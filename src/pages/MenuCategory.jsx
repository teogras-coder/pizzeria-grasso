import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MenuItemCard from '@/components/menu/MenuItemCard';
import Footer from '@/components/home/Footer';
import useCart from '@/hooks/useCart';
import { getMenuItemsByCategory } from '@/lib/apiClient';

const categoryTitles = { 
  focacce: 'Focacce', 
  pizze_napoli: 'Pizze Napoli', 
  frittura: 'Frittura', 
  bibite: 'Bibite' 
};

export default function MenuCategory() {
  const { category } = useParams();
  const { cartCount } = useCart();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const data = getMenuItemsByCategory(category);
    setItems(data);
    setIsLoading(false);

    const handleUpdate = () => {
      setItems(getMenuItemsByCategory(category));
    };
    window.addEventListener('menu-updated', handleUpdate);
    return () => window.removeEventListener('menu-updated', handleUpdate);
  }, [category]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-4 px-4 flex items-center gap-3 sticky top-0 z-40">
        <Link to="/" className="text-primary-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-xl font-bold text-primary-foreground">
          {categoryTitles[category] || category}
        </h1>
      </div>
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-muted-foreground">Nessun prodotto in questa categoria</p>
          </div>
        ) : (
          items.map((item) => <MenuItemCard key={item.id} item={item} />)
        )}
      </div>
      <Footer cartCount={cartCount} />
    </div>
  );
}
