'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useEffect, useState } from 'react';

export default function FloatingCartButton() {
  // Promijenjeno iz items u cartItems da odgovara tvom CartContextu
  const { cartItems } = useCart();
  const [mounted, setMounted] = useState(false);

  // Osiguraj da se button renderira samo na clientu
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dok se komponenta ne "mounta", ne crtaj ništa (sprječava Hydration grešku)
  if (!mounted) return null;

  // Koristi cartItems umjesto items
  if (!cartItems || cartItems.length === 0) return null;

  return (
    <Link
      href="/kosarica"
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-2 transition-transform active:scale-95"
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="font-bold">{cartItems.length}</span>
    </Link>
  );
}