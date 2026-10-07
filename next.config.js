/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // прототипы обновляются часто: браузер и CDN всегда перепроверяют, не отдают старую копию
    return [
      { source: '/proto/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    ];
  },
  async redirects() {
    return [
      { source: '/proto/digital-jazz-unified', destination: '/proto/digital-jazz-unified/index.html', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/lola', destination: '/lola/index.html' },
      { source: '/proto/digital-jazz', destination: '/proto/digital-jazz/index.html' },
      { source: '/proto/digital-jazz-color', destination: '/proto/digital-jazz-color/index.html' },
      { source: '/proto/dj-neon-check', destination: '/proto/dj-neon-check/index.html' },
      { source: '/proto/dj-neon-logo', destination: '/proto/dj-neon-logo/index.html' },
      { source: '/proto/fxpro', destination: '/proto/fxpro/index.html' },
      { source: '/proto/dj-intro', destination: '/proto/dj-intro/index.html' },
      { source: '/proto/dj-intro-glass', destination: '/proto/dj-intro-glass/index.html' },
      { source: '/proto/dj-intro-scatter', destination: '/proto/dj-intro-scatter/index.html' },
      { source: '/proto/dj-intro-v4', destination: '/proto/dj-intro-v4/index.html' },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1d609b9fa58348d39ec4c351d671a989.r2.dev',
      },
    ],
  },
};

module.exports = nextConfig;
