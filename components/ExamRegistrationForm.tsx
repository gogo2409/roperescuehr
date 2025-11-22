// components/ExamRegistrationForm.tsx
'use client';

import React, { useState } from 'react';

// Definiramo tipove podataka koje ćemo slati Strapi-ju ili koristiti lokalno
interface RegistrationData {
  ime: string;
  prezime: string;
  email: string;
}

interface ExamRegistrationFormProps {
    modulId: string;
    // Funkcija koja se poziva kada korisnik klikne "Započni"
    onStartExam: (data: RegistrationData) => void;
}

const ExamRegistrationForm: React.FC<ExamRegistrationFormProps> = ({ modulId, onStartExam }) => {
    const [ime, setIme] = useState('');
    const [prezime, setPrezime] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Jednostavna validacija
        if (!ime || !prezime || !email) {
            setError('Sva polja su obavezna!');
            return;
        }

        setError(null);
        
        // Pozivamo funkciju iz roditeljske komponente (page.tsx)
        onStartExam({ ime, prezime, email });
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-lg bg-white">
            <h2 className="text-3xl font-bold mb-4 text-center text-blue-700">
                Registracija za Ispit Modula {modulId}
            </h2>
            <p className="text-center text-gray-600 mb-6">
                Molimo Vas unesite svoje podatke za početak ispita.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <div>
                    <label htmlFor="ime" className="block text-sm font-medium text-gray-700">Ime</label>
                    <input
                        type="text"
                        id="ime"
                        value={ime}
                        onChange={(e) => setIme(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="prezime" className="block text-sm font-medium text-gray-700">Prezime</label>
                    <input
                        type="text"
                        id="prezime"
                        value={prezime}
                        onChange={(e) => setPrezime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition duration-200"
                >
                    Započni Ispit
                </button>
            </form>
            
            <p className="mt-6 text-sm text-center text-gray-500">
                Pišete ispit za Modul ID: **{modulId}**
            </p>
        </div>
    );
};

export default ExamRegistrationForm;