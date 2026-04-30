import { type VercelConfig, routes } from '@vercel/config/v1';
import { CSP } from './src/lib/csp';

export const config: VercelConfig = {
  framework: 'astro',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  outputDirectory: 'dist',
  redirects: [
    { source: '/(.*)/', destination: '/$1', statusCode: 308 },
    { source: '/feed', destination: '/rss.xml', statusCode: 308 },
  ],
  headers: [
    routes.header('/(.*)', [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=()',
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: CSP },
    ]),
    routes.cacheControl('/_astro/(.*)', {
      public: true,
      maxAge: '1year',
      immutable: true,
    }),
    routes.cacheControl('/fonts/(.*)', {
      public: true,
      maxAge: '1year',
      immutable: true,
    }),
    routes.cacheControl('/api/og(.*)', {
      public: true,
      sMaxAge: '1year',
      immutable: true,
      staleWhileRevalidate: '1day',
    }),
    routes.cacheControl('/(rss\\.xml|feed\\.json|sitemap.*)', {
      public: true,
      maxAge: '10min',
      sMaxAge: '1hour',
    }),
    routes.cacheControl('/(.*)\\.html', {
      public: true,
      sMaxAge: '60s',
      staleWhileRevalidate: '1day',
    }),
  ],
  crons: [{ path: '/api/refresh', schedule: '0 5 * * 1' }],
};

export default config;
