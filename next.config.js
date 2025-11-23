/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost', // Oprez: 'localhost' neće raditi u produkciji. Mora biti pravi Strapi host.
        port: '1337',
        pathname: '/uploads/**',
      },
      // Dodajte svoju produkcijsku Strapi domenu ovdje kada bude spremna!
      // {
      //   protocol: 'https',
      //   hostname: 'your-strapi-prod-domain.com',
      //   port: '', // Obično prazno za HTTPS
      //   pathname: '/uploads/**',
      // },
    ],
  },

  // OVO JE KRITIČNO za statični export za Firebase Hosting
  output: 'export',
};

module.exports = nextConfig;
