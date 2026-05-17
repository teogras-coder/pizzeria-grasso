import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Percent, Euro, ToggleLeft, ToggleRight } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/coupons';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    value: '',
    maxUses: '',
  });

  const refresh = () => setCoupons(getCoupons());

  useEffect(() => {
    refresh();
    window.addEventListener('coupons-updated', refresh);
    return () => window.removeEventListener('coupons-updated', refresh);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;
    
    createCoupon({
      code: formData.code.toUpperCase(),
      description: formData.description,
      discountType: formData.discountType,
      value: parseFloat(formData.value),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
    });
    
    setFormData({ code: '', description: '', discountType: 'percent', value: '', maxUses: '' });
    setShowForm(false);
    refresh();
  };

  const toggleActive = (id, current) => {
    updateCoupon(id, { isActive: !current });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-accent flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Coupon Sconto
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-heading flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Nuovo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Codice (es. PIZZA10)"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
              required
            />
            <input
              type="text"
              placeholder="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({...formData, discountType: e.target.value})}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            >
              <option value="percent">Percentuale %</option>
              <option value="fixed">Fisso €</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder={formData.discountType === 'percent' ? 'Sconto %' : 'Sconto €'}
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              className="bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
              required
            />
            <input
              type="number"
              placeholder="Max usi (vuoto = ∞)"
              value={formData.maxUses}
              onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
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
            <div key={coupon.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 rounded-lg p-2">
                  {coupon.discountType === 'percent' ? (
                    <Percent className="w-4 h-4 text-primary" />
                  ) : (
                    <Euro className="w-4 h-4 text-primary" />
                  )}
                </div>
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
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(coupon.id, coupon.isActive)}
                  className="p-1.5 rounded-md hover:bg-background/50 transition-colors"
                >
                  {coupon.isActive ? (
                    <ToggleRight className="w-5 h-5 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => { deleteCoupon(coupon.id); refresh(); }}
                  className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
