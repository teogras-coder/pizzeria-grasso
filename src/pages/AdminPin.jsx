import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

const ADMIN_PIN = '1980'; // PIN fisso per ora

export default function AdminPin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="bg-card/80 rounded-xl border border-primary/20 p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-xl font-bold text-accent">
            Accesso Gestione
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { 
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); 
              setError(false); 
            }}
            placeholder="Inserisci PIN (4 cifre)"
            maxLength={4}
            className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-3 text-center text-lg tracking-widest"
            autoFocus
          />

          {error && (
            <p className="text-destructive text-sm text-center font-body">
              PIN errato! Riprova.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-3 rounded-md transition-colors"
          >
            Entra
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 flex items-center justify-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Home
        </button>
      </div>
    </div>
  );
}
