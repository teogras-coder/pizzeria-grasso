import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

const MAIN_IMAGE_KEY = 'pizzeria_main_image';
const defaultMainImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';

const getMainImage = () => {
  return localStorage.getItem(MAIN_IMAGE_KEY) || defaultMainImage;
};

export default function Header() {
  const [mainImage, setMainImage] = useState(getMainImage());

  useEffect(() => {
    const handleUpdate = () => setMainImage(getMainImage());
    window.addEventListener('main-image-updated', handleUpdate);
    return () => window.removeEventListener('main-image-updated', handleUpdate);
  }, []);

  return (
    <div className="relative">
      {/* IMMAGINE PRINCIPALE */}
      <img 
        src={mainImage} 
        alt="Antica Pizzeria Grasso"
        className="w-full h-36 object-cover"
      />
      
      {/* SFUMATURA */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* LOGO E NOME IN ALTO A SINISTRA */}
      <div className="absolute top-3 left-3">
        <div className="bg-primary/80 backdrop-blur-sm rounded-lg px-3 py-2">
          <h1 className="font-heading text-base font-bold text-primary-foreground">
            🍕 Antica Pizzeria
          </h1>
          <p className="font-heading text-xs font-bold text-primary-foreground/90">
            Grasso
          </p>
        </div>
      </div>
      
      {/* LINK ADMIN IN ALTO A DESTRA - CLICCABILE! */}
      <Link 
        to="/admin-pin"
        className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background border border-border rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors"
      >
        <Settings className="w-4 h-4 text-primary" />
        <span className="font-body text-xs font-bold text-foreground">Admin</span>
      </Link>
      
      {/* INDIRIZZO IN BASSO */}
      <div className="absolute bottom-2 left-3">
        <p className="font-body text-[10px] text-white/80">
          📍 Manfredonia (FG) • 0884 660377
        </p>
      </div>
    </div>
  );
}
