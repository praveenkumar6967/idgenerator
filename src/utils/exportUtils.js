/**
 * Export Utilities for PNG and PDF Generation (Single & Bulk)
 */
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { renderFalconCard, TEMPLATE_CONFIG } from './cardRenderer';

function sanitizeFilename(name) {
  if (!name || !name.trim()) return 'Student_Card';
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Exports high-resolution PNG for a single card (Retina 2x: 1388 x 2048)
 * 
 * @param {Object} cardData - { name, position, photoElement, crop }
 * @returns {Promise<string>} Downloaded filename
 */
export async function exportCardAsPNG(cardData) {
  const offscreen = document.createElement('canvas');
  await renderFalconCard(offscreen, cardData, 2);

  const filename = `FALCON_${sanitizeFilename(cardData.name)}.png`;

  return new Promise((resolve, reject) => {
    offscreen.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerCelebration();
      resolve(filename);
    }, 'image/png');
  });
}

/**
 * Exports print-ready PDF for a single card (Single Page)
 * 
 * @param {Object} cardData - { name, position, photoElement, crop }
 * @returns {Promise<string>} Downloaded filename
 */
export async function exportCardAsPDF(cardData) {
  const offscreen = document.createElement('canvas');
  await renderFalconCard(offscreen, cardData, 2);

  const dataUrl = offscreen.toDataURL('image/png', 1.0);
  const filename = `FALCON_${sanitizeFilename(cardData.name)}.pdf`;

  // Aspect ratio is 694 / 1024 = 0.6777
  const pdfWidthMm = 70;
  const pdfHeightMm = Number((pdfWidthMm / TEMPLATE_CONFIG.aspectRatio).toFixed(2));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm]
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, '', 'FAST');
  pdf.save(filename);

  triggerCelebration();
  return filename;
}

/**
 * Exports ALL cards in the card list into ONE single combined PDF
 * 
 * Supports two layout modes:
 * A. 'single': One ID card per page (exact card aspect ratio, full-bleed badge format)
 * B. 'grid': Multiple ID cards per page (2x2 grid on A4 sheet with neat margins & cut lines)
 * 
 * @param {Array<Object>} cardList - Array of stored cards
 * @param {Object} options - { layout: 'single' | 'grid', onProgress: Function }
 * @returns {Promise<string>} Downloaded filename
 */
export async function exportBulkCardsAsPDF(cardList, options = {}) {
  const {
    layout = 'single', // 'single' | 'grid'
    onProgress = () => {}
  } = options;

  if (!cardList || cardList.length === 0) {
    throw new Error('No cards in the list to export.');
  }

  const filename = `FALCON_All_Student_ID_Cards.pdf`;
  const totalCards = cardList.length;

  // Helper to ensure we have a rendered dataURL for each card
  const renderedDataUrls = [];
  const offscreen = document.createElement('canvas');

  for (let i = 0; i < totalCards; i++) {
    onProgress(i + 1, totalCards, `Rendering card ${i + 1} of ${totalCards}...`);
    const card = cardList[i];

    if (card.renderedCardDataUrl) {
      renderedDataUrls.push(card.renderedCardDataUrl);
    } else {
      // Create image element from stored photo
      const photoImg = await loadImageFromSrc(card.enhancedPhotoDataUrl || card.originalPhotoSrc);
      await renderFalconCard(offscreen, {
        name: card.name,
        position: card.position,
        photoElement: photoImg,
        crop: card.crop
      }, 2);
      renderedDataUrls.push(offscreen.toDataURL('image/png', 1.0));
    }
  }

  onProgress(totalCards, totalCards, 'Compiling PDF document...');

  if (layout === 'single') {
    // ----------------------------------------------------
    // LAYOUT A: ONE ID CARD PER PAGE
    // ----------------------------------------------------
    const cardWidthMm = 70;
    const cardHeightMm = Number((cardWidthMm / TEMPLATE_CONFIG.aspectRatio).toFixed(2));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [cardWidthMm, cardHeightMm]
    });

    for (let i = 0; i < renderedDataUrls.length; i++) {
      if (i > 0) {
        pdf.addPage([cardWidthMm, cardHeightMm], 'portrait');
      }
      pdf.addImage(renderedDataUrls[i], 'PNG', 0, 0, cardWidthMm, cardHeightMm, '', 'FAST');
    }

    pdf.save(filename);
  } else {
    // ----------------------------------------------------
    // LAYOUT B: MULTIPLE CARDS PER A4 PAGE (2x2 Grid)
    // ----------------------------------------------------
    // A4 dimensions: 210mm x 297mm
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const cardsPerPage = 4; // 2 cols x 2 rows

    const cardWidthMm = 85;
    const cardHeightMm = Number((cardWidthMm / TEMPLATE_CONFIG.aspectRatio).toFixed(2)); // ~125.42mm

    const colGapMm = 10;
    const rowGapMm = 12;

    const totalGridWidth = 2 * cardWidthMm + colGapMm; // 180mm
    const totalGridHeight = 2 * cardHeightMm + rowGapMm; // 262.84mm

    const leftMargin = (pageWidthMm - totalGridWidth) / 2; // 15mm
    const topMargin = (pageHeightMm - totalGridHeight) / 2; // 17.08mm

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < renderedDataUrls.length; i++) {
      const pageIndex = Math.floor(i / cardsPerPage);
      const positionOnPage = i % cardsPerPage;

      if (positionOnPage === 0 && pageIndex > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const col = positionOnPage % 2;
      const row = Math.floor(positionOnPage / 2);

      const x = leftMargin + col * (cardWidthMm + colGapMm);
      const y = topMargin + row * (cardHeightMm + rowGapMm);

      // Embed Card Image
      pdf.addImage(renderedDataUrls[i], 'PNG', x, y, cardWidthMm, cardHeightMm, '', 'FAST');

      // Add subtle cutting guide boundary around each card
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.15);
      pdf.rect(x, y, cardWidthMm, cardHeightMm);
    }

    pdf.save(filename);
  }

  triggerCelebration();
  return filename;
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function triggerCelebration() {
  try {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#ef4444', '#dc2626', '#ffffff', '#f59e0b', '#991b1b']
    });
  } catch (e) {
    // Ignore if canvas-confetti is not available
  }
}
