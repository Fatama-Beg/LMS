/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337',
  }
};

module.exports = nextConfig;
