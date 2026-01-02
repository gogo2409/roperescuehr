'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { 
  Loader2, Package, Truck, ExternalLink, 
  ShoppingBag, Calendar, ChevronLeft, Info, Tag 
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: number;
  Ukupna_cijena: number;
  Status_posiljke: string;
  Tracking_broj: string | null;
  Datum_narudzbe: string;
  Proizvodi: any[]; // Dodano za prikaz artikala
}

export default function MojeNarudzbePage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STRAPI_URL = 'http://192.168.1.12:1337';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserOrders(currentUser.email || '');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserOrders = async (email: string) => {
    try {
      const queryParams = new URLSearchParams({
        'filters[$or][0][users_permissions_user][email][$eq]': email,
        'filters[$or][1][Adresa_dostave][$contains]': email,
        'sort': 'createdAt:desc',
        'populate': '*'
      });
      const res = await fetch(`${STRAPI_URL}/api/narudzbas?${queryParams.toString()}`);
      const json = await res.json();
      if (json.data) setOrders(json.data);
    } catch (error) {
      console.error('Greška:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('hr-HR');
  };

  // Funkcija za boju statusa - Završeno je sada crno
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'u obradi';
    
    if (s.includes('završeno')) {
      return "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900";
    }
    if (s.includes('poslano')) {
      return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
    }
    return "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400";
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/profil" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase text-xs tracking-widest">Povratak na profil</span>
        </Link>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Moje Narudžbe</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Povijest i status tvojih kupnji</p>
          </div>
          <div className="bg-gray-900 dark:bg-white p-4 rounded-3xl text-white dark:text-gray-900 shadow-xl">
            <ShoppingBag size={32} />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Package size={64} className="mx-auto text-gray-200 dark:text-gray-800 mb-6" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Nemaš narudžbi</h3>
            <Link href="/shop" className="inline-block mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Posjeti trgovinu</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm border-b-4 border-b-gray-100 dark:border-b-gray-800">
                {/* Gornji dio: ID i Status */}
                <div className="p-6 border-b dark:border-gray-800 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Narudžba</span>
                    <span className="text-lg font-black dark:text-white">#{order.id}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(order.Status_posiljke)}`}>
                    {order.Status_posiljke || 'U obradi'}
                  </span>
                </div>

                {/* Srednji dio: Proizvodi */}
                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                      <Tag size={12} /> Sadržaj narudžbe
                    </p>
                    <div className="grid gap-3">
                      {Array.isArray(order.Proizvodi) && order.Proizvodi.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-gray-700 h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">
                              {item.kolicina}x
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{item.naziv}</p>
                              {item.velicina && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Veličina: {item.velicina}</p>}
                            </div>
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{item.cijena} €</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Donji dio: Tracking i Ukupno */}
                  <div className="mt-8 pt-6 border-t dark:border-gray-800 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                    <div className="w-full md:w-auto">
                      {order.Tracking_broj ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4 group">
                          <div>
                            <p className="text-[9px] font-black uppercase text-indigo-400 tracking-tighter mb-0.5">Praćenje pošiljke</p>
                            <p className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">{order.Tracking_broj}</p>
                          </div>
                          <a 
                            href={`https://posiljka.posta.hr/hr/tracking/search?query=${order.Tracking_broj}`}
                            target="_blank"
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none"
                          >
                            <Truck size={18} />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold uppercase tracking-tight bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
                          <Info size={14} /> Tracking broj dostupan uskoro
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Ukupno plaćeno</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{order.Ukupna_cijena} <span className="text-lg">€</span></p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{formatDate(order.Datum_narudzbe)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}