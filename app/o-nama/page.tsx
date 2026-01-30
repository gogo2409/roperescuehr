'use client';

import React, { useEffect, useState } from 'react';
import { getGlobalStats } from '@/lib/firebase-leaderboard';
import { Users, BookOpen, Send, Info, Star, Loader2, CheckCircle2 } from 'lucide-react';

const AboutPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalExams: 0 });
  const [aboutData, setAboutData] = useState({ naslov: '', tekst: '' });
  const [loading, setLoading] = useState(true);
  
  // Stanja za kontakt formu
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Dohvati statistiku iz Firebasea
        const s = await getGlobalStats();
        setStats(s);

        // 2. Dohvati tekst iz Strapija (Prilagođeno Strapi v5)
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/o-nama`, {
          headers: { 
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` 
          },
          cache: 'no-store'
        });
        
        const response = await res.json();
        
        if (response && response.data) {
          setAboutData({
            naslov: response.data.naslov || '',
            tekst: response.data.tekst || ''
          });
        }
      } catch (err) {
        console.error("Greška pri učitavanju podataka:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funkcija za slanje forme na Formspree
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('https://formspree.io/f/xykkjbae', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSent(true);
        (e.target as HTMLFormElement).reset(); // Briše unos nakon slanja
      } else {
        setError("Došlo je do greške pri slanju. Pokušaj ponovo.");
      }
    } catch (err) {
      setError("Mrežna greška. Provjeri internet vezu.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 pb-24 pt-10">
      
      {/* SEKCIJA: O NAMA (Strapi) */}
      <section className="bg-white dark:bg-gray-900 rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-all">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-600/30">
              <Info size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic dark:text-white leading-none">
              {aboutData.naslov || "O Projektu"}
            </h1>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed whitespace-pre-wrap italic">
              {aboutData.tekst || "Tekst nije postavljen."}
            </div>
          </div>
        </div>
      </section>

      {/* SEKCIJA: STATISTIKA (Firebase) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70 mb-2 text-blue-100 italic">Registriranih korisnika</p>
            <h3 className="text-6xl font-black tabular-nums tracking-tighter">{stats.totalUsers}</h3>
          </div>
          <Users size={70} className="opacity-20 group-hover:scale-110 transition-transform duration-500" />
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70 mb-2 text-orange-100 italic">Riješenih ispita</p>
            <h3 className="text-6xl font-black tabular-nums tracking-tighter">{stats.totalExams}</h3>
          </div>
          <BookOpen size={70} className="opacity-20 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>

      {/* SEKCIJA: KONTAKT FORMA (Formspree) */}
      <section className="bg-gray-950 dark:bg-black rounded-[3.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">Kontaktiraj nas</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8 leading-relaxed">
              Imaš pitanje o sustavu ili prijedlog? Piši nam, odgovaramo u najkraćem roku.
            </p>
            
            {isSent ? (
              <div className="bg-green-500/10 border border-green-500/50 rounded-[2rem] p-8 text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-black uppercase italic mb-2">Poruka poslana!</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Javit ćemo ti se uskoro na email.</p>
                <button 
                  onClick={() => setIsSent(false)}
                  className="mt-6 text-[10px] font-black uppercase underline hover:text-green-500 transition-colors"
                >
                  Pošalji još jednu poruku
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    required
                    name="ime"
                    type="text" 
                    placeholder="Ime i prezime" 
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-sm text-white placeholder:text-gray-600" 
                  />
                  <input 
                    required
                    name="email"
                    type="email" 
                    placeholder="Email adresa" 
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-sm text-white placeholder:text-gray-600" 
                  />
                </div>
                <textarea 
                  required
                  name="poruka"
                  placeholder="Tvoja poruka..." 
                  rows={4} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-sm text-white placeholder:text-gray-600" 
                />
                
                {error && <p className="text-red-500 text-xs font-bold italic">{error}</p>}
                
                <button 
                  type="submit"
                  disabled={isSending}
                  className="bg-white text-black font-black uppercase px-12 py-5 rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 group active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Slanje...' : 'Pošalji poruku'}
                  <Send size={20} className={`${isSending ? 'animate-pulse' : 'group-hover:translate-x-1 group-hover:-translate-y-1'} transition-transform`} />
                </button>
              </form>
            )}
          </div>
          
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 animate-pulse" />
              <Star className="text-white/10 w-64 h-64 rotate-12 relative z-10" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;