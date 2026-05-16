import React from 'react';

export default function Header() {
  return (
    <div className="relative w-full">
      <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-3 px-4 flex items-center justify-center gap-3 rounded-b-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <span className="font-heading text-2xl font-bold text-primary-foreground tracking-wide">
            Antica Pizzeria Grasso
          </span>
          <span className="font-body text-xs text-primary-foreground/80 italic tracking-widest">
            Dal 1980
          </span>
        </div>
      </div>
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"
          alt="Pizza Napoletana"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>
    </div>
  );
}
