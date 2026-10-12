import React, { useState } from 'react';
import { 
  Users, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  FileText, 
  Layers, 
  Check, 
  AlertCircle,
  Sparkles,
  Printer,
  Grid
} from 'lucide-react';
import { exportBulkCardsAsPDF } from '../utils/exportUtils';

export default function CardListSection({ 
  cardList, 
  onEditCard, 
  onRemoveCard, 
  onClearList, 
  onPreviewCard,
  onDownloadCardPNG,
  onDownloadCardPDF,
  onLoad5SampleStudents
}) {
  const [layoutMode, setLayoutMode] = useState('single'); // 'single' | 'grid'
  const [isExportingBulk, setIsExportingBulk] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [exportSuccess, setExportSuccess] = useState(null);
  const [exportError, setExportError] = useState(null);

  const handleBulkDownload = async () => {
    if (!cardList || cardList.length === 0) return;
    setIsExportingBulk(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const filename = await exportBulkCardsAsPDF(cardList, {
        layout: layoutMode,
        onProgress: (current, total, status) => {
          setProgressText(status || `Processing card ${current} of ${total}...`);
        }
      });
      setExportSuccess(`Successfully downloaded ${filename} with ${cardList.length} cards!`);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      console.error('Bulk PDF export failed:', err);
      setExportError(err.message || 'Failed to generate combined PDF. Please try again.');
    } finally {
      setIsExportingBulk(false);
      setProgressText('');
    }
  };

  return (
    <section className="card-section card-list-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge">
            <Users size={18} className="text-red" />
          </div>
          <div>
            <h2 className="section-title">BATCH ID CARDS LIST</h2>
            <span className="section-desc">Manage all participants and download combined PDF</span>
          </div>
        </div>

        <div className="list-header-right">
          <span className="badge-count">
            {cardList.length} {cardList.length === 1 ? 'Card' : 'Cards'} Ready
          </span>
          {cardList.length > 0 && (
            <button 
              type="button" 
              className="btn-danger-ghost"
              onClick={onClearList}
              title="Clear all cards from batch list"
            >
              <Trash2 size={14} /> Clear List
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {cardList.length === 0 ? (
        <div className="empty-list-box">
          <div className="empty-icon-ring">
            <Layers size={32} className="text-subtle" />
          </div>
          <h3 className="empty-title">No Cards in Batch List Yet</h3>
          <p className="empty-desc">
            Enter a student's photo, name, and position above, then click 
            <strong className="text-red"> "ADD TO CARD LIST"</strong> to create a batch.
          </p>
          <div className="empty-actions">
            <button 
              type="button" 
              className="btn-primary-outline"
              onClick={onLoad5SampleStudents}
            >
              <Sparkles size={16} />
              <span>⚡ Load 5 Sample Students for Instant Bulk Test</span>
            </button>
          </div>
        </div>
      ) : (
        /* List with cards */
        <div className="batch-content-wrap">
          {/* Bulk Download Control Panel */}
          <div className="bulk-control-panel">
            <div className="layout-picker-group">
              <span className="layout-picker-label">
                <Printer size={14} className="text-red" /> PDF Layout Style:
              </span>
              <div className="layout-options-toggle">
                <button 
                  type="button"
                  className={`layout-btn ${layoutMode === 'single' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('single')}
                >
                  <FileText size={14} />
                  <span>1 Card Per Page (Full-Bleed Badge)</span>
                </button>
                <button 
                  type="button"
                  className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('grid')}
                >
                  <Grid size={14} />
                  <span>Multiple Cards Per Page (A4 2×2 Sheet)</span>
                </button>
              </div>
            </div>

            {/* Prominent Bulk Download Button */}
            <div className="bulk-download-action-row">
              <button 
                type="button"
                className="btn-bulk-download"
                onClick={handleBulkDownload}
                disabled={isExportingBulk}
              >
                <Download size={20} />
                <div className="btn-bulk-text">
                  <span className="btn-bulk-primary">
                    {isExportingBulk ? (progressText || 'GENERATING COMBINED PDF...') : 'DOWNLOAD ALL CARDS AS PDF'}
                  </span>
                  <span className="btn-bulk-sub">
                    {cardList.length} Cards • {layoutMode === 'single' ? 'Full-Bleed Badge Format' : 'A4 2×2 Print Sheet'}
                  </span>
                </div>
              </button>

              <button 
                type="button" 
                className="btn-secondary-sm"
                onClick={onLoad5SampleStudents}
                title="Append 5 sample committee members"
              >
                + Add 5 Sample Students
              </button>
            </div>

            {/* Alerts */}
            {exportSuccess && (
              <div className="success-banner mt-2">
                <Check size={18} className="text-green" />
                <span>{exportSuccess}</span>
              </div>
            )}
            {exportError && (
              <div className="error-alert mt-2">
                <AlertCircle size={18} />
                <span>{exportError}</span>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="cards-batch-grid">
            {cardList.map((card, index) => (
              <div key={card.id || index} className="batch-card-item">
                <div 
                  className="batch-card-thumb-wrap"
                  onClick={() => onPreviewCard(card)}
                  title="Click to view full preview"
                >
                  <img 
                    src={card.renderedCardDataUrl} 
                    alt={card.name} 
                    className="batch-card-thumb-img" 
                  />
                  <div className="batch-card-index-pill">#{index + 1}</div>
                  <div className="batch-card-hover-overlay">
                    <Eye size={20} />
                    <span>View Card</span>
                  </div>
                </div>

                <div className="batch-card-details">
                  <h4 className="batch-card-name" title={card.name}>
                    {card.name}
                  </h4>
                  <span className="batch-card-pos" title={card.position}>
                    {card.position}
                  </span>
                </div>

                <div className="batch-card-actions">
                  <button 
                    type="button" 
                    className="card-action-btn edit"
                    onClick={() => onEditCard(card)}
                    title="Edit student details / photo"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button 
                    type="button" 
                    className="card-action-btn png"
                    onClick={() => onDownloadCardPNG(card)}
                    title="Download high-res PNG"
                  >
                    <Download size={13} /> PNG
                  </button>
                  <button 
                    type="button" 
                    className="card-action-btn delete"
                    onClick={() => onRemoveCard(card.id)}
                    title="Remove from batch list"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
