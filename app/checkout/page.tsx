'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, CheckCircle, ShieldCheck, Loader2, MessageSquare } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { firebaseAuth } from '@/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import strapiService from '@/lib/strapi'; // Koristimo servis koji smo sredili

export default function CheckoutPage() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  
  const [orderSent, setOrderSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [strapiUserId, setStrapiUserId] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // KORISTIMO FUNKCIJU IZ STRAPI SERVISA - Čišće i sigurnije
        const sId = await strapiService.getStrapiUserId(user.uid);
        setStrapiUserId(sId);
      }
    });
    return () => unsubscribe();
  }, []);

  const totalPrice = getTotalPrice();
  const shippingCost = totalPrice >= 30 ? 0 : 5;
  const finalTotal = totalPrice + shippingCost;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!cartItems || cartItems.length === 0) {
      alert("Vaša košarica je prazna.");
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Formatiramo detalje kupca za tekstualno polje u Strapi bazi
    const detaljiKupca = `
IME I PREZIME: ${formData.get('ime')} ${formData.get('prezime')}
ADRESA: ${formData.get('adresa')}, ${formData.get('zip')} ${formData.get('grad')}
MOBITEL: ${formData.get('mobitel')}
EMAIL: ${formData.get('email')}
    `.trim();

    const narudzbaData = {
      data: {
        Adresa_dostave: detaljiKupca,
        Ukupna_cijena: Number(finalTotal.toFixed(2)),
        Proizvodi: cartItems.map(item => ({
          naziv: item.naziv,
          kolicina: item.kolicina,
          cijena: item.cijena,
          velicina: item.velicina || '/'
        })),
        Status_posiljke: "na čekanju", 
        Nacin_placanja: "pouzece", 
        Datum_narudzbe: new Date().toISOString().split('T')[0],
        Napomena_kupca: (formData.get('napomena') as string) || "Nema napomene",
        // OVDJE JE VEZA: Ako imamo ID, šaljemo ga. Strapi će sam povezati narudžbu s korisnikom.
        users_permissions_user: strapiUserId
      }
    };

    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';
      const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

      // Koristimo 'orders' jer je to standardni množina u Strapi v4/v5 (ako si ga tako nazvao)
      const response = await fetch(`${STRAPI_URL}/api/narudzbas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_TOKEN}`
        },
        body: JSON.stringify(narudzbaData),
      });

      if (response.ok) {
        setOrderSent(true);
        clearCart();
      } else {
        const errorData = await response.json();
        console.error("Strapi Error:", errorData);
        alert(`Greška: ${errorData?.error?.message || "Provjerite dozvole (create) u Strapi postavkama."}`);
      }
    } catch (error) {
      alert("Problem s povezivanjem. Provjerite radi li Strapi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (orderSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Narudžba zaprimljena!</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Hvala vam na kupovini. Detalje možete vidjeti na svom profilu.</p>
          <Link href="/shop" className="block w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-sm tracking-widest">
            Povratak u trgovinu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100 pb-20">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="py-10">
          <Link href="/kosarica" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest mb-6">
            <ArrowLeft size={16} /> Natrag na košaricu
          </Link>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Dovrši <span className="text-blue-600">kupovinu</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
                <h3 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2">
                  <Truck className="text-blue-600" /> Podaci za dostavu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <input required name="ime" type="text" placeholder="Ime" defaultValue={currentUser?.displayName?.split(' ')[0] || ''} className="p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                  <input required name="prezime" type="text" placeholder="Prezime" defaultValue={currentUser?.displayName?.split(' ')[1] || ''} className="p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
                <input required name="email" type="email" placeholder="E-mail adresa" defaultValue={currentUser?.email || ''} className="w-full p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                <input required name="adresa" type="text" placeholder="Adresa i kućni broj" className="w-full p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                <div className="grid grid-cols-2 gap-4">
                  <input required name="grad" type="text" placeholder="Grad" className="p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                  <input required name="zip" type="text" placeholder="Poštanski broj" className="p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
                <input required name="mobitel" type="tel" placeholder="Broj mobitela" className="w-full p-4 rounded-xl border dark:border-gray-700 dark:bg-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                <div className="pt-2 relative">
                   <textarea name="napomena" rows={3} placeholder="Napomena kupca (opcionalno)..." className="w-full p-4 rounded-xl border dark:bg-black dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-600 pl-11 py-4" />
                   <MessageSquare className="absolute top-8 left-4 text-gray-400" size={18} />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                <h3 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2 text-blue-600">
                  <CreditCard /> Način plaćanja
                </h3>
                <label className="flex items-center gap-4 p-4 bg-white dark:bg-black rounded-xl border-2 border-blue-600 cursor-pointer">
                  <div className="w-6 h-6 border-4 border-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="font-bold uppercase text-sm tracking-tighter">Plaćanje pouzećem</span>
                </label>
              </div>

              <button 
                disabled={isSubmitting} 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : `NARUČI SADA (${finalTotal.toFixed(2)} €)`}
              </button>
            </form>
          </div>

          {/* SAŽETAK */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
              <h3 className="text-xl font-black uppercase italic mb-6">Vaša narudžba</h3>
              <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-white dark:bg-black p-3 rounded-xl border dark:border-gray-800 shadow-sm">
                    <img src={item.slika} alt={item.naziv} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-[11px] leading-tight uppercase tracking-tighter">{item.naziv}</h4>
                      <p className="text-[10px] text-gray-500 font-black mt-1 uppercase">
                        {item.kolicina}x {item.cijena} € {item.velicina && `| VEL: ${item.velicina}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed dark:border-gray-800 pt-6 space-y-3">
                <div className="flex justify-between font-bold text-xs text-gray-400 uppercase tracking-widest">
                  <span>Iznos:</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-gray-400 uppercase tracking-widest">
                  <span>Dostava:</span>
                  <span className={shippingCost === 0 ? "text-green-500 font-black" : ""}>
                    {shippingCost === 0 ? "BESPLATNA" : `${shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t dark:border-gray-800 mt-2">
                  <span className="font-black uppercase text-sm tracking-widest italic text-blue-600">SVEUKUPNO:</span>
                  <span className="text-5xl font-black italic leading-none">{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 p-4 bg-white dark:bg-black rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <ShieldCheck className="text-blue-600" size={32} />
                <p className="text-[10px] text-gray-400 uppercase font-black leading-tight">
                  Sigurna kupnja • Podaci su zaštićeni <br/> SSL enkripcijom
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}