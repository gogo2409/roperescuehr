'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  BookOpen, 
  Timer, 
  Award, 
  CheckCircle2, 
  ChevronLeft, 
  AlertTriangle,
  X 
} from 'lucide-react';
import { fetchPitanjaByModul } from '@/lib/strapi';

export default function ExamContentFetcher() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const modulId = searchParams.get('modulId');

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ count: 0, title: '' });
    const [error, setError] = useState<string | null>(null);
    const [prikaziUpozorenje, setPrikaziUpozorenje] = useState(false);

    useEffect(() => {
        if (modulId) {
            fetchPitanjaByModul(Number(modulId))
                .then(questions => {
                    if (questions.length === 0) {
                        setError("Nema pronađenih pitanja za ovaj modul.");
                    } else {
                        setStats({
                            count: questions.length,
                            title: `Završni Ispit: Modul ${modulId}`
                        });
                    }
                })
                .catch(() => setError("Greška pri povezivanju sa serverom."))
                .finally(() => setLoading(false));
        }
    }, [modulId]);

    const pokreniIspit = () => {
        setPrikaziUpozorenje(false);
        router.push(`/ispit/${modulId}`);
    };

    if (!modulId) return <div className="p-20 text-center font-black">ID Modula nedostaje!</div>;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={50} />
            <p className="font-black text-gray-400 uppercase tracking-widest">Priprema ispita...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto mt-20 p-10 bg-red-50 rounded-[3rem] border-2 border-red-100 text-center">
            <h1 className="text-3xl font-black text-red-600 mb-4">Ups!</h1>
            <p className="text-red-500 font-bold mb-8">{error}</p>
            <Link href="/" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase">Povratak</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 relative">
            
            {/* --- MODAL UPOZORENJA --- */}
            {prikaziUpozorenje && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setPrikaziUpozorenje(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <button 
                            onClick={() => setPrikaziUpozorenje(false)}
                            className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center">
                            <div className="mx-auto w-20 h-20 bg-orange-100 text-orange-500 rounded-3xl flex items-center justify-center mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Jeste li sigurni?</h2>
                            <p className="text-gray-500 font-medium mb-8">
                                Jednom kada započnete, vrijeme se počinje mjeriti. Osigurajte stabilnu internet vezu i mirno okruženje.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={pokreniIspit}
                                    className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                                >
                                    Da, započni sada!
                                </button>
                                <button 
                                    onClick={() => setPrikaziUpozorenje(false)}
                                    className="w-full bg-gray-100 text-gray-500 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Odustani
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LOBBY SADRŽAJ --- */}
            <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-gray-400 font-black uppercase text-xs mb-8 hover:text-black transition-colors"
            >
                <ChevronLeft size={16} /> Natrag na gradivo
            </button>

            <div className="bg-white rounded-[3.5rem] shadow-2xl border p-8 md:p-16 relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-blue-50 rounded-full blur-3xl" />

                <div className="relative z-10 text-center">
                    <div className="inline-flex p-4 bg-blue-600 text-white rounded-3xl mb-6 shadow-xl shadow-blue-100">
                        <Award size={40} />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter italic">
                        {stats.title}
                    </h1>
                    <p className="text-xl text-gray-400 font-medium mb-12">
                        Pripremili smo <span className="text-blue-600 font-black">{stats.count} pitanja</span> za vašu certifikaciju.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                            <Timer className="mx-auto mb-3 text-blue-500" />
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Max Vrijeme</p>
                            <p className="font-bold text-gray-800 text-lg">45 Min</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                            <CheckCircle2 className="mx-auto mb-3 text-green-500" />
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Prolaznost</p>
                            <p className="font-bold text-gray-800 text-lg">90%</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                            <BookOpen className="mx-auto mb-3 text-orange-500" />
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Tip</p>
                            <p className="font-bold text-gray-800 text-lg">Završni</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setPrikaziUpozorenje(true)}
                        className="group relative w-full md:w-auto md:px-24 bg-gray-900 hover:bg-black text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter transition-all shadow-2xl active:scale-95"
                    >
                        Započni polaganje
                    </button>
                </div>
            </div>
        </div>
    );
}