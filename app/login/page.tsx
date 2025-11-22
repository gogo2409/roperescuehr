"use client"; // KLJUČNO: Označava ovu datoteku kao klijentsku komponentu

import React, { useState, useEffect } from 'react';
// --- FONT AWESOME IMPORTS ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faRightToBracket, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

// --- FIREBASE IMPORTS ---
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    Auth, 
    signInWithEmailAndPassword, // Ključna funkcija za prijavu
    signInWithCustomToken, 
    signInAnonymously,
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { getFirestore, Firestore, setLogLevel } from 'firebase/firestore';

// Globalne varijable osigurane od Canvas okruženja
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Postavke za Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (firebaseConfig) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        setLogLevel('Debug');
    } catch (e) {
        console.error("Greška pri inicijalizaciji Firebasea:", e);
    }
}

/**
 * Komponenta za stranicu Prijave.
 */
const LoginPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [authReady, setAuthReady] = useState<boolean>(false);
    
    // Validacija forme na klijentskoj strani
    const validateForm = (): boolean => {
        if (!email || !password) {
            setError('Oba polja (email i lozinka) su obavezna.');
            return false;
        }
        setError(null);
        return true;
    };

    /**
     * Glavna funkcija za prijavu.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError(null);
        
        if (!authReady || loading || !auth) return;

        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            // 1. Prijava korisnika putem Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            setSuccess(true);
            setError(null); // Čišćenje potencijalne greške
            
            // Očisti formu nakon uspješne prijave
            setEmail('');
            setPassword('');

            console.log("Uspješna prijava! UID:", userCredential.user.uid);
            
        } catch (err: any) {
            console.error("Firebase greška:", err.code, err.message);
            
            let userMessage = 'Došlo je do nepoznate greške pri prijavi.';
            if (err.code === 'auth/invalid-email' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                userMessage = 'Neispravan email ili lozinka.';
            } else if (err.code === 'auth/too-many-requests') {
                 userMessage = 'Previše neuspjelih pokušaja. Pokušajte ponovno kasnije.';
            }

            setError(userMessage);

        } finally {
            setLoading(false);
        }
    };
    
    // --- AUTENTIKACIJA I INICIJALIZACIJA (Isto kao na Register stranici) ---
    useEffect(() => {
        const initializeAuth = async () => {
            if (!auth) {
                setAuthReady(false);
                setError("Firebase nije inicijaliziran.");
                return;
            }

            try {
                await setPersistence(auth, browserSessionPersistence);

                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
                setAuthReady(true);
            } catch (error) {
                console.error("Greška pri inicijalizaciji auth-a:", error);
                setError("Greška pri provjeri autentifikacije.");
                setAuthReady(true); 
            }
        };

        if (firebaseConfig) {
            initializeAuth();
        } else {
            setAuthReady(true); 
        }
    }, []);


    // --- RENDERING I UI ---

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-100px)] p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6 border-b pb-2">
                    Prijava
                </h1>
                
                {/* Poruke o statusu */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="block sm:inline font-semibold">Uspješno ste prijavljeni!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Adresa</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vasa.adresa@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Lozinka */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Unesite lozinku"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Gumb za prijavu */}
                    <button
                        type="submit"
                        disabled={loading || !authReady}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white transition duration-200
                            ${loading || !authReady
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:scale-[1.005]'
                            }`}
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <><FontAwesomeIcon icon={faRightToBracket} className="w-5 h-5 mr-2" /> Prijavi se</>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Nemate račun?
                    {/* Link natrag na registraciju */}
                    <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700 ml-1 transition">
                        Registrirajte se
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;