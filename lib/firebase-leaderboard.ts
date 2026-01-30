/**
 * LOKACIJA: lib/firebase-leaderboard.ts
 * OPIS: Dohvat rezultata i globalne statistike sustava.
 */

import { 
  collection, 
  query, 
  limit, 
  getDocs, 
  getCountFromServer 
} from 'firebase/firestore';
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

/**
 * Dohvaća globalnu statistiku sustava (ukupno korisnika i riješenih ispita)
 */
export async function getGlobalStats() {
  try {
    const usersCol = collection(db, 'users');
    const examsCol = collection(db, 'exam_results');

    // getCountFromServer ne povlači dokumente, samo broj (štedi kvotu i brzinu)
    const usersSnapshot = await getCountFromServer(usersCol);
    const examsSnapshot = await getCountFromServer(examsCol);

    return {
      totalUsers: usersSnapshot.data().count,
      totalExams: examsSnapshot.data().count
    };
  } catch (error) {
    console.error("❌ Greška pri dohvatu statistike:", error);
    return { totalUsers: 0, totalExams: 0 };
  }
}

/**
 * Dohvaća rang listu korisnika
 */
export async function fetchFirebaseLeaderboard(
  modulId?: number | string,
  limitCount: number = 50
): Promise<FirebaseLeaderboardEntry[]> {
  try {
    const resultsRef = collection(db, 'exam_results');
    
    // Uzimamo veći limit (300) jer radimo filtriranje i sortiranje na klijentu
    // kako bismo izbjegli potrebu za kompleksnim Firebase indeksima.
    let q = query(resultsRef, limit(300)); 

    const querySnapshot = await getDocs(q);
    let results: FirebaseLeaderboardEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const score = data.ukupnoBodova || 0;
      const postotak = data.postotak || 0;
      const email = data.email || 'Gost';
      const mId = data.modulId !== undefined ? String(data.modulId) : '';
      const uid = data.userId || '';
      
      // Generiranje inicijala
      let initials = '??';
      if (data.initials) {
        initials = data.initials;
      } else if (data.userName) {
        const parts = data.userName.trim().split(/\s+/);
        initials = parts.length > 1 
          ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
          : parts[0].substring(0, 2);
      } else if (email) {
        initials = email.substring(0, 2).toUpperCase();
      }

      results.push({
        id: doc.id,
        userId: uid,
        userName: data.userName || email.split('@')[0],
        userEmail: email,
        score: score,
        maxScore: data.maxScore || (score > 100 ? score : 100),
        postotak: postotak,
        modulId: mId,
        timestamp: data.timestamp || '',
        initials: initials.toUpperCase().substring(0, 3),
        duration: data.vrijemeTrajanja || 0,
      });
    });

    // 1. FILTRIRANJE PO MODULU
    if (modulId !== undefined && modulId !== null && modulId !== '') {
      const searchId = String(modulId);
      results = results.filter(r => String(r.modulId) === searchId);
    }

    // 2. SORTIRANJE (Postotak -> Bodovi -> Vrijeme)
    return results.sort((a, b) => {
      if (b.postotak !== a.postotak) return b.postotak - a.postotak;
      if (b.score !== a.score) return b.score - a.score;
      // Ako je sve isto, brži rezultat (manji duration) ide gore
      return (a.duration || 0) - (b.duration || 0);
    }).slice(0, limitCount);

  } catch (error) {
    console.error('❌ Leaderboard Fetch Error:', error);
    return [];
  }
}