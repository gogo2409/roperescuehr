'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Loader2, 
  Trophy, 
  Lock, 
  ArrowLeft, 
  Medal, 
  Star,
  Info
} from 'lucide-react';

const SVE_MEDALJE_PODACI: Record<string, { naziv: string, opis: string, src: string }> = {
  'top1': { naziv: 'Top 1% (Zlatni dijamant)', opis: 'Budi u top 3 na sva tri modula. Najprestižnija medalja.', src: '/medalje/top1.png' },
  'brziprst': { naziv: 'Brzi Prst', opis: 'Ispit riješen s >90% točnosti u rekordno kratkom vremenu.', src: '/medalje/brziprst.png' },
  'brzaruka': { naziv: 'Brza Ruka', opis: 'Riješena 3 ispita zaredom u vremenu kraćem od prosjeka.', src: '/medalje/brzaruka.png' },
  'maratonac': { naziv: 'Maratonac', opis: 'Uspješno položen cijeli obrazovni ciklus (Moduli 1, 2 i 3).', src: '/medalje/maratonac.png' },
  'teamleader': { naziv: 'Team Leader', opis: 'Pozovi tri prijatelja da se registriraju preko tvog linka.', src: '/medalje/teamleader.png' },
  'vatreniniz': { naziv: 'Vatreni Niz', opis: 'Rješavanje ispita tri dana za redom ili 5 puta isti modul.', src: '/medalje/vatreniniz.png' },
  'nepogresivi': { naziv: 'Nepogrešivi', opis: 'Ostvareno 100% točnih odgovora na završnom ispitu modula.', src: '/medalje/nepogresivi.png' },
  'nocnastraza': { naziv: 'Noćna Straža', opis: 'Rješavanje bilo kojeg ispita u periodu od 00:00 do 06:00h.', src: '/medalje/nocnastraza.png' },
  'majstorteorije': { naziv: 'Majstor Teorije', opis: 'Riješeni svi mikro ispiti i završni ispiti za module 1, 2 i 3.', src: '/medalje/majstorteorije.png' },
  'povratnik': { naziv: 'Povratnik', opis: 'Značajno poboljšanje rezultata u odnosu na prethodni pokušaj.', src: '/medalje/povratnik.png' },
  'majstorcvorova': { naziv: 'Majstor Čvorova', opis: 'Riješen mikro ispit iz čvorova sa 100% točnosti.', src: '/medalje/majstorcvorova.png' },
  'majstorsustava': { naziv: 'Majstor Sustava', opis: 'Riješen mikro ispit iz kolotura sa 100% točnosti.', src: '/medalje/majstorsustava.png' },
  'modul1': { naziv: 'Modul 1', opis: 'Uspješno položen završni ispit iz Modula 1.', src: '/medalje/modul1.png' },
  'modul2': { naziv: 'Modul 2', opis: 'Uspješno položen završni ispit iz Modula 2.', src: '/medalje/modul2.png' },
  'modul3': { naziv: 'Modul 3', opis: 'Uspješno položen završni ispit iz Modula 3.', src: '/medalje/modul3.png' },
  'vjezbatelj': { naziv: 'Vježbatelj', opis: 'Posebna medalja koju dodjeljuje administrator.', src: '/medalje/vjezbatelj.png' },
  'instruktor': { naziv: 'Instruktor', opis: 'Posebna medalja koju dodjeljuje administrator.', src: '/medalje/instruktor.png' }
};

const LISTA_ID_MEDALJA = Object.keys(SVE_MEDALJE_PODACI);

export default function MojeMedaljePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [osvojeneMedalje, setOsvojeneMedalje] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          setOsvojeneMedalje(uSnap.data().medalje || []);
        }
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  const zakljucaneMedalje = LISTA_ID_MEDALJA.filter(id => !osvojeneMedalje.includes(id));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mb-4 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} /> Nazad u profil
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic uppercase">
              Moje Medalje
            </h1>
          </div>
          <div className="hidden md:flex bg-blue-50 p-4 rounded-3xl items-center gap-4 border border-blue-100">
             <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200">
                <Trophy size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-blue-400 leading-none">Napredak</p>
                <p className="text-xl font-black text-blue-900 italic">{osvojeneMedalje.length}/{LISTA_ID_MEDALJA.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:mt-10">
        
        {/* SEKCIJA: OSVOJENE */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6 ml-2">
            <Medal className="text-green-500" size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 italic">Osvojeni trofeji</h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border border-gray-100">
            {osvojeneMedalje.length > 0 ? osvojeneMedalje.map(m => (
              <MedalItem key={m} id={m} isLocked={false} />
            )) : (
              <div className="col-span-full py-10 text-center">
                <p className="font-bold text-gray-300 italic">Još nisi osvojio nijednu medalju. Vrijeme je za ispite!</p>
              </div>
            )}
          </div>
        </div>

        {/* SEKCIJA: ZAKLJUČANE */}
        <div>
          <div className="flex items-center gap-3 mb-6 ml-2">
            <Star className="text-orange-400" size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 italic">Preostali izazovi</h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border border-gray-100">
            {zakljucaneMedalje.map(m => (
              <MedalItem key={m} id={m} isLocked={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// POMOĆNA KOMPONENTA ZA JEDNU MEDALJU S TOOLTIPOM
function MedalItem({ id, isLocked }: { id: string, isLocked: boolean }) {
  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative">
        <img 
          src={SVE_MEDALJE_PODACI[id]?.src} 
          className={`w-16 h-16 md:w-20 md:h-20 transition-all duration-300 ${isLocked ? 'grayscale opacity-15' : 'hover:scale-110 cursor-help drop-shadow-md'}`} 
          alt={id} 
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="text-gray-300 opacity-50" size={16} />
          </div>
        )}
      </div>

      {/* NOVI TOOLTIP - ISTI KAO NA ISPITU */}
      <div className="invisible group-hover:visible absolute bottom-full left-0 mb-4 z-[100] w-60 transform transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none">
        <div className="bg-gray-900 text-white p-5 rounded-[1.5rem] shadow-2xl border border-gray-700 relative">
          <div className="flex items-center gap-2 mb-2">
            {isLocked ? <Lock size={12} className="text-orange-400" /> : <Medal size={12} className="text-blue-400" />}
            <p className={`font-black uppercase text-xs leading-tight tracking-tight ${isLocked ? 'text-orange-400' : 'text-blue-400'}`}>
              {SVE_MEDALJE_PODACI[id]?.naziv}
            </p>
          </div>
          <p className="text-[11px] font-medium text-gray-300 italic leading-snug">
            {SVE_MEDALJE_PODACI[id]?.opis}
          </p>
          {/* Strelica */}
          <div className="absolute top-full left-8 -mt-1 border-[10px] border-transparent border-t-gray-900"></div>
        </div>
      </div>

      <span className={`text-[8px] md:text-[10px] font-black uppercase mt-3 text-center leading-tight tracking-tighter italic ${isLocked ? 'text-gray-300' : 'text-gray-900'}`}>
        {SVE_MEDALJE_PODACI[id]?.naziv.split('(')[0]}
      </span>
    </div>
  );
}