export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://giscus.app https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://giscus.app",
  "img-src 'self' data: https://*.giscus.app https://*.gravatar.com https://avatars.githubusercontent.com",
  'frame-src https://giscus.app',
  "connect-src 'self' https://*.vercel-insights.com https://*.google-analytics.com https://webmention.io",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
