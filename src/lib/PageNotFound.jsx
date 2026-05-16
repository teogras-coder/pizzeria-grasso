import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-primary/20 rounded-full w-20 h-20 flex items-center justify-center mb-6">
        <span className="text-4xl">🍕</span>
      </div>
      <h1 className="font-heading text-4xl font-bold text-accent mb-2">404</h1>
      <p className="font-body text-muted-foreground mb-6">Pagina non trovata</p>
      <Link to="/">
        <button className="bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 px-4 rounded-lg flex items-center gap-2">
          <Home className="w-4 h-4" />
          Torna alla Home
        </button>
      </Link>
    </div>
  );
}
