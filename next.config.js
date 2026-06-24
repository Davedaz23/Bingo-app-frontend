/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Telegram CDN images
  images: {
    domains: ['t.me', 'telegram.org'],
  },
  // Proxy API in dev to avoid CORS
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' }]
      : [];
  },
};

module.exports = nextConfig;
