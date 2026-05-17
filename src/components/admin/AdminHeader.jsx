import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, UtensilsCrossed, Settings, Tag } from 'lucide-react';

const tabs = [
  { id: 'ordini', label: 'Ordini', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'coupon', label: 'Coupon', icon: Tag },
  { id: 'impostazioni', label: 'Impostazioni', icon: Settings },
];

export default function AdminHeader({ activeTab, onTabChange }) {
  return (
    <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-4 px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3 mb-3">
        <Link to="/" className="text-primary-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-xl font-bold text-primary-foreground">Pannello Gestione</h1>
      </div>
      <div className="flex bg-primary-foreground/10 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1 py-2 px-3 rounded-md font-heading text-xs transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
