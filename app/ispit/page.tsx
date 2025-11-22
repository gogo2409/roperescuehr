// app/ispit/page.tsx
'use client';

import React, { useState, useMemo } from 'react';

// --- STRUKTURA PODATAKA ---
interface Pitanje {
    id: number;
    tekst: string;
    opcije: string[];
    tocanOdgovor: string; 
}

// --- BAZA PITANJA ---
const pitanjaBaza: Pitanje[] = [
    {
        id: 1,
        tekst: "Koja je minimalna radna nosivost (WLL) za osnovnu osobnu zaštitnu opremu (OZO) u industrijskom pristupu užetom?",
        opcije: [
            "5 kN", 
            "10 kN", 
            "15 kN", 
            "22 kN"
        ],
        tocanOdgovor: "15 kN"
    },
    {
        id: 2,
        tekst: "Koja je primarna funkcija sidrenog sustava u sustavu rada na užetu?",
        opcije: [
            "Osigurati vizualnu referencu za penjača.",
            "Podržati samo penjača, ne i opremu.",
            "Sigurno pričvrstiti užad i opremu na strukturu.",
            "Regulirati duljinu užeta."
        ],
        tocanOdgovor: "Sigurno pričvrstiti užad i opremu na strukturu."
    },
    {
        id: 3,
        tekst: "Što je 'čvor' (eng. knot) u kontekstu spašavanja užetom?",
        opcije: [
            "Privremeno spajanje dva užeta s ciljem da se spoj može lako raspustiti.",
            "Trajno fiksiranje užeta za sidrenu točku.",
            "Kvar na užetu uzrokovan pretjeranom silom.",
            "Bilo koji prekid u vlaknima užeta."
        ],
        tocanOdgovor: "Privremeno spajanje dva užeta s ciljem da se spoj može lako raspustiti."
    },
];

// --- GLAVNA KOMPONENTA ISPITA ---
const IspitPage: React.FC = () => {
    // Stanje za praćenje trenutne faze ispita i rezultata
    const [trenutnoPitanjeIndeks, setTrenutnoPitanjeIndeks] = useState(0);
    const [odabraniOdgovor, setOdabraniOdgovor] = useState<string | null>(null);
    const [rezultati, setRezultati] = useState<number[]>([]); // 1 = točno, 0 = netočno
    const [ispitZavrsen, setIspitZavrsen] = useState(false);
    
    // Trenutno pitanje
    const trenutnoPitanje = pitanjaBaza[trenutnoPitanjeIndeks];

    // Funkcija za odabir odgovora
    const handleOdgovorClick = (odgovor: string) => {
        setOdabraniOdgovor(odgovor);
    };

    // Funkcija za prelazak na sljedeće pitanje
    const handleSljedecePitanje = () => {
        if (!odabraniOdgovor) return; // Ne dopusti prelazak ako nije odabran odgovor

        // Provjera i spremanje rezultata
        const jeTocno = odabraniOdgovor === trenutnoPitanje.tocanOdgovor;
        setRezultati(prev => [...prev, jeTocno ? 1 : 0]);

        const sljedećiIndeks = trenutnoPitanjeIndeks + 1;
        
        if (sljedećiIndeks < pitanjaBaza.length) {
            // Prelazak na sljedeće pitanje
            setTrenutnoPitanjeIndeks(sljedećiIndeks);
            setOdabraniOdgovor(null);
        } else {
            // Završetak ispita
            setIspitZavrsen(true);
        }
    };

    // Izračun konačnog rezultata (memoizacija za performanse)
    const konacanRezultat = useMemo(() => {
        const točniOdgovori = rezultati.reduce((suma, r) => suma + r, 0);
        return {
            brojTocnih: točniOdgovori,
            ukupnoPitanja: pitanjaBaza.length,
            postotak: (točniOdgovori / pitanjaBaza.length) * 100
        };
    }, [rezultati]);

    // --- PRIKAZ (RENDER) LOGIKA ---

    if (ispitZavrsen) {
        // Prikaz rezultata
        return (
            <div className="container mx-auto p-8 max-w-2xl bg-white shadow-xl rounded-lg my-12 text-center">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Ispit je završen!</h2>
                <p className="text-xl text-gray-700 mb-6">
                    Vaš rezultat: {konacanRezultat.brojTocnih} od {konacanRezultat.ukupnoPitanja} ({konacanRezultat.postotak.toFixed(1)}%)
                </p>
                <button 
                    onClick={() => window.location.reload()} // Jednostavan način za ponovno pokretanje za test
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                >
                    Ponovi ispit
                </button>
            </div>
        );
    }
    
    // Prikaz trenutnog pitanja
    return (
        <div className="container mx-auto p-4 max-w-4xl min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Ispit - Osnovne Tehnike ({trenutnoPitanjeIndeks + 1}/{pitanjaBaza.length})
            </h1>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
                
                {/* Tekst Pitanja */}
                <p className="text-xl font-semibold mb-6 text-gray-800">
                    {trenutnoPitanje.tekst}
                </p>
                
                {/* Opcije Odgovora */}
                <div className="space-y-4">
                    {trenutnoPitanje.opcije.map((opcija) => (
                        <button
                            key={opcija}
                            onClick={() => handleOdgovorClick(opcija)}
                            className={`
                                w-full text-left p-4 border rounded-lg transition duration-150
                                ${odabraniOdgovor === opcija 
                                    ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                }
                            `}
                        >
                            {opcija}
                        </button>
                    ))}
                </div>
                
                {/* Gumb za Sljedeće Pitanje */}
                <button
                    onClick={handleSljedecePitanje}
                    disabled={!odabraniOdgovor}
                    className={`
                        mt-8 w-full font-bold py-3 px-4 rounded-lg transition duration-300
                        ${odabraniOdgovor 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                    `}
                >
                    {trenutnoPitanjeIndeks === pitanjaBaza.length - 1 ? "Završi ispit" : "Sljedeće pitanje"}
                </button>

            </div>
        </div>
    );
};

export default IspitPage;