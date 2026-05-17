import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, UtensilsCrossed, Settings, Tag, Image } from 'lucide-react';

const tabs = [
  { id: 'ordini', label: 'Ordini', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'coupon', label: 'Coupon', icon: Tag },
  { id: 'categorie', label: 'Categorie', icon: Image },
  { id: 'impostazioni', label: 'Impost.', icon: Settings },
];

export default function AdminHeader({ activeTab, onTabChange }) {
  return (
    <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-3 px-3 sticky top-0 z-40">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/" className="text-primary-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading text-lg font-bold text-primary-foreground">Gestione</h1>
      </div>
      <div className="flex bg-primary-foreground/10 rounded-lg p-1 gap-0.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-md font-heading text-[10px] transition-all ${
              activeTab === tab.id
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
