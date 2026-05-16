// API LOCALE - nessun blocco, nessun servizio esterno
const STORAGE_KEYS = {
  menuItems: 'pizzeria_menu_items',
  orders: 'pizzeria_orders',
};

// ===== MENU ITEMS =====
export const getMenuItems = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.menuItems);
  return raw ? JSON.parse(raw) : [];
};

export const getMenuItemsByCategory = (category) => {
  return getMenuItems().filter(item => item.category === category && item.available !== false);
};

export const createMenuItem = (data) => {
  const items = getMenuItems();
  const newItem = { 
    ...data, 
    id: crypto.randomUUID(), 
    created_date: new Date().toISOString() 
  };
  localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify([...items, newItem]));
  window.dispatchEvent(new Event('menu-updated'));
  return newItem;
};

export const updateMenuItem = (id, data) => {
  const items = getMenuItems().map(item => 
    item.id === id ? { ...item, ...data } : item
  );
  localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify(items));
  window.dispatchEvent(new Event('menu-updated'));
};

export const deleteMenuItem = (id) => {
  const items = getMenuItems().filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify(items));
  window.dispatchEvent(new Event('menu-updated'));
};

// ===== ORDERS =====
export const getOrders = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.orders);
  return raw ? JSON.parse(raw) : [];
};

export const createOrder = (data) => {
  const orders = getOrders();
  const newOrder = { 
    ...data, 
    id: crypto.randomUUID(), 
    created_date: new Date().toISOString() 
  };
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify([newOrder, ...orders]));
  window.dispatchEvent(new Event('orders-updated'));
  return newOrder;
};

export const updateOrder = (id, data) => {
  const orders = getOrders().map(order => 
    order.id === id ? { ...order, ...data } : order
  );
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  window.dispatchEvent(new Event('orders-updated'));
};

// ===== DATI DEMO (pizze di esempio) =====
export const seedDemoData = () => {
  if (getMenuItems().length > 0) return;
  
  const demoItems = [
    { id: '1', name: 'Focaccia Classica', description: 'Olio, sale, rosmarino', price: 4.00, category: 'focacce', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80', available: true },
    { id: '2', name: 'Focaccia Pomodoro', description: 'Pomodoro fresco, basilico', price: 5.50, category: 'focacce', image_url: '', available: true },
    { id: '3', name: 'Margherita', description: 'Pomodoro, mozzarella, basilico', price: 6.00, category: 'pizze_napoli', image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&q=80', available: true },
    { id: '4', name: 'Marinara', description: 'Pomodoro, aglio, origano', price: 5.00, category: 'pizze_napoli', image_url: '', available: true },
    { id: '5', name: 'Arancini', description: 'Ragù, piselli, mozzarella', price: 3.50, category: 'frittura', image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=80', available: true },
    { id: '6', name: 'Crocchette', description: 'Patate, mozzarella', price: 3.00, category: 'frittura', image_url: '', available: true },
    { id: '7', name: 'Coca Cola', description: 'Lattina 33cl', price: 2.50, category: 'bibite', image_url: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=200&q=80', available: true },
    { id: '8', name: 'Acqua Naturale', description: 'Bottiglia 50cl', price: 1.50, category: 'bibite', image_url: '', available: true },
  ];
  
  localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify(demoItems));
};
