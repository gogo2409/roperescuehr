'use client';

import React, { useEffect, useState } from 'react';
import { getGlobalStats } from '@/lib/firebase-leaderboard';
import { Users, Activity, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GlobalStats() {
  const [stats, setStats] = useState({ totalUsers: 0, totalExams: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getGlobalStats();
        setStats(data);
      } catch (err) {
        console.error("Greška pri dohvaćanju statistike:", err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="mt-24 mb-16 border-t border-gray-100 dark:border-gray-800 pt-16 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">
          Zajednica u brojkama
        </h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.25em] mt-2">
          Pridruži se tisućama uspješno riješenih ispita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {/* Korisnici */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-800 flex flex-col items-center text-center group transition-all">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
            <Users size={32} />
          </div>
          <span className="text-5xl font-black dark:text-white tabular-nums tracking-tighter">
            {stats.totalUsers}
          </span>
          <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest mt-2 italic">
            Registriranih korisnika
          </span>
        </div>

        {/* Ispiti */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-800 flex flex-col items-center text-center group transition-all">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
            <Activity size={32} />
          </div>
          <span className="text-5xl font-black dark:text-white tabular-nums tracking-tighter">
            {stats.totalExams}
          </span>
          <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest mt-2 italic">
            Riješenih ispita
          </span>
        </div>

        {/* Poziv na akciju */}
        <Link href="/o-nama" className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-600/20 flex flex-col items-center justify-center text-center group hover:bg-blue-700 transition-all text-white relative overflow-hidden">
          <h4 className="text-2xl font-black uppercase italic leading-tight relative z-10">
            Saznaj više o projektu
          </h4>
          <div className="flex items-center gap-2 mt-4 bg-white/20 px-4 py-2 rounded-full relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest">O nama</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}