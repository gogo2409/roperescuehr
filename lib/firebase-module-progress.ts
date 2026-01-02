// lib/firebase-module-progress.ts
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Provjeri da li je korisnik položio određeni modul (90%+ score)
 */
export async function hasPassedModule(
  userId: string,
  modulId: number
): Promise<boolean> {
  try {
    const resultsRef = collection(db, 'exam_results');
    
    const q = query(
      resultsRef,
      where('userId', '==', userId),
      where('modulId', '==', modulId)
    );

    const querySnapshot = await getDocs(q);
    
    // Provjeri da li postoji barem jedan rezultat sa 90%+ score
    let hasPassed = false;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const percentage = data.maxScore > 0 
        ? (data.score / data.maxScore) * 100 
        : 0;
      
      if (percentage >= 90) {
        hasPassed = true;
      }
    });
    
    return hasPassed;
  } catch (error) {
    console.error('Greška pri provjeri modula:', error);
    return false;
  }
}

/**
 * Dohvati sve položene module za korisnika
 */
export async function getPassedModules(userId: string): Promise<number[]> {
  try {
    const resultsRef = collection(db, 'exam_results');
    
    const q = query(
      resultsRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    const passedModules = new Set<number>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const percentage = data.maxScore > 0 
        ? (data.score / data.maxScore) * 100 
        : 0;
      
      if (percentage >= 90) {
        passedModules.add(data.modulId);
      }
    });
    
    return Array.from(passedModules).sort();
  } catch (error) {
    console.error('Greška pri dohvaćanju položenih modula:', error);
    return [];
  }
}

/**
 * Provjeri da li je modul otključan za korisnika
 * Modul 1 je uvijek otključan
 * Modul 2 zahtijeva položen Modul 1
 * Modul 3 zahtijeva položen Modul 2
 * Modul 4 (Instruktor) zahtijeva položen Modul 3
 */
export async function isModuleUnlocked(
  userId: string,
  modulId: number
): Promise<{ unlocked: boolean; requiredModule?: number }> {
  // Modul 1 je uvijek otključan
  if (modulId === 1) {
    return { unlocked: true };
  }
  
  // Za ostale module, provjeri je li prethodni položen
  const requiredModule = modulId - 1;
  const hasPassed = await hasPassedModule(userId, requiredModule);
  
  return {
    unlocked: hasPassed,
    requiredModule: hasPassed ? undefined : requiredModule
  };
}

/**
 * Dohvati napredak korisnika kroz sve module
 */
export async function getUserProgress(userId: string): Promise<{
  passedModules: number[];
  totalModules: number;
  percentage: number;
  nextModule?: number;
}> {
  const passedModules = await getPassedModules(userId);
  const totalModules = 4; // Modul 1, 2, 3, Instruktor
  
  const percentage = (passedModules.length / totalModules) * 100;
  
  // Odredi sljedeći modul koji treba položiti
  let nextModule: number | undefined;
  for (let i = 1; i <= totalModules; i++) {
    if (!passedModules.includes(i)) {
      nextModule = i;
      break;
    }
  }
  
  return {
    passedModules,
    totalModules,
    percentage,
    nextModule
  };
}