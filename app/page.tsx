// 📁 app/page.tsx
import React from 'react';
import { Metadata } from 'next'; // Uvozimo tip za metapodatke
import ModuleCard from '@/components/ModuleCard';
import Link from 'next/link';
import FooterReklame from '@/components/FooterReklame';
import GlobalStats from '@/components/GlobalStats'; 
import { ArrowRight } from 'lucide-react';

// --- METADATA SEKCIJA (Ovo rješava izgled na WhatsApp-u i Google-u) ---
export const metadata: Metadata = {
  title: 'roperescue.hr | Znanje koje spašava živote',
  description: 'Interaktivna platforma za obuku i provjeru znanja iz tehnika spašavanja s užetom. Savladaj napredne sustave kroz module i ispite.',
  openGraph: {
    title: 'roperescue.hr | Sustav za obuku spašavatelja',
    description: 'Interaktivni moduli i provjera znanja iz tehnika spašavanja s užetom.',
    url: 'https://roperescue.hr', // Zamijeni svojom pravom domenom
    siteName: 'RopeRescue HR',
    images: [
      {
        url: '/og-image.jpg', // Putanja do tvoje slike u public folderu
        width: 1200,
        height: 630,
        alt: 'Rope Rescue Obuka',
      },
    ],
    locale: 'hr_HR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'roperescue.hr | Obuka spašavatelja',
    description: 'Znanje koje spašava živote. Savladaj tehnike spašavanja s užetom.',
    images: ['/og-image.jpg'],
  },
};

// Prisiljavamo Next.js da uvijek dohvaća svježe podatke iz Strapija
export const dynamic = 'force-dynamic';

async function getGlobalSettings() {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';
    const res = await fetch(`${strapiUrl}/api/global-settings?populate=*`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data[0] : null;
  } catch (error) {
    console.error("Greška pri dohvaćanju globalnih postavki:", error);
    return null;
  }
}

const HomePage = async () => {
  const settings = await getGlobalSettings();
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.12:1337';

  const opisTekst = settings?.opis || "Sustav za obuku i provjeru znanja iz tehnika spašavanje s užetom.";
  const logoPath = settings?.logo?.url;
  const logoUrl = logoPath 
    ? (logoPath.startsWith('http') ? logoPath : `${strapiUrl}${logoPath}`)
    : "/logo.png";

  return (
    <>
      <div className="container mx-auto p-4 max-w-7xl min-h-screen"> 
        
        {/* HERO SEKCIJA */}
        <section className="mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-10 text-center rounded-xl shadow-lg my-6 border-b-4 border-blue-600/70">
            
            <img 
              src={logoUrl} 
              alt="Logo"
              className="h-24 w-auto mx-auto mb-4 object-contain"
            />

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4 px-6 font-medium italic">
              {opisTekst}
            </p>
            
            <div className="mt-6">
              <a href="#moduli">
                <span className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 cursor-pointer text-base uppercase tracking-wider italic">
                  Započnite učenje ↓
                </span>
              </a>
            </div>
          </div>
        </section>
        
        <hr className="my-8 dark:border-gray-700" id="moduli" /> 
        
        {/* SEKCIJA: GLAVNI MODULI */}
        <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2 text-center uppercase tracking-tighter italic">
          Moduli za Učenje
        </h3>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-medium italic">
          Završite sva tri modula i položite ispite kako bi poboljšali svoje znanje.
        </p>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <ModuleCard modul="Modul 1" naslov="Osnovne Tehnike i Oprema" ikonaBroj={1 as 1|2|3|4} link="/modul?id=1" />
          <ModuleCard modul="Modul 2" naslov="Složene Situacije i Napredne Metode" ikonaBroj={2 as 1|2|3|4} link="/modul?id=2" />
          <ModuleCard modul="Modul 3" naslov="Sigurnost, Protokoli i Certifikacija" ikonaBroj={3 as 1|2|3|4} link="/modul?id=3" />
        </section>

        {/* SEKCIJA: MODUL 4 (BONUS) */}
        <div className="mb-20 max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <Link href="/modul?id=4">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300 group-hover:duration-200 animate-pulse"></div>
                
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase italic">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      BONUS MODUL
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <img 
                          src="/sistem.png" 
                          alt="Sistemi Spašavanja" 
                          className="w-14 h-14 object-contain filter brightness-0 invert"
                        />
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left text-black dark:text-white">
                      <h4 className="text-2xl font-black mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase italic tracking-tighter">
                        Za one koji žele znati više
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 font-medium italic">
                        Metode obuke, fizika sustava i napredni protokoli za instruktore i profesionalne spašavatelje.
                      </p>
                      
                      <div className="flex items-center justify-center md:justify-start gap-2 text-purple-600 dark:text-purple-400 font-black uppercase text-sm tracking-widest group-hover:gap-4 transition-all italic">
                        <span>Istraži sadržaj</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* --- STATISTIKA --- */}
        <GlobalStats />

      </div>
      
      <FooterReklame stranica={undefined} />
    </>
  );
};

export default HomePage;