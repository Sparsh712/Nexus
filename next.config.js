// next.config.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bin.bnbstatic.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/mutual/:path*',
        destination: `${API_URL}/api/mutual/:path*`,
      },
      {
        source: '/api/stock/:path*',
        destination: `${API_URL}/api/stock/:path*`,
      },
      {
        source: '/api/crypto/:path*',
        destination: `${API_URL}/api/crypto/:path*`,
      },
    ];
  },
}
