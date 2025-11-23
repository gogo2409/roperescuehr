// lib/auth.ts - Implementacija za Firebase Auth Login/Registraciju

// Uvezi potrebne funkcije iz Firebase Auth SDK
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth } from 'firebase/auth';
// Uvezi inicijaliziranu Auth instancu iz našeg Firebase konfiguracijskog modula
import { firebaseAuth } from './firebase'; // <-- važno, mora se uvesti

// Funkcija za prijavu korisnika
export const login = async (email: string, password: string) => {
    if (!firebaseAuth) {
        // Ako Firebase Auth instanca nije dostupna, prijavi grešku
        throw new Error("Firebase Authentication service is not initialized.");
    }
    // Koristi Firebase funkciju za prijavu s emailom i lozinkom
    await signInWithEmailAndPassword(firebaseAuth, email, password);
};

// Funkcija za registraciju novog korisnika
export const register = async (email: string, password: string) => {
    if (!firebaseAuth) {
        // Ako Firebase Auth instanca nije dostupna, prijavi grešku
        throw new Error("Firebase Authentication service is not initialized.");
    }
    // Koristi Firebase funkciju za registraciju s emailom i lozinkom
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
};

// Opcionalno: Ako ti treba, možeš dodati i druge funkcije ovdje
// Npr. za dohvaćanje trenutno prijavljenog korisnika
// export const getCurrentUser = () => {
//     if (!firebaseAuth) return null;
//     return firebaseAuth.currentUser;
// };

// Možda ti ovo više ne treba, ali ostavljam komentirano za referencu
// export const authService = {};
