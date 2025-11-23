// components/ModuleContentFetcher.tsx
'use client'; // <-- KRITIČNA LINIJA: Pretvara ovu komponentu u klijentsku

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';


// --- TIPOVI PRILAGOĐENI FLAT STRUKTURI (Ostavljeno nepromijenjeno) ---
interface FlatSlikaItem {
    id: number;
    url: string;
    alternativeText: string | null;
}

interface FlatModulItem {
    id: number;
    Naslov: string;
    Broj_Modula: number;
}

interface FlatKategorijaItem {
    id: number;
    Naziv: string;
}

interface KorakItem {
    id: number;
    Redni_Broj: number;
    Tekst: string;
    Slika?: FlatSlikaItem | null;
}

interface FlatLekcijaItem {
    id: number;
    Redni_Broj: number;
    Naziv_Tehnike: string;
    Namjena: string;
    Oprema_Zahtjev: string;
    Video_URL?: string;
    
    Glavna_Slika?: FlatSlikaItem | null;
    modul?: FlatModulItem | null;
    koraks?: KorakItem[];
    kategorija?: FlatKategorijaItem | null;
}

interface ModulContent {
    naslov: string;
    podnaslov: string;
    lekcije: FlatLekcijaItem[];
    jeIspitDostupan: boolean;
    modulIdBroj: number | undefined;
}


// --- POMOĆNA FUNKCIJA ZA BROJ IKONA (NEPROMIJENJENA) ---

const getIconCount = (id: number | undefined): number => {
    if (id === undefined) return 0;
    
    // Modul 4 (Instruktor) dobiva 1 karabiner
    if (id === 4) return 1;
    
    // Modul 1, 2, 3 dobivaju odgovarajući broj ikona
    return Math.min(id, 3); 
};


const ModuleContentFetcher: React.FC = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    const [modulData, setModulData] = useState<ModulContent | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [openLekcijaId, setOpenLekcijaId] = useState<number | null>(null);

    const toggleLekcija = (lekcijaId: number) => {
        setOpenLekcijaId(prevId => (prevId === lekcijaId ? null : lekcijaId));
    };


    const fetchModuleContent = async (moduleId: string) => {
        
        const targetModuleNumber = parseInt(moduleId);
        
        const lekcijeUrl = `http://192.168.1.12:1337/api/lekcijas?filters[modul][Broj_Modula][$eq]=${targetModuleNumber}&populate[0]=Glavna_Slika&populate[1]=koraks&populate[2]=koraks.Slika&populate[3]=modul&populate[4]=kategorija&sort[0]=Redni_Broj:asc`;
        
        const modulUrl = `http://192.168.1.12:1337/api/moduls?filters[Broj_Modula][$eq]=${targetModuleNumber}`;
        
        try {
            const lekcijeRes = await fetch(lekcijeUrl, { cache: 'no-store' });
            
            if (!lekcijeRes.ok) {
                 throw new Error(`Greška pri dohvaćanju lekcija (Status ${lekcijeRes.status})`);
            }

            const lekcijeJson = await lekcijeRes.json();
            const lekcijeArray: FlatLekcijaItem[] = lekcijeJson.data;

            let modulTitle = `Modul ${targetModuleNumber}`;
            let modulId = targetModuleNumber;
            let jeIspitDostupan = targetModuleNumber !== 4;
            
            try {
                const modulRes = await fetch(modulUrl, { cache: 'no-store' });
                const modulJson = await modulRes.json();
                
                const modulInfo = modulJson.data.length > 0 ? modulJson.data[0] : null;

                if (modulInfo && modulInfo.attributes) {
                    modulTitle = modulInfo.attributes.Naslov;
                    modulId = modulInfo.attributes.Broj_Modula;
                    jeIspitDostupan = modulInfo.attributes.Broj_Modula !== 4;
                } else if (lekcijeArray.length > 0 && lekcijeArray[0].modul) {
                    if (lekcijeArray[0].modul.Naslov) {
                        modulTitle = lekcijeArray[0].modul.Naslov;
                    }
                }
            } catch (modulError) {
                console.warn("API poziv za Modul je pao. Korišten je fallback naslov.");
            }
            
            setModulData({
                naslov: modulTitle,
                podnaslov: modulId === 4
                    ? 'Obuka za Instruktore'
                    : `Detaljno gradivo za Modul ${modulId}`,
                lekcije: lekcijeArray,
                jeIspitDostupan: jeIspitDostupan,
                modulIdBroj: modulId
            });

        } catch (error) {
            console.error("Fatalna greška pri dohvaćanju podataka:", error);
            setModulData({
                naslov: 'API Greška',
                podnaslov: `Povezivanje sa Strapi API-jem je neuspješno. Greška: ${error instanceof Error ? error.message : 'Nepoznata greška.'}`,
                lekcije: [],
                jeIspitDostupan: false,
                modulIdBroj: undefined
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchModuleContent(id);
        } else {
            setLoading(false);
        }
    }, [id]);
    
    if (loading || !modulData) {
        return (
            <div className="text-center p-20">
                <div className="text-4xl text-blue-500 animate-pulse">Učitavanje...</div>
            </div>
        );
    }
    
    // --- Prikaz Sadržaja ---
    let bojaKlase = 'text-gray-700';
    if (modulData.modulIdBroj === 1) bojaKlase = 'text-blue-600';
    else if (modulData.modulIdBroj === 2) bojaKlase = 'text-orange-600';
    else if (modulData.modulIdBroj === 3) bojaKlase = 'text-red-600';
    
    const ispitLink = `/ispit?modulId=${id}`;

    const brojIkona = getIconCount(modulData.modulIdBroj);
    const ikoneArray = Array(brojIkona).fill(null); 
    
    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <header className="text-center my-8 border-b pb-4">
                
                <div className="flex items-center justify-center space-x-3">
                    
                    <div className={`flex space-x-1 items-center`}> 
                        {ikoneArray.map((_, index) => (
                            <img 
                                key={index} 
                                src="/carabiner-single.png" 
                                alt="Karabiner" 
                                // 🔥 AŽURIRANO: Veće dimenzije i object-contain
                                className="h-10 w-10 object-contain" 
                            />
                        ))}
                    </div>
                    
                    <h1 className={`text-4xl font-extrabold ${bojaKlase}`}>
                        {modulData.naslov}
                    </h1>
                </div>

                <p className="text-xl text-gray-600 mt-2">{modulData.podnaslov}</p>
                
                 {modulData.naslov === 'API Greška' && (
                     <p className="text-red-600 mt-2 font-bold">{modulData.podnaslov}</p>
                 )}
            </header>

            {/* LISTA LEKCIJA (Ostatak koda ostaje nepromijenjen) */}
            <div className="space-y-4">
                {modulData.lekcije && modulData.lekcije.length > 0 ? (
                    
                    modulData.lekcije.map((lekcija: FlatLekcijaItem) => (
                        <section
                            key={lekcija.id}
                            className={`bg-white p-6 rounded-lg shadow-lg mb-4 border-l-4 transition-all duration-300 cursor-pointer
                                         ${openLekcijaId === lekcija.id
                                             ? 'border-blue-600/90 shadow-xl'
                                             : 'border-blue-600/50 hover:shadow-xl'
                                         }`}
                            onClick={() => toggleLekcija(lekcija.id)}
                        >
                            
                            <h2 className="text-2xl font-bold text-gray-800 flex justify-between items-start select-none">
                                <div className="flex items-center gap-4">
                                    {lekcija.Glavna_Slika?.url ? (
                                        <img
                                            src={`http://192.168.1.12:1337${lekcija.Glavna_Slika.url}`}
                                            alt={lekcija.Glavna_Slika.alternativeText || 'Slika lekcije'}
                                            className="w-12 h-12 object-cover rounded-full shadow-md border-2 border-blue-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 text-lg font-bold">
                                            #
                                        </div>
                                    )}
                                    <span>{lekcija.Redni_Broj}. {lekcija.Naziv_Tehnike}</span>
                                </div>
                                
                                <span className={`text-xl transition-transform duration-300 ${openLekcijaId === lekcija.id ? 'transform rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </h2>
                            
                            {openLekcijaId === lekcija.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    
                                    {lekcija.Glavna_Slika?.url && (
                                        <div className="my-6 text-center">
                                            <img
                                                src={`http://192.168.1.12:1337${lekcija.Glavna_Slika.url}`}
                                                alt={lekcija.Glavna_Slika.alternativeText || lekcija.Naziv_Tehnike}
                                                className="w-full max-h-96 object-contain rounded-lg shadow-md mx-auto"
                                            />
                                        </div>
                                    )}

                                    <h3 className="text-lg font-semibold mt-4 text-green-700">Namjena:</h3>
                                    <div className="prose max-w-none text-gray-700 mt-2 mb-6">
                                        <ReactMarkdown>
                                            {lekcija.Namjena}
                                        </ReactMarkdown>
                                    </div>

                                    <h3 className="text-lg font-semibold text-red-700">Oprema i Zahtjevi:</h3>
                                    <div className="prose max-w-none text-gray-700 mt-2">
                                        <ReactMarkdown>
                                            {lekcija.Oprema_Zahtjev}
                                        </ReactMarkdown>
                                    </div>

                                    {lekcija.kategorija && (
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800">Kategorija:</h3>
                                            <Link href={`/kategorija?naziv=${lekcija.kategorija.Naziv}`} onClick={(e) => e.stopPropagation()}>
                                                <span className="inline-block mt-2 px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full hover:bg-purple-200 transition duration-150 cursor-pointer shadow-sm">
                                                    {lekcija.kategorija.Naziv}
                                                </span>
                                            </Link>
                                        </div>
                                    )}

                                    {lekcija.koraks?.length && lekcija.koraks.length > 0 && (
                                        <div className="mt-6 border-t pt-4">
                                            <h3 className="text-xl font-bold mb-3 text-gray-800">Koraci:</h3>
                                            <ol className="list-decimal list-inside space-y-3 pl-4">
                                                {lekcija.koraks
                                                    .sort((a: KorakItem, b: KorakItem) => a.Redni_Broj - b.Redni_Broj)
                                                    .map((korak: KorakItem) => (
                                                        <li key={korak.id} className="text-gray-700">
                                                            <span className="font-semibold">{korak.Redni_Broj}.</span>
                                                            <span className="inline ml-2">
                                                                <ReactMarkdown>{korak.Tekst}</ReactMarkdown>
                                                            </span>

                                                            {korak.Slika?.url && (
                                                                <div className="my-3 ml-6">
                                                                    <img
                                                                        src={`http://192.168.1.12:1337${korak.Slika.url}`}
                                                                        alt={korak.Slika.alternativeText || `Slika za korak ${korak.Redni_Broj}`}
                                                                        className="w-full max-h-60 object-contain rounded-lg shadow-sm"
                                                                    />
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                            </ol>
                                        </div>
                                    )}

                                    {lekcija.Video_URL && (
                                        <div className="mt-6 text-center">
                                            <a href={lekcija.Video_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150">
                                                Pogledaj Video Lekciju
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    ))
                ) : (
                    <div className="text-center p-10 text-gray-500">
                        Nema pronađenih lekcija za ovaj modul.
                    </div>
                )}
            </div>

            {modulData.jeIspitDostupan && (
                <div className="mt-10 text-center">
                    <Link href={ispitLink}>
                        <span className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl py-4 px-12 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105">
                            Započni Ispit za Modul {id}
                            <span className="ml-3 text-2xl">⚡</span>
                        </span>
                    </Link>
                </div>
            )}
            
            <div className="text-center mt-12">
                <Link href="/">
                    <span className="text-blue-500 hover:text-blue-700 transition cursor-pointer">
                        &larr; Natrag na početnu
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default ModuleContentFetcher;
