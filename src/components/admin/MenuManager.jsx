import React, { useState, useEffect } from 'react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/apiClient';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categoryLabels = { 
  focacce: 'Focacce', 
  pizze_napoli: 'Pizze Napoli', 
  frittura: 'Frittura', 
  bibite: 'Bibite' 
};

function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { 
    name: '', 
    description: '', 
    price: '', 
    category: 'pizze_napoli', 
    image_url: '', 
    available: true 
  });
  
  const handleSubmit = () => {
    if (!form.name || !form.price || !form.category) { 
      toast.error('Compila nome, prezzo e categoria'); 
      return; 
    }
    onSave({ ...form, price: parseFloat(form.price) });
  };
  
  return (
    <div className="space-y-3 bg-card p-4 rounded-xl border border-primary/20">
      <div>
        <label className="text-xs text-accent font-heading block mb-1">Nome *</label>
        <input 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-accent font-heading block mb-1">Descrizione</label>
        <textarea 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm h-16"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-accent font-heading block mb-1">Prezzo (€) *</label>
          <input 
            type="number" 
            step="0.50" 
            value={form.price} 
            onChange={e => setForm({ ...form, price: e.target.value })} 
            className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-accent font-heading block mb-1">Categoria *</label>
          <select 
            value={form.category} 
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
          >
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-accent font-heading block mb-1">URL Immagine</label>
        <input 
          value={form.image_url} 
          onChange={e => setForm({ ...form, image_url: e.target.value })} 
          placeholder="https://..." 
          className="w-full bg-background/50 border border-primary/20 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={form.available} 
          onChange={e => setForm({ ...form, available: e.target.checked })} 
          className="w-4 h-4"
        />
        <label className="text-xs text-accent font-heading">Disponibile</label>
      </div>
      <div className="flex gap-2 pt-2">
        <button 
          onClick={onCancel} 
          className="flex-1 border border-primary/20 rounded-md py-2 text-sm font-heading hover:bg-card/50"
        >
          Annulla
        </button>
        <button 
          onClick={handleSubmit} 
          className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md py-2 text-sm font-heading"
        >
          Salva
        </button>
      </div>
    </div>
  );
}

export default function MenuManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    setItems(getMenuItems());
  };

  useEffect(() => {
    setIsLoading(true);
    refresh();
    setIsLoading(false);
    window.addEventListener('menu-updated', refresh);
    return () => window.removeEventListener('menu-updated', refresh);
  }, []);

  const handleSave = (data) => {
    if (editingItem) { 
      updateMenuItem(editingItem.id, data); 
      toast.success('Prodotto aggiornato'); 
    } else { 
      createMenuItem(data); 
      toast.success('Prodotto creato'); 
    }
    refresh();
    setDialogOpen(false); 
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    deleteMenuItem(id);
    refresh();
    toast.success('Prodotto eliminato');
  };

  const grouped = Object.entries(categoryLabels).map(([key, label]) => ({ 
    key, 
    label, 
    items: items.filter(i => i.category === key) 
  }));

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-lg font-bold text-accent">Gestione Menu</h2>
        <button 
          onClick={() => { setEditingItem(null); setDialogOpen(true); }}
          className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-md px-3 py-2 text-sm font-heading flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>
      
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ItemForm 
              item={editingItem} 
              onSave={handleSave} 
              onCancel={() => { setDialogOpen(false); setEditingItem(null); }} 
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.key}>
            <h3 className="font-heading text-sm font-bold text-primary mb-2">{group.label}</h3>
            {group.items.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-3">Nessun prodotto</p>
            ) : (
              <div className="space-y-2 mb-4">
                {group.items.map(item => (
                  <div key={item.id} className="flex items-center bg-card/60 rounded-lg border border-primary/10 p-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-accent truncate">{item.name}</span>
                        {!item.available && <span className="text-[10px] text-destructive">(non disponibile)</span>}
                      </div>
                      <span className="text-xs text-primary">€{item.price?.toFixed(2)}</span>
                    </div>
                    <button 
                      className="h-7 w-7 flex items-center justify-center hover:bg-primary/10 rounded-md"
                      onClick={() => { setEditingItem(item); setDialogOpen(true); }}
                    >
                      <Pencil className="w-3 h-3 text-primary" />
                    </button>
                    <button 
                      className="h-7 w-7 flex items-center justify-center hover:bg-destructive/10 rounded-md"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
