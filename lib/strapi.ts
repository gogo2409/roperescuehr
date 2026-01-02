/**
 * LOKACIJA: lib/strapi.ts
 * STATUS: STRAPI 5 UPDATE (Fixing URL/Link Property Error)
 */

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc, 
  arrayUnion,
  setDoc
} from 'firebase/firestore';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
const SESIJA_ENDPOINT = `${STRAPI_URL}/api/kviz-sesijas`;

// --- STRAPI 5 INTERFACE ---

export interface StrapiReklama {
  id: number;
  documentId: string;
  Naslov: string;
  Link: string;      // Često se koristi u Strapi 5
  URL?: string;       // DODANO: Da bi build prošao jer komponenta traži .URL
  Gdje_Prikazati: string;
  Tip_Prikaza?: 'Puna_Sirina' | 'Standard';
  Redoslijed?: number;
  Slika?: {
    url: string;
    alternativeText?: string;
  };
}

// --- NOVO: FUNKCIJE ZA NARUDŽBE ---

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

export async function fetchUserOrders(firebaseUID: string) {
  if (!firebaseUID) return [];
  const queryParams = new URLSearchParams({
    "filters[users_permissions_user][firebaseUID][$eq]": firebaseUID,
    "populate": "*", 
    "sort": "createdAt:desc"
  }).toString();

  const url = `${STRAPI_URL}/api/orders?${queryParams}`;

  try {
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("❌ Greška kod dohvata narudžbi:", error);
    return [];
  }
}

// --- DOHVAT SADRŽAJA ---

export async function fetchModuli() {
  const res = await fetch(`${STRAPI_URL}/api/moduls?sort=Broj_Modula:asc`, { cache: 'no-store' });
  return res.json();
}

export async function fetchLekcije(modulBroj: number) {
  const url = `${STRAPI_URL}/api/lekcijas?filters[modul][Broj_Modula][$eq]=${modulBroj}&populate=Glavna_Slika,koraks.Slika,modul,kategorija.Ikona&sort=Redni_Broj:asc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchProizvodi() {
  const url = `${STRAPI_URL}/api/proizvods?populate=Glavna_Slika,Slike&sort=createdAt:desc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchProizvodById(id: string) {
  const url = `${STRAPI_URL}/api/proizvods/${id}?populate=Glavna_Slika,Slike`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

// --- PITANJA I ISPITI ---

export async function fetchPitanjaByModul(modulBroj: number) {
  const url = `${STRAPI_URL}/api/pitanjes?filters[modul][Broj_Modula][$eq]=${modulBroj}&populate=*`;
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export async function fetchPitanjaByKategorija(kategorijaId: number) {
  try {
    const queryParams = new URLSearchParams({
      "filters[lekcija][kategorija][id][$eq]": kategorijaId.toString(),
      "populate": "lekcija.kategorija,Slika_pitanja",
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

// --- KORISNICI ---

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
    const checkRes = await fetch(`${STRAPI_URL}/api/users?filters[firebaseUID][$eq]=${firebaseUser.uid}`, {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }
    });
    const users = await checkRes.json();

    if (users && users.length > 0) {
      const strapiUserId = users[0].id;
      const updatePayload = {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        unit: unit.trim(),
        inicijali: initials,
        ime_prezime: `${cleanFirstName} ${cleanLastName}`,
        phone: cleanPhone,
        Telefon: cleanPhone
      };
      await fetch(`${STRAPI_URL}/api/users/${strapiUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_TOKEN}` },
        body: JSON.stringify(updatePayload),
      });
    } else {
      await fetch(`${STRAPI_URL}/api/users`, {
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
    }
  } catch (e) {
    console.error("❌ Kritična greška sync:", e);
  }
}

// --- REKLAME I ISPITI ---

export async function fetchReklame(gdje: string = 'Footer', target?: string): Promise<StrapiReklama[]> {
  try {
    let url = `${STRAPI_URL}/api/reklamas?filters[Gdje_Prikazati][$eq]=${gdje}&populate=*&sort=Redoslijed:asc`;
    if (target) url += `&filters[Target_Stranice][$in]=Sve,Samo_${target}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();
    return json.data || [];
  } catch { 
    return []; 
  }
}

export async function spremiIspitSustav(user: any, podaci: any) {
  const timestamp = new Date().toISOString();
  const isMikro = String(podaci.modulId).startsWith('mikro-');
  try {
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
    return [];
  } catch (e) { 
    return []; 
  }
}

// EKSPORT
const strapiService = {
  fetchModuli,
  fetchLekcije,
  fetchProizvodi,
  fetchProizvodById,
  fetchPitanjaByModul,
  fetchPitanjaByKategorija,
  fetchReklame,
  syncUserWithStrapi,
  getStrapiUserId,
  fetchUserOrders,
  spremiIspitSustav
};

export default strapiService;