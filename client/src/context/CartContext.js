'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'shop-cart-v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Load once on the client
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      /* ignore corrupted storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable */
    }
  }, [items, ready]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product._id);
      const max = Math.min(product.stock, 20);
      if (existing) {
        return prev.map((i) =>
          i.id === product._id ? { ...i, qty: Math.min(i.qty + qty, max), stock: product.stock } : i
        );
      }
      return [
        ...prev,
        {
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          qty: Math.min(qty, max),
        },
      ];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock, 20)) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      add,
      setQty,
      remove,
      clear,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100,
    }),
    [items, ready, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
