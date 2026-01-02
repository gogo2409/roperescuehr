/**
 * LOKACIJA: lib/firebase-leaderboard.ts
 * OPIS: Prilagođen dohvat rezultata prema tvojoj strukturi (ukupnoBodova, modulId string).
 */

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface FirebaseLeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  maxScore: number;
  postotak: number;
  modulId: string | number;
  timestamp: string;
  initials: string;
  duration?: number;
}

export async function fetchFirebaseLeaderboard(
  modulId?: number | string,
  limitCount: number = 50
): Promise<FirebaseLeaderboardEntry[]> {
  try {
    const resultsRef = collection(db, 'exam_results');
    
    // Bazični query (OrderBy score/ukupnoBodova zahtijeva indeks, pa koristimo siguran pristup)
    let q = query(resultsRef, limit(200)); 

    const querySnapshot = await getDocs(q);
    let results: FirebaseLeaderboardEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // MAPIRANJE PREMA TVOJOJ STRUKTURI IZ FIREBASEA
      const score = data.ukupnoBodova || 0;
      const postotak = data.postotak || 0;
      const email = data.email || 'Gost';
      const mId = String(data.modulId || '');
      const uid = data.userId || '';
      
      // Generiranje inicijala iz emaila ili imena (budući da nemaš userName polje)
      let initials = '??';
      if (data.userName) {
        const parts = data.userName.split(' ');
        initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].substring(0, 2);
      } else if (email) {
        initials = email.substring(0, 2).toUpperCase();
      }

      results.push({
        id: doc.id,
        userId: uid,
        userName: data.userName || email.split('@')[0], // Fallback na dio emaila
        userEmail: email,
        score: score,
        maxScore: data.maxScore || score, // Fallback ako nema maxScore
        postotak: postotak,
        modulId: mId,
        timestamp: data.timestamp || '',
        initials: initials.toUpperCase(),
        duration: data.vrijemeTrajanja || 0,
      });
    });

    // 1. FILTRIRANJE PO MODULU (ako je odabran)
    if (modulId !== undefined && modulId !== null) {
      const searchId = String(modulId);
      results = results.filter(r => String(r.modulId) === searchId);
    }

    // 2. SORTIRANJE (prvo postotak, pa bodovi, pa vrijeme)
    return results.sort((a, b) => {
      if (b.postotak !== a.postotak) return b.postotak - a.postotak;
      if (b.score !== a.score) return b.score - a.score;
      return (a.duration || 0) - (b.duration || 0);
    }).slice(0, limitCount);

  } catch (error) {
    console.error('❌ Leaderboard Fetch Error:', error);
    return [];
  }
}