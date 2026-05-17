// API LOCALE - nessun blocco, nessun servizio esterno
const STORAGE_KEYS = {
  menuItems: 'pizzeria_menu_items',
  orders: 'pizzeria_orders',
};

// ===== SETTINGS (Apertura/Chiusura, Orari, PIN) =====
export const getSettings = () => {
  const raw = localStorage.getItem('pizzeria_settings');
  return raw ? JSON.parse(raw) : {
    isOpen: true,
    pin: '1980',
    openingDays: {
      lunedi: false,
      martedi: true,
      mercoledi: true,
      giovedi: true,
      venerdi: true,
      sabato: true,
      domenica: true,
    },
    openingHours: { start: '19:00', end: '23:00' },
    deliveryHours: { start: '19:00', end: '22:30' },
    pickupHours: { start: '18:30', end: '23:00' },
  };
};

export const updateSettings = (data) => {
  const current = getSettings();
  const updated = { ...current, ...data };
  localStorage.setItem('pizzeria_settings', JSON.stringify(updated));
  window.dispatchEvent(new Event('settings-updated'));
  return updated;
};

export const checkIsOpen = () => {
  const settings = getSettings();
  if (!settings.isOpen) return false;

  const now = new Date();
  const dayNames = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
  const today = dayNames[now.getDay()];

  if (!settings.openingDays[today]) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = settings.openingHours.start.split(':').map(Number);
  const [endH, endM] = settings.openingHours.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentTime >= startMinutes && currentTime <= endMinutes;
};
