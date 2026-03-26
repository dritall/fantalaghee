/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tmssl.akamaized.net' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'images.fotmob.com' },
      { protocol: 'https', hostname: 'api.sofascore.app' },
    ],
  },
};

module.exports = nextConfig;
