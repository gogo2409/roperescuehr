'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';

// --- TIPOVI ---
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
    Ikona?: FlatSlikaItem | null;
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
    Tagovi?: string;
    Glavna_Slika?: FlatSlikaItem | null;
    modul?: FlatModulItem | null;
    koraks?: KorakItem[];
    kategorija?: FlatKategorijaItem | null;
}

interface CategoryGroup {
    id: number;
    name: string;
    icon: string | null;
    lessons: FlatLekcijaItem[];
}

interface ModulContent {
    naslov: string;
    podnaslov: string;
    categories: CategoryGroup[];
    jeIspitDostupan: boolean;
    modulIdBroj: number | undefined;
}

const getIconCount = (id: number | undefined): number => {
    if (id === undefined || id === 4) return 0;
    return Math.min(id, 3); 
};

const ModuleContentFetcher: React.FC = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    const [modulData, setModulData] = useState<ModulContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [openKategorijaId, setOpenKategorijaId] = useState<number | null>(null);
    const [openLekcijaId, setOpenLekcijaId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.substring(1);
            const [kat, lek] = hash.split('-');
            if (kat) setOpenKategorijaId(Number(kat));
            if (lek) setOpenLekcijaId(Number(lek));
        }
    }, []);

    const fetchModuleContent = async (moduleId: string) => {
        const targetModuleNumber = parseInt(moduleId);
        const baseUrl = "http://192.168.1.12:1337";
        const lekcijeUrl = `${baseUrl}/api/lekcijas?filters[modul][Broj_Modula][$eq]=${targetModuleNumber}&populate[0]=Glavna_Slika&populate[1]=koraks&populate[2]=koraks.Slika&populate[3]=modul&populate[4]=kategorija&sort[0]=Redni_Broj:asc`;
        const modulUrl = `${baseUrl}/api/moduls?filters[Broj_Modula][$eq]=${targetModuleNumber}`;
        
        try {
            const lekcijeRes = await fetch(lekcijeUrl, { cache: 'no-store' });
            const lekcijeJson = await lekcijeRes.json();
            const lekcijeArray: FlatLekcijaItem[] = lekcijeJson.data;

            const uniqueKategorijaIds = [...new Set(lekcijeArray.filter(l => l.kategorija).map(l => l.kategorija!.id))];
            const kategorijeMap = new Map();

            if (uniqueKategorijaIds.length > 0) {
                const kategorijeRes = await fetch(`${baseUrl}/api/kategorijas?populate=Ikona_Slika`, { cache: 'no-store' });
                const kategorijeJson = await kategorijeRes.json();
                kategorijeJson.data.filter((kat: any) => uniqueKategorijaIds.includes(kat.id)).forEach((kat: any) => {
                    kategorijeMap.set(kat.id, {
                        id: kat.id,
                        Naziv: kat.Naziv,
                        Ikona: kat.Ikona_Slika ? { url: kat.Ikona_Slika.url, alternativeText: kat.Ikona_Slika.alternativeText } : null
                    });
                });
            }

            lekcijeArray.forEach(lekcija => {
                if (lekcija.kategorija && kategorijeMap.has(lekcija.kategorija.id)) {
                    lekcija.kategorija = kategorijeMap.get(lekcija.kategorija.id);
                }
            });

            let modulTitle = targetModuleNumber === 4 ? "Za one koji žele znati više" : `Modul ${targetModuleNumber}`;
            let modulId = targetModuleNumber;
            let jeIspitDostupan = targetModuleNumber !== 4;
            
            try {
                const modulRes = await fetch(modulUrl, { cache: 'no-store' });
                const modulJson = await modulRes.json();
                const modulInfo = modulJson.data.length > 0 ? modulJson.data[0] : null;
                if (modulInfo && modulInfo.attributes) {
                    modulTitle = targetModuleNumber === 4 ? "Za one koji žele znati više" : modulInfo.attributes.Naslov;
                    modulId = modulInfo.attributes.Broj_Modula;
                    jeIspitDostupan = modulInfo.attributes.Broj_Modula !== 4;
                }
            } catch (e) { console.warn("Modul fetch fallback"); }
            
            const categoryMap = new Map<string, CategoryGroup>();
            lekcijeArray.forEach((lekcija) => {
                if (!lekcija.kategorija) return;
                const catName = lekcija.kategorija.Naziv;
                if (!categoryMap.has(catName)) {
                    categoryMap.set(catName, {
                        id: lekcija.kategorija.id,
                        name: catName,
                        icon: lekcija.kategorija.Ikona?.url ? `${baseUrl}${lekcija.kategorija.Ikona.url}` : null,
                        lessons: []
                    });
                }
                categoryMap.get(catName)!.lessons.push(lekcija);
            });

            setModulData({
                naslov: modulTitle,
                podnaslov: targetModuleNumber === 4 
                    ? 'Napredne metode obuke - Dodatni sadržaji za instruktore' 
                    : `Detaljno gradivo za Modul ${modulId}`,
                categories: Array.from(categoryMap.values()),
                jeIspitDostupan,
                modulIdBroj: modulId
            });
        } catch (error) {
            console.error("Greška:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchModuleContent(id);
    }, [id]);
    
    if (loading || !modulData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    let bojaKlase = 'text-gray-700 dark:text-gray-300';
    if (modulData.modulIdBroj === 1) bojaKlase = 'text-blue-600 dark:text-blue-400';
    else if (modulData.modulIdBroj === 2) bojaKlase = 'text-orange-600 dark:text-orange-400';
    else if (modulData.modulIdBroj === 3) bojaKlase = 'text-red-600 dark:text-red-400';
    else if (modulData.modulIdBroj === 4) bojaKlase = 'text-purple-600 dark:text-purple-400';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 py-8 text-center">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center space-x-2 mb-4"> 
                        {modulData.modulIdBroj === 4 ? (
                            <img src="/sistem.png" alt="Sistem" className="h-16 w-16" />
                        ) : (
                            Array(getIconCount(modulData.modulIdBroj)).fill(null).map((_, i) => (
                                <img key={i} src="/carabiner-single.png" alt="Karabiner" className="h-10 w-10" />
                            ))
                        )}
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-extrabold mb-2 ${bojaKlase}`}>{modulData.naslov}</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{modulData.podnaslov}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Search */}
                <div className="mb-8 relative">
                    <input
                        type="text"
                        placeholder="Pretraži lekcije..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-5 py-4 pl-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 transition-all"
                    />
                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                    {modulData.categories.map((category) => {
                        const filteredLessons = category.lessons.filter(l => 
                            l.Naziv_Tehnike.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.Namjena.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (searchQuery && filteredLessons.length === 0) return null;
                        const isOpen = openKategorijaId === category.id;

                        return (
                            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div 
                                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-4 transition-colors"
                                    onClick={() => setOpenKategorijaId(isOpen ? null : category.id)}
                                >
                                    {category.icon && <img src={category.icon} alt="" className="w-10 h-10 object-contain p-2 bg-gray-100 dark:bg-gray-700 rounded-xl" />}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{category.name}</h3>
                                        <p className="text-sm text-gray-500">{filteredLessons.length} lekcija</p>
                                    </div>
                                    <ChevronRight className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
                                </div>

                                {isOpen && (
                                    <div className="border-t dark:border-gray-700">
                                        {filteredLessons.map((lekcija) => {
                                            const isLekOpen = openLekcijaId === lekcija.id;
                                            return (
                                                <div key={lekcija.id} className="border-b dark:border-gray-700 last:border-0">
                                                    <div
                                                        onClick={() => setOpenLekcijaId(isLekOpen ? null : lekcija.id)}
                                                        className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                            {lekcija.Redni_Broj}
                                                        </div>
                                                        <span className="flex-1 font-medium text-gray-700 dark:text-gray-200">{lekcija.Naziv_Tehnike}</span>
                                                        <ChevronRight className={`w-5 h-5 transition-transform ${isLekOpen ? 'rotate-90' : 'text-gray-300'}`} />
                                                    </div>

                                                    {isLekOpen && (
                                                        <div className="px-6 pb-8 pt-4 bg-white dark:bg-gray-800/60 animate-in fade-in duration-300">
                                                            {lekcija.Glavna_Slika?.url && (
                                                                <img src={`http://192.168.1.12:1337${lekcija.Glavna_Slika.url}`} className="w-full max-h-80 object-contain rounded-xl mb-6 bg-gray-50 dark:bg-gray-900/50 p-2 shadow-sm" alt="" />
                                                            )}
                                                            <div className="space-y-6">
                                                                <section>
                                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Namjena</h4>
                                                                    <div className="prose prose-sm dark:prose-invert max-w-none 
                                                                                prose-ol:list-decimal prose-ol:pl-6
                                                                                prose-li:marker:text-blue-600 prose-li:marker:font-bold
                                                                                prose-li:my-2 text-gray-600 dark:text-gray-300 leading-relaxed">
                                                                        <ReactMarkdown>
                                                                            {lekcija.Namjena
                                                                                .replace(/(\d+\.)\s*/g, '$1 ')
                                                                                .split('\n')
                                                                                .map(l => l.trim())
                                                                                .filter(l => l.length > 0)
                                                                                .join('\n\n')}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </section>

                                                                {lekcija.Oprema_Zahtjev && (
                                                                    <section>
                                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">Potrebna oprema</h4>
                                                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{lekcija.Oprema_Zahtjev}</p>
                                                                    </section>
                                                                )}

                                                                {lekcija.koraks && lekcija.koraks.length > 0 && (
                                                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20 shadow-sm">
                                                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                            Koraci izvođenja:
                                                                        </h4>
                                                                        <div className="space-y-4">
                                                                            {lekcija.koraks.sort((a,b) => a.Redni_Broj - b.Redni_Broj).map(k => (
                                                                                <div key={k.id} className="flex gap-3">
                                                                                    <span className="font-bold text-blue-500 min-w-[20px]">{k.Redni_Broj}.</span>
                                                                                    <div className="prose prose-sm dark:prose-invert leading-relaxed"><ReactMarkdown>{k.Tekst}</ReactMarkdown></div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {lekcija.Video_URL && (
                                                                    <a href={lekcija.Video_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-500 transition-all shadow-md">
                                                                        📺 Pogledaj video lekciju
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* --- ISPRAVLJENA PUTANJA ZA MIKRO ISPIT --- */}
                                        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col items-center">
                                            <div className="flex items-center gap-3 mb-4">
                                                <GraduationCap className="text-blue-600" size={24} />
                                                <span className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Provjera znanja</span>
                                            </div>
                                            <Link 
                                                href={`/ispit/mikro-ispit/${category.id}`} 
                                                className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95"
                                            >
                                                <PlayCircle size={18} />
                                                Započni Mikro Ispit: {category.name}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Buttons */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    {modulData.jeIspitDostupan && (
                        <Link href={`/ispit/${id}`} className="w-full max-w-md">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform hover:scale-[1.01] active:scale-95">
                                📝 Započni Ispit Modula {id}
                            </button>
                        </Link>
                    )}
                    <Link href="/" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        {/* Pazi: Ovdje je Link, ne gumb, da ostane čisto */}
                        ← Natrag na popis modula
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ModuleContentFetcher;