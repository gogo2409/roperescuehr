// lib/firebase.ts - Firebase inicijalizacija i izvoz Firebase App i Auth instanci

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Dohvati Firebase konfiguraciju iz varijabli okoline
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Ako koristiš Analytics
};

let app: FirebaseApp;

// Provjeri je li Firebase aplikacija već inicijalizirana
if (!getApps().length) {
  // Ako nije, inicijaliziraj je s konfiguracijom
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully from environment variables.");
} else {
  // Ako je već inicijalizirana (npr. tijekom hot module replacementa ili SSR-a), dohvati postojeću instancu
  app = getApp();
  console.log("Firebase app already initialized, fetched existing instance.");
}

export const firebaseApp = app;
export const firebaseAuth = getAuth(app);

// Uklonio sam `firebaseAppId` i `firebaseInitialAuthToken` jer se ne koriste za standardnu inicijalizaciju klijentskog SDK-a.
// Ako su ti potrebni za specifične svrhe (npr. SSR s tokenom), to se obično rješava u getServerSideProps ili sličnim Next.js metodama.
