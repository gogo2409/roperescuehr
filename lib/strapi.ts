/**
 * LOKACIJA: lib/strapi.ts
 * STATUS: FULL UPDATE (Shop + Lekcije + Orders + User Sync)
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

// --- NOVO: FUNKCIJE ZA NARUDŽBE ---

/**
 * Dohvaća Strapi interni ID korisnika na temelju Firebase UID-a.
 * Potrebno za relaciju kod kreiranja narudžbe.
 */
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

/**
 * Dohvaća sve narudžbe povezane s prijavljenim korisnikom.
 * Koristi točan naziv relacije: users_permissions_user
 */
export async function fetchUserOrders(firebaseUID: string) {
  if (!firebaseUID) return [];

  const queryParams = new URLSearchParams({
    "filters[users_permissions_user][firebaseUID][$eq]": firebaseUID,
    "populate": "*", // Povlači i JSON polje Proizvodi
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

// --- DOHVAT SADRŽAJA (SHOP & LEKCIJE) ---

export async function fetchModuli() {
  const res = await fetch(`${STRAPI_URL}/api/moduls?sort=Broj_Modula:asc`, { cache: 'no-store' });
  return res.json();
}

export async function fetchLekcije(modulBroj: number) {
  const url = `${STRAPI_URL}/api/lekcijas?filters[modul][Broj_Modula][$eq]=${modulBroj}&populate[0]=Glavna_Slika&populate[1]=koraks&populate[2]=koraks.Slika&populate[3]=modul&populate[4]=kategorija&populate[5]=kategorija.Ikona&sort[0]=Redni_Broj:asc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchProizvodi() {
  const url = `${STRAPI_URL}/api/proizvods?populate[0]=Glavna_Slika&populate[1]=Slike&sort=createdAt:desc`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchProizvodById(id: string) {
  const url = `${STRAPI_URL}/api/proizvods/${id}?populate[0]=Glavna_Slika&populate[1]=Slike`;
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

// --- REKLAME I ISPITI (Skraćeno radi preglednosti) ---

export async function fetchReklame(gdje: string = 'Footer', target?: string) {
  try {
    let url = `${STRAPI_URL}/api/reklamas?filters[Gdje_Prikazati][$eq]=${gdje}&populate=*&sort=Redoslijed:asc`;
    if (target) url += `&filters[Target_Stranice][$in]=Sve,Samo_${target}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
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
  } catch (e) { return []; }
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
  getStrapiUserId,    // NOVO
  fetchUserOrders,    // NOVO
  spremiIspitSustav
};

export default strapiService;