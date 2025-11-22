"use client"; // Ova direktiva je KLJUČNA. MORA biti prva linija koda u ovoj datoteci.

import React, { useState, useEffect } from 'react';
// --- FONT AWESOME IMPORTS ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faCircleCheck, faTriangleExclamation, faUserPlus, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

// --- FIREBASE IMPORTS ---
// ISPRAVLJENO: initializeApp i FirebaseApp dolaze iz 'firebase/app'
import { 
    initializeApp, 
    FirebaseApp 
} from 'firebase/app'; 
// Auth moduli dolaze iz 'firebase/auth'
import { 
    getAuth, 
    Auth, 
    createUserWithEmailAndPassword, 
    signInWithCustomToken, 
    signInAnonymously,
    updateProfile, 
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
// Firestore moduli dolaze iz 'firebase/firestore'
import { getFirestore, Firestore, setLogLevel } from 'firebase/firestore';

// Globalne varijable osigurane od Canvas okruženja
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Postavke za Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// --- GLOBALNA INICIJALIZACIJA (IZVAN KOMPONENTE) ---
if (firebaseConfig) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app); // Ovdje se definira Auth objekt
        db = getFirestore(app);
        setLogLevel('Debug'); // Uključeno debug logiranje za Firebase
        console.log("Firebase konfiguracija učitana. Pokušaj inicijalizacije Auth servisa...");
    } catch (e) {
        console.error("FATAL: Greška pri globalnoj inicijalizaciji Firebasea (getAuth/initializeApp). Auth servis nije dostupan. Greška:", e);
    }
}

/**
 * Komponenta za stranicu Registracije.
 */
const RegisterPage = () => {
    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    // authReady = true SAMO kada je Auth objekt dostupan I uspješno obavljena početna prijava
    const [authReady, setAuthReady] = useState<boolean>(false);
    
    /**
     * Klijentska validacija forme.
     */
    const validateForm = (): boolean => {
        if (!fullName || !email || !password || password.length < 6 || !email.includes('@') || !email.includes('.')) {
            let userMessage = 'Sva polja su obavezna. Lozinka mora imati najmanje 6 znakova, a email mora biti ispravnog formata.';
            if (password && password.length < 6) userMessage = 'Lozinka mora imati najmanje 6 znakova.';
            if (!email.includes('@')) userMessage = 'Molimo unesite ispravan format email adrese.';
            
            setError(userMessage);
            console.error("VALIDATION FAILED:", userMessage); 
            return false;
        }
        setError(null);
        return true;
    };

    /**
     * Glavna funkcija za registraciju novog korisnika.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError(null);
        
        // 1. STROGA PROVJERA: Je li Auth servis inicijaliziran i spreman za upotrebu
        if (!authReady || auth === undefined) { 
            const message = auth === undefined && firebaseConfig
                ? "Autentifikacija nije dostupna. (Greška pri inicijalizaciji. Provjerite konzolu!)"
                : "Sustav se još uvijek učitava, pričekajte.";
            setError(message);
            console.error("SUBMISSION BLOCKED: Auth nije spreman ili dostupan. Status AuthReady:", authReady);
            return;
        }
        
        // 2. Provjera validacije forme
        if (!validateForm()) {
            console.warn("Slanje obrasca blokirano zbog validacije.");
            return;
        }
        
        setLoading(true);
        
        try {
            console.log("Pokušaj registracije za:", email);
            
            // 3. Stvaranje korisnika s emailom i lozinkom
            // Budući da smo prošli provjeru 'auth === undefined', sigurni smo da 'auth' postoji
            const userCredential = await createUserWithEmailAndPassword(auth, email, password); 
            
            // 4. Dodavanje Imena/Display Name-a
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: fullName
                });
            }

            setSuccess(true);
            setError(null); 
            
            // Očisti formu nakon uspješne registracije
            setFullName('');
            setEmail('');
            setPassword('');

            console.log("Uspješna registracija! UID:", userCredential.user.uid, "Display Name:", fullName);
            
        } catch (err: any) {
            console.error("Firebase greška:", err.code, err.message);
            
            let userMessage = 'Došlo je do nepoznate greške pri registraciji.';
            if (err.code === 'auth/email-already-in-use') {
                userMessage = 'Ovaj email je već registriran. Pokušajte se prijaviti.';
            } else if (err.code === 'auth/weak-password') {
                userMessage = 'Lozinka je preslaba. Koristite barem 6 znakova.';
            } else if (err.code === 'auth/network-request-failed') {
                userMessage = 'Greška mreže. Provjerite svoju internetsku vezu.';
            }

            setError(userMessage);

        } finally {
            setLoading(false);
        }
    };
    
    // --- AUTENTIKACIJA I INICIJALIZACIJA (KLIJENTSKA) ---
    useEffect(() => {
        const initializeAuth = async () => {
            // Ako Auth objekt ne postoji (globalna inicijalizacija nije uspjela), prikaži grešku i izađi.
            if (auth === undefined) { 
                setAuthReady(false);
                if (firebaseConfig) {
                    setError("Autentifikacija neuspješno inicijalizirana (FATAL greška u konzoli).");
                } else {
                    setError("Upozorenje: Firebase konfiguracija nije dostupna. Registracija neće raditi.");
                }
                return;
            }

            try {
                // Postavljanje trajnosti sesije
                await setPersistence(auth, browserSessionPersistence);

                // Provjera i prijava (token/anonimno)
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("Uspješno potpisivanje s prilagođenim tokenom.");
                } else {
                    await signInAnonymously(auth);
                    console.log("Uspješna anonimna prijava (za inicijalizaciju).");
                }
                
                // Samo ako je cijeli proces uspješan, postavljamo AuthReady na true
                setAuthReady(true);
                setError(null); // Očisti poruke o grešci ako je Auth uspješan
            } catch (error) {
                console.error("Greška pri prijavi (token/anonimno):", error);
                setAuthReady(false); 
                setError("Greška pri početnoj provjeri autentifikacije. Provjerite svoju internetsku vezu.");
            }
        };

        initializeAuth();
    }, []);


    // --- RENDERING I UI ---

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-100px)] p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6 border-b pb-2">
                    Registracija Novog Korisnika
                </h1>
                
                {/* Status Učitavanja Auth-a */}
                {!authReady && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="status">
                        <FontAwesomeIcon icon={faHourglassHalf} className="animate-pulse w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="block sm:inline font-semibold">Učitavanje sustava za autentifikaciju... Molimo pričekajte.</span>
                    </div>
                )}

                {/* Poruke o statusu */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="block sm:inline font-semibold">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="block sm:inline font-semibold">
                            Uspješna registracija! Sada se možete prijaviti.
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Ime i Prezime */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Ime i Prezime</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Unesite vaše ime i prezime"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                            />
                        </div>
                    </div>

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
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Lozinka (min. 6 znakova)</label>
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

                    {/* Gumb za registraciju */}
                    <button
                        type="submit"
                        disabled={loading || !authReady}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white transition duration-200
                            ${loading || !authReady
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-[1.005]'
                            }`}
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <><FontAwesomeIcon icon={faUserPlus} className="w-5 h-5 mr-2" /> Registriraj se</>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Već imate račun?
                    {/* Link natrag na prijavu */}
                    <a href="/login" className="font-semibold text-green-600 hover:text-green-700 ml-1 transition">
                        Prijavite se
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;