'use client';

import React, { useEffect, useState } from 'react';
import '@fortawesome/fontawesome-svg-core/styles.css'; 
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';

// Komponente i Context
import AuthNavButtons from '../components/AuthNavButtons';
import FooterReklame from '../components/FooterReklame';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CartProvider } from '../contexts/CartContext';
import ThemeToggle from '../components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

// Komponenta za dinamički Shop link
function ShopLink() {
  const [shopEnabled, setShopEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const res = await fetch('http://192.168.1.12:1337/api/shop-enabled');
        const data = await res.json();
        setShopEnabled(data.data?.Shop_Enabled ?? true);
      } catch (error) {
        console.error('Greška pri dohvaćanju shop statusa:', error);
        setShopEnabled(true); // Default: prikaži shop ako API ne radi
      } finally {
        setLoading(false);
      }
    };

    checkShopStatus();
    
    // Provjeri svake 30 sekundi (opciono - da se ažurira bez refresha)
    const interval = setInterval(checkShopStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ne prikazuj link dok se učitava ili ako je shop disabled
  if (loading || !shopEnabled) return null;

  return (
    <Link 
      href="/shop" 
      className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
    >
      <FontAwesomeIcon icon={faShoppingCart} className="h-4 w-5" /> 
      <span className="hidden sm:inline">Shop</span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // PWA i Service Worker logika
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('✅ SW registered'))
        .catch((err) => console.error('❌ SW failed', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      const installBtn = document.getElementById('install-button');
      if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    const event = (window as any).deferredPrompt;
    if (event) {
      event.prompt();
      (window as any).deferredPrompt = null;
    }
  };
  
  const isIspitPage = pathname?.includes('/ispit/');
  const isPocetnaPage = pathname === '/';
  
  let targetStranica: 'Pocetna' | 'Ispit' | 'Profil' | undefined;
  if (pathname?.includes('/profil')) {
    targetStranica = 'Profil';
  }

  return (
    <html lang="hr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      
      <body className={inter.className}>
        <ThemeProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              
              <header className="bg-gray-900 dark:bg-black shadow-2xl sticky top-0 z-50 w-full">  
                <div className="px-6 py-3 flex justify-between items-center max-w-6xl mx-auto"> 
                  
                  <nav className="flex items-center space-x-4">
                    <Link 
                      href="/" 
                      className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faHome} className="h-4 w-5" /> 
                      <span className="hidden sm:inline">Početna</span>
                    </Link>

                    {/* Dinamički Shop link - prikazuje se samo ako je enabled */}
                    <ShopLink />

                    <Link 
                      href="/leaderboard" 
                      className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
                    >
                      <span>🏆</span>
                      <span className="hidden md:inline">Leaderboard</span>
                    </Link>

                    <button
                      id="install-button"
                      onClick={handleInstallClick}
                      className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold items-center gap-1 hidden"
                    >
                      📱 <span className="hidden sm:inline">Instaliraj</span>
                    </button>

                    <ThemeToggle />
                  </nav>

                  <AuthNavButtons /> 
                </div>
              </header>

              <main className="flex-grow max-w-6xl mx-auto py-8 px-6 w-full">
                {children}
              </main>

              {!isIspitPage && !isPocetnaPage && <FooterReklame stranica={targetStranica} />}
              
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}