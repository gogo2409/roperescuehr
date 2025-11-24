// lib/auth.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from './firebase';

// Funkcija za login
export const login = async (email: string, password: string) => {
  if (!firebaseAuth) throw new Error("Firebase Auth nije inicijaliziran.");
  return await signInWithEmailAndPassword(firebaseAuth, email, password);
};

// Funkcija za registraciju
export const register = async (email: string, password: string) => {
  if (!firebaseAuth) throw new Error("Firebase Auth nije inicijaliziran.");
  return await createUserWithEmailAndPassword(firebaseAuth, email, password);
};

// Opcionalno: funkcija za dohvat trenutno prijavljenog korisnika
export const getCurrentUser = () => {
  return firebaseAuth.currentUser;
};
