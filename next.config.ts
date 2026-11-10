import type { NextConfig } from 'next'

const noIndex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // La app usa la ubicación (mapa / "cerca tuyo") y el micrófono (audios a Refi).
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)' },
        ],
      },
      // Las superficies internas no se indexan (además de robots.txt y metadata.robots).
      { source: '/empresa', headers: noIndex },
      { source: '/empresa/:path*', headers: noIndex },
      { source: '/plataforma', headers: noIndex },
      { source: '/plataforma/:path*', headers: noIndex },
    ]
  },
}

export default nextConfig
