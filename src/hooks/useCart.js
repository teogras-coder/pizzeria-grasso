import { useState, useEffect, useCallback } from 'react';
import { getCart, getCartCount, getCartTotal } from '@/lib/cartStore';

export default function useCart() {
  const [cart, setCart] = useState(getCart());
  const [cartCount, setCartCount] = useState(getCartCount());
  const [cartTotal, setCartTotal] = useState(getCartTotal());

  const refresh = useCallback(() => {
    setCart(getCart());
    setCartCount(getCartCount());
    setCartTotal(getCartTotal());
  }, []);

  useEffect(() => {
    window.addEventListener('cart-updated', refresh);
    return () => window.removeEventListener('cart-updated', refresh);
  }, [refresh]);

  return { cart, cartCount, cartTotal, refresh };
}
