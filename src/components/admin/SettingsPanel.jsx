import React, { useState } from 'react';
import { Store, Clock, Lock } from 'lucide-react';
import PinSettings from './PinSettings';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('pizzeria_isOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('pizzeria_isOpen', JSON.stringify(newState));
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

      {/* CARD CAMBIA PIN */}
      <PinSettings />
    </div>
  );
}
