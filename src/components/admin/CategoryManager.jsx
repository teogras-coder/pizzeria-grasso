import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image, Upload, X } from 'lucide-react';

const CATEGORIES_KEY = 'pizzeria_categories';

const defaultCategories = [
  { id: 'focacce', title: 'FOCACCE', subtitle: 'Tutti i gusti della tradizione', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
  { id: 'pizze_napoli', title: 'PIZZE NAPOLI', subtitle: 'Classiche e speciali', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&q=80' },
  { id: 'frittura', title: 'FRITTURA', subtitle: 'Gustosi antipasti', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
  { id: 'bibite', title: 'BIBITE', subtitle: 'Rinfrescanti', image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80' },
];

const getCategories = () => {
  const raw = localStorage.getItem(CATEGORIES_KEY);
  return raw ? JSON.parse(raw) : defaultCategories;
};

const saveCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  window.dispatchEvent(new Event('categories-updated'));
};

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: '', subtitle: '', image: '' });

  const refresh = () => setCategories(getCategories());

  useEffect(() => {
    refresh();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCategory({ ...newCategory, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategory.title) return;
    
    const id = newCategory.title.toLowerCase().replace(/\s+/g, '_');
    const categories = getCategories();
    
    // Se esiste già, aggiorna
    const existingIndex = categories.findIndex(c => c.id === id);
    if (existingIndex >= 0) {
      categories[existingIndex] = { ...categories[existingIndex], ...newCategory, id };
    } else {
      categories.push({ ...newCategory, id });
    }
    
    saveCategories(categories);
    setNewCategory({ title: '', subtitle: '', image: '' });
    setShowForm(false);
    refresh();
  };

  const handleDelete = (id) => {
    if (window.confirm('Eliminare questa categoria?')) {
      const categories = getCategories().filter(c => c.id !== id);
      saveCategories(categories);
      refresh();
    }
  };

  const handleReset = () => {
    if (window.confirm('Ripristinare le categorie predefinite?')) {
      saveCategories(defaultCategories);
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-accent flex items-center gap-2">
          <Image className="w-5 h-5" />
          Categorie Menu
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 rounded-md bg-background/50 hover:bg-background text-muted-foreground"
          >
            Ripristina
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-heading"
          >
            {showForm ? 'Chiudi' : '+ Nuova'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <input
            type="text"
            placeholder="Nome categoria (es. PIZZE)"
            value={newCategory.title}
            onChange={(e) => setNewCategory({...newCategory, title: e.target.value})}
            className="w-full bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
            required
          />
          <input
            type="text"
            placeholder="Sottotitolo (es. Classiche e speciali)"
            value={newCategory.subtitle}
            onChange={(e) => setNewCategory({...newCategory, subtitle: e.target.value})}
            className="w-full bg-background/50 border border-border rounded-md px-3 py-2 font-body text-sm"
          />
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-body">Immagine categoria</label>
            <div className="flex items-center gap-3">
              {newCategory.image && (
                <div className="relative">
                  <img src={newCategory.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewCategory({...newCategory, image: ''})}
                    className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 bg-background/50 border border-border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-background/80 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body">
                  {newCategory.image ? 'Cambia immagine' : 'Carica immagine'}
                </span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-heading py-2 rounded-md"
          >
            Salva Categoria
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3">
        {categories.map(category => (
          <div key={category.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="relative h-24">
              <img 
                src={category.image || 'https://via.placeholder.com/400x200?text=No+Image'} 
                alt={category.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(category.id)}
                className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3">
              <h3 className="font-heading font-bold text-foreground text-sm">{category.title}</h3>
              <p className="text-xs text-muted-foreground font-body">{category.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
