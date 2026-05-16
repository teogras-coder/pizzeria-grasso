import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ title, subtitle, icon, image, to }) {
  return (
    <Link to={to} className="block">
      <div className="flex items-center bg-card/90 backdrop-blur-sm rounded-xl border border-primary/20 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md">
        <div className="w-20 h-20 flex-shrink-0 bg-primary/20 flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{icon}</span>
          )}
        </div>
        <div className="flex-1 px-4 py-3">
          <h3 className="font-heading text-lg font-bold text-accent tracking-wide">{title}</h3>
          <p className="font-body text-xs text-muted-foreground italic">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
