import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const allowIndexing = process.env.ALLOW_INDEXING === 'true';

const robotsText = allowIndexing
  ? 'User-agent: *\nAllow: /\n'
  : 'User-agent: *\nDisallow: /\n';

const hostingConfig = {
  functions: {
    source: 'functions',
  },
  firestore: {
    rules: 'firestore.rules',
  },
  hosting: {
    public: 'dist',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [
      { source: '/api/**', function: 'apiProxy' },
      { source: '**', destination: '/index.html' },
    ],
  },
};

if (!allowIndexing) {
  hostingConfig.hosting.headers = [
    {
      source: '**',
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
        },
      ],
    },
  ];
}

const robotsPath = path.join(rootDir, 'public', 'robots.txt');
const firebasePath = path.join(rootDir, 'firebase.json');

fs.writeFileSync(robotsPath, robotsText, 'utf8');
fs.writeFileSync(firebasePath, `${JSON.stringify(hostingConfig, null, 2)}\n`, 'utf8');

console.log(`SEO mode prepared: ${allowIndexing ? 'INDEXABLE' : 'NOINDEX'}`);
