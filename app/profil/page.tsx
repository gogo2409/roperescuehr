'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firebaseAuth, db } from '@/lib/firebase';
import { 
  Loader2, Trophy, XCircle, Award, 
  ShoppingBag, User as UserIcon, 
  ChevronRight, ClipboardList
} from 'lucide-react';
import Link from 'next/link';

interface ExamResult {
  id: string;
  modulId: string; // Promijenjeno u string jer tako spremamo
  ukupnoBodova: number; // Novo polje
  maxScore: number;
  timestamp: any;
  postotak: number; // Novo polje
}

const ProfilPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        await loadUserResults(currentUser.uid);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserResults = async (userId: string) => {
    try {
      // Koristimo orderBy da dobijemo najnovije rezultate prvi
      const q = query(
        collection(db, 'exam_results'), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const resultsData: ExamResult[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resultsData.push({
          id: doc.id,
          modulId: String(data.modulId || '0'),
          ukupnoBodova: Number(data.ukupnoBodova || 0),
          maxScore: Number(data.maxScore || 100),
          timestamp: data.timestamp,
          postotak: Number(data.postotak || 0)
        });
      });

      // Sortiranje ručno (ako Firestore index još nije kreiran)
      resultsData.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      setResults(resultsData);
    } catch (error) {
      console.error('Greška pri učitavanju rezultata:', error);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString('hr-HR');
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl text-center shadow-xl border dark:border-gray-800">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">Prijava obavezna</h2>
        <Link href="/" className="block w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition mt-4">Vrati se na početnu</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pb-24">
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 bg-gray-900 dark:bg-white rounded-3xl flex items-center justify-center shadow-lg">
            <UserIcon size={36} className="text-white dark:text-gray-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Moj Profil</h1>
            <p className="text-gray-500 font-medium">{user.displayName || user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        
        {/* 1. MOJE NARUDŽBE GUMB */}
        <Link href="/profil/narudzbe" className="group block mb-6 bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 hover:border-indigo-500 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-transform group-hover:scale-110">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Moje Narudžbe</h3>
                <p className="text-gray-500 text-sm font-medium">Prati statuse paketa i povijest kupnji</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl text-gray-300 group-hover:text-indigo-600 transition-colors">
              <ChevronRight size={24} />
            </div>
          </div>
        </Link>

        {/* 2. STATISTIKA */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 leading-tight">Ukupno ispita</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">{results.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl">
              <Trophy size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 leading-tight">Položeno</p>
              <p className="text-2xl font-black text-green-600 leading-none">{results.filter(r => r.postotak >= 90).length}</p>
            </div>
          </div>
        </div>

        {/* 3. REZULTATI ISPITA */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <Award className="text-indigo-600" /> Rezultati ispita
            </h2>
          </div>
          
          {results.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border-2 border-dashed dark:border-gray-800 text-gray-400 font-medium">
              Još nemate pohranjenih rezultata ispita.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((res) => {
                const passed = res.postotak >= 90;
                return (
                  <div key={res.id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} dark:bg-gray-800`}>
                        {passed ? <Trophy size={20} /> : <XCircle size={20} />}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 dark:text-white leading-tight">Modul {res.modulId}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(res.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${passed ? 'text-green-600' : 'text-red-600'}`}>{res.postotak.toFixed(0)}%</p>
                      <p className="text-[9px] font-black uppercase text-gray-400 leading-none">{res.ukupnoBodova}/{res.maxScore} Bod</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilPage;