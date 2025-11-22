// components/ModuleCard.tsx
import React from 'react';
import Link from 'next/link'; 

// Definiranje tipova za props - sada prihvaća samo brojeve 1 do 4
interface ModuleCardProps {
  modul: string;
  naslov: string;
  ikonaBroj: 1 | 2 | 3 | 4; 
  link: string;
}

// Funkcionalna komponenta za prikaz ikona
const CarabinerIcon: React.FC<{ count: number }> = ({ count }) => {
  // Putanja do Vaše slike
  const imagePath = "/carabiner-single.png"; 

  // Stvaranje niza slika na temelju broja modula
  const icons = Array.from({ length: count }, (_, i) => (
    <img 
      key={i} 
      src={imagePath} 
      alt={`Ikona - ${count}`} 
      className="w-16 h-16 mx-1 transition-transform duration-300 group-hover:scale-110 object-contain" 
      // Manji CSS filter trikovi za vizualnu razliku između karabinera
      style={{ 
        filter: count === 1 ? 'none' : 
                count === 2 ? 'brightness(0.9)' : 
                count === 3 ? 'brightness(0.8)' : 
                'none' // Za Instruktora, bez filtera
      }}
    /> 
  ));

  return <div className="flex justify-center mb-4">{icons}</div>;
};

const ModuleCard: React.FC<ModuleCardProps> = ({ modul, naslov, ikonaBroj, link }) => {
  // Određivanje boje okvira na temelju broja modula
  let bojaKlase = 'border-gray-400'; 
  let gumbBoja = 'bg-blue-600 hover:bg-blue-700';

  if (ikonaBroj === 1) {
    bojaKlase = 'border-blue-500';
  } else if (ikonaBroj === 2) {
    bojaKlase = 'border-orange-500';
  } else if (ikonaBroj === 3) {
    bojaKlase = 'border-red-500';
  } else if (ikonaBroj === 4) {
    // Instruktor
    bojaKlase = 'border-gray-700';
    gumbBoja = 'bg-gray-600 hover:bg-gray-700';
  }
  
  // Tekst je sada uvijek "Pregledaj Gradivo"
  const gumbTekst = "Pregledaj Gradivo"; 

  return (
    <div className={`group bg-white shadow-xl rounded-xl p-8 text-center border-t-8 ${bojaKlase} transition hover:shadow-2xl hover:scale-[1.02] duration-300 cursor-pointer`}>
      
      {/* Ikona Karabiner/Ispit */}
      <CarabinerIcon count={ikonaBroj} />

      <h3 className="text-3xl font-bold text-gray-800 mt-4">{modul}</h3>
      <p className="text-gray-500 mb-6 mt-2 h-12 flex items-center justify-center">{naslov}</p>

      {/* Gumb za akciju */}
      <Link 
        href={link} 
        className={`inline-block ${gumbBoja} text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out mt-4`}
      >
        {gumbTekst}
      </Link>
    </div>
  );
};

export default ModuleCard;