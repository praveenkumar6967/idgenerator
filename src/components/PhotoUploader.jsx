import React, { useRef, useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  RotateCcw, 
  Sliders, 
  Move, 
  ZoomIn, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  RefreshCw,
  Sun,
  Contrast,
  Thermometer,
  Target
} from 'lucide-react';
import { 
  analyzeImage, 
  calculateAutoEnhancement, 
  processImage 
} from '../utils/imageEnhancer';
import { computeAutoFit } from '../utils/faceDetector';
import { TEMPLATE_CONFIG } from '../utils/cardRenderer';

export default function PhotoUploader({ 
  originalPhoto,
  enhancedPhoto,
  activePhoto,
  onPhotoUploaded,
  onPhotoRemoved,
  onEnhancedPhotoChange,
  crop,
  onCropChange
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Enhancement stats and settings
  const [autoSummary, setAutoSummary] = useState('');
  const [fitSummary, setFitSummary] = useState('');
  const [previewMode, setPreviewMode] = useState('enhanced'); // 'enhanced' | 'original' | 'split'
  const [splitPosition, setSplitPosition] = useState(50);
  const [showAdvancedTune, setShowAdvancedTune] = useState(false);

  // Stored automatic crop so user can reset to it
  const [storedAutoCrop, setStoredAutoCrop] = useState({ zoom: 1.0, panX: 0, panY: 0 });

  // Manual fine-tune sliders
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    warmth: 0,
    sharpening: 25,
    shadowBoost: 0
  });

  const applyPipeline = (baseImg, customAdjustments) => {
    if (!baseImg) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const enhancedCanvas = processImage(baseImg, customAdjustments);
        onEnhancedPhotoChange(enhancedCanvas, customAdjustments);
      } catch (err) {
        console.error('Enhancement processing error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  const handleFileSelect = (file) => {
    setFileError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      setFileError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds 25MB limit. Please upload an image under 25MB.');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // Step 1: Analyze raw image lighting
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        
        const stats = analyzeImage(imgData);
        const autoSettings = calculateAutoEnhancement(stats);

        setAutoSummary(autoSettings.summary);
        setAdjustments({
          brightness: autoSettings.brightness,
          contrast: autoSettings.contrast,
          warmth: autoSettings.warmth,
          sharpening: autoSettings.sharpening,
          shadowBoost: autoSettings.shadowBoost
        });

        // Step 2: Auto-enhance lighting, contrast, warmth & sharpness
        const enhancedCanvas = processImage(img, autoSettings);

        // Step 3: Automatic Face Detection & Intelligent Circular Fitting
        const autoFitResult = await computeAutoFit(img, { radius: TEMPLATE_CONFIG.photo.radius });
        const initialCrop = {
          zoom: autoFitResult.zoom,
          panX: autoFitResult.panX,
          panY: autoFitResult.panY
        };

        setStoredAutoCrop(initialCrop);
        setFitSummary(autoFitResult.summary);

        onPhotoUploaded(img, enhancedCanvas, initialCrop);
        setPreviewMode('enhanced');
        setIsProcessing(false);
      };
      img.onerror = () => {
        setFileError('Failed to load image. The file may be corrupt.');
        setIsProcessing(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setFileError('Error reading file from disk.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReEnhance = () => {
    if (!originalPhoto) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalPhoto.naturalWidth;
    tempCanvas.height = originalPhoto.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalPhoto, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const stats = analyzeImage(imgData);
    const autoSettings = calculateAutoEnhancement(stats);
    
    setAutoSummary(autoSettings.summary);
    setAdjustments({
      brightness: autoSettings.brightness,
      contrast: autoSettings.contrast,
      warmth: autoSettings.warmth,
      sharpening: autoSettings.sharpening,
      shadowBoost: autoSettings.shadowBoost
    });
    applyPipeline(originalPhoto, autoSettings);
  };

  const handleResetEnhancement = () => {
    if (!originalPhoto) return;
    const neutral = {
      brightness: 0,
      contrast: 0,
      warmth: 0,
      sharpening: 0,
      shadowBoost: 0
    };
    setAdjustments(neutral);
    setAutoSummary('Manual / Unadjusted');
    applyPipeline(originalPhoto, neutral);
  };

  const handleAdjustmentChange = (key, value) => {
    const updated = { ...adjustments, [key]: Number(value) };
    setAdjustments(updated);
    applyPipeline(originalPhoto, updated);
  };

  const handleResetToAutoFit = () => {
    onCropChange({ ...storedAutoCrop });
  };

  return (
    <div className="card-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <span className="section-number">01</span>
          <div>
            <h2 className="section-title">STUDENT PHOTOGRAPH</h2>
            <span className="section-desc">Auto-detected & fitted into circular frame</span>
          </div>
        </div>
        {originalPhoto && (
          <button 
            type="button" 
            onClick={onPhotoRemoved}
            className="btn-danger-ghost"
            title="Remove Photo"
          >
            <X size={14} /> Remove
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      {!originalPhoto ? (
        <div 
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/jpeg,image/png,image/webp" 
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <div className="dropzone-icon-ring">
            <UploadCloud size={32} className="text-red" />
          </div>
          <div className="dropzone-text">
            <span className="dropzone-cta">Upload Any Student Photo</span>
            <span className="dropzone-sub">Portrait, Landscape, Square, Selfie or Bust Photo (JPG, PNG, WEBP)</span>
          </div>
          <div className="dropzone-pills">
            <span className="pill">🎯 Auto Face Centering & Circular Fitting</span>
            <span className="pill">✨ Auto Lighting & Tone Recovery</span>
            <span className="pill">🔒 100% Client-Side</span>
          </div>
        </div>
      ) : (
        /* Photo is uploaded: Preview, Comparison & Controls */
        <div className="photo-editor-body">
          {/* File info bar */}
          <div className="file-info-bar">
            <div className="file-info-left">
              <ImageIcon size={16} className="text-red" />
              <span className="file-name" title={fileName}>{fileName}</span>
              <span className="file-size">({fileSize})</span>
            </div>
            <button 
              type="button" 
              className="btn-secondary-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Photo
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          {/* Auto Fitting & Enhancement Highlight Badges */}
          <div className="enhancement-badge-bar">
            <div className="enhancement-badge-icon">
              <Sparkles size={16} className="text-gold animate-pulse" />
            </div>
            <div className="enhancement-badge-info">
              <div className="badge-tag">AUTOMATICALLY OPTIMIZED & FITTED</div>
              <div className="badge-desc">
                {fitSummary || 'Face centered & scaled to circle'} • {autoSummary || 'Lighting & contrast optimized'}
              </div>
            </div>
            <div className="enhancement-badge-actions">
              <button 
                type="button" 
                className="btn-icon-ghost" 
                onClick={handleReEnhance} 
                title="Re-run Auto Enhancement"
              >
                <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
              </button>
              <button 
                type="button" 
                className="btn-icon-ghost" 
                onClick={handleResetEnhancement} 
                title="Reset to Original Colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Before / After Photo Comparison View */}
          <div className="photo-comparison-container">
            <div className="comparison-tabs">
              <button 
                type="button"
                className={`comp-tab ${previewMode === 'enhanced' ? 'active' : ''}`}
                onClick={() => setPreviewMode('enhanced')}
              >
                ✨ Enhanced Photo
              </button>
              <button 
                type="button"
                className={`comp-tab ${previewMode === 'original' ? 'active' : ''}`}
                onClick={() => setPreviewMode('original')}
              >
                📷 Original Photo
              </button>
              <button 
                type="button"
                className={`comp-tab ${previewMode === 'split' ? 'active' : ''}`}
                onClick={() => setPreviewMode('split')}
              >
                ⚡ Before / After Split
              </button>
            </div>

            <div className="photo-preview-viewport">
              {previewMode === 'enhanced' && enhancedPhoto && (
                <img 
                  src={enhancedPhoto.toDataURL()} 
                  alt="Enhanced Student" 
                  className="preview-img"
                />
              )}
              {previewMode === 'original' && originalPhoto && (
                <img 
                  src={originalPhoto.src} 
                  alt="Original Student" 
                  className="preview-img"
                />
              )}
              {previewMode === 'split' && originalPhoto && enhancedPhoto && (
                <div className="split-view-container">
                  <img 
                    src={originalPhoto.src} 
                    alt="Original" 
                    className="split-img-base"
                  />
                  <div 
                    className="split-img-overlay"
                    style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                  >
                    <img 
                      src={enhancedPhoto.toDataURL()} 
                      alt="Enhanced" 
                      className="split-img-top"
                    />
                  </div>
                  <div 
                    className="split-slider-line"
                    style={{ left: `${splitPosition}%` }}
                  >
                    <div className="split-handle">⇹</div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={splitPosition}
                    onChange={(e) => setSplitPosition(Number(e.target.value))}
                    className="split-range-input"
                  />
                  <span className="split-label left">ORIGINAL</span>
                  <span className="split-label right">ENHANCED</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo Positioning & Circular Framing Controls */}
          <div className="subpanel-card">
            <div className="subpanel-header">
              <div className="subpanel-title">
                <Target size={15} className="text-red" />
                <span>Circular Framing & Crop (Auto-Fitted)</span>
              </div>
              <button 
                type="button"
                className="btn-link"
                onClick={handleResetToAutoFit}
                title="Restore automatic face crop"
              >
                🎯 Reset to Auto-Fit
              </button>
            </div>

            <div className="sliders-grid">
              <div className="slider-item">
                <div className="slider-label-row">
                  <span>Zoom / Scale</span>
                  <span className="slider-val">{(crop.zoom || 1.0).toFixed(2)}x</span>
                </div>
                <input 
                  type="range"
                  min="0.7"
                  max="2.5"
                  step="0.05"
                  value={crop.zoom || 1.0}
                  onChange={(e) => onCropChange({ ...crop, zoom: parseFloat(e.target.value) })}
                  className="falcon-slider"
                />
              </div>

              <div className="slider-item">
                <div className="slider-label-row">
                  <span>Pan X (Left / Right)</span>
                  <span className="slider-val">{crop.panX || 0}px</span>
                </div>
                <input 
                  type="range"
                  min="-180"
                  max="180"
                  step="2"
                  value={crop.panX || 0}
                  onChange={(e) => onCropChange({ ...crop, panX: parseInt(e.target.value) })}
                  className="falcon-slider"
                />
              </div>

              <div className="slider-item">
                <div className="slider-label-row">
                  <span>Pan Y (Up / Down)</span>
                  <span className="slider-val">{crop.panY || 0}px</span>
                </div>
                <input 
                  type="range"
                  min="-220"
                  max="220"
                  step="2"
                  value={crop.panY || 0}
                  onChange={(e) => onCropChange({ ...crop, panY: parseInt(e.target.value) })}
                  className="falcon-slider"
                />
              </div>
            </div>
          </div>

          {/* Advanced Manual Fine-Tuning Drawer */}
          <div className="subpanel-card">
            <button 
              type="button" 
              className="subpanel-toggle"
              onClick={() => setShowAdvancedTune(!showAdvancedTune)}
            >
              <div className="subpanel-title">
                <Sliders size={15} className="text-gold" />
                <span>Manual Enhancement Sliders</span>
              </div>
              <span className="toggle-chevron">{showAdvancedTune ? '▲ Hide' : '▼ Adjust'}</span>
            </button>

            {showAdvancedTune && (
              <div className="sliders-grid mt-3">
                <div className="slider-item">
                  <div className="slider-label-row">
                    <span className="flex-center gap-1"><Sun size={13} /> Brightness</span>
                    <span className="slider-val">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-40" 
                    max="40" 
                    value={adjustments.brightness} 
                    onChange={(e) => handleAdjustmentChange('brightness', e.target.value)}
                    className="falcon-slider"
                  />
                </div>

                <div className="slider-item">
                  <div className="slider-label-row">
                    <span className="flex-center gap-1"><Contrast size={13} /> Contrast</span>
                    <span className="slider-val">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-40" 
                    max="40" 
                    value={adjustments.contrast} 
                    onChange={(e) => handleAdjustmentChange('contrast', e.target.value)}
                    className="falcon-slider"
                  />
                </div>

                <div className="slider-item">
                  <div className="slider-label-row">
                    <span className="flex-center gap-1"><Thermometer size={13} /> Color Warmth</span>
                    <span className="slider-val">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-30" 
                    max="30" 
                    value={adjustments.warmth} 
                    onChange={(e) => handleAdjustmentChange('warmth', e.target.value)}
                    className="falcon-slider"
                  />
                </div>

                <div className="slider-item">
                  <div className="slider-label-row">
                    <span>Shadow Detail Boost</span>
                    <span className="slider-val">+{adjustments.shadowBoost}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    value={adjustments.shadowBoost} 
                    onChange={(e) => handleAdjustmentChange('shadowBoost', e.target.value)}
                    className="falcon-slider"
                  />
                </div>

                <div className="slider-item">
                  <div className="slider-label-row">
                    <span>Sharpening Filter</span>
                    <span className="slider-val">{adjustments.sharpening}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="80" 
                    value={adjustments.sharpening} 
                    onChange={(e) => handleAdjustmentChange('sharpening', e.target.value)}
                    className="falcon-slider"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation / Error Alert */}
      {fileError && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
}
