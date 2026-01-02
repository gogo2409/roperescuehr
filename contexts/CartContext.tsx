// contexts/CartContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipovi
interface CartItem {
  productId: number;
  naziv: string;
  cijena: number;
  slika: string;
  kolicina: number;
  velicina?: string;
}

interface CartContextType {
  cartItems: CartItem[]; // Promijenjeno iz cart u cartItems
  addToCart: (item: Omit<CartItem, 'kolicina'>, kolicina?: number) => void;
  removeFromCart: (productId: number, velicina?: string) => void;
  updateQuantity: (productId: number, kolicina: number, velicina?: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getCartCount: () => number;
  isInCart: (productId: number, velicina?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // 1. Mount učitavanje
  useEffect(() => {
    setMounted(true);
    try {
      const savedCart = localStorage.getItem('rope-rescue-cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch (error) {
      console.error('Error parsing cart:', error);
    }
  }, []);

  // 2. Spremanje promjena
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('rope-rescue-cart', JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  const addToCart = (item: Omit<CartItem, 'kolicina'>, kolicina: number = 1) => {
    setCartItems(prev => {
      const index = prev.findIndex(
        i => i.productId === item.productId && i.velicina === item.velicina
      );
      if (index > -1) {
        const newCart = [...prev];
        newCart[index].kolicina += kolicina;
        return newCart;
      }
      return [...prev, { ...item, kolicina }];
    });
  };

  const removeFromCart = (productId: number, velicina?: string) => {
    setCartItems(prev =>
      prev.filter(i => !(i.productId === productId && i.velicina === velicina))
    );
  };

  const updateQuantity = (productId: number, kolicina: number, velicina?: string) => {
    if (kolicina <= 0) return removeFromCart(productId, velicina);
    setCartItems(prev =>
      prev.map(i =>
        i.productId === productId && i.velicina === velicina
          ? { ...i, kolicina }
          : i
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rope-rescue-cart');
    }
  };

  const getTotalPrice = () =>
    cartItems.reduce((total, i) => total + i.cijena * i.kolicina, 0);

  const getCartCount = () =>
    cartItems.reduce((count, i) => count + i.kolicina, 0);

  const isInCart = (productId: number, velicina?: string) =>
    cartItems.some(i => i.productId === productId && i.velicina === velicina);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getCartCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// SIGURNI HOOK: Ne baca Error koji ruši aplikaciju
export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    // Vraćamo prazan set podataka umjesto Errora dok se Provider ne učita
    return {
      cartItems: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getTotalPrice: () => 0,
      getCartCount: () => 0,
      isInCart: () => false,
    };
  }
  
  return context;
}