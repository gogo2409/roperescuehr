// app/kategorija/CategoryClientContent.tsx
'use client'; // <-- DODAJ OVU LINIJU!

// ISPRAVLJENA LINIJA 4: Uklonjen dupli 'react'
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// --- TIPOVI KORISNI U FILTRIRANJU ---

// Tip za osnovne podatke lekcije (mogu se kopirati iz ModuleContentFetcher.tsx)
interface FlatLekcijaItem {
    id: number;
    Redni_Broj: number;
    Naziv_Tehnike: string;
    Namjena: string;
    // Dodan samo dio Slika objekta koji je bitan za prikaz
    Glavna_Slika?: { url: string; alternativeText: string | null; } | null;
    modul?: { Broj_Modula: number; } | null; // Da možemo linkati natrag na modul
}

interface FilteredContent {
    naslov: string;
    lekcije: FlatLekcijaItem[];
    loading: boolean;
}


const CategoryClientContent: React.FC = () => { // <-- PROMIJENJENO IME KOMPONENTE!
    const searchParams = useSearchParams();
    const categoryName = searchParams.get('naziv'); // Dohvaća naziv iz URL-a (npr. Čvorovi)

    const [data, setData] = useState<FilteredContent>({
        naslov: categoryName || 'Sve Lekcije',
        lekcije: [],
        loading: true
    });

    // Dohvaćanje lekcija filtriranih po Kategoriji
    const fetchFilteredContent = async (category: string) => {
        setData(prev => ({ ...prev, loading: true }));

        // API poziv filtrira lekcije po Nazivu kategorije
        const url = `http://192.168.1.12:1337/api/lekcijas?filters[kategorija][Naziv][$eq]=${encodeURIComponent(category)}&populate[0]=Glavna_Slika&populate[1]=modul&sort[0]=Redni_Broj:asc`;

        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error("Greška pri dohvaćanju API-ja.");

            const json = await res.json();

            setData({
                naslov: category,
                lekcije: json.data || [],
                loading: false
            });

        } catch (error) {
            console.error("Greška pri dohvaćanju kategorije:", error);
            setData(prev => ({
                ...prev,
                loading: false,
                naslov: `Greška pri učitavanju: ${category}`
            }));
        }
    };

    useEffect(() => {
        if (categoryName) {
            fetchFilteredContent(categoryName);
        } else {
            setData(prev => ({
                ...prev,
                loading: false,
                naslov: 'Nije odabrana kategorija.'
            }));
        }
    }, [categoryName]);


    if (data.loading) {
        return (
            <div className="text-center p-20">
                <div className="text-4xl text-purple-500 animate-pulse">Učitavanje lekcija za kategoriju "{data.naslov}"...</div>
            </div>
        );
    }

    // --- Renderiranje Sadržaja ---

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <header className="text-center my-8 border-b pb-4">
                <h1 className={`text-4xl font-extrabold text-purple-700`}>
                    Kategorija: {data.naslov}
                </h1>
                <p className="text-xl text-gray-600 mt-2">Pronađeno {data.lekcije.length} lekcija</p>
            </header>

            {data.lekcije.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {data.lekcije.map(lekcija => (
                        <div key={lekcija.id} className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-purple-400">
                            <h2 className="text-xl font-bold text-gray-800">
                                {lekcija.Naziv_Tehnike}
                            </h2>
                            <p className="text-gray-600 mt-1 mb-3 text-sm italic">
                                Modul: {lekcija.modul?.Broj_Modula || 'N/A'}
                            </p>

                            {lekcija.Glavna_Slika?.url && (
                                <img
                                    src={`http://192.168.1.12:1337${lekcija.Glavna_Slika.url}`}
                                    alt={lekcija.Glavna_Slika.alternativeText || lekcija.Naziv_Tehnike}
                                    className="w-full h-32 object-cover rounded-md mt-2"
                                />
                            )}

                            <Link href={`/modul?id=${lekcija.modul?.Broj_Modula}`} passHref>
                                <span className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 mt-4 rounded-lg transition duration-150 text-sm">
                                    Pogledaj detaljnu lekciju
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 text-gray-500">
                    Nema pronađenih lekcija u kategoriji "{categoryName}".
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

export default CategoryClientContent; // <-- PROMIJENJENI DEFAULT EXPORT
