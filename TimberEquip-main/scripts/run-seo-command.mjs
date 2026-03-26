import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [, , mode, ...commandParts] = process.argv;

if (!['indexable', 'noindex'].includes(mode || '')) {
  console.error('Usage: node scripts/run-seo-command.mjs <indexable|noindex> <command...>');
  process.exit(1);
}

if (!commandParts.length) {
  console.error('A command is required after the mode.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const allowIndexing = mode === 'indexable' ? 'true' : 'false';

process.env.ALLOW_INDEXING = allowIndexing;
process.env.VITE_ALLOW_INDEXING = allowIndexing;

await import(pathToFileURL(path.join(rootDir, 'scripts', 'prepare-seo-mode.mjs')).href);

const command = commandParts.join(' ');
const child = spawn(command, {
  cwd: rootDir,
  env: process.env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
