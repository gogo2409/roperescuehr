'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseAuth, db } from '@/lib/firebase';
import { 
  Loader2, Share2, Copy, Check, Users, ArrowLeft, UserPlus, Gift
} from 'lucide-react';
import Link from 'next/link';

interface ReferredUser {
  id: string;
  name: string;
  createdAt: string;
}

export default function ReferralPage() {
  const [user, setUser] = useState<User | null>(null);
  const [strapiId, setStrapiId] = useState<string | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${strapiId || ''}` 
    : '';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const sId = await fetchStrapiId(currentUser.email!);
        if (sId) await loadReferredUsers(sId);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchStrapiId = async (email: string) => {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      const res = await fetch(`${strapiUrl}/api/users?filters[email][$eq]=${email}`);
      const data = await res.json();
      if (data.length > 0) {
        setStrapiId(data[0].id.toString());
        return data[0].id.toString();
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const loadReferredUsers = async (sId: string) => {
    const q = query(collection(db, 'users'), where('referredBy', '==', sId));
    const snap = await getDocs(q);
    const referred: ReferredUser[] = [];
    snap.forEach(doc => {
      referred.push({ id: doc.id, name: `${doc.data().firstName} ${doc.data().lastName}`, createdAt: doc.data().createdAt });
    });
    setReferredUsers(referred);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pb-12 font-sans">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        
        {/* BACK BUTTON */}
        <Link href="/profil" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 font-bold text-sm">
          <ArrowLeft size={18} /> NATRAG NA PROFIL
        </Link>

        {/* HERO SECTION */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white mb-8 shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Pozovi ekipu</h1>
            <p className="text-indigo-100 max-w-md font-medium">Podijeli svoj jedinstveni link s kolegama. Kada se registriraju, vidjet ćeš ih na listi ispod.</p>
          </div>
          <Share2 size={180} className="absolute -right-10 -bottom-10 text-indigo-500/30 rotate-12" />
        </div>

        {/* LINK BOX */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border dark:border-gray-800 shadow-sm mb-8">
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Tvoj osobni link</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 px-5 py-4 rounded-2xl text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
              {referralLink}
            </div>
            <button 
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${copied ? 'bg-green-500 text-white scale-95' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? "KOPIRANO" : "KOPIRAJ"}
            </button>
          </div>
        </div>

        {/* LISTA KORISNIKA */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <Users className="text-indigo-600" /> Pozvani korisnici
            </h3>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-4 py-1 rounded-full text-xs font-black">
              {referredUsers.length} UKUPNO
            </span>
          </div>

          {referredUsers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed dark:border-gray-800 rounded-[2rem]">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="text-gray-300" size={30} />
              </div>
              <p className="text-gray-400 font-medium">Još nema registriranih preko tvog linka.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border dark:border-gray-800 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm flex items-center justify-center text-indigo-600 font-black text-lg">
                      {ref.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white leading-none mb-1">{ref.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Pridružio se: {new Date(ref.createdAt).toLocaleDateString('hr-HR')}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-2 rounded-lg">
                    <Check size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO CARD */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-6 rounded-3xl flex gap-4">
          <Gift className="text-amber-600 shrink-0" size={24} />
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            <strong>Savjet:</strong> Podijeli link u WhatsApp grupama ili na društvenim mrežama kako bi tvoji kolege lakše pronašli materijale!
          </p>
        </div>

      </div>
    </div>
  );
}