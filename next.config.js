/** @type {import('next').NextConfig} */
const nextConfig = {
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
