// components/CartLink.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function CartLink() {
  const { cartItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = cartItems ? cartItems.reduce((sum, item) => sum + item.kolicina, 0) : 0;

  if (!mounted) return <span className="text-2xl">🛒</span>;

  return (
    <Link 
      href="/kosarica" 
      className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1 relative group"
    >
      <span className="text-2xl">🛒</span>
      <span className="hidden sm:inline">Košarica</span>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
          {cartCount}
        </span>
      )}
    </Link>
  );
}