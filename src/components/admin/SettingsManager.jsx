import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/apiClient';
import { Save, Clock, Calendar, Lock, Power, RotateCcw, Hash } from 'lucide-react';
import { toast } from 'sonner';

const days = [
  { id: 'lunedi', label: 'Lunedì' },
  { id: 'martedi', label: 'Martedì' },
  { id: 'mercoledi', label: 'Mercoledì' },
  { id: 'giovedi', label: 'Giovedì' },
  { id: 'venerdi', label: 'Venerdì' },
  { id: 'sabato', label: 'Sabato' },
  { id: 'domenica', label: 'Domenica' },
];

const timeOptions = [];
for (let h = 12; h <= 24; h++) {
  for (let m = 0; m < 60; m += 10) {
    if (h === 24 && m > 0) continue;
    timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export default function SettingsManager() {
  const [settings, setSettings] = useState(getSettings());
  const [pin, setPin] = useState('');
  const [orderCounter, setOrderCounter] = useState(() => {
    return parseInt(localStorage.getItem('pizzeria_order_counter') || '0');
  });

  const handleSave = () => {
    const newSettings = { ...settings };
    if (pin && pin.length === 4) {
      newSettings.pin = pin;
    }
    updateSettings(newSettings);
    toast.success('Impostazioni salvate!');
    setPin('');
  };

  const handleResetCounter = () => {
    if (confirm('Sei sicuro di voler azzerare il contatore ordini?')) {
      localStorage.setItem('pizzeria_order_counter', '0');
      setOrderCounter(0);
      toast.success('Contatore ordini azzerato!');
    }
  };

  const toggleDay = (dayId) => {
    setSettings(prev => ({
      ...prev,
      openingDays: {
        ...prev.openingDays,
        [dayId]: !prev.openingDays[dayId]
      }
    }));
  };

  return (
    <div className="space-y-6 px-4 py-4">
      <h2 className="font-heading text-lg font-bold text-accent">Impostazioni</h2>

      {/* Aperto/Chiuso */}
      <div className="bg-card/60 rounded-xl border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Power className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-accent">Stato Pizzeria</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-body">
            {settings.isOpen ? '🟢 Aperta' : '🔴 Chiusa'}
          </span>
          <button
            onClick={() => setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.isOpen ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              settings.isOpen ? 'translate-x-7' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* PIN Admin */}
      <div className="bg-card/60 rounded-xl border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-accent">PIN Admin</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Nuovo PIN (4 cifre)"
            className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm text-center tracking-widest"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">PIN attuale: {settings.pin || '1980'}</p>
      </div>

      {/* Contatore Ordini */}
      <div className="bg-card/60 rounded-xl border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-accent">Contatore Ordini</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-heading font-bold text-accent">{orderCounter}</span>
            <span className="text-xs text-muted-foreground ml-2">ordini effettuati</span>
          </div>
          <button
            onClick={handleResetCounter}
            className="flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md px-3 py-2 text-xs font-heading transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Azzera
          </button>
        </div>
      </div>

      {/* Giorni Apertura */}
      <div className="bg-card/60 rounded-xl border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-accent">Giorni Apertura</h3>
        </div>
        <div className="space-y-2">
          {days.map(day => (
            <div key={day.id} className="flex items-center justify-between">
              <span className="text-sm font-body">{day.label}</span>
              <button
                onClick={() => toggleDay(day.id)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  settings.openingDays[day.id] ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.openingDays[day.id] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Orari */}
      <div className="bg-card/60 rounded-xl border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-accent">Orari</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-accent font-heading block mb-1">Orario Apertura</label>
            <div className="flex gap-2">
              <select
                value={settings.openingHours.start}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  openingHours: { ...prev.openingHours, start: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="self-center text-sm">-</span>
              <select
                value={settings.openingHours.end}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  openingHours: { ...prev.openingHours, end: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-accent font-heading block mb-1">Orario Consegna</label>
            <div className="flex gap-2">
              <select
                value={settings.deliveryHours.start}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  deliveryHours: { ...prev.deliveryHours, start: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="self-center text-sm">-</span>
              <select
                value={settings.deliveryHours.end}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  deliveryHours: { ...prev.deliveryHours, end: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-accent font-heading block mb-1">Orario Ritiro</label>
            <div className="flex gap-2">
              <select
                value={settings.pickupHours.start}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  pickupHours: { ...prev.pickupHours, start: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="self-center text-sm">-</span>
              <select
                value={settings.pickupHours.end}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  pickupHours: { ...prev.pickupHours, end: e.target.value }
                }))}
                className="flex-1 bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Salva */}
      <button
        onClick={handleSave}
        className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-3 rounded-md flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" /> Salva Impostazioni
      </button>
    </div>
  );
}
