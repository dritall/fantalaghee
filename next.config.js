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
  // Vecchio dominio → nuovo. Prima lo faceva middleware.ts, che però girava
  // su OGNI richiesta (pagine, JS, CSS, immagini) solo per controllare l'host:
  // consumo inutile di invocazioni sul piano Hobby. Qui il redirect lo fa
  // direttamente il routing di Vercel, senza eseguire codice.
  async redirects() {
    return ['fantalaghee.live', 'www.fantalaghee.live'].map((host) => ({
      source: '/:path*',
      has: [{ type: 'host', value: host }],
      destination: 'https://fantalaghee.co/:path*',
      permanent: true,
    }));
  },
};

module.exports = nextConfig;
