# 🦅 FALCON ID CARD GENERATOR

> **Standalone Client-Side Web Application for Designing Personalized FALCON Student Committee Identity Cards**

A dedicated, high-performance web tool built with **React**, **Vite**, and **HTML5 Canvas**. Generates individual and batch print-ready identity cards by applying student photographs, custom names, and designations onto the official **FALCON** black-and-red committee template — completely locally in the browser with **100% privacy**.

---

## ⚡ Key Features

### 1. 🦅 Exact Official FALCON Template
- Preserves the authentic black-and-red aesthetic, crown symbol, eagle illustration, red circular flame frame, and outer geometric borders.
- **Zero distortion**: Original aspect ratio (694 × 1024) maintained with pixel precision.
- **Zero ghost text**: Removes or masks previous placeholder names and positions with pure-black blending before painting new text.

### 2. 🎯 Automatic Photo Detection & Circular Fitting
- **Instant Image Processing**: Automatically analyzes uploaded student photos (portrait, landscape, square, selfie, full-body, dark, bright) without requiring manual adjustments.
- **Face Detection & Headroom Preservation**:
  - Uses native browser Shape Detection API (`window.FaceDetector`) where available.
  - In-browser computer-vision fallback: Skin-tone segmentation and facial feature centroid analysis.
  - Automatically centers the person's face with natural headroom and shoulder balance.
- **Mathematical Guarantee**:
  - Automatically scales the image so the circular aperture (`cx: 347, cy: 472, radius: 212px`) is **100% filled** with zero empty spaces or black voids.
  - Circular clipping prevents any overflow outside the frame.
  - Crisp inner red circular border ring (`#ef2a2a`) with ambient glow seamlessly frames the photograph.
- **Manual Adjustments (Optional)**:
  - Zoom slider (0.7× to 2.5×)
  - Horizontal Pan X (-180px to +180px)
  - Vertical Pan Y (-220px to +220px)
  - **"🎯 Reset to Auto-Fit"** button restores the automatically calculated crop anytime.

### 3. ✨ Automatic AI-Grade Photo Enhancement
- **Instant Client-Side Processing**: Automatically runs immediately upon uploading any photo.
- **Lighting & Exposure Correction**: Midtone gamma lift for underexposed or dim photos while preserving deep blacks.
- **Contrast Optimization**: Adaptive S-curve contrast stretching for dull, flat images.
- **Shadow Detail Recovery**: Gently boosts dark hair, facial shadows, and clothing.
- **Skin-Tone Preservation**: Conservative warmth balance that avoids oversaturation or artificial whitening.
- **Gentle Unsharp Mask Sharpening**: 3×3 convolution kernel brings out crisp detail in eyes and facial features.
- **Before / After Comparison Modes**:
  - `✨ Enhanced Photo` (Active on card)
  - `📷 Original Photo`
  - `⚡ Before / After Split Slider` (Interactive drag comparison)
- **Manual Adjustment Sliders**: Fine-tune Brightness, Contrast, Warmth, Shadow Boost, and Sharpening with Re-enhance and Reset buttons.

### 4. 📚 Bulk ID Card Batch Generation & Combined PDF
- **"ADD TO CARD LIST"**:
  - Validates required fields, renders a high-resolution 2× canvas (1388 × 2048 px), and adds it to the batch list.
  - Resets the form immediately for the next participant while preserving all previously added cards.
- **Batch Management**:
  - Preview every card in full-size modal.
  - Edit existing cards (loads photo, name, position, crop back into the editor).
  - Remove individual cards.
  - Clear entire list with confirmation.
- **"DOWNLOAD ALL CARDS AS PDF"**:
  - **Layout A — 1 Card Per Page**: Standard full-bleed ID card badge format (exact 694:1024 aspect ratio).
  - **Layout B — Multiple Cards Per Page (A4 2×2 Grid)**: Prints 4 cards per A4 page with 15mm margins and cutting guidelines.
  - High resolution, zero distortion, zero interface elements in export.
  - Individual card PNG and PDF downloads remain available anytime.

---

## 🚀 Getting Started

### Installation & Running Locally

1. Navigate to the project directory:
   ```bash
   cd c:\Users\ADMIN\Downloads\ID
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```text
   http://127.0.0.1:5173/
   ```

5. Production build:
   ```bash
   npm run build
   ```
