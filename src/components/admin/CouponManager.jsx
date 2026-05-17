import React, { useState, useEffect } from 'react';

const getCoupons = () => {
  const raw = localStorage.getItem('pizzeria_coupons');
  return raw ? JSON.parse(raw) : [];
};

const createCoupon = (data) => {
  const coupons = getCoupons();
  const newCoupon = {
    ...data,
    id: crypto.randomUUID(),
    created_date: new Date().toISOString(),
    usedCount: 0,
    isActive: true,
  };
  localStorage.setItem('pizzeria_coupons', JSON.stringify([...coupons, newCoupon]));
};

const updateCoupon = (id, data) => {
  const coupons = getCoupons().map(c => 
    c.id === id ? { ...c, ...data } : c
  );
  localStorage.setItem('pizzeria_coupons', JSON.stringify(coupons));
};

const deleteCoupon = (id) => {
  const coupons = getCoupons().filter(c => c.id !== id);
  localStorage.setItem('pizzeria_coupons', JSON.stringify(coupons));
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const refresh = () => setCoupons(getCoupons());

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || !value) return;
    
    createCoupon({
      code: code.toUpperCase(),
      description,
      discountType,
      value: parseFloat(value),
      maxUses: maxUses ? parseInt(maxUses) : null,
    });
    
    setCode('');
    setDescription('');
    setValue('');
    setMaxUses('');
    setShowForm(false);
    refresh();
  };

  const toggleActive = (id, current) => {
    updateCoupon(id, { isActive: !current });
    refresh();
  };

  const handleDelete = (id) => {
    if (window.confirm('Eliminare questo coupon?')) {
      deleteCoupon(id);
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-accent">
          Coupon Sconto
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-heading"
        >
          {showForm ? 'Chiudi' : '+ Nuovo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Codice (es. PIZZA10)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
              required
            />
            <input
              type="text"
              placeholder="Descrizione"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            >
              <option value="percent">Percentuale %</option>
              <option value="fixed">Fisso €</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder={discountType === 'percent' ? 'Sconto %' : 'Sconto €'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
              required
            />
            <input
              type="number"
              placeholder="Max usi (vuoto = infiniti)"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 rounded-md"
          >
            Crea Coupon
          </button>
        </form>
      )}

      <div className="space-y-2">
        {coupons.length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-4">Nessun coupon creato</p>
        ) : (
          coupons.map(coupon => (
            <div key={coupon.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-foreground">{coupon.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-900/30 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {coupon.isActive ? 'Attivo' : 'Disattivato'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    {coupon.description || 'Nessuna descrizione'} • 
                    {coupon.discountType === 'percent' ? ` ${coupon.value}%` : ` €${coupon.value.toFixed(2)}`} • 
                    Usato {coupon.usedCount}x{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(coupon.id, coupon.isActive)}
                    className="text-xs px-2 py-1 rounded-md bg-background/50 hover:bg-background"
                  >
                    {coupon.isActive ? 'Disattiva' : 'Attiva'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-xs px-2 py-1 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
