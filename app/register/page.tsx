"use client";

import React, { useState, useEffect } from "react";
import { 
  firebaseAuth 
} from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  updateProfile, // KLJUČNO: Za spremanje Imena i Prezime
  User 
} from "firebase/auth";
import { UserPlus, LogIn, LogOut, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// Funkcija za mapiranje Firebase grešaka na hrvatski jezik (Ostavljamo je radi čišćih poruka)
const mapFirebaseError = (code: string) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email je već registriran.';
    case 'auth/invalid-email': return 'Email nije ispravan.';
    case 'auth/weak-password': return 'Lozinka mora imati najmanje 6 znakova.';
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'Nevažeća email adresa ili lozinka.';
    case 'auth/operation-not-allowed': return 'Prijava s emailom/lozinkom nije omogućena.';
    default: return 'Neočekivana pogreška. Pokušajte ponovno.';
  }
};

// ... (ModalMessage ostaje isti)

const RegisterPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState(""); // NOVO STANJE
  const [lastName, setLastName] = useState("");  // NOVO STANJE
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // ... (useEffect ostaje isti)

  const handleAuth = async () => {
    // KLJUČNA PROVJERA: Ako je registracija, provjeri i Ime/Prezime
    if (!email || !password || (isRegistering && (!firstName || !lastName))) {
      setMessage({ type: 'error', text: 'Molimo popunite sva obavezna polja.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (isRegistering) {
        // 1. REGISTRACIJA
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        
        // 2. SPREMANJE IMENA I PREZIMENA U KORISNIČKI PROFIL (displayName)
        await updateProfile(userCredential.user, {
            displayName: `${firstName} ${lastName}`,
        });

        setMessage({ type: 'success', text: 'Registracija uspješna! Prijavljeni ste.' });

      } else {
        // PRIJAVA
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        setMessage({ type: 'success', text: 'Prijava uspješna! Dobrodošli.' });
      }
      
      // Očisti polja
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");

    } catch (e: any) {
      setMessage({ type: 'error', text: mapFirebaseError(e.code) });
    } finally {
      setIsLoading(false);
    }
  };

  // ... (handleSignOut i handleSwitchMode ostaju isti)
  const handleSwitchMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setMessage(null);
  };
  // ... (Definicije stilova gumba ostaju iste)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Ovdje bi se modal trebao prikazati, ali ga skraćujem radi preglednosti */}
      {message && <div /* ... ModalMessage implementacija ... */ ></div>} 

      {!user ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <h2 className="text-3xl font-extrabold text-indigo-700 mb-8 text-center border-b pb-2">
            {isRegistering ? "Kreiranje Računa" : "Prijava Korisnika"}
          </h2>

          <div className="space-y-4">
            
            {/* KLJUČNA PROMJENA: Koristimo 'hidden' klasu za skrivanje umjesto potpunog uvjetnog renderiranja */}
            {/* Ako je isRegistering false (prijava), blok se skriva s 'hidden' klasom */}
            <div className={`flex gap-4 ${!isRegistering ? 'hidden' : ''}`}>
              <input
                type="text"
                placeholder="Ime"
                // REQUIRED atribut je postavljen samo kada je u modu Registracije
                required={isRegistering} 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              />
              <input
                type="text"
                placeholder="Prezime"
                required={isRegistering}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              />
            </div>
            {/* KRAJ Ime/Prezime bloka */}

            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
            <input
              type="password"
              placeholder="Lozinka"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>

          {/* ... Ostatak forme (gumb i prebacivanje) ostaje isti ... */}
          <button
            // ... (handleAuth)
          >
            {/* ... */}
          </button>
          <p className="text-center text-sm text-gray-500 mt-6">
            {isRegistering ? "Već imaš račun?" : "Nemaš račun?"}{" "}
            <span
              className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-semibold transition duration-150"
              onClick={handleSwitchMode}
            >
              {isRegistering ? "Prijavi se ovdje" : "Registriraj se ovdje"}
            </span>
          </p>
        </div>
      ) : (
        // ... (Prikaz prijavljenog korisnika ostaje isti)
        <div>
           {/* Prikazuje Ime/Prezime ako je spremljeno, inače email */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Dobrodošli, {user.displayName || user.email}
          </h2>
           {/* ... Odjava gumb ... */}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;