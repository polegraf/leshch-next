/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/lola', destination: '/lola/index.html' },
      { source: '/proto/digital-jazz', destination: '/proto/digital-jazz/index.html' },
      { source: '/proto/digital-jazz-color', destination: '/proto/digital-jazz-color/index.html' },
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
