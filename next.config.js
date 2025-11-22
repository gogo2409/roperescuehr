/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... ostala konfiguracija (ako postoji)
  
  images: {
    // Ovo govori Next.js-u da dopusti učitavanje slika s ove adrese.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337', 
        pathname: '/uploads/**', // Važan dio Strapi putanje
      },
    ],
  },
  
  // ...
};

module.exports = nextConfig;