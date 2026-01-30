"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { firebaseAuth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  updateProfile,
  User 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { syncUserWithStrapi } from '@/lib/strapi';
import { 
  UserPlus, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  UserCheck, 
  ShieldAlert,
  X 
} from 'lucide-react';

// --- POMOĆNE KOMPONENTE ---

const mapFirebaseError = (code: string) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email je već registriran.';
    case 'auth/invalid-email': return 'Email nije ispravan.';
    case 'auth/weak-password': return 'Lozinka mora imati najmanje 6 znakova.';
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'Nevažeća email adresa ili lozinka.';
    default: return 'Neočekivana pogreška. Pokušajte ponovno.';
  }
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${props.className || ''}`}
  />
);

const CustomButton = ({ children, onClick, className = "", disabled = false, type = "button" }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-4 py-3 text-sm font-bold transition-all duration-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 
      ${disabled ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' : `${className} hover:opacity-90 shadow-md`}`}
  >
    {children}
  </button>
);

const StatusMessage = ({ message }: { message: { type: 'error' | 'success', text: string } }) => (
  <div className={`mt-4 p-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
    <p className="text-sm font-medium">{message.text}</p>
  </div>
);

// --- GLAVNI SADRŽAJ ---

const RegisterContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [refId, setRefId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('ref');
    if (id) {
      setRefId(id);
      setIsRegistering(true); 
      const fetchReferrer = async () => {
        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
          const res = await fetch(`${strapiUrl}/api/users/${id}`);
          if (res.ok) {
            const data = await res.json();
            setReferrerName(data.firstName ? `${data.firstName} ${data.lastName}` : data.username);
          }
        } catch (err) {
          console.error("Greška pri dohvatu imena pozivatelja:", err);
        }
      };
      fetchReferrer();
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!email || !password || (isRegistering && (!firstName || !lastName))) {
      setMessage({ type: 'error', text: 'Molimo popunite sva polja.' });
      return;
    }
    if (isRegistering && !acceptedTerms) {
      setMessage({ type: 'error', text: 'Morate prihvatiti uvjete.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (isRegistering) {
        // 1. Kreiranje korisnika u Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const newUser = userCredential.user;
        
        // 2. Ažuriranje prikaza imena
        await updateProfile(newUser, { displayName: `${firstName} ${lastName}` });
        
        // 3. SPREMANJE U FIRESTORE (Dodano polje referredBy)
        await setDoc(doc(db, "users", newUser.uid), {
          firstName,
          lastName,
          email,
          createdAt: new Date().toISOString(),
          referredBy: refId || null // <--- OVO JE KLJUČNO ZA LISTU NA PROFILU
        });

        // 4. Sinkronizacija sa Strapijem
        await syncUserWithStrapi(newUser, firstName, lastName, "", "");

        // 5. Okidanje API rute za referral logiku (opcionalno za bodove)
        if (refId) {
          try {
            await fetch('/api/register-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referredBy: refId, newUserUid: newUser.uid })
            });
          } catch (err) { console.error("Referral API error:", err); }
        }
        
        setMessage({ type: 'success', text: 'Registracija uspješna!' });
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        setMessage({ type: 'success', text: 'Prijava uspješna!' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: mapFirebaseError(e.code) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
      {!user ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 border-b dark:border-gray-700 pb-2">
            {isRegistering ? "Registracija" : "Prijava"}
          </h2>

          {isRegistering && referrerName && (
            <div className="mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
              <UserCheck size={20} className="shrink-0" />
              <p className="text-sm font-medium leading-tight">
                Korisnik <strong>{referrerName}</strong> te pozvao!
              </p>
            </div>
          )}

          <div className="space-y-4">
            {isRegistering && (
              <div className="flex gap-4">
                <Input placeholder="Ime" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <Input placeholder="Prezime" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            )}

            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="Lozinka" value={password} onChange={e => setPassword(e.target.value)} />

            {isRegistering && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <ShieldAlert size={14} />
                    <span>Važno Obavještenje</span>
                  </div>
                  <p className="mb-2">
                    Prihvaćanjem uvjeta registracije, potvrđujete da razumijete i prihvaćate da ova aplikacija služi 
                    isključivo u <strong>demonstracijske i edukativne svrhe</strong>.
                  </p>
                  <p className="mb-2">
                    Stoga se izričito odričemo bilo kakve odgovornosti za točnost, potpunost ili korisnost bilo koje 
                    informacije, usluge ili proizvoda dostupnog putem ove platforme. <strong>Koristite na vlastitu odgovornost</strong>.
                  </p>
                  <p>
                    Podaci se spremaju u Firebase Firestore. Ne garantiramo njihovu trajnost ili sigurnost u 
                    produkcijskom okruženju.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" checked={acceptedTerms} 
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded shrink-0 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
                    Pročitao/la sam i prihvaćam <strong>uvjete korištenja</strong> i razumijem da je ova aplikacija u edukativne svrhe.
                  </span>
                </label>
              </div>
            )}
          </div>

          <CustomButton
            onClick={handleAuth} 
            disabled={isLoading || (isRegistering && !acceptedTerms)}
            className={`w-full mt-8 ${isRegistering ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : isRegistering ? "REGISTRACIJA" : "PRIJAVA"}
          </CustomButton>

          {message && <StatusMessage message={message} />}

          <p className="text-center text-sm text-gray-500 mt-6">
            {isRegistering ? "Već imaš račun?" : "Nemaš račun?"}{" "}
            <span 
              className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-semibold underline decoration-2 underline-offset-4" 
              onClick={() => { setIsRegistering(!isRegistering); setMessage(null); }}
            >
              {isRegistering ? "Prijavi se" : "Registriraj se"}
            </span>
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl text-center border border-indigo-50 dark:border-gray-700 max-w-sm w-full">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
             <UserCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Uspješna prijava!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 truncate">{user.displayName || user.email}</p>
          <CustomButton onClick={() => signOut(firebaseAuth)} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <LogOut size={18} className="mr-2" /> Odjavi se
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white font-bold text-indigo-600">Učitavanje stranice...</div>}>
      <RegisterContent />
    </Suspense>
  );
}