'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Loader2, 
  Clock, 
  ChevronRight, 
  Play, 
  CheckCircle2,
  Timer,
  Trophy,
  AlertCircle,
  History,
  ArrowLeft,
  Lock,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  fetchPitanjaByKategorija, 
  spremiIspitSustav, 
  syncUserWithStrapi 
} from '@/lib/strapi';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';

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

export default function MikroIspitPage() {
  const params = useParams();
  const router = useRouter();
  const kategorijaId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [pitanja, setPitanja] = useState<any[]>([]);
  const [nazivKategorije, setNazivKategorije] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ispitZapoceo, setIspitZapoceo] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [odabrano, setOdabrano] = useState<string | null>(null);
  const [rezultati, setRezultati] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  const [pocetakVrijeme, setPocetakVrijeme] = useState<number | null>(null);
  const [zavrseno, setZavrseno] = useState(false);
  const [noveMedalje, setNoveMedalje] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!kategorijaId) return;
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      if (u) {
        await syncUserWithStrapi(u);
        const uSnap = await getDoc(doc(db, "users", u.uid));
        if (uSnap.exists()) setUserStats(uSnap.data());
      }
      try {
        const p = await fetchPitanjaByKategorija(Number(kategorijaId));
        if (!p || p.length === 0) setError("Nema pitanja.");
        else {
          setPitanja(p);
          setNazivKategorije(p[0].lekcija?.kategorija?.Naziv || "Mikro Ispit");
        }
      } catch (e) { setError("Greška pri učitavanju."); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [kategorijaId]);

  useEffect(() => {
    if (ispitZapoceo && timeLeft > 0 && !zavrseno) {
      const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(t);
    } else if (timeLeft === 0 && !zavrseno) handleZavrsiIspit();
  }, [ispitZapoceo, timeLeft, zavrseno]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const kreniSIspitom = () => { setIspitZapoceo(true); setPocetakVrijeme(Date.now()); };

  const handleSljedece = async () => {
    const p = pitanja[indeks];
    const jeTocno = odabrano === p.Tocan_Odgovor;
    const noviNiz = [...rezultati, { jeTocno, bodovi: jeTocno ? (p.Bodovi || 1) : 0 }];
    setRezultati(noviNiz);
    if (indeks + 1 < pitanja.length) { setIndeks(indeks + 1); setOdabrano(null); }
    else await handleZavrsiIspit(noviNiz);
  };

  const handleZavrsiIspit = async (final = rezultati) => {
    setIsSaving(true);
    const ukupno = final.reduce((a, b) => a + b.bodovi, 0);
    const max = pitanja.reduce((a, b) => a + (b.Bodovi || 1), 0);
    const postotak = Math.round((ukupno / max) * 100);
    const trajanje = pocetakVrijeme ? Math.floor((Date.now() - pocetakVrijeme) / 1000) : 0;
    
    if (user) {
      const m = await spremiIspitSustav(user, { 
        modulId: `mikro-${kategorijaId}`, 
        nazivKategorije: nazivKategorije,
        ukupnoBodova: ukupno, 
        postotak, 
        vrijemeTrajanja: trajanje, 
        email: user.email 
      });
      setNoveMedalje(m);
      const uSnap = await getDoc(doc(db, "users", user.uid));
      if (uSnap.exists()) setUserStats(uSnap.data());
    }
    setIsSaving(false); setZavrseno(true);
  };

  if (loading || isSaving) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={50} />
      <h2 className="font-black text-gray-300 uppercase tracking-tighter italic">{isSaving ? "Analiziramo tvoj uspjeh..." : "Priprema..."}</h2>
    </div>
  );

  if (zavrseno) {
    const postotak = Math.round((rezultati.reduce((a,b)=>a+b.bodovi,0) / (pitanja.reduce((a,b)=>a+(b.Bodovi||1),0) || 1)) * 100);
    const stareMedalje = userStats?.medalje || [];
    const zakljucane = LISTA_ID_MEDALJA.filter(m => !stareMedalje.includes(m) && !noveMedalje.includes(m));

    return (
      <div className="max-w-3xl mx-auto my-6 md:my-10 p-4">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border p-6 md:p-10 text-center relative overflow-hidden">
          <h1 className="text-7xl md:text-9xl font-black mb-2 tracking-tighter italic text-gray-900 leading-none">{postotak}%</h1>
          <p className={`text-xl md:text-3xl font-black mb-8 md:mb-12 uppercase italic ${postotak >= 90 ? 'text-green-500' : 'text-red-500'}`}>
            {postotak >= 90 ? 'MIKRO ISPIT POLOŽEN!' : 'POKUŠAJTE PONOVNO'}
          </p>

          {noveMedalje.length > 0 && (
            <div className="mb-8 md:mb-12 p-6 md:p-8 bg-yellow-50 rounded-[2rem] md:rounded-[3rem] border-4 border-yellow-100">
              <Trophy className="mx-auto text-yellow-500 mb-4" size={32} />
              <h3 className="text-yellow-700 font-black uppercase text-[10px] md:text-sm mb-6 tracking-widest text-center">Nove Medalje!</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {noveMedalje.map((m: string) => (
                  <div key={m} className="flex flex-col items-center">
                    <img src={SVE_MEDALJE_PODACI[m]?.src} className="w-16 h-16 md:w-20 md:h-20 animate-bounce" alt={m} />
                    <span className="font-black text-[8px] text-yellow-800 uppercase mt-2 italic text-center max-w-[70px]">{SVE_MEDALJE_PODACI[m]?.naziv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {[
            { naslov: "Moja Kolekcija", data: stareMedalje, isLocked: false },
            { naslov: "Još možeš osvojiti", data: zakljucane, isLocked: true }
          ].map((sec, idx) => sec.data.length > 0 && (
            <div key={idx} className="mb-8 text-left">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-4 italic">{sec.naslov}</h4>
              <div className="flex flex-wrap gap-4 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner relative">
                {sec.data.map((m: string) => (
                  <div key={m} className="group relative">
                    <div className="relative z-10">
                      <img 
                        src={SVE_MEDALJE_PODACI[m]?.src} 
                        className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-300 ${sec.isLocked ? 'grayscale opacity-20' : 'hover:scale-110 cursor-help'}`} 
                        alt={m} 
                      />
                      {sec.isLocked && <Lock className="absolute inset-0 m-auto text-gray-400 opacity-40" size={12} />}
                    </div>
                    <div className="invisible group-hover:visible absolute bottom-full left-0 mb-3 z-[100] w-56 transform transition-all duration-200 opacity-0 group-hover:opacity-100">
                      <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-700 relative">
                        <div className="flex items-center gap-2 mb-1">
                          {sec.isLocked && <Lock size={12} className="text-orange-400" />}
                          <p className={`font-black uppercase text-[11px] leading-tight ${sec.isLocked ? 'text-orange-400' : 'text-blue-400'}`}>{SVE_MEDALJE_PODACI[m]?.naziv}</p>
                        </div>
                        <p className="text-[10px] font-medium text-gray-300 italic leading-snug">{SVE_MEDALJE_PODACI[m]?.opis}</p>
                        <div className="absolute top-full left-6 -mt-1 border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col md:flex-row gap-4 mt-10">
            <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">Ponovi Mikro Ispit</button>
            <button onClick={() => router.push('/')} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase active:scale-95 transition-all">Završi</button>
          </div>
        </div>
      </div>
    );
  }

  if (!ispitZapoceo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-gray-900/95 backdrop-blur-xl">
        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <ArrowLeft size={24} className="text-gray-400" />
          </button>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tighter italic uppercase">{nazivKategorije || "Spremni?"}</h2>
          <p className="text-gray-400 font-bold mb-8 italic text-sm md:text-base text-balance">Vrijeme rješavanja i točnost utječu na tvoj ranking i medalje.</p>
          
          <div className="space-y-3 mb-10 text-left">
            <div className="bg-blue-50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-blue-100 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200"><Timer size={22} /></div>
              <p className="font-black text-blue-900 italic text-sm md:text-base text-balance">Vrijeme rješavanja ispita: 15 minuta</p>
            </div>
            <div className="bg-green-50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-green-100 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-200"><CheckCircle2 size={22} /></div>
              <p className="font-black text-green-900 italic leading-tight text-xs md:text-sm text-balance">Za prolaz na ispitu potrebno je 90% točnih odgovora.</p>
            </div>
            <div className="bg-orange-50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-orange-100 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-200"><History size={22} /></div>
              <p className="font-black text-orange-900 italic leading-tight text-xs md:text-sm text-balance">Nema povratka na prethodna pitanja. Svaki odgovor je konačan.</p>
            </div>
          </div>

          <button onClick={kreniSIspitom} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-xl md:text-2xl uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Play fill="currentColor" size={24} /> ZAPOČNI MIKRO ISPIT</button>
        </div>
      </div>
    );
  }

  const p = pitanja[indeks];
  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen flex flex-col justify-center">
      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border relative overflow-hidden">
        <div className="absolute top-0 left-0 h-2 bg-blue-500 transition-all duration-700" style={{ width: `${((indeks + 1) / pitanja.length) * 100}%` }} />
        <div className="flex justify-between items-center mb-6 md:mb-10 text-[10px] md:text-xs font-black text-gray-300 uppercase italic">
          <span className="flex items-center gap-2"><BookOpen size={14} /> {nazivKategorije} • {indeks + 1}/{pitanja.length}</span>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600"><Clock size={14} /> {formatTime(timeLeft)}</div>
        </div>
        {p?.Slika_pitanja?.url && <div className="mb-6 rounded-[1.5rem] overflow-hidden bg-gray-50 border"><img src={`${STRAPI_URL}${p.Slika_pitanja.url}`} className="w-full h-auto max-h-64 object-contain mx-auto" alt="Pitanje" /></div>}
        <ReactMarkdown className="text-xl md:text-3xl font-black text-gray-800 leading-tight italic mb-8">{p?.Tekst_Pitanja}</ReactMarkdown>
        <div className="grid gap-3">
          {['A', 'B', 'C'].map(s => (
            <button key={s} onClick={() => setOdabrano(s)} className={`w-full text-left p-4 md:p-6 border-2 rounded-[1.5rem] flex items-center gap-4 transition-all ${odabrano === s ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:bg-gray-50'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${odabrano === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
              <span className={`text-sm md:text-lg font-bold ${odabrano === s ? 'text-blue-900' : 'text-gray-700'}`}>{p?.[`Odgovor_${s}`]}</span>
            </button>
          ))}
        </div>
        <button onClick={handleSljedece} disabled={!odabrano} className="w-full mt-8 bg-gray-900 text-white py-6 rounded-[1.5rem] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20 shadow-xl">
          {indeks === pitanja.length - 1 ? 'Završi Mikro Ispit' : 'Sljedeće Pitanje'} <ChevronRight />
        </button>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-gray-300 font-black text-[9px] md:text-[10px] uppercase tracking-widest italic"><AlertCircle size={12} /> Odgovori su konačni i nije moguć povratak</div>
    </div>
  );
}