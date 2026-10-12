import React from 'react';
import { ShieldCheck, Sparkles, Printer, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="falcon-header">
      <div className="falcon-header-container">
        <div className="brand-group">
          <div className="brand-emblem">
            {/* Crown & Eagle Badge */}
            <svg viewBox="0 0 64 64" className="brand-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20L22 36L32 16L42 36L52 20L56 46H8L12 20Z" fill="url(#crown-gradient)" />
              <path d="M32 38L20 48L32 58L44 48L32 38Z" fill="#ff1f1f" />
              <circle cx="32" cy="14" r="3" fill="#ff4d4d" />
              <circle cx="12" cy="18" r="2.5" fill="#ff4d4d" />
              <circle cx="52" cy="18" r="2.5" fill="#ff4d4d" />
              <defs>
                <linearGradient id="crown-gradient" x1="8" y1="16" x2="56" y2="46" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff4d4d" />
                  <stop offset="0.5" stopColor="#b91c1c" />
                  <stop offset="1" stopColor="#7f1d1d" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="brand-titles">
            <div className="brand-super">
              <span className="badge-red">OFFICIAL</span>
              <span className="badge-text">STUDENT COMMITTEE SUITE</span>
            </div>
            <h1 className="brand-title">
              <span className="text-white">FALCON</span>{' '}
              <span className="text-red">ID CARD GENERATOR</span>
            </h1>
            <p className="brand-subtitle">
              Student Committee Identity Card Designer & Automatic Photo Enhancer
            </p>
          </div>
        </div>

        <div className="header-badges">
          <div className="status-pill">
            <ShieldCheck size={16} className="text-red" />
            <span>100% Client-Side & Private</span>
          </div>
          <div className="status-pill">
            <Zap size={16} className="text-gold" />
            <span>Auto AI Photo Enhance</span>
          </div>
          <div className="status-pill">
            <Printer size={16} className="text-cyan" />
            <span>Print-Ready 300 DPI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
