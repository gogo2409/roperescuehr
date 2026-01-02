// components/FooterReklame.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { fetchReklame, StrapiReklama } from '@/lib/strapi';
import Image from 'next/image';

interface FooterReklameProps {
  stranica?: 'Pocetna' | 'Ispit' | 'Profil';
}

const FooterReklame: React.FC<FooterReklameProps> = ({ stranica }) => {
  const [reklame, setReklame] = useState<StrapiReklama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReklame = async () => {
      const data = await fetchReklame('Footer', stranica);
      setReklame(data);
      setLoading(false);
    };

    loadReklame();
  }, [stranica]);

  if (loading) {
    return (
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-500">Učitavanje...</p>
        </div>
      </footer>
    );
  }

  if (reklame.length === 0) {
    return null; // Ne prikazuj footer ako nema reklama
  }

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  return (
    <footer className="bg-gray-100 py-8 mt-12 border-t-2 border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Desktop layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {reklame.map((reklama) => {
            const isPunaSirina = reklama.Tip_Prikaza === 'Puna_Sirina';
            
            return (
              <a
                key={reklama.id}
                href={reklama.URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  block rounded-lg overflow-hidden shadow-md hover:shadow-xl 
                  transition-all duration-300 transform hover:scale-105
                  bg-white
                  ${isPunaSirina ? 'md:col-span-2' : ''}
                `}
              >
                {reklama.Slika && (
                  <div className="relative w-full" style={{ paddingBottom: '25%' }}>
                    <Image
                      src={`${STRAPI_URL}${reklama.Slika.url}`}
                      alt={reklama.Slika.alternativeText || reklama.Naslov}
                      fill
                      className="object-cover"
                      sizes={isPunaSirina ? "100vw" : "50vw"}
                    />
                  </div>
                )}
                {!reklama.Slika && (
                  <div className="p-8 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                    <h3 className="text-2xl font-bold">{reklama.Naslov}</h3>
                  </div>
                )}
              </a>
            );
          })}
        </div>

        {/* Mobile layout - sve ispod */}
        <div className="md:hidden flex flex-col gap-4">
          {reklame.map((reklama) => (
            <a
              key={reklama.id}
              href={reklama.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white"
            >
              {reklama.Slika && (
                <div className="relative w-full" style={{ paddingBottom: '33%' }}>
                  <Image
                    src={`${STRAPI_URL}${reklama.Slika.url}`}
                    alt={reklama.Slika.alternativeText || reklama.Naslov}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              )}
              {!reklama.Slika && (
                <div className="p-6 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                  <h3 className="text-xl font-bold">{reklama.Naslov}</h3>
                </div>
              )}
            </a>
          ))}
        </div>

        {/* Diskretna labela */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Sponzorirani sadržaj
        </p>
      </div>
    </footer>
  );
};

export default FooterReklame;