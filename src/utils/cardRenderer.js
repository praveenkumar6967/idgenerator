/**
 * High-Resolution FALCON ID Card Renderer
 * 
 * Draws pixel-perfect FALCON student committee identity card on HTML5 Canvas:
 * - Original uploaded template as fixed background
 * - Circular photo frame: cx=347, cy=472, radius=212 (matching original template dimensions)
 * - Crisp red inner border ring with subtle glow
 * - Clean removal of previous placeholder text
 * - Auto-scaling brush & display typography for Student Name
 * - Auto-scaling condensed tracked typography for Committee Position
 * - Zero ghost text, zero distortion
 */

export const TEMPLATE_CONFIG = {
  // Base template dimensions (from uploaded image)
  width: 694,
  height: 1024,
  aspectRatio: 694 / 1024,

  // Circular Photo Area (measured from template & reference cards)
  photo: {
    cx: 347, // Centered horizontally
    cy: 472, // Centered vertically in red circular flame frame
    radius: 212 // Diameter: 424px
  },

  // Name Area
  name: {
    cx: 347,
    y: 820,
    maxWidth: 590,
    baseFontSize: 52,
    minFontSize: 22,
    fontFamily: '"Sedgwick Ave Display", "Permanent Marker", "Outfit", sans-serif',
    color: '#FFFFFF',
    glowColor: 'rgba(239, 35, 35, 0.85)',
    glowBlur: 9
  },

  // Committee Position Area
  position: {
    cx: 347,
    y: 896,
    maxWidth: 390,
    baseFontSize: 24,
    minFontSize: 13,
    fontFamily: '"Bebas Neue", "Oswald", "Barlow Condensed", sans-serif',
    color: '#FFFFFF',
    letterSpacing: '3px'
  },

  // Placeholder wipe zones (guarantees zero ghost text)
  wipeZones: [
    // Name zone
    { x: 40, y: 770, w: 614, h: 80 },
    // Designation zone between dashes
    { x: 138, y: 872, w: 414, h: 38 }
  ]
};

// Cache for loaded background template
let cachedTemplateImg = null;

export async function loadTemplateImage(src = '/assets/falcon_template_clean.png') {
  if (cachedTemplateImg && cachedTemplateImg.src.includes(src)) {
    return cachedTemplateImg;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedTemplateImg = img;
      resolve(img);
    };
    img.onerror = (err) => {
      const fallback = new Image();
      fallback.crossOrigin = 'anonymous';
      fallback.onload = () => {
        cachedTemplateImg = fallback;
        resolve(fallback);
      };
      fallback.onerror = () => reject(err);
      fallback.src = '/assets/falcon_template_original.jpg';
    };
    img.src = src;
  });
}

/**
 * Main render function
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object} data - { name, position, photoElement, crop: { zoom, panX, panY } }
 * @param {number} scale - 1 for preview, 2 for ultra-high-res export
 */
export async function renderFalconCard(canvas, data, scale = 1) {
  if (!canvas) return;

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const {
    name = '',
    position = '',
    photoElement = null,
    crop = { zoom: 1.0, panX: 0, panY: 0 },
    templateSrc = '/assets/falcon_template_clean.png'
  } = data;

  const width = TEMPLATE_CONFIG.width * scale;
  const height = TEMPLATE_CONFIG.height * scale;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Check if this is the original template sample (no photo, with default placeholder name & position)
  const isOriginalTemplate = 
    (!photoElement) &&
    (!name || name.trim().toUpperCase() === "TEMPLATE PERSON'S NAME") &&
    (!position || position.trim().toUpperCase() === "OVERALL EVENT COORDINATOR");

  if (isOriginalTemplate) {
    try {
      const origTemplateImg = await loadTemplateImage('/assets/falcon_template_original.jpg');
      ctx.drawImage(origTemplateImg, 0, 0, width, height);
      return;
    } catch (e) {
      console.error('Failed to load original template image:', e);
    }
  }

  // 1. Clear background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Background Template
  try {
    const templateImg = await loadTemplateImage(templateSrc);
    ctx.drawImage(templateImg, 0, 0, width, height);
  } catch (e) {
    console.error('Failed to load template image:', e);
  }

  // 3. Guarantee that placeholder text is completely covered with pure black
  ctx.fillStyle = '#000000';
  for (const zone of TEMPLATE_CONFIG.wipeZones) {
    ctx.fillRect(
      zone.x * scale,
      zone.y * scale,
      zone.w * scale,
      zone.h * scale
    );
  }

  // 4. Render Circular Student Photo
  if (photoElement) {
    const { cx, cy, radius } = TEMPLATE_CONFIG.photo;
    const scaledCx = cx * scale;
    const scaledCy = cy * scale;
    const scaledR = radius * scale;

    ctx.save();

    // Circular clipping path
    ctx.beginPath();
    ctx.arc(scaledCx, scaledCy, scaledR, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Background fill for photo circle
    ctx.fillStyle = '#111111';
    ctx.fill();

    const pw = photoElement.naturalWidth || photoElement.width;
    const ph = photoElement.naturalHeight || photoElement.height;

    // Minimum scale required to completely cover the circular diameter
    const diameter = scaledR * 2;
    const baseFitScale = Math.max(diameter / pw, diameter / ph);
    const finalScale = baseFitScale * (crop.zoom || 1.0);

    const drawW = pw * finalScale;
    const drawH = ph * finalScale;

    // Apply pan offsets (scaled)
    const userPanX = (crop.panX || 0) * scale;
    const userPanY = (crop.panY || 0) * scale;

    const drawX = scaledCx - (drawW / 2) + userPanX;
    const drawY = scaledCy - (drawH / 2) + userPanY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(photoElement, drawX, drawY, drawW, drawH);

    ctx.restore();

    // Draw crisp inner red circular border ring with ambient glow around photo edge
    ctx.save();
    ctx.beginPath();
    ctx.arc(scaledCx, scaledCy, scaledR, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#ef2a2a';
    ctx.lineWidth = 3.5 * scale;
    ctx.shadowColor = 'rgba(239, 42, 42, 0.8)';
    ctx.shadowBlur = 8 * scale;
    ctx.stroke();
    ctx.restore();
  }

  // 5. Render Student Name
  if (name && name.trim().length > 0) {
    const displayName = name.trim().toUpperCase();
    const { cx, y, maxWidth, baseFontSize, minFontSize, fontFamily, color, glowColor, glowBlur } = TEMPLATE_CONFIG.name;

    const scaledCx = cx * scale;
    const scaledY = y * scale;
    const scaledMaxWidth = maxWidth * scale;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = baseFontSize * scale;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    let measuredWidth = ctx.measureText(displayName).width;

    if (measuredWidth > scaledMaxWidth) {
      const shrinkRatio = scaledMaxWidth / measuredWidth;
      fontSize = Math.max(minFontSize * scale, Math.floor(fontSize * shrinkRatio));
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
    }

    // Outer red glow pass
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillStyle = color;
    ctx.fillText(displayName, scaledCx, scaledY);

    // Foreground pass
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.fillText(displayName, scaledCx, scaledY);

    ctx.restore();
  }

  // 6. Render Committee Position
  if (position && position.trim().length > 0) {
    const displayPos = position.trim().toUpperCase();
    const { cx, y, maxWidth, baseFontSize, minFontSize, fontFamily, color } = TEMPLATE_CONFIG.position;

    const scaledCx = cx * scale;
    const scaledY = y * scale;
    const scaledMaxWidth = maxWidth * scale;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${3 * scale}px`;
    }

    let fontSize = baseFontSize * scale;
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    let measuredWidth = ctx.measureText(displayPos).width;

    if (measuredWidth > scaledMaxWidth) {
      const shrinkRatio = scaledMaxWidth / measuredWidth;
      fontSize = Math.max(minFontSize * scale, Math.floor(fontSize * shrinkRatio));
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1 * scale;
    ctx.fillStyle = color;
    ctx.fillText(displayPos, scaledCx, scaledY);

    ctx.restore();
  }
}
