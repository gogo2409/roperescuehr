'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { 
  LogOut, 
  LogIn, 
  UserPlus, 
  Loader2, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  User as UserIcon,
  ShoppingCart,
  ClipboardList,
  Trophy,
  Share2
} from 'lucide-react';
import { firebaseAuth, db } from '@/lib/firebase';
import { syncUserWithStrapi } from '@/lib/strapi';

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
    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${props.className || ''}`}
  />
);

const Button = ({ children, onClick, className = "", disabled = false, type = "button" }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 
      ${disabled ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' : `${className} hover:opacity-90`}`}
  >
    {children}
  </button>
);

const FormModal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative border border-transparent dark:border-gray-700 overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 border-b dark:border-gray-700 pb-2">{title}</h3>
        <div className="text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- MODAL ZA REGISTRACIJU ---
const RegistrationModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) { setMessage({ type: 'error', text: 'Ime i Prezime su obavezni.' }); return; }
    setIsLoading(true); setMessage(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}` });
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName, lastName, email, unit: "", phone: "", createdAt: new Date().toISOString()
      });

      await syncUserWithStrapi(userCredential.user, firstName, lastName, "", "");

      setMessage({ type: 'success', text: 'Registracija uspješna!' });
      setTimeout(onClose, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: mapFirebaseError(error.code) });
    } finally { setIsLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Registracija">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <Input placeholder="Ime" required value={firstName} onChange={e => setFirstName(e.target.value)} />
          <Input placeholder="Prezime" required value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Lozinka" required value={password} onChange={e => setPassword(e.target.value)} />
        
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto text-[11px] leading-relaxed text-gray-700 dark:text-gray-400">
          <p className="mb-2">Prihvaćanjem uvjeta registracije, potvrđujete da razumijete i prihvaćate da ova aplikacija služi isključivo u edukativne svrhe.</p>
          <p className="mb-2 font-bold text-gray-900 dark:text-gray-200">Koristite na vlastitu odgovornost.</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={acceptedTerms} 
            onChange={e => setAcceptedTerms(e.target.checked)} 
            className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
            Pročitao/la sam i prihvaćam <strong>uvjete korištenja</strong>.
          </span>
        </label>

        <Button type="submit" disabled={isLoading || !acceptedTerms} className="w-full bg-indigo-600 text-white py-2">
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Registracija'}
        </Button>
      </form>
      {message && <StatusMessage message={message} />}
    </FormModal>
  );
};

// --- MODAL ZA PRIJAVU ---
const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setMessage(null);
    try { 
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password); 
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        await syncUserWithStrapi(userCredential.user, data.firstName, data.lastName, data.unit, data.phone);
      } else {
        await syncUserWithStrapi(userCredential.user);
      }
      setMessage({ type: 'success', text: 'Prijava uspješna!' });
      setTimeout(onClose, 1000);
    } catch (error: any) { 
      setMessage({ type: 'error', text: mapFirebaseError(error.code) }); 
    } finally { setIsLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Prijava">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Lozinka" required value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white py-2">
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Prijava'}
        </Button>
      </form>
      {message && <StatusMessage message={message} />}
    </FormModal>
  );
};

// --- MODAL ZA PROFIL ---
const ProfileModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setFirstName(d.firstName || '');
          setLastName(d.lastName || '');
          setPhone(d.phone || '');
          setUnit(d.unit || '');
        }
      });
    }
  }, [isOpen, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { firstName, lastName, phone, unit });
      await syncUserWithStrapi(user, firstName, lastName, unit, phone);
      setMessage({ type: 'success', text: 'Spremljeno!' });
      setTimeout(onClose, 1500);
    } catch { setMessage({ type: 'error', text: 'Greška!' }); }
    finally { setIsLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Moj profil">
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="flex gap-4">
          <Input placeholder="Ime" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <Input placeholder="Prezime" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <Input placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input placeholder="Postrojba" value={unit} onChange={e => setUnit(e.target.value)} />
        <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white">Spremi promjene</Button>
      </form>

      {/* NAVIGACIJSKI LINKOVI UNUTAR MODALA */}
      <div className="mt-6 pt-4 border-t dark:border-gray-700 grid grid-cols-1 gap-2">
        <a href="/profil" className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
          <ClipboardList className="h-4 w-4" /> Rezultati ispita
        </a>
        <a href="/profil/medalje" className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors">
          <Trophy className="h-4 w-4" /> Moje medalje
        </a>
        
        {/* DODAN LINK ZA POZOVI PRIJATELJE */}
        <a href="/profil/pozovi-prijatelje" className="flex items-center justify-center gap-2 w-full bg-indigo-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors">
          <Share2 className="h-4 w-4" /> Pozovi prijatelje
        </a>

        <a href="/profil/narudzbe" className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          <ShoppingCart className="h-4 w-4" /> Moje narudžbe
        </a>
      </div>
      {message && <StatusMessage message={message} />}
    </FormModal>
  );
};

const StatusMessage = ({ message }: { message: any }) => (
  <div className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
    <p className="text-sm font-medium">{message.text}</p>
  </div>
);

export default function AuthNavButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [modals, setModals] = useState({ reg: false, login: false, prof: false });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, u => { setUser(u); setIsAuthReady(true); });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Button onClick={() => setModals({ ...modals, prof: true })} className="bg-indigo-600 text-white"><UserIcon className="h-4 w-4 mr-1.5" /> Profil</Button>
          <Button onClick={() => signOut(firebaseAuth)} className="bg-red-500 text-white"><LogOut className="h-4 w-4 mr-1.5" /> Odjava</Button>
        </>
      ) : (
        <>
          <Button onClick={() => setModals({ ...modals, reg: true })} className="bg-indigo-600 text-white">Registracija</Button>
          <Button onClick={() => setModals({ ...modals, login: true })} className="bg-green-600 text-white">Prijava</Button>
        </>
      )}
      <RegistrationModal isOpen={modals.reg} onClose={() => setModals({ ...modals, reg: false })} />
      <LoginModal isOpen={modals.login} onClose={() => setModals({ ...modals, login: false })} />
      {user && <ProfileModal isOpen={modals.prof} onClose={() => setModals({ ...modals, prof: false })} user={user} />}
    </div>
  );
}