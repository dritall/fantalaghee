// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.sofascore.app' },
      { protocol: 'https', hostname: 'images.fotmob.com' },
      { protocol: 'https', hostname: 'img.legaseriea.it', pathname: '/vimages/**' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
}
module.exports = nextConfig
