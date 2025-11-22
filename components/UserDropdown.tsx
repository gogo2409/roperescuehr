// components/UserDropdown.tsx

'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faAngleDown, faCertificate, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; 

interface DropdownLink {
    name: string;
    href: string;
    icon: any; 
}

// Uklonjen "Moj Profil"
const userLinks: DropdownLink[] = [
    { name: "Ispis Certifikata", href: "/certifikat", icon: faCertificate },
    { name: "Postavke", href: "/postavke", icon: faCog },
];

interface UserDropdownProps {
    onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleToggle = () => setIsOpen(!isOpen);

    const handleLogoutClick = () => {
        setIsOpen(false); 
        onLogout();
    }

    return (
        <div className="relative inline-block text-left z-20">
            {/* Gumb za Dropdown */}
            <button
                type="button"
                className="inline-flex justify-center items-center rounded-full p-2 bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition duration-150"
                onClick={handleToggle}
            >
                <FontAwesomeIcon icon={faUserCircle} className="h-4 w-4" /> 
                <FontAwesomeIcon 
                    icon={faAngleDown} 
                    className={`ml-1 h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>
            
            {/* Dropdown Lista */}
            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 divide-y divide-gray-600"
                    // ... ostali atributi ...
                >
                    <div className="py-1">
                        {userLinks.map((link) => (
                            <Link key={link.name} href={link.href} passHref>
                                <div 
                                    className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-blue-600/50 hover:text-white transition duration-100 cursor-pointer" 
                                    onClick={() => setIsOpen(false)} 
                                >
                                    <FontAwesomeIcon icon={link.icon} className="h-4 w-4 mr-3 text-blue-300" />
                                    {link.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    {/* Odjava */}
                    <div className="py-1">
                        <div 
                            onClick={handleLogoutClick} 
                            className="flex items-center px-4 py-2 text-sm text-red-300 hover:bg-red-500/50 hover:text-white transition duration-100 cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-3" />
                            Odjavi se
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;