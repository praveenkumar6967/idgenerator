import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button type="button" className="modal-close-btn" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className="modal-icon-wrap">
          <AlertTriangle size={36} className="text-red" />
        </div>

        <h3 className="modal-title">{title || 'Confirm Reset Form'}</h3>
        <p className="modal-message">
          {message || 'Are you sure you want to clear the student name, committee position, uploaded photo, and reset all crop controls?'}
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            Yes, Reset Form
          </button>
        </div>
      </div>
    </div>
  );
}
