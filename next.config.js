/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.sofascore.app' },
      { protocol: 'https', hostname: 'images.fotmob.com' }
    ],
  },
}
module.exports = nextConfig
