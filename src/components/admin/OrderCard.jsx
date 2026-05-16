import React from 'react';
import { updateOrder } from '@/lib/apiClient';
import { format } from 'date-fns';
import { Phone, MapPin, Clock, User } from 'lucide-react';

const statusColors = {
  nuovo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_preparazione: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pronto: 'bg-green-500/20 text-green-400 border-green-500/30',
  consegnato: 'bg-muted text-muted-foreground border-border',
  annullato: 'bg-destructive/20 text-destructive border-destructive/30'
};

const statusLabels = { 
  nuovo: 'Nuovo', 
  in_preparazione: 'In Preparazione', 
  pronto: 'Pronto', 
  consegnato: 'Consegnato', 
  annullato: 'Annullato' 
};

export default function OrderCard({ order, onUpdate }) {
  const handleStatusChange = (newStatus) => {
    updateOrder(order.id, { status: newStatus });
    if (onUpdate) onUpdate();
  };

  return (
    <div className="bg-card/80 rounded-xl border border-primary/15 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3 h-3 text-primary" />
            <span className="font-heading text-sm font-bold text-accent">{order.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{order.created_date ? format(new Date(order.created_date), 'dd/MM HH:mm') : ''}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-body border ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" /> {order.customer_phone}
        </span>
        {order.order_type === 'domicilio' && order.customer_address && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {order.customer_address}
          </span>
        )}
      </div>
      <div className="bg-background/50 rounded-lg p-2 space-y-1">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs font-body">
            <span className="text-foreground">{item.quantity}x {item.name}</span>
            <span className="text-primary">€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      {order.notes && (
        <p className="text-xs text-muted-foreground italic bg-background/30 rounded p-2">
          📝 {order.notes}
        </p>
      )}
      <div className="flex justify-between items-center pt-1">
        <span className="font-heading text-sm font-bold text-primary">
          Totale: €{order.total?.toFixed(2)}
        </span>
        <select 
          value={order.status} 
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-40 h-8 text-xs bg-background/50 border border-primary/20 rounded-md px-2"
        >
          <option value="nuovo">Nuovo</option>
          <option value="in_preparazione">In Preparazione</option>
          <option value="pronto">Pronto</option>
          <option value="consegnato">Consegnato</option>
          <option value="annullato">Annullato</option>
        </select>
      </div>
    </div>
  );
}
