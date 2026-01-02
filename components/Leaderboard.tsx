'use client';

import React, { useEffect, useState } from 'react';
import { fetchFirebaseLeaderboard, FirebaseLeaderboardEntry } from '@/lib/firebase-leaderboard';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Trophy, Calendar, Target, Loader2, Inbox, X, Shield, Mail, Phone } from 'lucide-react';
import { User } from 'firebase/auth';

// POBOLJŠANA MAPA - Podržava oba formata (sa i bez crtice)
const ACHIEVEMENT_IMAGES: { [key: string]: string } = {
  "top1": "/medalje/top1.png",
  "top-1": "/medalje/top1.png",
  "brziprst": "/medalje/brziprst.png",
  "brzi-prst": "/medalje/brziprst.png",
  "brzaruka": "/medalje/brzaruka.png",
  "brza-ruka": "/medalje/brzaruka.png",
  "maratonac": "/medalje/maratonac.png",
  "teamleader": "/medalje/teamleader.png",
  "team-leader": "/medalje/teamleader.png",
  "vatreniniz": "/medalje/vatreniniz.png",
  "vatreni-niz": "/medalje/vatreniniz.png",
  "nepogresivi": "/medalje/nepogresivi.png",
  "nocnastraza": "/medalje/nocnastraza.png",
  "nocna-straza": "/medalje/nocnastraza.png",
  "majstorteorije": "/medalje/majstorteorije.png",
  "majstor-teorije": "/medalje/majstorteorije.png",
  "povratnik": "/medalje/povratnik.png",
  "majstorcvorova": "/medalje/majstorcvorova.png",
  "majstor-cvorova": "/medalje/majstorcvorova.png",
  "majstorsustava": "/medalje/majstorsustava.png",
  "majstor-sustava": "/medalje/majstorsustava.png",
  "modul1": "/medalje/modul1.png",
  "modul-1": "/medalje/modul1.png",
  "modul2": "/medalje/modul2.png",
  "modul-2": "/medalje/modul2.png",
  "modul3": "/medalje/modul3.png",
  "modul-3": "/medalje/modul3.png",
  "vjezbatelj": "/medalje/vjezbatelj.png",
  "instruktor": "/medalje/instruktor.png",
};

const UserModal = ({ userId, onClose }: { userId: string, onClose: () => void }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) setUserData(userDoc.data());
      } catch (err) {
        console.error("Greška pri dohvaćanju profila:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <span className="text-[10px] font-black uppercase text-gray-400">Učitavanje...</span>
      </div>
    </div>
  );

  if (!userData) return null;

  // Izračun inicijala za prikaz u krugu i naslovu
  const inicijali = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-950 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border dark:border-gray-800 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-black dark:hover:text-white z-10 transition-colors">
          <X size={20} />
        </button>
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-[1.8rem] flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg uppercase">
            {inicijali || "??"}
          </div>
          
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-tight">
            Korisnik: {inicijali}
          </h2>

          {userData.unit && (
            <div className="flex items-center justify-center gap-2 mt-3 text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 py-1.5 px-4 rounded-full w-fit mx-auto border border-blue-100 dark:border-blue-800">
              <Shield size={14} />
              <span className="text-[10px] uppercase tracking-widest">{userData.unit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 my-6 text-left">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border dark:border-gray-800">
              <Mail size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate">{userData.email}</span>
            </div>
          </div>

          <div className="border-t dark:border-gray-800 pt-6">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 italic text-center">Sve osvojene medalje</p>
            <div className="flex flex-wrap justify-center gap-3">
              {userData.medalje?.map((m: string) => {
                const slug = m.toLowerCase().trim();
                const imgSrc = ACHIEVEMENT_IMAGES[slug] || ACHIEVEMENT_IMAGES[slug.replace(' ', '-')];
                
                if (!imgSrc) return null;
                
                return (
                  <img 
                    key={m} 
                    src={imgSrc} 
                    className="h-10 w-10 object-contain drop-shadow-sm" 
                    alt={m} 
                    title={m}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LeaderboardProps {
  currentUser?: User | null;
}

interface ExtendedLeaderboardEntry extends FirebaseLeaderboardEntry {
  strapiMedals?: string[];
  strapiInitials?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const [entries, setEntries] = useState<ExtendedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<number | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const firebaseData = await fetchFirebaseLeaderboard(selectedModule, 50);
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
        const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

        try {
          const strapiRes = await fetch(`${STRAPI_URL}/api/users`, {
            headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
          });
          const strapiUsers = await strapiRes.json();

          const enrichedData = firebaseData.map(entry => {
            const sUser = strapiUsers.find((u: any) => u.firebaseUID === entry.userId);
            let medals: string[] = [];
            if (sUser?.medalje) {
              medals = Array.isArray(sUser.medalje) ? sUser.medalje : [sUser.medalje];
            }
            return {
              ...entry,
              strapiMedals: medals,
              strapiInitials: sUser?.inicijali || entry.initials
            };
          });
          setEntries(enrichedData);
        } catch (err) {
          console.error("⚠️ Strapi Sync Failed", err);
          setEntries(firebaseData);
        }
      } catch (error) {
        console.error("❌ Leaderboard Error", error);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [selectedModule]);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <span className="text-3xl animate-bounce">🥇</span>;
      case 2: return <span className="text-3xl">🥈</span>;
      case 3: return <span className="text-3xl">🥉</span>;
      default: return <span className="text-gray-400 font-bold text-lg">{position}.</span>;
    }
  };

  return (
    <div className="space-y-6">
      {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}

      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white rounded-2xl p-8 shadow-2xl border-b-4 border-blue-500">
        <div className="flex flex-col items-center gap-2 text-center">
          <Trophy className="h-12 w-12 text-yellow-400 drop-shadow-lg" />
          <h1 className="text-4xl font-black uppercase tracking-tighter">Leaderboard</h1>
          <p className="text-blue-100 text-lg font-bold opacity-90 uppercase tracking-widest text-center">
            Top 50 najboljih rezultata
          </p>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto pb-2 px-2">
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-xl shadow-sm border dark:border-gray-800">
          {[undefined, 1, 2, 3, 4].map((m) => (
            <button
              key={m || 'all'}
              onClick={() => setSelectedModule(m)}
              className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${
                selectedModule === m 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {m === 4 ? 'Za one koji žele znati više' : m ? `Modul ${m}` : 'Svi Moduli'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-2">
        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
            <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold uppercase">Trenutno nema rezultata</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isCurrentUser = currentUser?.uid === entry.userId;
            return (
              <div
                key={`${entry.userId}-${entry.timestamp}`}
                onClick={() => setSelectedUserId(entry.userId)}
                className={`relative rounded-xl p-4 transition-all border cursor-pointer active:scale-[0.98] ${
                  isCurrentUser 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 ring-1 ring-blue-400 scale-[1.01]' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 flex-shrink-0 text-center font-black">
                    {getMedalIcon(index + 1)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-lg tracking-tight dark:text-white truncate">
                        {entry.strapiInitials || entry.initials}
                      </span>
                      
                      <div className="flex gap-1.5 items-center">
                        {entry.strapiMedals?.map((slug, i) => {
                          const normalizedSlug = slug.toLowerCase().replace(' ', '-');
                          const imgSrc = ACHIEVEMENT_IMAGES[slug] || ACHIEVEMENT_IMAGES[normalizedSlug];
                          if (!imgSrc) return null;
                          return (
                            <img 
                              key={i} 
                              src={imgSrc} 
                              alt={slug} 
                              className="h-8 w-8 object-contain hover:scale-125 transition-transform"
                            />
                          );
                        })}
                      </div>

                      {isCurrentUser && (
                        <span className="bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-full font-black uppercase">Ti</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center">
                        {new Date(entry.timestamp).toLocaleDateString('hr-HR')}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter text-center">
                         {entry.modulId === 4 ? 'Završni ispit' : `Modul ${entry.modulId}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-black leading-none ${
                      entry.postotak >= 90 ? 'text-green-500' : 
                      entry.postotak >= 75 ? 'text-yellow-500' : 'text-blue-500'
                    }`}>
                      {entry.postotak.toFixed(0)}%
                    </div>
                    <div className="text-[10px] font-bold opacity-40 uppercase mt-1">
                      {entry.score}/{entry.maxScore} Bod
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;