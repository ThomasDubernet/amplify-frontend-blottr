/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cdn.bubble.io',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 