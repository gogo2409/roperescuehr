'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import Leaderboard from '@/components/Leaderboard';
import FooterReklame from '@/components/FooterReklame';
import { Loader2 } from 'lucide-react';
import { syncUserWithStrapi } from '@/lib/strapi-sync';

const LeaderboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    console.log("🚀 LeaderboardPage: Provjera prijave...");
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);

      if (currentUser) {
        console.log("👤 Korisnik je ulogiran, šaljem na sync...");
        await syncUserWithStrapi(currentUser);
      } else {
        console.log("👤 Korisnik nije ulogiran.");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto p-4 max-w-4xl">
        <Leaderboard currentUser={user} />
      </div>
      
      <div className="pb-20">
        <FooterReklame stranica="Pocetna" />
      </div>
    </div>
  );
};

export default LeaderboardPage;