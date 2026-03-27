import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function getGitOutput(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const args = parseArgs(process.argv.slice(2));
const environment = String(args.env || process.env.RELEASE_ENV || 'production').trim();
const fromRef = String(args.from || process.env.RELEASE_FROM || '').trim();
const toRef = String(args.to || process.env.RELEASE_TO || 'HEAD').trim();
const output = String(args.output || '').trim();

const shortToRef = getGitOutput(['rev-parse', '--short', toRef]);
const range = fromRef ? `${fromRef}..${toRef}` : '-n 20';
const logArgs = fromRef
  ? ['log', '--pretty=format:%h|%ad|%an|%s', '--date=short', range]
  : ['log', '--pretty=format:%h|%ad|%an|%s', '--date=short', '-n', '20', toRef];
const commits = getGitOutput(logArgs)
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const [sha, date, author, subject] = line.split('|');
    return { sha, date, author, subject };
  });

const body = [
  `# Release Notes`,
  ``,
  `- Environment: ${environment}`,
  `- Generated at: ${new Date().toISOString()}`,
  `- Target ref: ${toRef} (${shortToRef})`,
  `- Source range: ${fromRef ? `${fromRef}..${toRef}` : `latest ${commits.length} commits`}`,
  ``,
  `## Included Commits`,
  ...commits.map((commit) => `- ${commit.sha} | ${commit.date} | ${commit.author} | ${commit.subject}`),
  ``,
].join('\n');

if (output) {
  const resolvedOutput = path.resolve(output);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, body, 'utf8');
  console.log(`Release notes written to ${resolvedOutput}`);
} else {
  console.log(body);
}
