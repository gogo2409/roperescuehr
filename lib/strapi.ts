/**
 * LOKACIJA: lib/strapi.ts
 * STATUS: FIXED (Povezan s medals.ts + automatska dodjela medalja)
 */

import { db } from './firebase';
import { 
  doc, 
  updateDoc, 
  setDoc,
  getDoc,
  arrayUnion
} from 'firebase/firestore';
import { calculateNewMedals } from './medals';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
const SESIJA_ENDPOINT = `${STRAPI_URL}/api/kviz-sesijas`;

// --- INTERFACE ---
export interface StrapiReklama {
  id: number;
  documentId: string;
  Naslov: string;
  Link: string;
  URL?: string;
  Gdje_Prikazati: string;
  Tip_Prikaza?: 'Puna_Sirina' | 'Standard';
  Redoslijed?: number;
  Slika?: { url: string; alternativeText?: string; };
}

// --- POMOĆNE FUNKCIJE ---
export async function getStrapiUserId(firebaseUID: string) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/users?filters[firebaseUID][$eq]=${firebaseUID}`, {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }
    });
    const users = await res.json();
    return users.length > 0 ? users[0].id : null;
  } catch (error) {
    console.error("Greška kod dohvata Strapi User ID-a:", error);
    return null;
  }
}

export async function fetchModuli() {
  const res = await fetch(`${STRAPI_URL}/api/moduls?sort=Broj_Modula:asc`, { cache: 'no-store' });
  return res.json();
}

export async function fetchLekcije(modulBroj: number) {
  const url = `${STRAPI_URL}/api/lekcijas?filters[modul][Broj_Modula][$eq]=${modulBroj}&populate[0]=Glavna_Slika&populate[1]=koraks&populate[2]=koraks.Slika&populate[3]=modul&populate[4]=kategorija&populate[5]=kategorija.Ikona&sort[0]=Redni_Broj:asc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchPitanjaByKategorija(kategorijaId: number) {
  try {
    const queryParams = new URLSearchParams({
      "filters[lekcija][kategorija][id][$eq]": kategorijaId.toString(),
      "populate[lekcija][populate][kategorija][fields][0]": "Naziv",
      "populate[Slika_pitanja][fields][0]": "url",
      "pagination[pageSize]": "100"
    }).toString();
    const url = `${STRAPI_URL}/api/pitanjes?${queryParams}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("fetchPitanjaByKategorija error:", error);
    return [];
  }
}

// --- SINKRONIZACIJA KORISNIKA ---
export async function syncUserWithStrapi(
  firebaseUser: any, 
  firstName: string = "", 
  lastName: string = "", 
  unit: string = "",
  phone: string = ""
) {
  if (!firebaseUser || !firebaseUser.email) return;

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  const cleanPhone = String(phone).replace(/\s/g, ''); 
  const initials = ((cleanFirstName[0] || "") + (cleanLastName[0] || "")).toUpperCase() || "XX";

  try {
    const checkRes = await fetch(`${STRAPI_URL}/api/users?filters[firebaseUID][$eq]=${firebaseUser.uid}&populate=*`, {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }
    });
    const users = await checkRes.json();

    let strapiUserData = null;

    if (users && users.length > 0) {
      const strapiUserId = users[0].id;
      const updateRes = await fetch(`${STRAPI_URL}/api/users/${strapiUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_TOKEN}` },
        body: JSON.stringify({
          firstName: cleanFirstName || users[0].firstName,
          lastName: cleanLastName || users[0].lastName,
          unit: unit.trim() || users[0].unit,
          inicijali: initials !== "XX" ? initials : users[0].inicijali,
          ime_prezime: cleanFirstName ? `${cleanFirstName} ${cleanLastName}` : users[0].ime_prezime,
          phone: cleanPhone || users[0].phone,
          Telefon: cleanPhone || users[0].Telefon
        }),
      });
      strapiUserData = await updateRes.json();
    } else {
      const createRes = await fetch(`${STRAPI_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_TOKEN}` },
        body: JSON.stringify({
          username: firebaseUser.email.toLowerCase(),
          email: firebaseUser.email.toLowerCase(),
          firebaseUID: firebaseUser.uid,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          phone: cleanPhone,
          Telefon: cleanPhone,
          unit: unit.trim(),
          inicijali: initials,
          confirmed: true,
          role: 1,
          password: "User_" + firebaseUser.uid.substring(0, 10)
        }),
      });
      strapiUserData = await createRes.json();
    }

    if (strapiUserData) {
      const rawMedals: string[] = strapiUserData.medalje || [];
      const fixedMedals = rawMedals.map(m => m === 'team-leader' ? 'teamleader' : m);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, {
        medalje: fixedMedals,
        strapiId: strapiUserData.id
      }).catch(async () => {
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          medalje: fixedMedals,
          strapiId: strapiUserData.id
        }, { merge: true });
      });
    }
  } catch (e) {
    console.error("❌ Kritična greška sync:", e);
  }
}

// --- ISPITI (SADA S MEDALJAMA) ---
export async function spremiIspitSustav(user: any, podaci: any) {
  const timestamp = new Date().toISOString();
  const isMikro = String(podaci.modulId).startsWith('mikro-');
  
  try {
    // 1. DOHVATI TRENUTNE MEDALJE I POVIJEST IZ FIREBASEA
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || { medalje: [], history: [] };
    
    // 2. IZRAČUNAJ NOVE MEDALJE
    const noveMedalje = calculateNewMedals(userData.medalje || [], {
      postotak: podaci.postotak,
      trajanjeSekunde: podaci.vrijemeTrajanja,
      modulId: podaci.modulId,
      ukupnoPitanja: podaci.ukupnoPitanja || 10,
      history: userData.history || [],
      nazivKategorije: podaci.nazivKategorije // BITNO ZA ČVOROVE
    });

    // 3. POŠALJI U STRAPI (Povijest sesija)
    const strapiPayload = {
      data: {
        Ime_Prezime: String(user.displayName || user.email.split('@')[0]),
        Email: user.email,
        Datum_Pocetka: timestamp,
        ukupnoBodova: Math.round(Number(podaci.ukupnoBodova)),
        Status_Ispita: "zavrseno",
        Tip_Ispita: isMikro ? "Mikro" : "Zavrsni",
        modul_id: String(podaci.modulId)
      }
    };
    await fetch(SESIJA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_TOKEN}` },
      body: JSON.stringify(strapiPayload),
    });

    // 4. SPREMI NOVE MEDALJE U FIREBASE (ako ih ima)
    if (noveMedalje.length > 0) {
      await updateDoc(userRef, {
        medalje: arrayUnion(...noveMedalje)
      });
    }

    // 5. DODAJ ISPIT U HISTORY
    await updateDoc(userRef, {
      history: arrayUnion({
        modulId: podaci.modulId,
        postotak: podaci.postotak,
        datum: timestamp
      })
    });

    return noveMedalje; // Vraćamo nove medalje frontendu
  } catch (e) { 
    console.error("Greška u spremiIspitSustav:", e);
    return []; 
  }
}

export async function fetchProizvodi() {
  const url = `${STRAPI_URL}/api/proizvods?populate[0]=Glavna_Slika&populate[1]=Slike&sort=createdAt:desc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchPitanjaByModul(modulBroj: number) {
  const url = `${STRAPI_URL}/api/pitanjes?filters[modul][Broj_Modula][$eq]=${modulBroj}&populate=*`;
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export async function fetchReklame(gdje: string = 'Footer', target?: string) {
  try {
    let url = `${STRAPI_URL}/api/reklamas?filters[Gdje_Prikazati][$eq]=${gdje}&populate=*&sort=Redoslijed:asc`;
    if (target) url += `&filters[Target_Stranice][$in]=Sve,Samo_${target}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

const strapiService = {
  fetchModuli,
  fetchLekcije,
  fetchProizvodi,
  fetchPitanjaByModul,
  fetchPitanjaByKategorija,
  fetchReklame,
  syncUserWithStrapi,
  getStrapiUserId,
  spremiIspitSustav
};

export default strapiService;