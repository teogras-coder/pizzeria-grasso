import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PIN = '1980'; // Il PIN è 1980, puoi cambiarlo

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
        <h2 className="font-heading text-xl font-bold text-accent mb-4 text-center">
          🔒 Accesso Gestione
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Inserisci PIN"
            maxLength={4}
            className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-center text-lg tracking-widest"
          />
          {error && (
            <p className="text-destructive text-xs text-center">PIN errato!</p>
          )}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 rounded-md"
          >
            Entra
          </button>
        </form>
        <button
          onClick={() => navigate('/')}
          className="w-full mt-2 text-muted-foreground text-xs hover:text-foreground"
        >
          Torna indietro
        </button>
      </div>
    </div>
  );
}
