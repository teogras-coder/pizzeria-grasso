const CART_KEY = 'pizzeria_cart';

export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.menu_item_id === item.menu_item_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
}

export function removeFromCart(menuItemId) {
  const cart = getCart().filter(i => i.menu_item_id !== menuItemId);
  saveCart(cart);
}

export function updateCartQuantity(menuItemId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.menu_item_id === menuItemId);
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      saveCart(cart.filter(i => i.menu_item_id !== menuItemId));
    } else {
      saveCart(cart);
    }
  }
}

export function clearCart() { 
  saveCart([]); 
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
