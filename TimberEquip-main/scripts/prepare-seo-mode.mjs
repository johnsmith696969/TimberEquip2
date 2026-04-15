import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const allowIndexing = process.env.ALLOW_INDEXING === 'true';

const robotsText = allowIndexing
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://www.timberequip.com/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://www.recaptcha.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.stripe.com https://firebasestorage.googleapis.com https://*.firebasestorage.googleapis.com https://*.firebasestorage.app https://*.googleusercontent.com https://placehold.co https://images.unsplash.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://forestryequipmentsales.com https://timberequip.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebasestorage.app https://*.stripe.com https://api.stripe.com https://*.run.app https://www.google.com https://www.gstatic.com https://www.recaptcha.net; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://apis.google.com https://*.firebaseapp.com https://*.stripe.com https://*.run.app https://www.recaptcha.net https://maps.google.com https://www.openstreetmap.org https://www.youtube.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self';",
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), usb=(), geolocation=(self)',
  },
];

const immutableAssetCacheHeaders = [
  {
    key: 'Cache-Control',
    value: 'public, max-age=31536000, immutable',
  },
];

const hostingConfig = {
  functions: {
    source: 'functions',
  },
  firestore: {
    rules: 'firestore.rules',
  },
  storage: {
    rules: 'storage.rules',
  },
  dataconnect: {
    source: 'dataconnect',
  },
  hosting: {
    public: 'dist',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [
      { source: '/api/**', function: 'apiProxy' },
      { source: '/sitemap.xml', function: 'publicPages' },
      { source: '**', destination: '/index.html' },
    ],
    headers: [
      {
        source: '**',
        headers: securityHeaders,
      },
      {
        source: '/assets/**',
        headers: immutableAssetCacheHeaders,
      },
      {
        source: '/page-photos/**',
        headers: immutableAssetCacheHeaders,
      },
      {
        source: '/*.svg',
        headers: immutableAssetCacheHeaders,
      },
      {
        source: '/*.png',
        headers: immutableAssetCacheHeaders,
      },
      {
        source: '/*.ico',
        headers: immutableAssetCacheHeaders,
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/index.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ],
  },
};

if (!allowIndexing) {
  hostingConfig.hosting.headers.push({
    source: '**',
    headers: [
      {
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    ],
  });
}

const robotsPath = path.join(rootDir, 'public', 'robots.txt');
const firebasePath = path.join(rootDir, 'firebase.json');

fs.writeFileSync(robotsPath, robotsText, 'utf8');
fs.writeFileSync(firebasePath, `${JSON.stringify(hostingConfig, null, 2)}\n`, 'utf8');

console.log(`SEO mode prepared: ${allowIndexing ? 'INDEXABLE' : 'NOINDEX'}`);
