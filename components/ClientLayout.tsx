// 📁 components/ClientLayout.tsx
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CartProvider } from '../contexts/CartContext';
import ThemeToggle from './ThemeToggle';
import AuthNavButtons from './AuthNavButtons';
import FooterReklame from './FooterReklame';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const isIspitPage = pathname?.includes('/ispit/');
  const isPocetnaPage = pathname === '/';
  let targetStranica: 'Pocetna' | 'Ispit' | 'Profil' | undefined;
  if (pathname?.includes('/profil')) targetStranica = 'Profil';

  return (
    <ThemeProvider>
      <CartProvider>
        <header className="bg-gray-900 dark:bg-black shadow-2xl sticky top-0 z-10 w-full">
          <div className="px-6 py-3 flex justify-between items-center max-w-6xl mx-auto">
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faHome} className="h-4 w-5" />
                <span className="hidden sm:inline">Početna</span>
              </Link>

              <Link
                href="/leaderboard"
                className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
              >
                <span>🏆</span>
                <span className="hidden md:inline">Leaderboard</span>
              </Link>

              <ThemeToggle />
            </nav>

            <AuthNavButtons />
          </div>
        </header>

        <main className="flex-grow max-w-6xl mx-auto py-8 px-6 bg-white dark:bg-gray-900 w-full">
          {children}
        </main>

        {!isIspitPage && !isPocetnaPage && <FooterReklame stranica={targetStranica} />}
      </CartProvider>
    </ThemeProvider>
  );
}
