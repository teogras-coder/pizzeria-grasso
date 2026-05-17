import React, { useState, useEffect } from 'react';
import { Upload, Image, X, RotateCcw } from 'lucide-react';

const MAIN_IMAGE_KEY = 'pizzeria_main_image';

const defaultMainImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';

const getMainImage = () => {
  return localStorage.getItem(MAIN_IMAGE_KEY) || defaultMainImage;
};

const saveMainImage = (image) => {
  localStorage.setItem(MAIN_IMAGE_KEY, image);
  window.dispatchEvent(new Event('main-image-updated'));
};

export default function MainImageManager() {
  const [mainImage, setMainImage] = useState(getMainImage());
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const handleUpdate = () => setMainImage(getMainImage());
    window.addEventListener('main-image-updated', handleUpdate);
    return () => window.removeEventListener('main-image-updated', handleUpdate);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (preview) {
      saveMainImage(preview);
      setPreview('');
    }
  };

  const handleReset = () => {
    if (window.confirm('Ripristinare l\'immagine predefinita?')) {
      localStorage.removeItem(MAIN_IMAGE_KEY);
      setMainImage(defaultMainImage);
      setPreview('');
      window.dispatchEvent(new Event('main-image-updated'));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-accent flex items-center gap-2">
        <Image className="w-5 h-5" />
        Immagine Principale
      </h2>

      {/* Anteprima attuale */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground font-body mb-2">Immagine attuale:</p>
        <img 
          src={mainImage} 
          alt="Immagine principale"
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      {/* Upload nuova immagine */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-body">Carica nuova immagine:</p>
        
        <div className="flex items-center gap-3">
          {preview && (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
              <button
                onClick={() => setPreview('')}
                className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </div>
          )}
          
          <label className="flex items-center gap-2 bg-background/50 border border-border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-background/80 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-body">
              {preview ? 'Cambia immagine' : 'Carica immagine'}
            </span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {preview && (
          <button
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 rounded-md"
          >
            Salva Immagine
          </button>
        )}
      </div>

      {/* Ripristina */}
      <button
        onClick={handleReset}
        className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40 font-heading py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Ripristina Predefinita
      </button>
    </div>
  );
}
