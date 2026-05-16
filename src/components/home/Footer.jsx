import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer({ cartCount }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-primary/20 py-3 px-4 flex items-center justify-between z-50">
      <div className="flex flex-col">
        <span className="font-heading text-xs text-primary font-semibold">AG</span>
        <span className="font-body text-[10px] text-muted-foreground">Manfredonia, Tel. 0884 660377</span>
      </div>
      <Link
        to="/carrello"
        className="relative bg-primary rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
      >
        <ShoppingCart className="w-5 h-5 text-primary-foreground" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
