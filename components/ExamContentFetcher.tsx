// components/ExamContentFetcher.tsx
'use client'; 

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Definirajte strukturu za jedno pitanje (prema Vašem Strapi modelu!)
interface Question {
    id: number;
    Tekst_Pitanja: string; // Ime polja iz schema.json
    Odgovor_A: string;
    Odgovor_B: string;
    Odgovor_C: string;
    Tocan_Odgovor: 'A' | 'B' | 'C'; 
    // modulu nismo dodali jer ga ne koristimo za prikaz
}

// Funkcija za dohvaćanje ispitnih pitanja iz Strapi-ja
const fetchExamQuestions = async (moduleId: string): Promise<{ questions: Question[], examTitle: string }> => {
    // API putanja: Filtriramo po relaciji 'modul' (koja sadrži ID modula)
    // Kolekcija je 'pitanjes'
    const strapiUrl = `http://localhost:1337/api/pitanjes?filters[modul][id][$eq]=${moduleId}&populate=*`;
    
    try {
        // Dodali smo { cache: 'no-store' } kako bismo osigurali da uvijek dobijemo aktualne podatke
        const res = await fetch(strapiUrl, { cache: 'no-store' }); 

        if (!res.ok) {
            throw new Error(`Greška pri dohvaćanju pitanja: Status ${res.status}`);
        }

        const json = await res.json();
        
        // Pitanja se nalaze u 'data', ali moramo mapirati 'attributes' polje (zbog Strapi v4/v5 strukture)
        const questions: Question[] = json.data.map((item: any) => ({
            id: item.id,
            ...item.attributes // Izdvajamo sve atribute (Tekst_Pitanja, Odgovor_A, itd.)
        }));

        return {
            questions: questions,
            examTitle: `Ispit za Modul ${moduleId} (${questions.length} pitanja)`,
        };
    } catch (error) {
        throw new Error(`API Greška: Nije moguće dohvatiti pitanja. Provjerite da Strapi server radi. Detalji: ${error instanceof Error ? error.message : String(error)}`);
    }
};

const ExamContentFetcher: React.FC = () => {
    const searchParams = useSearchParams();
    const modulId = searchParams.get('modulId'); 

    const [examData, setExamData] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const modulIdBroj = parseInt(modulId as string);

    useEffect(() => {
        if (modulId && !isNaN(modulIdBroj)) {
            fetchExamQuestions(modulId)
                .then(data => {
                    setExamData({
                        naslov: data.examTitle,
                        opis: `Ovaj ispit se sastoji od ${data.questions.length} pitanja.`,
                    });
                    setQuestions(data.questions);
                    setError(null);
                })
                .catch(err => {
                    setError(err.message);
                    setExamData({
                        naslov: 'Greška pri učitavanju pitanja',
                        opis: `Došlo je do greške: ${err.message}`,
                    });
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false); 
        }
    }, [modulId]);

    // --- Prikaz greške/učitavanja ---

    if (!modulId || isNaN(modulIdBroj)) {
        return (
            <div className="text-center p-20">
                <h1 className="text-5xl text-red-600">Greška: Nedostaje ID Modula</h1>
                <p className="text-xl mt-4">Nije moguće započeti ispit. ID modula nije pronađen u URL-u.</p>
                <Link href="/">
                    <span className="text-blue-500 hover:text-blue-700 transition cursor-pointer mt-8 block">
                        &larr; Natrag na početnu
                    </span>
                </Link>
            </div>
        );
    }
    
    if (loading || !examData) {
        return (
            <div className="text-center p-20">
                <div className="text-4xl text-green-500 animate-pulse">Priprema ispita...</div>
            </div>
        );
    }

    // --- Prikaz sadržaja ispita ---

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <header className="text-center my-8 border-b pb-4">
                <h1 className="text-4xl font-extrabold text-green-700">
                    {examData.naslov}
                </h1>
                <p className="text-xl text-gray-600 mt-2">{examData.opis}</p>
            </header>

            {/* Prikaz Pitanja */}
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                {error ? (
                    <div className="text-red-600 p-4 border border-red-300 bg-red-50 rounded-md">
                        <h3 className="font-bold">Greška pri dohvaćanju:</h3>
                        <p>{error}</p>
                    </div>
                ) : questions.length === 0 ? (
                    <p className="text-lg text-orange-600">Nema pronađenih pitanja za Modul {modulId}. Provjerite Strapi bazu i relacije.</p>
                ) : (
                    questions.map((q, index) => (
                        <div key={q.id} className="border-b pb-4 mb-4 last:border-b-0">
                            {/* Pitanje */}
                            <h3 className="text-xl font-semibold mb-3">
                                {index + 1}. {q.Tekst_Pitanja}
                            </h3>
                            {/* Odgovori */}
                            <ul className="space-y-2 text-gray-700">
                                <li className="border p-3 rounded-md hover:bg-gray-50 cursor-pointer">A) {q.Odgovor_A}</li>
                                <li className="border p-3 rounded-md hover:bg-gray-50 cursor-pointer">B) {q.Odgovor_B}</li>
                                <li className="border p-3 rounded-md hover:bg-gray-50 cursor-pointer">C) {q.Odgovor_C}</li>
                            </ul>
                            {/* Ovdje bi išla stvarna logika za odabir odgovora */}
                        </div>
                    ))
                )}
            </section>

            <div className="text-center mt-12">
                <Link href={`/modul?id=${modulId}`}>
                    <span className="text-blue-500 hover:text-blue-700 transition cursor-pointer">
                        &larr; Natrag na gradivo Modula {modulId}
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default ExamContentFetcher;