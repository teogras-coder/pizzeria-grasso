// COUPON / CODICI SCONTO
const STORAGE_KEY = 'pizzeria_coupons';

export const getCoupons = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const createCoupon = (data) => {
  const coupons = getCoupons();
  const newCoupon = {
    ...data,
    id: crypto.randomUUID(),
    created_date: new Date().toISOString(),
    usedCount: 0,
    isActive: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...coupons, newCoupon]));
  window.dispatchEvent(new Event('coupons-updated'));
  return newCoupon;
};

export const updateCoupon = (id, data) => {
  const coupons = getCoupons().map(c => 
    c.id === id ? { ...c, ...data } : c
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  window.dispatchEvent(new Event('coupons-updated'));
};

export const deleteCoupon = (id) => {
  const coupons = getCoupons().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  window.dispatchEvent(new Event('coupons-updated'));
};

export const validateCoupon = (code) => {
  const coupons = getCoupons();
  const coupon = coupons.find(c => 
    c.code.toUpperCase() === code.toUpperCase() && 
    c.isActive && 
    (c.maxUses === null || c.usedCount < c.maxUses)
  );
  
  if (!coupon) return { valid: false, message: 'Codice non valido o scaduto' };
  
  return { 
    valid: true, 
    coupon,
    discount: coupon.discountType === 'percent' 
      ? `${coupon.value}%` 
      : `€${coupon.value.toFixed(2)}`
  };
};

export const useCoupon = (code) => {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (coupon) {
    coupon.usedCount += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  }
};
