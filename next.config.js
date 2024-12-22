/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/**',
      },
      {
        protocol: 'https',
        hostname: 'poke-family.moodmnky.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'poke-family-gym.vercel.app',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 