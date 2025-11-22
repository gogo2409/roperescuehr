// app/page.tsx
import React from 'react';
import ModuleCard from '@/components/ModuleCard';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    // Glavni kontejner stranice ostaje isti (max-w-7xl)
    <div className="container mx-auto p-4 max-w-7xl min-h-screen"> 
      
      {/* 1. HERO SEKCIJA - Dodajemo centriranje i sužavanje (max-w-5xl) */}
      <section className="mx-auto max-w-5xl"> {/* OVO SUŽAVA HERO SEKCIJU */}
          <div className="bg-gray-100 py-16 text-center rounded-xl shadow-lg my-12 border-b-4 border-blue-600/70">
              
              {/* 🔥 UVELICAN PRIKAZ LOGA (h-28 = 112px visine) 🔥 */}
              <img 
                  src="/logo.png" 
                  alt="Roperescue.hr Logo"
                  className="h-28 w-auto mx-auto mb-6" // POVEĆANO NA h-28
              />

              {/* Manji, funkcionalni tekst ispod loga */}
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                  Sustav za obuku i provjeru znanja iz tehnika spašavanje s užetom.
              </p>
              
              <div className="mt-8">
                  {/* Gumb za skrolanje do modula */}
                  <a href="#moduli">
                      <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105">
                          Započnite učenje ↓
                      </span>
                  </a>
              </div>
          </div>
      </section>
      
      <hr className="my-10" id="moduli" /> 
      
      <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Dostupni Moduli za Učenje</h3>

      {/* 2. Sekcija: Glavni Moduli (Kartice) - Široka mreža modula */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        
        {/* Modul 1 */}
        <ModuleCard 
          modul="Modul 1" 
          naslov="Osnovne Tehnike i Oprema" 
          ikonaBroj={1 as 1|2|3|4}
          link="/modul?id=1"
        />
        
        {/* Modul 2 */}
        <ModuleCard 
          modul="Modul 2" 
          naslov="Složene Situacije i Napredne Metode" 
          ikonaBroj={2 as 1|2|3|4}
          link="/modul?id=2"
        />
        
        {/* Modul 3 */}
        <ModuleCard 
          modul="Modul 3" 
          naslov="Sigurnost, Protokoli i Certifikacija" 
          ikonaBroj={3 as 1|2|3|4}
          link="/modul?id=3"
        />
        
        {/* Modul 4: INSTRUKTOR */}
        <ModuleCard 
          modul="Instruktor" 
          naslov="Metode Obuke i Provjera Znanja" 
          ikonaBroj={4 as 1|2|3|4}
          link="/modul?id=instruktor"
        />
        
      </section>

    </div>
  );
};

export default HomePage;