import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import useCart from '@/hooks/useCart';
import { updateCartQuantity, removeFromCart, clearCart } from '@/lib/cartStore';
import { createOrder } from '@/lib/apiClient';

export default function Cart() {
  const { cart, cartTotal, refresh } = useCart();
  const [orderType, setOrderType] = useState('asporto');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    if (tipo) setOrderType(tipo);
  }, []);

  const handleSubmit = async () => {
    if (!name || !phone) { 
      toast.error('Inserisci nome e telefono'); 
      return; 
    }
    if (orderType === 'domicilio' && !address) { 
      toast.error("Inserisci l'indirizzo di consegna"); 
      return; 
    }
    if (cart.length === 0) { 
      toast.error('Il carrello è vuoto'); 
      return; 
    }
    
    setSubmitting(true);
    try {
      createOrder({ 
        items: cart, 
        total: cartTotal, 
        order_type: orderType, 
        status: 'nuovo', 
        customer_name: name, 
        customer_phone: phone, 
        customer_address: address, 
        notes 
      });
      clearCart();
      refresh();
      setOrderSent(true);
      toast.success('Ordine inviato con successo!');
    } catch (e) {
      toast.error('Errore invio ordine');
    }
    setSubmitting(false);
  };

  if (orderSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-primary/20 rounded-full w-20 h-20 flex items-center justify-center mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-accent mb-2">Ordine Inviato!</h2>
        <p className="font-body text-muted-foreground mb-6">
          Il tuo ordine è stato ricevuto. Ti contatteremo al numero indicato.
        </p>
        <Link to="/">
          <button className="bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 px-4 rounded-lg">
            Torna alla Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-4 px-4 flex items-center gap-3 sticky top-0 z-40">
        <Link to="/" className="text-primary-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-xl font-bold text-primary-foreground">Carrello</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-muted-foreground">Il carrello è vuoto</p>
            <Link to="/">
              <button className="mt-4 border border-primary/30 text-primary rounded-md px-4 py-2 text-sm font-heading hover:bg-primary/10">
                Vai al Menu
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.menu_item_id} className="flex items-center bg-card/80 rounded-xl border border-primary/15 p-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-bold text-accent truncate">{item.name}</h4>
                    <p className="font-body text-xs text-primary">€{item.price?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="h-7 w-7 rounded-full border border-primary/30 flex items-center justify-center hover:bg-primary/10"
                      onClick={() => updateCartQuantity(item.menu_item_id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-heading text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                    <button 
                      className="h-7 w-7 rounded-full border border-primary/30 flex items-center justify-center hover:bg-primary/10"
                      onClick={() => updateCartQuantity(item.menu_item_id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button 
                      className="h-7 w-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => removeFromCart(item.menu_item_id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card/90 rounded-xl border border-primary/20 p-4 flex justify-between items-center">
              <span className="font-heading text-lg font-bold text-accent">Totale</span>
              <span className="font-heading text-xl font-bold text-primary">€{cartTotal.toFixed(2)}</span>
            </div>
            <div className="space-y-4 bg-card/60 rounded-xl border border-primary/15 p-4">
              <div>
                <label className="font-heading text-xs text-accent mb-2 block">Tipo Ordine</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="orderType" 
                      value="asporto" 
                      checked={orderType === 'asporto'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="font-body text-sm">Ritiro in pizzeria</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="orderType" 
                      value="domicilio" 
                      checked={orderType === 'domicilio'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="font-body text-sm">Consegna a domicilio</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="font-heading text-xs text-accent mb-1 block">Nome *</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Il tuo nome" 
                  className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="font-heading text-xs text-accent mb-1 block">Telefono *</label>
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Numero di telefono" 
                  type="tel" 
                  className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
                />
              </div>
              {orderType === 'domicilio' && (
                <div>
                  <label className="font-heading text-xs text-accent mb-1 block">Indirizzo *</label>
                  <input 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Indirizzo di consegna" 
                    className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="font-heading text-xs text-accent mb-1 block">Note</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Allergie, preferenze..." 
                  className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm h-20"
                />
              </div>
              <button 
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading text-lg py-3 rounded-lg disabled:opacity-50"
                onClick={handleSubmit} 
                disabled={submitting}
              >
                {submitting ? 'Invio in corso...' : 'Invia Ordine'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
