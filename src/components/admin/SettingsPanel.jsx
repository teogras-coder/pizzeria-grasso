import React, { useState } from 'react';
import { Store, Clock, Hash, RotateCcw, Image, Upload, X } from 'lucide-react';
import PinSettings from './PinSettings';
import { getNextOrderNumber, resetOrderCounter } from '@/lib/apiClient';

const MAIN_IMAGE_KEY = 'pizzeria_main_image';
const defaultMainImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';

const getMainImage = () => {
  return localStorage.getItem(MAIN_IMAGE_KEY) || defaultMainImage;
};

const saveMainImage = (image) => {
  localStorage.setItem(MAIN_IMAGE_KEY, image);
  window.dispatchEvent(new Event('main-image-updated'));
};

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('pizzeria_isOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [mainImage, setMainImage] = useState(getMainImage());
  const [preview, setPreview] = useState('');

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('pizzeria_isOpen', JSON.stringify(newState));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveImage = () => {
    if (preview) {
      saveMainImage(preview);
      setMainImage(preview);
      setPreview('');
    }
  };

  const handleResetImage = () => {
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
        <Store className="w-5 h-5" />
        Impostazioni
      </h2>

      {/* CARD TOGGLE APERTO/CHIUSO */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-foreground">Stato Pizzeria</h3>
        </div>
        
        <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
          <span className={`font-body font-bold ${isOpen ? 'text-green-400' : 'text-destructive'}`}>
            {isOpen ? '🟢 Aperta' : '🔴 Chiusa'}
          </span>
          
          <button
            onClick={toggleOpen}
            className={`px-4 py-2 rounded-lg font-heading text-sm font-bold transition-all ${
              isOpen 
                ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/40'
                : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-600/40'
            }`}
          >
            {isOpen ? 'Chiudi Pizzeria' : 'Apri Pizzeria'}
          </button>
        </div>
        
        <p className="text-muted-foreground text-xs font-body mt-2">
          {isOpen 
            ? 'I clienti possono effettuare ordini.' 
            : 'I clienti vedranno un avviso di chiusura.'}
        </p>
      </div>

      {/* CARD IMMAGINE PRINCIPALE */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-foreground">Immagine Principale</h3>
        </div>
        
        <img 
          src={preview || mainImage} 
          alt="Immagine principale"
          className="w-full h-32 object-cover rounded-lg"
        />
        
        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 bg-background/50 border border-border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-background/80 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-body">
              {preview ? 'Cambia' : 'Carica nuova'}
            </span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          
          {preview && (
            <button
              onClick={() => setPreview('')}
              className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {preview && (
          <button
            onClick={handleSaveImage}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 rounded-md"
          >
            Salva Immagine
          </button>
        )}
        
        <button
          onClick={handleResetImage}
          className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40 font-heading py-2 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Ripristina Predefinita
        </button>
      </div>

      {/* CARD NUMERI ORDINE */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-foreground">Numeri Ordine</h3>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 mb-3">
          <p className="text-muted-foreground text-xs font-body">
            Prossimo ordine: <span className="text-primary font-bold text-lg">#{getNextOrderNumber()}</span>
          </p>
        </div>
        
        <button
          onClick={() => {
            if (window.confirm('Sei sicuro di voler azzerare i numeri ordine? Il prossimo ordine sarà #1.')) {
              resetOrderCounter();
              window.location.reload();
            }
          }}
          className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40 font-heading py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Azzera Numeri Ordine
        </button>
        
        <p className="text-muted-foreground text-xs font-body mt-2">
          Attenzione: questa azione non può essere annullata!
        </p>
      </div>

      {/* CARD CAMBIA PIN */}
      <PinSettings />
    </div>
  );
}
