import React from 'react';
import { User, Award, CheckCircle } from 'lucide-react';

const COMMON_POSITIONS = [
  'Event Organizer',
  'Overall Event Coordinator',
  'Editor',
  'Joint Treasurer',
  'Event Coordinator',
  'Committee Member',
  'Technical Head',
  'Cultural Head',
  'Logistics Head',
  'Media & Design Head'
];

export default function DetailsForm({ 
  name, 
  setName, 
  position, 
  setPosition 
}) {
  return (
    <div className="card-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <span className="section-number">02</span>
          <h2 className="section-title">COMMITTEE MEMBER DETAILS</h2>
        </div>
      </div>

      <div className="form-fields-stack">
        {/* Student Name */}
        <div className="form-group">
          <div className="form-label-row">
            <label htmlFor="student-name" className="form-label">
              <User size={15} className="text-red" />
              <span>Student Full Name <span className="text-red">*</span></span>
            </label>
            <span className="char-count">{name.length} chars</span>
          </div>

          <div className="input-wrap">
            <input 
              id="student-name"
              type="text" 
              className="falcon-input"
              placeholder="e.g. Navin Prasath, Praveen T, Malini Suresh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="off"
            />
          </div>
          <span className="field-hint">
            Rendered in bold brush typography. Auto-scales dynamically to fit card bounds.
          </span>
        </div>

        {/* Committee Position */}
        <div className="form-group">
          <div className="form-label-row">
            <label htmlFor="committee-pos" className="form-label">
              <Award size={15} className="text-red" />
              <span>Committee Position / Designation <span className="text-red">*</span></span>
            </label>
            <span className="char-count">{position.length} chars</span>
          </div>

          <div className="input-wrap">
            <input 
              id="committee-pos"
              type="text" 
              className="falcon-input"
              placeholder="e.g. OVERALL EVENT COORDINATOR"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              maxLength={50}
              autoComplete="off"
            />
          </div>
          <span className="field-hint">
            Centered precisely between decorative red lines. All custom designations supported.
          </span>

          {/* Quick-select position chips */}
          <div className="chips-section">
            <span className="chips-label">Quick Suggestions:</span>
            <div className="chips-list">
              {COMMON_POSITIONS.map((chip) => {
                const isSelected = position.trim().toLowerCase() === chip.toLowerCase();
                return (
                  <button 
                    key={chip}
                    type="button"
                    className={`chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPosition(chip)}
                  >
                    {chip}
                    {isSelected && <CheckCircle size={12} className="ml-1 text-red" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
