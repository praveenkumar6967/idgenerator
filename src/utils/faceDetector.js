/**
 * Advanced Client-Side Face Detection & Intelligent Auto-Fitting
 * 
 * Automatically analyzes uploaded student photos (portrait, landscape, square,
 * selfie, full-body, dark, bright) and computes optimal zoom, panX, and panY
 * to fit the circular FALCON ID card frame with zero empty space and natural face centering.
 */

/**
 * Detects face position and computes optimal crop settings
 * @param {HTMLImageElement|HTMLCanvasElement} img 
 * @param {Object} circleConfig - { radius: number }
 * @returns {Promise<Object>} { zoom, panX, panY, method, summary }
 */
export async function computeAutoFit(img, circleConfig = { radius: 210 }) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const radius = circleConfig.radius || 210;
  const diameter = radius * 2;

  // 1. Try Native Browser Shape Detection API (if supported in Chrome/Edge)
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 1 });
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        const faceX = box.x + box.width / 2;
        const faceY = box.y + box.height / 2;
        const faceH = box.height;
        return calculateCropFromFace({
          imgW: w,
          imgH: h,
          faceX,
          faceY,
          faceH,
          diameter,
          radius,
          method: 'native'
        });
      }
    } catch (e) {
      // Fallback to computer-vision analysis
    }
  }

  // 2. Client-Side Computer Vision: Skin-Tone & Upper-Body Centroid Detection
  const cvFace = analyzeSkinToneAndFeatures(img, w, h);
  if (cvFace && cvFace.confidence > 0.3) {
    return calculateCropFromFace({
      imgW: w,
      imgH: h,
      faceX: cvFace.x,
      faceY: cvFace.y,
      faceH: cvFace.h,
      diameter,
      radius,
      method: 'skin_contour'
    });
  }

  // 3. Robust Orientation-Aware Fallback Heuristic
  return calculateHeuristicCrop(w, h, diameter, radius);
}

/**
 * Calculates zoom, panX, panY from face coordinates with mathematical guarantee
 * that the circular frame is 100% filled without empty space.
 */
function calculateCropFromFace({ imgW, imgH, faceX, faceY, faceH, diameter, radius, method }) {
  // Base scale needed to completely cover the circular aperture
  const baseScale = Math.max(diameter / imgW, diameter / imgH);

  // Determine optimal zoom so face is prominently displayed (occupying ~50-60% of circle height)
  let desiredZoom = 1.0;
  const relativeFaceHeight = faceH / imgH;

  if (relativeFaceHeight < 0.22) {
    // Full-body or distant portrait -> zoom in to frame head & shoulders
    desiredZoom = Math.min(2.1, 0.48 / (relativeFaceHeight || 0.22));
  } else if (relativeFaceHeight < 0.35) {
    // Half-body portrait
    desiredZoom = Math.min(1.45, 0.52 / relativeFaceHeight);
  } else if (relativeFaceHeight > 0.65) {
    // Very tight selfie -> keep zoom minimal so full hair/chin is visible
    desiredZoom = 1.0;
  } else {
    // Standard bust/passport photo
    desiredZoom = 1.08;
  }

  const finalScale = baseScale * desiredZoom;
  const drawW = imgW * finalScale;
  const drawH = imgH * finalScale;

  // Center the detected face horizontally & vertically
  // Add slight upward bias (-15% of radius) for natural headroom & neck display
  const targetFaceYOffset = -radius * 0.12;

  const rawPanX = -(faceX - imgW / 2) * finalScale;
  const rawPanY = -(faceY - imgH / 2) * finalScale + targetFaceYOffset;

  // CLAMP to mathematically prevent any empty space or black voids inside circle:
  const maxPanX = Math.max(0, (drawW - diameter) / 2);
  const maxPanY = Math.max(0, (drawH - diameter) / 2);

  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));

  return {
    zoom: Number(desiredZoom.toFixed(2)),
    panX: Math.round(clampedPanX),
    panY: Math.round(clampedPanY),
    method,
    summary: `Auto-centered face (${method === 'native' ? 'Face Detector' : 'Smart CV Centroid'})`
  };
}

/**
 * Orientation-aware fallback when no clear face is detected
 */
function calculateHeuristicCrop(imgW, imgH, diameter, radius) {
  const baseScale = Math.max(diameter / imgW, diameter / imgH);
  let zoom = 1.05;
  let panX = 0;
  let panY = 0;

  const aspectRatio = imgW / imgH;

  if (aspectRatio < 0.85) {
    // Portrait orientation: face is usually in upper third
    zoom = 1.1;
    const drawH = imgH * (baseScale * zoom);
    const maxPanY = Math.max(0, (drawH - diameter) / 2);
    // Pan up so the head and shoulders appear in the circular frame
    panY = -Math.round(maxPanY * 0.55);
  } else if (aspectRatio > 1.2) {
    // Landscape orientation: person is in middle, cover height
    zoom = 1.0;
    panX = 0;
    panY = 0;
  } else {
    // Square / near-square
    zoom = 1.05;
    const drawH = imgH * (baseScale * zoom);
    const maxPanY = Math.max(0, (drawH - diameter) / 2);
    panY = -Math.round(maxPanY * 0.25);
  }

  return {
    zoom,
    panX,
    panY,
    method: 'heuristic',
    summary: `Auto-fitted (${aspectRatio < 0.85 ? 'Portrait' : aspectRatio > 1.2 ? 'Landscape' : 'Square'} layout)`
  };
}

/**
 * Fast client-side skin-tone & upper feature centroid detection on resampled canvas
 */
function analyzeSkinToneAndFeatures(img, origW, origH) {
  try {
    const sampleW = 160;
    const sampleH = Math.round(160 * (origH / origW));

    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, sampleW, sampleH);

    // Analyze upper 65% of the photo
    const scanHeight = Math.round(sampleH * 0.65);
    const imgData = ctx.getImageData(0, 0, sampleW, scanHeight);
    const data = imgData.data;

    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let minY = scanHeight;
    let maxY = 0;
    let minX = sampleW;
    let maxX = 0;

    for (let y = 0; y < scanHeight; y++) {
      for (let x = 0; x < sampleW; x++) {
        const i = (y * sampleW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skin tone heuristic across human diversity
        const isSkin = 
          r > 75 && 
          g > 35 && 
          b > 15 && 
          r > g && 
          r > b && 
          Math.abs(r - g) > 10 && 
          (Math.max(r, g, b) - Math.min(r, g, b)) > 12;

        if (isSkin) {
          // Weight pixels closer to horizontal center higher
          const centerDist = Math.abs(x - sampleW / 2) / (sampleW / 2);
          const weight = 1 - centerDist * 0.4;

          totalWeight += weight;
          sumX += x * weight;
          sumY += y * weight;

          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (totalWeight < 60) {
      return null;
    }

    const detectedSampleX = sumX / totalWeight;
    const detectedSampleY = sumY / totalWeight;
    const faceHeightSample = Math.max(sampleH * 0.2, maxY - minY);

    return {
      x: (detectedSampleX / sampleW) * origW,
      y: (detectedSampleY / sampleH) * origH,
      h: (faceHeightSample / sampleH) * origH,
      confidence: totalWeight / (sampleW * scanHeight * 0.15)
    };
  } catch (e) {
    return null;
  }
}
