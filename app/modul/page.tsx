// app/modul/page.tsx

import React, { Suspense } from 'react';
import ModuleContentFetcher from '../../components/ModuleContentFetcher';
import type { Metadata } from 'next';

// SEO Metadata
export async function generateMetadata({ searchParams }: { 
  searchParams: { id?: string } 
}): Promise<Metadata> {
  const moduleId = searchParams.id || '1';
  
  try {
    // Fetch modul info za dinamički metadata
    const res = await fetch(
      `http://192.168.1.12:1337/api/moduls?filters[Broj_Modula][$eq]=${moduleId}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const modul = data.data[0]?.attributes;
    
    const title = modul?.Naslov || `Modul ${moduleId}`;
    const description = modul?.Opis || `Detaljno gradivo za Modul ${moduleId} - tehnike spašavanja užadima`;
    
    return {
      title: `${title} | Rope Rescue Obuka`,
      description: description,
      keywords: ['rope rescue', 'spašavanje', 'obuka', 'tehnike', 'čvorovi', 'sidrište', title],
      openGraph: {
        title: title,
        description: description,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
      }
    };
  } catch (error) {
    // Fallback metadata ako API ne radi
    return {
      title: `Modul ${moduleId} | Rope Rescue Obuka`,
      description: `Gradivo za Modul ${moduleId}`,
    };
  }
}

// Glavna stranica
const ModulePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje modula...</p>
        </div>
      </div>
    }>
      <ModuleContentFetcher />
    </Suspense>
  );
};

export default ModulePage;