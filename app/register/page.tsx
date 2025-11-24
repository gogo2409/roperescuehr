"use client";

import React, { useState, useEffect } from "react";
import { 
  firebaseAuth 
} from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";

// Modal za greške
const ModalMessage = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full">
      <h3 className="text-xl font-bold text-red-600 mb-4">Greška</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150"
      >
        Zatvori
      </button>
    </div>
  </div>
);

const RegisterPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) return;
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setErrorMessage(`Greška pri ${isRegistering ? "registraciji" : "prijavi"}: ${e.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (e: any) {
      setErrorMessage(`Greška pri odjavi: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {errorMessage && <ModalMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}

      {!user ? (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isRegistering ? "Registracija" : "Prijava"}
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 border rounded mb-4"
          />
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 border rounded mb-4"
          />

          <button
            onClick={handleAuth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold mb-4"
          >
            {isRegistering ? "Registriraj se" : "Prijavi se"}
          </button>

          <p className="text-center text-sm text-gray-600">
            {isRegistering ? "Imaš račun?" : "Nemaš račun?"}{" "}
            <span
              className="text-blue-700 cursor-pointer font-semibold"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Prijavi se" : "Registriraj se"}
            </span>
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dobrodošli, {user.email}</h2>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded font-bold"
          >
            Odjavi se
          </button>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
