import React from 'react';
import { X, Download, FileText, User, Award } from 'lucide-react';

export default function CardPreviewModal({ 
  card, 
  onClose, 
  onDownloadPNG, 
  onDownloadPDF 
}) {
  if (!card) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card preview-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          title="Close Preview"
        >
          <X size={20} />
        </button>

        <div className="preview-modal-header">
          <div className="preview-modal-title-wrap">
            <span className="badge-red">CARD PREVIEW</span>
            <h3 className="preview-modal-name">{card.name}</h3>
            <span className="preview-modal-pos">{card.position}</span>
          </div>
        </div>

        <div className="preview-modal-stage">
          <img 
            src={card.renderedCardDataUrl} 
            alt={card.name} 
            className="preview-modal-img"
          />
        </div>

        <div className="preview-modal-actions">
          <button 
            type="button" 
            className="btn-download-png flex-1"
            onClick={() => onDownloadPNG(card)}
          >
            <Download size={16} />
            <span>Download PNG</span>
          </button>

          <button 
            type="button" 
            className="btn-download-pdf flex-1"
            onClick={() => onDownloadPDF(card)}
          >
            <FileText size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
