import React, { useState, useEffect } from 'react';

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
        className="w-full h-40 object-cover"
      />
      
      {/* SFUMATURA SCURA PER LEGGERE IL TESTO */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* LOGO E TESTO IN ALTO A SINISTRA */}
      <div className="absolute top-4 left-4">
        <div className="bg-primary/90 backdrop-blur-sm rounded-lg px-3 py-2">
          <h1 className="font-heading text-lg font-bold text-primary-foreground">
            🍕 Antica Pizzeria Grasso
          </h1>
        </div>
      </div>
      
      {/* INDIRIZZO IN BASSO */}
      <div className="absolute bottom-3 left-4 right-4">
        <p className="font-body text-xs text-white/90 drop-shadow">
          📍 Via Antiche Mura Otto, 71043 Manfredonia (FG)
        </p>
        <p className="font-body text-xs text-white/70 drop-shadow">
          📞 0884 660377
        </p>
      </div>
    </div>
  );
}
