'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ČEKAJ DA SE CLIENT MOUNTA
  useEffect(() => {
    setMounted(true);
  }, []);

  // ⛔ NIŠTA SE NE RENDERA NA SERVERU
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="ml-2 text-sm text-blue-400 hover:text-blue-300 transition"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
