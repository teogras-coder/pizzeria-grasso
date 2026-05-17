import React from 'react';
import Header from '@/components/home/Header';
import CategoryCard from '@/components/home/CategoryCard';
import ActionButton from '@/components/home/ActionButton';
import Footer from '@/components/home/Footer';
import useCart from '@/hooks/useCart';

const categories = [
  { title: 'FOCACCE', subtitle: 'Tutti i gusti della tradizione', icon: '🍕',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80', to: '/menu/focacce' },
  { title: 'PIZZE NAPOLI', subtitle: 'Classiche e speciali', icon: '🍕',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&q=80', to: '/menu/pizze_napoli' },
  { title: 'FRITTURA', subtitle: 'Gustosi antipasti', icon: '🍟',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=80', to: '/menu/frittura' },
  { title: 'BIBITE', subtitle: 'Rinfrescanti', icon: '🥤',
    image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=200&q=80', to: '/menu/bibite' }
];

export default function Home() {
  const { cartCount } = useCart();
  
  // Legge lo stato aperto/chiuso da localStorage
  const isOpen = React.useMemo(() => {
    const saved = localStorage.getItem('pizzeria_isOpen');
    return saved !== null ? JSON.parse(saved) : true;
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      {/* SCRITTA PIÙ IN SU */}
      {!isOpen && (
        <div className="mx-4 mt-6 mb-2 text-center">
          <p className="text-destructive font-body text-sm font-bold">
            🔴 Siamo chiusi
          </p>
        </div>
      )}
      {isOpen && (
        <div className="mx-4 mt-6 mb-2 text-center">
          <p className="text-green-400 font-body text-sm font-bold">
            🟢 Siamo aperti
          </p>
        </div>
      )}

      <div className="px-4 space-y-3 relative z-10">
        {categories.map((cat) => <CategoryCard key={cat.title} {...cat} />)}
      </div>
      <div className="px-4 mt-4 space-y-2">
        <ActionButton icon="📞" label="CHIAMATE & PRENOTAZIONI" href="tel:0884660377" />
        <ActionButton icon="🚚" label="CONSEGNA A DOMICILIO" onClick={() => { window.location.href = '/carrello?tipo=domicilio'; }} />
        <ActionButton icon="🏠" label="RITIRO IN PIZZERIA" onClick={() => { window.location.href = '/carrello?tipo=asporto'; }} />
      </div>
      <Footer cartCount={cartCount} />
    </div>
  );
}
