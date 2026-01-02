// 📁 components/ProductCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext'; // Provjeri putanju!

interface Product {
  id: number;
  documentId: string;
  Naziv: string;
  Cijena: number;
  Stara_cijena: number | null;
  Na_stanju: boolean;
  Slike: Array<{ url: string }>;
  kategorija_proizvoda: { Naziv: string } | null;
  Velicine?: string[];
}

const STRAPI_URL = 'http://192.168.1.12:1337';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  const hasSizes = product.Velicine && Array.isArray(product.Velicine) && product.Velicine.length > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (hasSizes && !selectedSize) {
      alert('Molimo odaberite veličinu!');
      return;
    }

    addToCart({
      productId: product.id,
      naziv: product.Naziv,
      cijena: product.Cijena,
      slika: product.Slike[0]?.url ? `${STRAPI_URL}${product.Slike[0].url}` : '/placeholder.jpg',
      velicina: selectedSize
    }, quantity);

    alert(`✅ Dodano: ${product.Naziv} ${selectedSize ? `(${selectedSize})` : ''} x${quantity}`);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700">
      
      {/* LINK NA SLICI */}
      <Link href={`/shop/${product.documentId}`} className="block relative overflow-hidden aspect-square">
        <img
          src={product.Slike[0]?.url ? `${STRAPI_URL}${product.Slike[0].url}` : '/placeholder.jpg'}
          alt={product.Naziv}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!product.Na_stanju && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">RASPRODANO</span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        {/* LINK NA NASLOVU */}
        <Link href={`/shop/${product.documentId}`} className="block mb-2">
          {product.kategorija_proizvoda && (
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
              {product.kategorija_proizvoda.Naziv}
            </span>
          )}
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.Naziv}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-black text-gray-900 dark:text-white">{product.Cijena} €</span>
          {product.Stara_cijena && (
            <span className="text-sm text-gray-400 line-through">{product.Stara_cijena} €</span>
          )}
        </div>

        {/* DONJI DIO - Kontrole (bez linka) */}
        <div className="mt-auto space-y-3">
          {hasSizes && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Veličina:</p>
              <div className="flex flex-wrap gap-1.5">
                {product.Velicine?.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedSize(v)}
                    className={`px-2.5 py-1 text-xs font-bold border rounded-md transition-all ${
                      selectedSize === v 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-blue-600 transition-colors">
                <Minus size={14}/>
              </button>
              <span className="font-bold text-sm w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-blue-600 transition-colors">
                <Plus size={14}/>
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!product.Na_stanju}
              className={`p-2 rounded-lg transition-all ${
                product.Na_stanju ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}