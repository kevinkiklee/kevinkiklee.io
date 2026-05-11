import { type VercelConfig, routes } from '@vercel/config/v1';
import { CSP } from './src/lib/csp';

export const config: VercelConfig = {
  framework: 'astro',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  outputDirectory: 'dist',
  redirects: [
    // strip trailing slash
    { source: '/(.*)/', destination: '/$1', statusCode: 308 },
    // legacy /feed → /rss.xml
    { source: '/feed', destination: '/rss.xml', statusCode: 308 },
    // www → apex is configured at the project domain level (Vercel API
    // PATCH /v9/projects/.../domains/www.kevinkiklee.io with redirect +
    // redirectStatusCode), not here — `host` matchers in vercel.ts
    // redirects are silently ignored by the edge.
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
        // Defense-in-depth: explicitly disable every powerful API the
        // platform exposes. A static blog has no need for any of these,
        // so blocking them costs nothing and shrinks the attack surface
        // if a third-party script is ever compromised.
        value: [
          'accelerometer=()',
          'attribution-reporting=()',
          'autoplay=()',
          'bluetooth=()',
          'browsing-topics=()',
          'camera=()',
          // CopyButton uses navigator.clipboard.writeText for same-origin
          // code-block copies, so allow self only — never cross-origin.
          'clipboard-read=()',
          'clipboard-write=(self)',
          'compute-pressure=()',
          'display-capture=()',
          'encrypted-media=()',
          'fullscreen=()',
          'gamepad=()',
          'geolocation=()',
          'gyroscope=()',
          'hid=()',
          'identity-credentials-get=()',
          'idle-detection=()',
          // FLoC's deprecated cohort signal. Setting `=()` is the documented
          // opt-out even though the API was removed in Chrome 115.
          'interest-cohort=()',
          'keyboard-map=()',
          'local-fonts=()',
          'magnetometer=()',
          'microphone=()',
          'midi=()',
          'payment=()',
          'picture-in-picture=()',
          'private-state-token-issuance=()',
          'private-state-token-redemption=()',
          'publickey-credentials-get=()',
          'screen-wake-lock=()',
          'serial=()',
          'storage-access=()',
          'sync-xhr=()',
          'unload=()',
          'usb=()',
          'web-share=()',
          'window-management=()',
          'xr-spatial-tracking=()',
        ].join(', '),
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      // Block hotlinking of our subresources (fonts, images, OG renders)
      // from other origins. `same-origin` is the strictest setting that
      // still allows our own pages to fetch them.
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
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
    routes.cacheControl('/(rss\\.xml|feed\\.json|sitemap.*|llms\\.txt|llms-full\\.txt)', {
      public: true,
      maxAge: '10min',
      sMaxAge: '1hour',
    }),
    routes.cacheControl('/posts/(.+)\\.md', {
      public: true,
      maxAge: '10min',
      sMaxAge: '1hour',
      staleWhileRevalidate: '1day',
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
