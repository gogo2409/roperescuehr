// 📁 LOKACIJA: app/shop/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, ArrowLeft, CheckCircle, Package, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../contexts/CartContext';

const STRAPI_URL = 'http://192.168.1.12:1337';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, getCartCount } = useCart(); 
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${STRAPI_URL}/api/products/${id}?populate=*`);
        const json = await res.json();
        setProduct(json.data);
      } catch (err) {
        console.error("Greška pri dohvaćanju detalja:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    </div>
  );
  
  if (!product) return <div className="p-20 text-center">Proizvod nije pronađen.</div>;

  const hasSizes = product.Velicine && Array.isArray(product.Velicine) && product.Velicine.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      alert('Molimo odaberite veličinu!');
      return;
    }

    addToCart({
      productId: product.id,
      naziv: product.Naziv,
      cijena: product.Cijena,
      slika: product.Slike?.[0]?.url ? `${STRAPI_URL}${product.Slike[0].url}` : '/placeholder.jpg',
      velicina: selectedSize
    }, quantity);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20 font-sans text-gray-900 dark:text-gray-100">
      
      <div className="container mx-auto p-4 max-w-7xl">
        
        {/* HERO SEKCIJA - SMANJENA VISINA (py-10) */}
        <section className="mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-10 text-center rounded-xl shadow-lg my-8 border-b-4 border-blue-600/70">
            
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter uppercase italic text-gray-900 dark:text-white px-4">
              ROPE RESCUE <span className="text-blue-600">SHOP</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-6">
              Vrhunska oprema za spašavanje i industrijsku sigurnost.
            </p>
            
          </div>
        </section>

        {/* DETALJI PROIZVODA */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors font-bold">
            <ArrowLeft size={20} /> Natrag u shop
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="rounded-3xl overflow-hidden bg-white shadow-xl border border-gray-100 dark:border-gray-800">
              <img
                src={product.Slike?.[0]?.url ? `${STRAPI_URL}${product.Slike[0].url}` : '/placeholder.jpg'}
                alt={product.Naziv}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="flex flex-col">
              <div className="mb-6">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  {product.kategorija_proizvoda?.Naziv || 'Oprema'}
                </span>
                <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-gray-900 dark:text-white leading-tight">
                  {product.Naziv}
                </h1>
                <div className="flex items-center gap-4">
                   <p className="text-4xl font-black text-blue-600">{product.Cijena} €</p>
                   {product.Stara_cijena && (
                     <p className="text-xl text-gray-400 line-through font-bold">{product.Stara_cijena} €</p>
                   )}
                </div>
              </div>

              <div className="mb-8 text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                 <p>{product.Opis?.[0]?.children?.[0]?.text || "Opis u pripremi..."}</p>
              </div>

              {hasSizes && (
                <div className="mb-8">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Veličina</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.Velicine.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[56px] h-12 rounded-xl font-bold border-2 transition-all ${
                          selectedSize === size
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
                <div className="flex flex-wrap items-center gap-8">
                   <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border dark:border-gray-700 shadow-inner">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 transition-colors">
                        <Minus size={20} strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center font-black text-xl">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 transition-colors">
                        <Plus size={20} strokeWidth={3} />
                      </button>
                   </div>
                   
                   <div className="space-y-1">
                     <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                        <CheckCircle size={18} /> Dostupno
                     </div>
                     <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                        <Package size={18} /> Brza dostava
                     </div>
                   </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!product.Na_stanju}
                  className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    product.Na_stanju
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={24} strokeWidth={2.5} />
                  {product.Na_stanju ? 'Dodaj u košaricu' : 'Nije dostupno'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING CART */}
      {getCartCount() > 0 && (
        <Link href="/kosarica">
          <button className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 z-50 flex items-center gap-3 group">
            <div className="relative">
              <ShoppingCart size={28} />
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                {getCartCount()}
              </span>
            </div>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap px-0 group-hover:px-2">
                Pregledaj košaricu
            </span>
          </button>
        </Link>
      )}
    </div>
  );
}