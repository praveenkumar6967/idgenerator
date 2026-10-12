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
  AlertCircle,
  Move,
  ZoomIn,
  ZoomOut,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { renderFalconCard, TEMPLATE_CONFIG } from '../utils/cardRenderer';
import { exportCardAsPNG, exportCardAsPDF } from '../utils/exportUtils';

export default function PreviewPanel({ 
  name, 
  position, 
  activePhoto, 
  crop,
  onCropChange,
  autoCrop,
  onResetRequest,
  onLoadSample,
  onAddToCardList,
  editingCardId,
  onCancelEdit,
  cardListCount = 0
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
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

  // Pointer drag event handlers for mouse & mobile touch
  const handlePointerDown = (e) => {
    if (!activePhoto) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !onCropChange) return;
    e.preventDefault();

    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    // Map screen movement to canvas scale (694px base width)
    const stageEl = stageRef.current;
    const rect = stageEl ? stageEl.getBoundingClientRect() : null;
    const scaleRatio = rect && rect.width > 0 ? (TEMPLATE_CONFIG.width / rect.width) : 1;

    const deltaPanX = dx * scaleRatio;
    const deltaPanY = dy * scaleRatio;

    onCropChange(prev => ({
      ...prev,
      panX: Math.round((prev.panX || 0) + deltaPanX),
      panY: Math.round((prev.panY || 0) + deltaPanY)
    }));
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Mouse wheel zoom over circular frame
  const handleWheel = (e) => {
    if (!activePhoto || !onCropChange) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.05 : -0.05;
    const currentZoom = crop?.zoom || 1.0;
    const nextZoom = Math.min(3.0, Math.max(0.7, Number((currentZoom + step).toFixed(2))));
    onCropChange(prev => ({
      ...prev,
      zoom: nextZoom
    }));
  };

  // Zoom button handlers
  const handleZoomIn = () => {
    if (!onCropChange) return;
    const currentZoom = crop?.zoom || 1.0;
    const nextZoom = Math.min(3.0, Number((currentZoom + 0.1).toFixed(2)));
    onCropChange(prev => ({ ...prev, zoom: nextZoom }));
  };

  const handleZoomOut = () => {
    if (!onCropChange) return;
    const currentZoom = crop?.zoom || 1.0;
    const nextZoom = Math.max(0.7, Number((currentZoom - 0.1).toFixed(2)));
    onCropChange(prev => ({ ...prev, zoom: nextZoom }));
  };

  const handleZoomSliderChange = (e) => {
    if (!onCropChange) return;
    onCropChange(prev => ({
      ...prev,
      zoom: parseFloat(e.target.value)
    }));
  };

  // Position control handlers
  const handleResetPosition = () => {
    if (!onCropChange) return;
    onCropChange(prev => ({
      ...prev,
      panX: 0,
      panY: 0,
      zoom: 1.0
    }));
  };

  const handleAutoCenter = () => {
    if (!onCropChange) return;
    if (autoCrop) {
      onCropChange({ ...autoCrop });
    } else {
      onCropChange({ zoom: 1.0, panX: 0, panY: 0 });
    }
  };

  const handleNudge = (dx, dy) => {
    if (!onCropChange) return;
    onCropChange(prev => ({
      ...prev,
      panX: (prev.panX || 0) + dx,
      panY: (prev.panY || 0) + dy
    }));
  };

  // Export handlers
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

  const isOriginalTemplate = 
    (!activePhoto) &&
    (name.trim().toUpperCase() === "TEMPLATE PERSON'S NAME") &&
    (position.trim().toUpperCase() === "OVERALL EVENT COORDINATOR");

  const isFormComplete = (name.trim().length > 0 && position.trim().length > 0 && activePhoto) || isOriginalTemplate;

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
              title="Load original sample template"
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
        <div 
          ref={stageRef}
          className="card-stage-shadow-wrap"
        >
          <canvas 
            ref={canvasRef}
            className="falcon-id-canvas"
            width={TEMPLATE_CONFIG.width}
            height={TEMPLATE_CONFIG.height}
          />

          {/* Interactive Drag Overlay: Directly positioned over the circular photo frame */}
          {activePhoto && (
            <div 
              className={`photo-drag-overlay ${isDragging ? 'dragging' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              title="Click and drag to position face inside the circular frame (scroll to zoom)"
            >
              <div className="drag-guide-ring">
                <span className="drag-hint-badge">
                  <Move size={12} /> Drag Face
                </span>
              </div>
            </div>
          )}

          {!activePhoto && !isOriginalTemplate && (
            <div className="stage-placeholder-overlay">
              <span className="overlay-badge">Awaiting Student Photograph</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Photo Positioning & Zoom Controls (Visible when photo is uploaded) */}
      {activePhoto && (
        <div className="photo-position-controls-card">
          <div className="controls-header">
            <div className="controls-title">
              <Move size={15} className="text-red" />
              <span>PHOTO POSITIONING & ZOOM</span>
            </div>
            <div className="controls-action-chips">
              <button 
                type="button" 
                className="btn-chip"
                onClick={handleAutoCenter}
                title="Automatically center face in circular frame"
              >
                <Target size={12} className="text-gold" /> Auto-Center
              </button>
              <button 
                type="button" 
                className="btn-chip"
                onClick={handleResetPosition}
                title="Reset position and zoom to center"
              >
                <RotateCcw size={12} /> Reset Position
              </button>
            </div>
          </div>

          {/* Drag instruction notice */}
          <div className="drag-instruction-bar">
            <Move size={13} className="text-red animate-pulse" />
            <span>Click & drag the photo inside the circular frame, or use controls below:</span>
          </div>

          {/* Zoom Controls Row */}
          <div className="zoom-controls-row">
            <button 
              type="button" 
              className="btn-zoom-step"
              onClick={handleZoomOut}
              disabled={(crop?.zoom || 1.0) <= 0.7}
              title="Zoom Out (-)"
            >
              <ZoomOut size={15} />
            </button>

            <div className="zoom-slider-container">
              <input 
                type="range"
                min="0.7"
                max="3.0"
                step="0.02"
                value={crop?.zoom || 1.0}
                onChange={handleZoomSliderChange}
                className="falcon-slider"
                aria-label="Photo Zoom Level"
              />
              <div className="zoom-slider-labels">
                <span>0.7x</span>
                <span className="zoom-val-badge">{(crop?.zoom || 1.0).toFixed(2)}x Zoom</span>
                <span>3.0x</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-zoom-step"
              onClick={handleZoomIn}
              disabled={(crop?.zoom || 1.0) >= 3.0}
              title="Zoom In (+)"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Directional Nudge Row */}
          <div className="nudge-controls-row">
            <span className="nudge-title">Nudge Position:</span>
            <div className="nudge-buttons-pad">
              <button type="button" className="btn-nudge" onClick={() => handleNudge(0, -10)} title="Nudge Up">
                <ArrowUp size={13} />
              </button>
              <div className="nudge-middle-row">
                <button type="button" className="btn-nudge" onClick={() => handleNudge(-10, 0)} title="Nudge Left">
                  <ArrowLeft size={13} />
                </button>
                <button type="button" className="btn-nudge" onClick={() => handleNudge(10, 0)} title="Nudge Right">
                  <ArrowRight size={13} />
                </button>
              </div>
              <button type="button" className="btn-nudge" onClick={() => handleNudge(0, 10)} title="Nudge Down">
                <ArrowDown size={13} />
              </button>
            </div>
            <div className="coordinates-tag">
              <span>X: <strong>{crop?.panX || 0}px</strong></span>
              <span>Y: <strong>{crop?.panY || 0}px</strong></span>
            </div>
          </div>
        </div>
      )}

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
