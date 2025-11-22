import React from 'react';

// Ova stranica predstavlja korisnički profil.
// Kasnije će se ovdje dodati funkcionalnost za prikaz korisničkih podataka.

const ProfilPage = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl shadow-lg">
      <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
        Moj Profil
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Ovo je sigurna zona gdje će biti prikazani vaši korisnički podaci, postavke i aktivnosti.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-inner w-full max-w-md border border-gray-200">
        <p className="font-semibold text-gray-700">Status:</p>
        <p className="text-gray-500">Korisnik (Trenutno niste ulogirani, prikazujemo opće informacije)</p>
        
        <p className="font-semibold text-gray-700 mt-4">Sljedeći korak:</p>
        <p className="text-gray-500">Implementirajte logiku za prijavu i dohvat podataka specifičnih za korisnika.</p>
      </div>
      
      <a 
        href="/" 
        className="mt-8 text-blue-600 hover:text-blue-800 transition duration-150 font-medium"
      >
        &larr; Povratak na početnu
      </a>
    </div>
  );
};

export default ProfilPage;