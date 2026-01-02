/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',         // Mapa gdje će se generirati Service Worker datoteke
  register: true,         // Automatska registracija Service Workera
  skipWaiting: true,      // Brza aktivacija nove verzije aplikacije
  disable: process.env.NODE_ENV === 'development', // PWA je ugašen dok radiš (npm run dev)
});

const nextConfig = {
  // Tvoje postojeće postavke za slike
  images: {
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.12',
        port: '1337',
        pathname: '/uploads/**',
      },
    ],
  },
  // Ovdje možeš dodati ostale Next.js postavke ako ih budeš imao
};

// Važno: Omotavamo nextConfig s withPWA
module.exports = withPWA(nextConfig);