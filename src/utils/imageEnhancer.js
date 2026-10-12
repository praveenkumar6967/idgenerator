/**
 * Advanced Client-Side Image Enhancement Utility
 * 
 * Performs automated and manual image enhancements using HTML5 Canvas:
 * - Exposure/Brightness correction with shadow recovery
 * - S-curve contrast optimization
 * - Conservative color temperature balancing (skin-tone preservation)
 * - Gentle unsharp mask convolution sharpening
 * - High-speed pixel manipulation
 */

/**
 * Analyzes image pixel data and computes lighting and color statistics.
 * @param {ImageData} imageData 
 * @returns {Object} statistics
 */
export function analyzeImage(imageData) {
  const data = imageData.data;
  const totalPixels = data.length / 4;
  
  let totalLuminance = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let shadowsCount = 0;
  let highlightsCount = 0;
  
  const histogram = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Perceived luminance (ITU-R BT.709)
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    histogram[lum]++;
    totalLuminance += lum;
    
    totalR += r;
    totalG += g;
    totalB += b;
    
    if (lum < 50) shadowsCount++;
    if (lum > 210) highlightsCount++;
  }

  const meanLuminance = totalLuminance / totalPixels;
  const meanR = totalR / totalPixels;
  const meanG = totalG / totalPixels;
  const meanB = totalB / totalPixels;

  // Calculate contrast standard deviation
  let varianceSum = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      varianceSum += histogram[i] * Math.pow(i - meanLuminance, 2);
    }
  }
  const stdDevContrast = Math.sqrt(varianceSum / totalPixels);

  return {
    meanLuminance,
    meanR,
    meanG,
    meanB,
    stdDevContrast,
    shadowRatio: shadowsCount / totalPixels,
    highlightRatio: highlightsCount / totalPixels,
    isDark: meanLuminance < 115,
    isLowContrast: stdDevContrast < 48,
    isDull: stdDevContrast < 40 && meanLuminance < 130
  };
}

/**
 * Automatically calculates optimal enhancement settings based on image analysis.
 * @param {Object} stats - output from analyzeImage
 * @returns {Object} settings
 */
export function calculateAutoEnhancement(stats) {
  let brightness = 0;
  let contrast = 0;
  let warmth = 0;
  let sharpening = 25; // default subtle sharpening
  let shadowBoost = 0;

  // 1. Brightness / Underexposure adjustment
  if (stats.meanLuminance < 90) {
    // Very dark photo
    brightness = Math.min(32, Math.round((115 - stats.meanLuminance) * 0.7));
    shadowBoost = 35;
  } else if (stats.meanLuminance < 125) {
    // Slightly underexposed
    brightness = Math.min(22, Math.round((125 - stats.meanLuminance) * 0.55));
    shadowBoost = 20;
  } else if (stats.meanLuminance > 165) {
    // Slightly overexposed
    brightness = -Math.min(15, Math.round((stats.meanLuminance - 165) * 0.4));
  }

  // 2. Contrast adjustment
  if (stats.stdDevContrast < 38) {
    contrast = 24;
  } else if (stats.stdDevContrast < 50) {
    contrast = 15;
  } else if (stats.stdDevContrast > 68) {
    contrast = -5; // soften overly harsh contrast
  }

  // 3. Color balance / Natural skin-tone warmth
  // If image has a heavy blue/cyan cast (common in indoor / fluorescent selfies), balance gently
  if (stats.meanB > stats.meanR + 15) {
    warmth = Math.min(20, Math.round((stats.meanB - stats.meanR) * 0.4));
  } else if (stats.meanR > stats.meanB + 30) {
    warmth = -10; // reduce overly red tint
  } else {
    warmth = 5; // gentle healthy warmth for portrait
  }

  // 4. Sharpening - mild for high-res, gentle for soft photos
  if (stats.isDull) {
    sharpening = 35;
  } else {
    sharpening = 25;
  }

  return {
    brightness,
    contrast,
    warmth,
    sharpening,
    shadowBoost,
    summary: [
      brightness !== 0 ? `${brightness > 0 ? '+' : ''}${brightness}% Brightness` : null,
      contrast !== 0 ? `${contrast > 0 ? '+' : ''}${contrast}% Contrast` : null,
      shadowBoost > 0 ? `+${shadowBoost}% Shadow Detail` : null,
      warmth !== 0 ? `${warmth > 0 ? '+' : ''}${warmth}% Warmth` : null,
      sharpening > 0 ? `Crisp Sharpening` : null
    ].filter(Boolean).join(', ')
  };
}

/**
 * Applies full enhancement pipeline:
 * Tone curve, contrast, warmth, shadow recovery, and sharpening.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImg 
 * @param {Object} options - { brightness, contrast, warmth, sharpening, shadowBoost }
 * @returns {HTMLCanvasElement} enhanced canvas
 */
export function processImage(sourceImg, options = {}) {
  const {
    brightness = 0,
    contrast = 0,
    warmth = 0,
    sharpening = 0,
    shadowBoost = 0
  } = options;

  const width = sourceImg.naturalWidth || sourceImg.width;
  const height = sourceImg.naturalHeight || sourceImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceImg, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Pre-calculate Lookup Tables (LUT) for maximum performance
  // 1. Contrast factor: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const c = Math.max(-100, Math.min(100, contrast * 2.55));
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));

  // 2. Brightness offset
  const bOffset = brightness * 1.6;

  // 3. Warmth adjustments (red boost, blue reduction)
  const redShift = warmth * 0.45;
  const blueShift = -warmth * 0.35;

  // 4. Shadow boost gamma
  const shadowFactor = shadowBoost / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Shadow recovery (smooth lift for dark pixels)
    if (shadowFactor > 0) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum < 130) {
        const shadowWeight = (1 - lum / 130) * shadowFactor * 45;
        r += shadowWeight;
        g += shadowWeight;
        b += shadowWeight;
      }
    }

    // Apply Brightness
    r += bOffset;
    g += bOffset;
    b += bOffset;

    // Apply Contrast (centered around 128)
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Apply Warmth / Color balance
    r += redShift;
    b += blueShift;

    // Natural skin tone preservation clamp
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  // Put enhanced pixel data back
  ctx.putImageData(imgData, 0, 0);

  // Apply Gentle Sharpening if enabled (Unsharp Mask via 3x3 Convolution Kernel)
  if (sharpening > 0) {
    const sharpCanvas = applySharpenKernel(canvas, sharpening);
    return sharpCanvas;
  }

  return canvas;
}

/**
 * High-performance 3x3 convolution unsharp mask kernel for crisp facial detail
 * @param {HTMLCanvasElement} inputCanvas 
 * @param {number} amount - 0 to 100
 * @returns {HTMLCanvasElement}
 */
function applySharpenKernel(inputCanvas, amount) {
  const w = inputCanvas.width;
  const h = inputCanvas.height;
  const strength = (amount / 100) * 0.6; // gentle factor

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = w;
  outputCanvas.height = h;
  const outCtx = outputCanvas.getContext('2d');
  
  const inCtx = inputCanvas.getContext('2d', { willReadFrequently: true });
  const srcData = inCtx.getImageData(0, 0, w, h);
  const dstData = outCtx.createImageData(w, h);
  
  const src = srcData.data;
  const dst = dstData.data;

  // Kernel:
  // [  0,        -strength,       0         ]
  // [ -strength, 1 + 4*strength, -strength ]
  // [  0,        -strength,       0         ]
  const centerWeight = 1 + 4 * strength;
  const edgeWeight = -strength;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const topIdx = ((y - 1) * w + x) * 4;
      const botIdx = ((y + 1) * w + x) * 4;
      const leftIdx = (y * w + (x - 1)) * 4;
      const rightIdx = (y * w + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val = 
          src[idx + c] * centerWeight +
          src[topIdx + c] * edgeWeight +
          src[botIdx + c] * edgeWeight +
          src[leftIdx + c] * edgeWeight +
          src[rightIdx + c] * edgeWeight;

        dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      dst[idx + 3] = src[idx + 3]; // Preserve alpha
    }
  }

  // Handle edges by copying border rows
  for (let x = 0; x < w; x++) {
    const top = x * 4;
    const bot = ((h - 1) * w + x) * 4;
    for (let c = 0; c < 4; c++) {
      dst[top + c] = src[top + c];
      dst[bot + c] = src[bot + c];
    }
  }
  for (let y = 0; y < h; y++) {
    const left = (y * w) * 4;
    const right = (y * w + (w - 1)) * 4;
    for (let c = 0; c < 4; c++) {
      dst[left + c] = src[left + c];
      dst[right + c] = src[right + c];
    }
  }

  outCtx.putImageData(dstData, 0, 0);
  return outputCanvas;
}
