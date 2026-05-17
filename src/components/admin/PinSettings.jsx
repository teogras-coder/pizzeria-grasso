import React, { useState } from 'react';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';

export default function PinSettings() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // PIN attuale salvato
    const savedPin = localStorage.getItem('admin_pin') || '1980';
    
    // Controlla PIN attuale
    if (currentPin !== savedPin) {
      setMessage('PIN attuale errato!');
      setIsError(true);
      return;
    }
    
    // Controlla che i PIN nuovi coincidano
    if (newPin !== confirmPin) {
      setMessage('I PIN nuovi non coincidono!');
      setIsError(true);
      return;
    }
    
    // Controlla lunghezza
    if (newPin.length !== 4) {
      setMessage('Il PIN deve essere di 4 cifre!');
      setIsError(true);
      return;
    }
    
    // Salva nuovo PIN
    localStorage.setItem('admin_pin', newPin);
    setMessage('PIN cambiato con successo!');
    setIsError(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-foreground">Cambia PIN</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN attuale"
            maxLength={4}
            className="w-full bg-background/50 border border-border rounded-md px-3 py-2.5 text-center text-lg tracking-widest pr-10"
          />
        </div>
        
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN nuovo (4 cifre)"
            maxLength={4}
            className="w-full bg-background/50 border border-border rounded-md px-3 py-2.5 text-center text-lg tracking-widest"
          />
        </div>
        
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Conferma PIN nuovo"
            maxLength={4}
            className="w-full bg-background/50 border border-border rounded-md px-3 py-2.5 text-center text-lg tracking-widest"
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showPin ? 'Nascondi PIN' : 'Mostra PIN'}
        </button>
        
        {message && (
          <p className={`text-sm text-center font-body ${isError ? 'text-destructive' : 'text-green-400'}`}>
            {message}
          </p>
        )}
        
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Salva PIN
        </button>
      </form>
    </div>
  );
}
