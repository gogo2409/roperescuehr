// 📁 app/kosarica/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext'; 

export default function KosaricaPage() {
  // IZMJENA: cart -> cartItems (usklađeno s CartContext.tsx)
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getTotalPrice, 
    getCartCount 
  } = useCart();

  // Osiguravamo da cartItems uvijek bude niz, čak i ako Context vrati undefined pri učitavanju
  const items = cartItems || [];
  
  const totalPrice = getTotalPrice();
  const shippingThreshold = 30;
  const shippingCost = 5;
  const isFreeShipping = totalPrice >= shippingThreshold;
  const finalTotal = isFreeShipping ? totalPrice : totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100">
      
      <div className="container mx-auto p-4 max-w-7xl">
        
        {/* HERO SEKCIJA */}
        <section className="mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-10 text-center rounded-xl shadow-lg my-8 border-b-4 border-blue-600/70">
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter uppercase italic text-gray-900 dark:text-white px-4">
              VAŠA <span className="text-blue-600">KOŠARICA</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-6 font-medium">
              Pregledajte odabrane proizvode i dovršite svoju narudžbu.
            </p>
          </div>
        </section>

        {/* STATUS BAR */}
        <div className="max-w-6xl mx-auto px-4 mb-8 flex items-center justify-between border-b pb-4 dark:border-gray-800">
            <Link href="/shop" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold text-sm uppercase tracking-widest">
                <ArrowLeft size={18} /> Natrag u shop
            </Link>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <ShoppingCart size={18} className="text-blue-600" />
                <span className="font-black text-blue-600">
                    {/* IZMJENA: Provjera na items.length */}
                    {items.length === 0
                        ? 'Prazna košarica'
                        : `${getCartCount()} ${getCartCount() === 1 ? 'PROIZVOD' : 'PROIZVODA'}`}
                </span>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-20">
          {/* IZMJENA: Provjera na items.length */}
          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <ShoppingBag className="w-20 h-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-6 uppercase italic">
                Trenutno nema ničega...
              </h2>
              <Link href="/shop">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm">
                  Započni kupovinu
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Lista proizvoda */}
              <div className="lg:w-2/3 space-y-4">
                {/* IZMJENA: Mapiranje preko items niza */}
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.velicina || 'no-size'}`}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
                  >
                    <img
                      src={item.slika}
                      alt={item.naziv}
                      className="w-28 h-28 object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">
                            {item.naziv}
                          </h3>
                          {item.velicina && (
                            <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-black px-2 py-1 rounded mt-1 uppercase tracking-tighter border dark:border-gray-700">
                              VELIČINA: {item.velicina}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.velicina)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-2xl font-black text-blue-600 italic">
                          {item.cijena} €
                        </p>
                        
                        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border dark:border-gray-700">
                          <button
                            onClick={() => updateQuantity(item.productId, item.kolicina - 1, item.velicina)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-lg transition shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-black text-lg">{item.kolicina}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.kolicina + 1, item.velicina)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-lg transition shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    if(confirm('Isprazniti cijelu košaricu?')) clearCart();
                  }}
                  className="w-full py-4 text-gray-400 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-[0.2em]"
                >
                  Isprazni košaricu
                </button>
              </div>

              {/* Sažetak narudžbe */}
              <div className="lg:w-1/3">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 sticky top-24">
                  <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Sažetak</h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Proizvodi:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{totalPrice.toFixed(2)} €</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Dostava:</span>
                      {isFreeShipping ? (
                        <span className="text-green-500 font-black uppercase text-sm tracking-tighter">Besplatna</span>
                      ) : (
                        <span className="font-bold text-gray-900 dark:text-gray-100 italic">{shippingCost.toFixed(2)} €</span>
                      )}
                    </div>

                    {!isFreeShipping && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-tighter text-center">
                          Dodaj još {(shippingThreshold - totalPrice).toFixed(2)} € za besplatnu dostavu!
                        </p>
                      </div>
                    )}

                    <div className="border-t-2 border-dashed dark:border-gray-800 pt-4 mt-4 flex justify-between items-end">
                      <span className="font-black uppercase text-sm">Ukupno:</span>
                      <span className="text-4xl font-black text-blue-600 italic leading-none">
                        {finalTotal.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-widest mb-6">
                      KRENI NA PLAĆANJE
                    </button>
                  </Link>

                  <div className="p-4 bg-white dark:bg-black/40 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed uppercase font-black tracking-tighter">
                      🚚 Dostava 2-3 dana • Besplatna iznad 30 €
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}