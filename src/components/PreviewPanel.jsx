import React, { useRef, useEffect, useState } from 'react';
import { 
  Download, 
  FileText, 
  RotateCcw, 
  PlusCircle,
  Save,
  Check, 
  Sparkles,
  Printer,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { renderFalconCard, TEMPLATE_CONFIG } from '../utils/cardRenderer';
import { exportCardAsPNG, exportCardAsPDF } from '../utils/exportUtils';

export default function PreviewPanel({ 
  name, 
  position, 
  activePhoto, 
  crop,
  onResetRequest,
  onLoadSample,
  onAddToCardList,
  editingCardId,
  onCancelEdit,
  cardListCount = 0
}) {
  const canvasRef = useRef(null);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [renderError, setRenderError] = useState(null);

  // Live Canvas Rendering whenever state changes
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        if (!canvasRef.current) return;
        await renderFalconCard(
          canvasRef.current,
          {
            name,
            position,
            photoElement: activePhoto,
            crop
          },
          1 // 1x scale for smooth live browser rendering
        );
        if (!isCancelled) setRenderError(null);
      } catch (err) {
        console.error('Canvas render error:', err);
        if (!isCancelled) setRenderError('Error rendering card preview');
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [name, position, activePhoto, crop]);

  const handleDownloadPNG = async () => {
    setIsExportingPNG(true);
    setDownloadSuccess(null);
    try {
      const filename = await exportCardAsPNG({
        name,
        position,
        photoElement: activePhoto,
        crop
      });
      setDownloadSuccess(`Downloaded ${filename} successfully!`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error('PNG export failed:', e);
      alert('Failed to generate PNG image. Please try again.');
    } finally {
      setIsExportingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setDownloadSuccess(null);
    try {
      const filename = await exportCardAsPDF({
        name,
        position,
        photoElement: activePhoto,
        crop
      });
      setDownloadSuccess(`Generated ${filename} for printing!`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const isFormComplete = name.trim().length > 0 && position.trim().length > 0 && activePhoto;

  return (
    <div className="preview-panel-wrap">
      {/* Top action header */}
      <div className="preview-header">
        <div className="preview-title-block">
          <div className="live-indicator">
            <span className="live-dot animate-ping" />
            <span className="live-text">LIVE PREVIEW</span>
          </div>
          <span className="preview-dims">
            {TEMPLATE_CONFIG.width} × {TEMPLATE_CONFIG.height} px
          </span>
        </div>

        <div className="preview-quick-actions">
          {editingCardId ? (
            <button 
              type="button" 
              className="btn-outline-sm"
              onClick={onCancelEdit}
            >
              Cancel Edit
            </button>
          ) : (
            <button 
              type="button" 
              className="btn-outline-sm"
              onClick={onLoadSample}
              title="Load sample committee member for testing"
            >
              ⚡ Load Sample
            </button>
          )}
          <button 
            type="button" 
            className="btn-danger-sm"
            onClick={onResetRequest}
            title="Reset form for next participant"
          >
            <RotateCcw size={14} /> Reset Form
          </button>
        </div>
      </div>

      {/* Main ID Card Preview Container */}
      <div className="card-stage-container">
        <div className="card-stage-shadow-wrap">
          <canvas 
            ref={canvasRef}
            className="falcon-id-canvas"
            width={TEMPLATE_CONFIG.width}
            height={TEMPLATE_CONFIG.height}
          />

          {!activePhoto && (
            <div className="stage-placeholder-overlay">
              <span className="overlay-badge">Awaiting Student Photograph</span>
            </div>
          )}
        </div>
      </div>

      {/* Download Alert notification */}
      {downloadSuccess && (
        <div className="success-banner">
          <Check size={18} className="text-green" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Primary Batch Action: ADD TO CARD LIST */}
      <div className="add-to-batch-box">
        <button 
          type="button"
          className={`btn-add-batch ${editingCardId ? 'editing-mode' : ''}`}
          onClick={onAddToCardList}
          disabled={!isFormComplete}
        >
          {editingCardId ? <Save size={18} /> : <PlusCircle size={18} />}
          <span>
            {editingCardId ? 'UPDATE CARD IN LIST' : 'ADD TO CARD LIST'}
          </span>
          <span className="btn-tag">
            {cardListCount > 0 ? `(${cardListCount} currently in batch)` : '(Starts batch)'}
          </span>
        </button>
        {!isFormComplete && (
          <span className="add-batch-hint">
            * Please enter photo, student name, and committee position to add card
          </span>
        )}
      </div>

      {/* Individual Download Action Buttons */}
      <div className="export-action-box">
        <div className="export-btn-group">
          <button 
            type="button"
            className="btn-download-png"
            onClick={handleDownloadPNG}
            disabled={isExportingPNG || !isFormComplete}
          >
            <Download size={16} />
            <span>{isExportingPNG ? 'GENERATING...' : 'DOWNLOAD PNG'}</span>
            <span className="btn-tag">CURRENT CARD (2X)</span>
          </button>

          <button 
            type="button"
            className="btn-download-pdf"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF || !isFormComplete}
          >
            <FileText size={16} />
            <span>{isExportingPDF ? 'BUILDING...' : 'DOWNLOAD PDF'}</span>
            <span className="btn-tag">CURRENT CARD (300 DPI)</span>
          </button>
        </div>

        <div className="export-meta-info">
          <span className="meta-item">
            <ShieldCheck size={14} className="text-red" />
            Original template borders and eagle artwork preserved
          </span>
          <span className="meta-item">
            <Printer size={14} className="text-gold" />
            Zero margin print ready output
          </span>
        </div>
      </div>
    </div>
  );
}
