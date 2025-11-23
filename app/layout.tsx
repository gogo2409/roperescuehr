// app/layout.tsx

// CRITICAL IMPORT FOR FONT AWESOME CSS
import '@fortawesome/fontawesome-svg-core/styles.css'; 

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
// Ovu komponentu ZADRŽAVAMO: Ona sada obrađuje PRIJAVU, REGISTRACIJU, PROFIL i ODJAVU
import AuthNavButtons from '../components/AuthNavButtons'; 

// DODAJ OVO: Uvozimo Firebase Auth instancu i inicijalni auth token
import { firebaseAuth, firebaseInitialAuthToken } from '@/lib/firebase'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vaša Aplikacija',
  description: 'Opis vaše Next.js aplikacije',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      {/* POZADINA: Ostavljamo bijelu za glavni sadržaj */}
      <body className={`${inter.className} bg-white text-gray-800 min-h-screen`}>
        
        {/* HEADER: AŽURIRANO NA TAMNU POZADINU (bg-gray-900) I JAČU SJENU */}
        <header className="bg-gray-900 shadow-2xl sticky top-0 z-10 w-full">  
          <div className="px-6 py-3 flex justify-between items-center max-w-6xl mx-auto"> 
            
            {/* Glavni navigacijski linkovi - samo oni koji su uvijek vidljivi */}
            <nav className="flex items-center space-x-4">
              
              {/* LINK: Početna (Globalno, uvijek vidljivo) */}
              <Link 
                href="/" 
                className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1"
              >
                <FontAwesomeIcon 
                  icon={faHome} 
                  className="h-4 w-4"
                /> 
                Početna
              </Link>
            
              {/* IZVAĐENO: Moj Profil, Prijava, Registracija - premješteni su u AuthNavButtons */}

            </nav>

            {/* DINAMIČKA KOMPONENTA: Prikazuje Prijava/Registracija ILI Profil/Odjava */}
            {/* AŽURIRANO: Sada prosljeđujemo 'auth' i 'initialAuthToken' propove */}
            <AuthNavButtons auth={firebaseAuth} initialAuthToken={firebaseInitialAuthToken} />
          </div>
        </header>

        {/* MAIN: Sadržaj stranice */}
        <main className="min-h-[calc(10vh-100px)] max-w-6xl mx-auto py-8 px-6 bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
