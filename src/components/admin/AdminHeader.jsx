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
      {/* IMMAGINE PIÙ PICCOLA - h-32 invece di h-48 */}
      <img 
        src={mainImage} 
        alt="Antica Pizzeria Grasso"
        className="w-full h-32 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* TESTO IN BASSO A SINISTRA */}
      <div className="absolute bottom-2 left-4 right-4">
        <h1 className="font-heading text-xl font-bold text-primary-foreground drop-shadow-lg">
          Antica Pizzeria Grasso
        </h1>
        <p className="font-body text-xs text-primary-foreground/80 drop-shadow">
          Manfredonia (FG) - Via Antiche Mura Otto
        </p>
      </div>
    </div>
  );
}
