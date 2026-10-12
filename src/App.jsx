import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PhotoUploader from './components/PhotoUploader';
import DetailsForm from './components/DetailsForm';
import PreviewPanel from './components/PreviewPanel';
import CardListSection from './components/CardListSection';
import CardPreviewModal from './components/CardPreviewModal';
import ConfirmModal from './components/ConfirmModal';
import { analyzeImage, calculateAutoEnhancement, processImage } from './utils/imageEnhancer';
import { computeAutoFit } from './utils/faceDetector';
import { renderFalconCard, TEMPLATE_CONFIG } from './utils/cardRenderer';
import { exportCardAsPNG, exportCardAsPDF } from './utils/exportUtils';
import confetti from 'canvas-confetti';

const SAMPLE_STUDENTS = [
  {
    name: 'NAVIN PRASATH',
    position: 'OVERALL EVENT COORDINATOR',
    photoSrc: '/assets/sample_student.jpg'
  },
  {
    name: 'SARANYA K',
    position: 'JOINT TREASURER',
    photoSrc: '/assets/samples/saranya.png'
  },
  {
    name: 'DHARANI DHARAN S',
    position: 'TECHNICAL HEAD',
    photoSrc: '/assets/samples/student_2.png'
  },
  {
    name: 'KEERTHANA M',
    position: 'EVENT COORDINATOR',
    photoSrc: '/assets/samples/student_4.jpg'
  },
  {
    name: 'PRAVEEN T',
    position: 'EDITOR HEAD',
    photoSrc: '/assets/samples/student_5.jpeg'
  }
];

export default function App() {
  // Current card editor state
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [enhancedPhoto, setEnhancedPhoto] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [crop, setCrop] = useState({ zoom: 1.0, panX: 0, panY: 0 });

  // Batch Card List state
  const [cardList, setCardList] = useState(() => {
    try {
      const saved = sessionStorage.getItem('falcon_card_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editingCardId, setEditingCardId] = useState(null);
  const [previewModalCard, setPreviewModalCard] = useState(null);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearListModalOpen, setIsClearListModalOpen] = useState(false);

  // Persist card list to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('falcon_card_list', JSON.stringify(cardList));
    } catch (e) {
      // Ignore storage quota
    }
  }, [cardList]);

  // Data Safety: beforeunload warning if cards or unsaved work exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cardList.length > 0 || name || position || activePhoto) {
        e.preventDefault();
        e.returnValue = 'You have cards in your batch list. Leaving this page will clear unsaved cards.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cardList, name, position, activePhoto]);

  // Automatically load sample form on launch
  useEffect(() => {
    handleLoadSample();
  }, []);

  // Photo handlers
  const handlePhotoUploaded = (origImg, enhCanvas, defaultCrop) => {
    setOriginalPhoto(origImg);
    setEnhancedPhoto(enhCanvas);
    setActivePhoto(enhCanvas);
    setCrop(defaultCrop);
  };

  const handlePhotoRemoved = () => {
    setOriginalPhoto(null);
    setEnhancedPhoto(null);
    setActivePhoto(null);
    setCrop({ zoom: 1.0, panX: 0, panY: 0 });
  };

  const handleEnhancedPhotoChange = (updatedCanvas) => {
    setEnhancedPhoto(updatedCanvas);
    setActivePhoto(updatedCanvas);
  };

  // Reset current editor form
  const handleResetForm = () => {
    setName('');
    setPosition('');
    handlePhotoRemoved();
    setEditingCardId(null);
    setIsResetModalOpen(false);
  };

  // ADD TO CARD LIST (or UPDATE EXISTING)
  const handleAddToCardList = async () => {
    const isOriginalTemplate = 
      (!activePhoto) &&
      (!name || name.trim().toUpperCase() === "TEMPLATE PERSON'S NAME") &&
      (!position || position.trim().toUpperCase() === "OVERALL EVENT COORDINATOR");

    if (!isOriginalTemplate && (!name.trim() || !position.trim() || !activePhoto)) {
      alert('Please provide student photo, name, and committee position before adding to list.');
      return;
    }

    try {
      // Pre-render high-res 2x canvas (1388 x 2048) for thumbnail and fast PDF compilation
      const offscreen = document.createElement('canvas');
      await renderFalconCard(offscreen, {
        name: name.trim(),
        position: position.trim(),
        photoElement: activePhoto,
        crop
      }, 2);
      const renderedCardDataUrl = offscreen.toDataURL('image/png', 0.95);

      if (editingCardId) {
        // Update existing card
        setCardList((prev) =>
          prev.map((c) =>
            c.id === editingCardId
              ? {
                  ...c,
                  name: name.trim(),
                  position: position.trim(),
                  originalPhotoSrc: originalPhoto?.src || c.originalPhotoSrc,
                  enhancedPhotoDataUrl: enhancedPhoto?.toDataURL() || c.enhancedPhotoDataUrl,
                  renderedCardDataUrl,
                  crop: { ...crop },
                  updatedAt: Date.now()
                }
              : c
          )
        );
        setEditingCardId(null);
      } else {
        // Add new card
        const newCard = {
          id: `falcon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: name.trim(),
          position: position.trim(),
          originalPhotoSrc: originalPhoto?.src || '',
          enhancedPhotoDataUrl: enhancedPhoto?.toDataURL() || '',
          renderedCardDataUrl,
          crop: { ...crop },
          createdAt: Date.now()
        };
        setCardList((prev) => [...prev, newCard]);
      }

      // Trigger celebratory micro-confetti
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#ef4444', '#dc2626', '#ffffff']
      });

      // Clear the form and prepare for the next student
      setName('');
      setPosition('');
      handlePhotoRemoved();
    } catch (err) {
      console.error('Failed to add card to list:', err);
      alert('Error creating card image. Please try again.');
    }
  };

  // EDIT CARD
  const handleEditCard = (card) => {
    setEditingCardId(card.id);
    setName(card.name);
    setPosition(card.position);
    setCrop(card.crop || { zoom: 1.0, panX: 0, panY: 0 });

    const photoSrc = card.enhancedPhotoDataUrl || card.originalPhotoSrc;
    if (photoSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalPhoto(img);
        setEnhancedPhoto(img);
        setActivePhoto(img);
      };
      img.src = photoSrc;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setName('');
    setPosition('');
    handlePhotoRemoved();
  };

  // REMOVE CARD
  const handleRemoveCard = (cardId) => {
    setCardList((prev) => prev.filter((c) => c.id !== cardId));
    if (editingCardId === cardId) {
      handleCancelEdit();
    }
  };

  // CLEAR ALL CARDS
  const handleClearList = () => {
    setCardList([]);
    setIsClearListModalOpen(false);
  };

  // Load exact sample matching the user's uploaded Falcon template image
  const handleLoadSample = () => {
    setName("TEMPLATE PERSON'S NAME");
    setPosition("OVERALL EVENT COORDINATOR");
    handlePhotoRemoved();
  };

  // Load 5 sample students directly into batch list with auto-fitting for instant testing
  const handleLoad5SampleStudents = async () => {
    const offscreen = document.createElement('canvas');
    const newCards = [];

    for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
      const s = SAMPLE_STUDENTS[i];
      const img = await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.src = s.photoSrc;
      });

      // Analyze and auto-enhance
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      const stats = analyzeImage(imgData);
      const autoSettings = calculateAutoEnhancement(stats);
      const enhCanvas = processImage(img, autoSettings);

      // Automatic face detection & circular fitting
      const autoFit = await computeAutoFit(img, { radius: TEMPLATE_CONFIG.photo.radius });
      const computedCrop = { zoom: autoFit.zoom, panX: autoFit.panX, panY: autoFit.panY };

      // Render 2x card
      await renderFalconCard(offscreen, {
        name: s.name,
        position: s.position,
        photoElement: enhCanvas,
        crop: computedCrop
      }, 2);
      const renderedCardDataUrl = offscreen.toDataURL('image/png', 0.95);

      newCards.push({
        id: `falcon_${Date.now()}_${i}`,
        name: s.name,
        position: s.position,
        originalPhotoSrc: s.photoSrc,
        enhancedPhotoDataUrl: enhCanvas.toDataURL(),
        renderedCardDataUrl,
        crop: computedCrop,
        createdAt: Date.now() + i
      });
    }

    setCardList((prev) => [...prev, ...newCards]);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#ef4444', '#dc2626', '#ffffff', '#f59e0b']
    });
  };

  return (
    <div className="falcon-app">
      <Header />

      <main className="falcon-main-container">
        <div className="falcon-layout-grid">
          {/* Left Panel: Input & Photo Controls */}
          <section className="falcon-left-panel">
            <PhotoUploader 
              originalPhoto={originalPhoto}
              enhancedPhoto={enhancedPhoto}
              activePhoto={activePhoto}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoRemoved={handlePhotoRemoved}
              onEnhancedPhotoChange={handleEnhancedPhotoChange}
              crop={crop}
              onCropChange={setCrop}
            />

            <DetailsForm 
              name={name}
              setName={setName}
              position={position}
              setPosition={setPosition}
            />
          </section>

          {/* Right Panel: Live Card Preview & Add to Batch */}
          <section className="falcon-right-panel">
            <PreviewPanel 
              name={name}
              position={position}
              activePhoto={activePhoto}
              crop={crop}
              onResetRequest={() => setIsResetModalOpen(true)}
              onLoadSample={handleLoadSample}
              onAddToCardList={handleAddToCardList}
              editingCardId={editingCardId}
              onCancelEdit={handleCancelEdit}
              cardListCount={cardList.length}
            />
          </section>
        </div>

        {/* Batch ID Cards List & Bulk PDF Export Section */}
        <CardListSection 
          cardList={cardList}
          onEditCard={handleEditCard}
          onRemoveCard={handleRemoveCard}
          onClearList={() => setIsClearListModalOpen(true)}
          onPreviewCard={setPreviewModalCard}
          onDownloadCardPNG={(card) => {
            const link = document.createElement('a');
            link.href = card.renderedCardDataUrl;
            link.download = `FALCON_${card.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
            link.click();
          }}
          onDownloadCardPDF={async (card) => {
            const photoImg = new Image();
            photoImg.crossOrigin = 'anonymous';
            photoImg.onload = async () => {
              await exportCardAsPDF({
                name: card.name,
                position: card.position,
                photoElement: photoImg,
                crop: card.crop
              });
            };
            photoImg.src = card.enhancedPhotoDataUrl || card.originalPhotoSrc;
          }}
          onLoad5SampleStudents={handleLoad5SampleStudents}
        />
      </main>

      {/* Confirmation Modal for Reset Current Form */}
      <ConfirmModal 
        isOpen={isResetModalOpen}
        onConfirm={handleResetForm}
        onCancel={() => setIsResetModalOpen(false)}
        title="Reset Current Card Form?"
        message="This will clear the current name, designation, uploaded photo, and framing adjustments from the editor. Any previously added cards in your batch list will remain safe."
      />

      {/* Confirmation Modal for Clear Entire Card List */}
      <ConfirmModal 
        isOpen={isClearListModalOpen}
        onConfirm={handleClearList}
        onCancel={() => setIsClearListModalOpen(false)}
        title="Clear Entire Batch List?"
        message={`Are you sure you want to remove all ${cardList.length} cards from the batch list? This action cannot be undone.`}
      />

      {/* Full-Size Card Preview Modal */}
      <CardPreviewModal 
        card={previewModalCard}
        onClose={() => setPreviewModalCard(null)}
        onDownloadPNG={(card) => {
          const link = document.createElement('a');
          link.href = card.renderedCardDataUrl;
          link.download = `FALCON_${card.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
          link.click();
        }}
        onDownloadPDF={async (card) => {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          photoImg.onload = async () => {
            await exportCardAsPDF({
              name: card.name,
              position: card.position,
              photoElement: photoImg,
              crop: card.crop
            });
          };
          photoImg.src = card.enhancedPhotoDataUrl || card.originalPhotoSrc;
        }}
      />

      {/* Footer */}
      <footer className="falcon-footer">
        <div className="footer-content">
          <p>
            <strong>Local & Confidential:</strong> All bulk ID card compilation and photo enhancement happens 100% locally in your browser. Zero photographs or personal data are ever uploaded to any server.
          </p>
          <p className="footer-sub">
            FALCON Student Committee Suite • High-Resolution Multi-Page & A4 2×2 Sheet PDF Export
          </p>
        </div>
      </footer>
    </div>
  );
}
