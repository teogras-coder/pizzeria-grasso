import React from 'react';
import { Plus } from 'lucide-react';
import { addToCart } from '@/lib/cartStore';
import { toast } from 'sonner';

export default function MenuItemCard({ item }) {
  const handleAdd = () => {
    addToCart({ menu_item_id: item.id, name: item.name, price: item.price });
    toast.success(`${item.name} aggiunto al carrello`);
  };

  return (
    <div className="flex items-center bg-card/80 backdrop-blur-sm rounded-xl border border-primary/15 p-3 gap-3 shadow-sm">
      {item.image_url && (
        <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-sm font-bold text-accent truncate">{item.name}</h4>
        {item.description && (
          <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <p className="font-heading text-sm font-bold text-primary mt-1">€{item.price?.toFixed(2)}</p>
      </div>
      <button
        className="rounded-full bg-primary hover:bg-primary/80 h-9 w-9 flex-shrink-0 flex items-center justify-center text-primary-foreground disabled:opacity-50"
        onClick={handleAdd}
        disabled={!item.available}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
