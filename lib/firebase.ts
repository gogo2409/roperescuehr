// lib/firebase.ts - Firebase inicijalizacija i izvoz Firebase App i Auth instanci

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth'; // Dodao Auth tip za type safety

// Globalne varijable koje Next.js Build traži
// Oprez: Vrijednosti iz 'default-app-id' će biti korištene ako __app_id nije definirano
// Za produkciju, ove varijable moraju doći iz sigurnog izvora (npr. .env, GitHub Secrets)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const firebaseConfig = firebaseConfigStr ? JSON.parse(firebaseConfigStr) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

// Inicijaliziraj Firebase App samo ako config postoji i ako aplikacija već nije inicijalizirana
if (firebaseConfig && !getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        console.log("Firebase app initialized successfully from config.");
        authInstance = getAuth(app); // Inicijaliziraj Auth instancu ovdje
        console.log("Firebase Auth initialized.");
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // Ako je došlo do greške pri inicijalizaciji, aplikacija i authInstance ostaju null
    }
} else if (getApps().length) {
    // Ako je app već inicijaliziran (npr. na serveru), dohvati postojeću instancu
    app = getApp();
    authInstance = getAuth(app); // Dohvati Auth instancu iz postojeće aplikacije
    console.log("Firebase app and Auth already initialized.");
} else {
    console.warn("Firebase configuration not found. Firebase features may not work as expected.");
}

export const firebaseApp = app;
export const firebaseAuth = authInstance; // <-- Sada izvozimo Auth instancu!
export const firebaseInitialAuthToken = initialAuthToken;
export const firebaseAppId = appId;
