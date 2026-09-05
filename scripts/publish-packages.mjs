import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

// A first-time npm bootstrap or partially completed release must not make a
// retry publish a different artifact under an already occupied version.
export async function publishCandidate(candidate, run = execFile) {
  let published;
  try {
    const result = await run('npm', ['view', `${candidate.name}@${candidate.version}`, 'dist.integrity', '--json', '--prefer-online']);
    published = JSON.parse(result.stdout);
  } catch (error) {
    let details;
    try { details = JSON.parse(error.stdout); } catch { throw error; }
    if (details?.error?.code !== 'E404') throw error;
  }
  if (published !== undefined) {
    if (published !== candidate.integrity) throw new Error(`${candidate.name}@${candidate.version} already exists with different integrity; refusing to continue.`);
    return 'already-published-identical';
  }
  await run('npm', ['publish', candidate.tarball, '--access', 'public']);
  return 'published';
}

async function main() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ovlira-publish-'));
  try {
    const root = JSON.parse(await readFile('package.json', 'utf8'));
    const elements = JSON.parse(await readFile('packages/elements/package.json', 'utf8'));
    if (root.version !== elements.version || root.dependencies['@ovlira/elements'] !== root.version) throw new Error('Release package versions do not match.');
    for (const workspace of [['--workspace', '@ovlira/elements'], []]) {
      const { stdout } = await execFile('npm', ['pack', '--json', '--pack-destination', directory, ...workspace]);
      const [packed] = JSON.parse(stdout);
      const candidate = { ...packed, tarball: path.join(directory, packed.filename) };
      const result = await publishCandidate(candidate);
      console.log(`${candidate.name}@${candidate.version}: ${result}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
