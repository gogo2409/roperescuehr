"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut, 
    User, 
    Auth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';
import { LogOut, LogIn, UserPlus, Loader2, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthNavButtonsProps {
    auth: Auth | null;
    initialAuthToken?: string | null;
}

const mapFirebaseError = (code: string) => {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Ova email adresa je već registrirana.';
        case 'auth/invalid-email':
            return 'Unesena email adresa nije ispravna.';
        case 'auth/weak-password':
            return 'Lozinka mora imati najmanje 6 znakova.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Nevažeća email adresa ili lozinka.';
        case 'auth/operation-not-allowed':
            return 'Prijava putem emaila/lozinke nije omogućena u Firebase projektu.';
        default:
            return 'Došlo je do neočekivane pogreške. Pokušajte ponovno.';
    }
};

// Jednostavni gumb
const Button = ({ children, onClick, className = "", disabled = false }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2 font-medium text-white transition-all duration-200 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-opacity-50 
            ${disabled ? 'bg-gray-400 cursor-not-allowed' : `${className} hover:shadow-lg hover:brightness-110 focus:ring-indigo-500`}`}
    >
        {children}
    </button>
);

// Modal za forme (Login / Registration)
const FormModal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative transform transition-all duration-300 scale-100">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>
                <h3 className="text-2xl font-bold text-indigo-600 mb-6 border-b pb-2">{title}</h3>
                {children}
            </div>
        </div>
    );
};

// Registration Modal
const RegistrationModal = ({ isOpen, onClose, auth }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setMessage(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setMessage({ type: 'success', text: 'Uspješna registracija! Sada ste prijavljeni.' });
            setTimeout(onClose, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: mapFirebaseError(error.code) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Registracija">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Lozinka"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                />
                <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? 'Registriram...' : <><UserPlus className="h-5 w-5 mr-2" /> Registracija</>}
                </Button>
            </form>
            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}
        </FormModal>
    );
};

// Login Modal
const LoginModal = ({ isOpen, onClose, auth }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setMessage(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setMessage({ type: 'success', text: 'Uspješna prijava! Dobrodošli.' });
            setTimeout(onClose, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: mapFirebaseError(error.code) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Prijava">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Lozinka"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                />
                <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                    {isLoading ? 'Prijavljivanje...' : <><LogIn className="h-5 w-5 mr-2" /> Prijava</>}
                </Button>
            </form>
            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}
        </FormModal>
    );
};

// --- Glavna komponenta ---
export default function AuthNavButtons({ auth, initialAuthToken }: AuthNavButtonsProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState("");

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Slušatelj auth state-a
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setUserId(currentUser?.uid || "Anoniman");
            setIsAuthReady(true);
        });

        // Anonimna prijava ako nema korisnika
        if (!auth.currentUser) {
            signInAnonymously(auth).catch(err => console.error("Anonimna prijava neuspjela:", err));
        }

        return () => unsubscribe();
    }, [auth]);

    const handleSignOut = useCallback(() => {
        if (!auth) return;
        signOut(auth).catch(err => console.error("Greška pri odjavi:", err));
    }, [auth]);

    if (!auth || !isAuthReady) {
        return (
            <div className="flex items-center space-x-4 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-600">Provjera autentifikacije...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white shadow-xl rounded-xl">
            {user && !user.isAnonymous ? (
                <>
                    <div className="text-sm font-semibold text-gray-700 max-w-xs truncate md:max-w-md lg:max-w-lg">
                        Prijavljen/a kao: <span className="text-indigo-600">{userId}</span>
                    </div>
                    <Button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                        <LogOut className="h-5 w-5 mr-2" /> Odjava
                    </Button>
                </>
            ) : (
                <>
                    <p className="text-sm text-gray-500">Anonimni pristup.</p>
                    <Button onClick={() => setIsRegisterModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <UserPlus className="h-5 w-5 mr-2" /> Registracija
                    </Button>
                    <Button onClick={() => setIsLoginModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <LogIn className="h-5 w-5 mr-2" /> Prijava
                    </Button>
                </>
            )}

            <RegistrationModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} auth={auth} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} auth={auth} />
        </div>
    );
}
