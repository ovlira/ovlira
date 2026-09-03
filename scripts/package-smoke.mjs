import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function run(command, args, options = {}) {
  return execFile(command, args, {
    cwd: repoRoot,
    maxBuffer: 4 * 1024 * 1024,
    timeout: 180_000,
    env: { ...process.env, npm_config_cache: path.join(tempDirectory, '.npm-cache') },
    ...options,
  });
}

async function pack(args, outputDirectory) {
  const { stdout } = await run('npm', [
    'pack',
    '--silent',
    '--pack-destination',
    outputDirectory,
    ...args,
  ], {
    env: {
      ...process.env,
      npm_config_cache: path.join(outputDirectory, '.npm-cache'),
    },
  });
  const filename = stdout.trim().split(/\r?\n/).at(-1);
  if (!filename) throw new Error(`npm pack returned no filename for ${args.join(' ')}`);
  return path.isAbsolute(filename) ? filename : path.join(outputDirectory, filename);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'ovlira-package-smoke-'));
const projectDirectory = path.join(tempDirectory, 'project');
const npm = (args) => run('npm', args, { cwd: projectDirectory });
const cli = (args) => npm(['run', '--silent', 'ovlira', '--', ...args]);

try {
  await mkdir(projectDirectory, { recursive: true });

  const cliTarball = await pack([], tempDirectory);
  const elementsTarball = await pack(['--workspace', '@ovlira/elements'], tempDirectory);
  await npm(['init', '--yes']);
  await npm(['install', '--save-dev', '--save-exact', '--no-audit', '--no-fund', cliTarball, elementsTarball]);
  await npm(['pkg', 'set', 'scripts.ovlira=ovlira']);
  const searchResult = await cli(['search', 'tooltip', '--json']);
  const search = JSON.parse(searchResult.stdout);
  assert(Array.isArray(search.results), 'packed CLI search did not return results');
  assert(search.results.some((result) => result.id === 'component.tooltip'), 'packed CLI could not find tooltip');

  await cli(['inspect', 'page.settings', '--section', 'guidance', '--json']);
  await cli(['init', '.']);
  // Replace unpublished version ranges with the exact candidate tarballs.
  await npm(['install', '--save-exact', '--no-audit', '--no-fund', cliTarball, elementsTarball]);
  await cli(['add', 'page.settings', '--json']);

  const generatedEntry = await readFile(path.join(projectDirectory, 'src', 'main.ts'), 'utf8');
  assert(generatedEntry.includes("@ovlira/elements/input.js"), `packed CLI generated the wrong package import: ${generatedEntry.slice(0, 240)}`);
  assert(generatedEntry.includes("@ovlira/elements/button.js"), 'packed CLI omitted the button package import');
  assert(!generatedEntry.includes('src/components'), 'packed CLI generated a legacy copied-source import');

  for (const dependency of ['@ovlira/cli', '@ovlira/elements', 'lit', 'typescript', 'vite']) {
    const resolved = await realpath(path.join(projectDirectory, 'node_modules', dependency));
    assert(resolved.startsWith(`${await realpath(projectDirectory)}${path.sep}`), `${dependency} resolves outside the fresh app`);
  }
  const check = JSON.parse((await cli(['check', '--json'])).stdout);
  assert(check.ok, `packed CLI check failed: ${JSON.stringify(check)}`);
  await npm(['run', 'build']);
  await npm(['ci', '--no-audit', '--no-fund']);
  await npm(['run', 'build']);
  assert(JSON.parse((await cli(['check', '--json'])).stdout).ok, 'clean reinstall failed validation');

  console.log('Ovlira package smoke: passed');
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
