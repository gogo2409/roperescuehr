// 📁 LOKACIJA: app/shop/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, ShoppingCart, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';

interface Product {
  id: number;
  documentId: string;
  Naziv: string;
  Opis: any[];
  Cijena: number;
  Stara_cijena: number | null;
  Na_stanju: boolean;
  Slike: Array<{
    url: string;
    alternativeText: string | null;
  }>;
  kategorija_proizvoda: {
    Naziv: string;
  } | null;
  Velicine?: string[];
}

const STRAPI_URL = 'http://192.168.1.12:1337';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategorija, setSelectedKategorija] = useState('Sve');
  const [kategorije, setKategorije] = useState<string[]>(['Sve']);
  
  // NOVO: Shop enabled status
  const [shopEnabled, setShopEnabled] = useState<boolean | null>(null);
  
  const { getCartCount } = useCart();

  // NOVO: Provjeri da li je shop uključen
  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const res = await fetch(`${STRAPI_URL}/api/shop-enabled`);
        const data = await res.json();
        setShopEnabled(data.data?.Shop_Enabled ?? false);
      } catch (error) {
        console.error('Greška pri provjeri shop statusa:', error);
        setShopEnabled(false);
      }
    };
    checkShopStatus();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${STRAPI_URL}/api/products?populate=*`);
        const data = await res.json();
        
        if (data.data) {
          setProducts(data.data);
          const uniqueKategorije = ['Sve', ...new Set(
            data.data
              .filter((p: any) => p.kategorija_proizvoda)
              .map((p: any) => p.kategorija_proizvoda.Naziv)
          )];
          setKategorije(uniqueKategorije as string[]);
        }
      } catch (error) {
        console.error('Greška pri dohvaćanju proizvoda:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.Naziv.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKategorija = 
      selectedKategorija === 'Sve' || 
      product.kategorija_proizvoda?.Naziv === selectedKategorija;
    return matchesSearch && matchesKategorija;
  });

  // Loading state
  if (loading || shopEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      </div>
    );
  }

  // NOVO: Ako shop nije enabled, prikaži "Shop zatvoren" poruku
  if (shopEnabled === false) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-12 border-2 border-gray-200 dark:border-gray-700">
            
            {/* Ikona */}
            <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full">
              <Lock className="w-12 h-12 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Naslov */}
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">
              Shop je privremeno zatvoren
            </h1>

            {/* Opis */}
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Naš shop trenutno nije dostupan. Radimo na dodavanju novih proizvoda i unapređenju usluge.
              <br />
              Uskoro se vraćamo! 🛒
            </p>

            {/* Gumb */}
            <Link href="/">
              <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                Natrag na početnu
              </button>
            </Link>

            {/* Info box */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Možete se vratiti kasnije ili nastaviti s obukom kroz naše module.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Shop je enabled - prikaži normalno
  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20 font-sans text-gray-900 dark:text-gray-100">
      
      <div className="container mx-auto p-4 max-w-7xl">
        
        {/* HERO SEKCIJA */}
        <section className="mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-10 text-center rounded-xl shadow-lg my-8 border-b-4 border-blue-600/70">
            
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter uppercase italic text-gray-900 dark:text-white px-4">
              ROPE RESCUE <span className="text-blue-600">SHOP</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-6">
              Vrhunska oprema za spašavanje iz visina, rad na užetu i industrijsku sigurnost.
            </p>
            
          </div>
        </section>

        {/* SEARCH & FILTERS PANEL */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Pretraži opremu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Kategorije gumbi */}
              <div className="flex flex-wrap gap-2 justify-center">
                {kategorije.map((kat) => (
                  <button
                    key={kat}
                    onClick={() => setSelectedKategorija(kat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      selectedKategorija === kat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="max-w-7xl mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
              <ShoppingBag className="mx-auto w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Nema pronađenih proizvoda</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      {getCartCount() > 0 && (
        <Link href="/kosarica">
          <button className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 z-40 flex items-center gap-3 group">
            <div className="relative">
              <ShoppingCart size={28} />
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                {getCartCount()}
              </span>
            </div>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap px-0 group-hover:px-2">
                Košarica
            </span>
          </button>
        </Link>
      )}
    </div>
  );
}