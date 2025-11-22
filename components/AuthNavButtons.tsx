// OBAVEZNO ZA KORISNIKE NEXT.JS-a: Ova direktiva omogućuje korištenje React Hooksa.
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    initializeApp, 
    FirebaseApp 
} from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut, 
    User,
    Auth,
    createUserWithEmailAndPassword, // Dodano za registraciju
    signInWithEmailAndPassword // Dodano za prijavu
} from 'firebase/auth';
import { LogOut, LogIn, UserPlus, Loader2, X, AlertTriangle, CheckCircle } from 'lucide-react'; 

// --- Global Variables (Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;

// --- Helper Functions ---

// Funkcija za provjeru je li Firebase konfiguracija dostupna
const isFirebaseConfigAvailable = Object.keys(firebaseConfig).length > 0;

// Funkcija za mapiranje Firebase kodova grešaka na poruke na hrvatskom jeziku
const mapFirebaseError = (code) => {
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

// --- Custom Components ---

// Button Component
const Button = ({ children, onClick, className = "", type = "button", disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2 font-medium text-white transition-all duration-200 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-opacity-50 
            ${disabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : `${className} hover:shadow-lg hover:brightness-110 focus:ring-indigo-500`
            }`}
    >
        {children}
    </button>
);

// Form Modal Base
const FormModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative transform transition-all duration-300 scale-100">
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                    aria-label="Zatvori"
                >
                    <X className="h-6 w-6" />
                </button>

                <h3 className="text-2xl font-bold text-indigo-600 mb-6 border-b pb-2">
                    {title}
                </h3>
                
                {children}

                <p className="mt-4 text-xs text-gray-500 text-center">
                    Napomena: Ovisno o postavkama vašeg Firebase projekta, prijava može zahtijevati provjeru emaila.
                </p>
            </div>
        </div>
    );
};

// --- Registration Modal Component (RegistrationModal) ---
const RegistrationModal = ({ isOpen, onClose, auth, isConfigAvailable }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text: string }
    const [isLoading, setIsLoading] = useState(false);

    // Resetiraj stanje modala kada se otvori/zatvori
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setMessage(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setMessage({ type: 'success', text: 'Uspješna registracija! Sada ste prijavljeni.' });
            setTimeout(onClose, 2000); // Zatvori nakon uspjeha
        } catch (error) {
            console.error("Greška prilikom registracije:", error);
            setMessage({ 
                type: 'error', 
                text: mapFirebaseError(error.code) 
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Ako nema konfiguracije, prikaži upozorenje
    if (!isConfigAvailable) {
        return (
            <FormModal isOpen={isOpen} onClose={onClose} title="Registracija">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                    <p className="font-bold flex items-center"><AlertTriangle className="h-5 w-5 mr-2" /> Upozorenje!</p>
                    <p>Firebase konfiguracija nije dostupna. Registracija nije moguća.</p>
                </div>
            </FormModal>
        );
    }


    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Registracija">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="korisnik@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Lozinka (min. 6 znakova)
                    </label>
                    <input
                        id="reg-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Najmanje 6 znakova"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div className="pt-2">
                    <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <UserPlus className="h-5 w-5 mr-2" />} 
                        {isLoading ? 'Registriram...' : 'Registriraj se'}
                    </Button>
                </div>
            </form>
            {message && (
                <div 
                    className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}
        </FormModal>
    );
};

// --- Login Modal Component (LoginModal) ---
const LoginModal = ({ isOpen, onClose, auth, isConfigAvailable }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Resetiraj stanje modala kada se otvori/zatvori
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setMessage(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setMessage({ type: 'success', text: 'Uspješna prijava! Dobrodošli.' });
            setTimeout(onClose, 2000); // Zatvori nakon uspjeha
        } catch (error) {
            console.error("Greška prilikom prijave:", error);
            setMessage({ 
                type: 'error', 
                text: mapFirebaseError(error.code) 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Ako nema konfiguracije, prikaži upozorenje
    if (!isConfigAvailable) {
        return (
            <FormModal isOpen={isOpen} onClose={onClose} title="Prijava">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                    <p className="font-bold flex items-center"><AlertTriangle className="h-5 w-5 mr-2" /> Upozorenje!</p>
                    <p>Firebase konfiguracija nije dostupna. Prijava nije moguća.</p>
                </div>
            </FormModal>
        );
    }
    
    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Prijava">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="log-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        id="log-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="korisnik@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="log-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Lozinka
                    </label>
                    <input
                        id="log-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Lozinka"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div className="pt-2">
                    <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <LogIn className="h-5 w-5 mr-2" />} 
                        {isLoading ? 'Prijavljujem se...' : 'Prijava'}
                    </Button>
                </div>
            </form>
            {message && (
                <div 
                    className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}
        </FormModal>
    );
};

// --- Auth Navigation Buttons Component ---
const AuthNavButtons = ({ auth, user, isAuthReady, userId, openRegisterModal, openLoginModal }) => {
    
    // Custom function to handle confirmations without window.confirm/alert
    const handleConfirm = (message, onConfirm) => {
        // U pravom web-appu, ovo bi bio prilagođeni modal. Ovdje koristimo log (console.log) i upozorenje.
        console.log(`Potrebna potvrda: ${message}`);
        // Koristimo window.confirm() samo za Canvas okruženje
        if (window.confirm(message)) { 
            onConfirm();
        }
    };

    const handleSignOut = useCallback(() => {
        if (!auth) {
            console.log("Auth nije inicijaliziran.");
            return;
        }
        handleConfirm("Jeste li sigurni da se želite odjaviti?", async () => {
            try {
                await signOut(auth);
                console.log("Korisnik odjavljen.");
            } catch (error) {
                console.error("Greška prilikom odjave:", error);
            }
        });
    }, [auth]);
    
    // Provjera stanja za renderiranje
    if (!isAuthReady) {
        return (
            <div className="flex items-center space-x-4 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-600">Provjera autentifikacije...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white shadow-xl rounded-xl">
            {user && user.isAnonymous === false ? (
                // Prijavljeni korisnik (koji nije anoniman)
                <>
                    <div className="text-sm font-semibold text-gray-700 max-w-xs truncate md:max-w-md lg:max-w-lg">
                        Prijavljen/a kao: <span className="text-indigo-600">{userId}</span>
                    </div>
                    <Button 
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    >
                        <LogOut className="h-5 w-5 mr-2" /> Odjava
                    </Button>
                </>
            ) : (
                // Odjavljen/anonimni korisnik
                <>
                    <p className="text-sm text-gray-500">Anonimni pristup.</p>
                    <Button 
                        onClick={openRegisterModal} 
                        disabled={!isFirebaseConfigAvailable}
                        className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    >
                        <UserPlus className="h-5 w-5 mr-2" /> Registracija
                    </Button>
                    <Button 
                        onClick={openLoginModal}
                        disabled={!isFirebaseConfigAvailable}
                        className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    >
                        <LogIn className="h-5 w-5 mr-2" /> Prijava
                    </Button>
                </>
            )}
        </div>
    );
};

// --- Main Application Component (App) ---
export default function App() {
    // State for Firebase instances and status
    const [auth, setAuth] = useState<Auth | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>("");
    
    // State for Modals
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 

    // Logika inicijalizacije
    useEffect(() => {
        if (!isFirebaseConfigAvailable) {
            console.warn("Firebase konfiguracija nije dostupna. Preskačemo inicijalizaciju Firebasea.");
            setUserId(crypto.randomUUID()); 
            setIsAuthReady(true);
            return; 
        }

        // 1. Inicijalizacija Firebase App-a i Auth-a
        const app: FirebaseApp = initializeApp(firebaseConfig);
        const authInstance: Auth = getAuth(app);
        setAuth(authInstance);

        // 2. Postavljanje Slušatelja za Promjenu Autentifikacijskog Stanja (Sinkroni dio - vraća funkciju za odjavu)
        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            // Postavljamo isAuthReady na true tek nakon prvog provjere stanja
            setIsAuthReady(true); 
            // Postavljamo userId: koristi UID ako je dostupan, inače anonimni ID
            setUserId(currentUser?.uid || crypto.randomUUID()); 
            
            console.log("Auth Stanje Promijenjeno. UID:", currentUser ? (currentUser.uid.substring(0, 8) + '...') : "Anoniman/Odjavljen");
        });

        // 3. Asinkroni dio: Prijava (koristeći Custom Token ili Anonimno)
        const performSignIn = async () => {
             try {
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    // Ako nema tokena, anonimna prijava (ako nije već prijavljen listenerom)
                    if (!authInstance.currentUser) {
                         await signInAnonymously(authInstance);
                    }
                }
            } catch (err) {
                // Ako prijava ne uspije (npr. token je istekao), UI mora i dalje biti otključan.
                console.error("Greška pri prijavi (Anonimno/Custom Token):", err);
                setIsAuthReady(true); 
            }
        };
        
        performSignIn();

        // 4. Vraćamo sinkronu funkciju za čišćenje (unsubscribe listener)
        return () => {
            console.log("Čišćenje Firebase auth listenera...");
            unsubscribe();
        };

    }, []); // Prazan array znači da se izvršava samo jednom

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-3xl">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Demo Autentifikacije (Firebase)
                    </h1>
                    <p className="text-gray-500">
                        {appId}
                    </p>
                </header>
                
                <AuthNavButtons 
                    auth={auth} 
                    user={user} 
                    isAuthReady={isAuthReady}
                    userId={userId} 
                    openRegisterModal={() => setIsRegisterModalOpen(true)} 
                    openLoginModal={() => setIsLoginModalOpen(true)}
                />

                <section className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Stanje Aplikacije</h2>
                    <div className="space-y-3 text-sm">
                        <p>
                            <span className="font-medium text-gray-600">Auth Status:</span> 
                            <span className={`ml-2 px-3 py-1 rounded-full text-white font-semibold ${user && !user.isAnonymous ? 'bg-green-500' : 'bg-red-500'}`}>
                                {user && !user.isAnonymous ? 'Prijavljen/a (Email/Lozinka)' : 'Odjavljen/a ili Anonimni/a'}
                            </span>
                        </p>
                        <p className="break-all">
                            <span className="font-medium text-gray-600">Trenutni UID:</span> 
                            <span className="ml-2 text-indigo-600 font-mono text-xs md:text-sm">{userId || 'Nema konfiguracije/Nema korisnika'}</span>
                        </p>
                        <p>
                            <span className="font-medium text-gray-600">Inicijalizacija gotova:</span> 
                            <span className={`ml-2 ${isAuthReady ? 'text-green-500' : 'text-red-500'}`}>{isAuthReady ? 'DA' : 'NE'}</span>
                        </p>
                        <p>
                            <span className="font-medium text-gray-600">Konfiguracija dostupna:</span> 
                            <span className={`ml-2 ${isFirebaseConfigAvailable ? 'text-green-500' : 'text-red-500'}`}>{isFirebaseConfigAvailable ? 'DA' : 'NE'}</span>
                        </p>
                    </div>
                </section>
                
                {/* Modali */}
                <RegistrationModal 
                    isOpen={isRegisterModalOpen} 
                    onClose={() => setIsRegisterModalOpen(false)} 
                    auth={auth}
                    isConfigAvailable={isFirebaseConfigAvailable}
                />
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    auth={auth}
                    isConfigAvailable={isFirebaseConfigAvailable}
                />
            </div>
        </div>
    );
}