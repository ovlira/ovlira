// @vitest-environment node
import { execFile as execFileCallback } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execFile = promisify(execFileCallback);

it('overview approval cannot approve a changed component image', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-approval-'));
  try {
    const snapshots = path.join(root, 'tests/browser/component-visual.review.ts-snapshots');
    await Promise.all(['scripts', 'src/catalogue', 'docs/design', 'tests/browser/component-visual.review.ts-snapshots'].map(dir => fs.mkdir(path.join(root, dir), { recursive: true })));
    const script = path.join(root, 'scripts/generate-component-visual-manifest.mjs');
    await fs.copyFile(path.resolve('scripts/generate-component-visual-manifest.mjs'), script);
    await fs.writeFile(path.join(root, 'src/catalogue/components.json'), JSON.stringify([{ id: 'component.button', api: { tag: 'ov-button' } }]));
    for (const name of ['ov-button-light-wide-darwin.png', 'ov-button-dark-wide-darwin.png', 'ov-button-light-narrow-darwin.png', 'catalogue-overview-light-narrow-darwin.png']) {
      await fs.writeFile(path.join(snapshots, name), `original ${name}`);
    }
    const run = (...args: string[]) => execFile(process.execPath, [script, ...args]);
    const read = async () => JSON.parse(await fs.readFile(path.join(root, 'docs/design/component-visual-manifest.json'), 'utf8'));
    await run('--approve', '--approval-source=fixture initial approval');
    const originalComponents = (await read()).components;
    await fs.writeFile(path.join(snapshots, 'catalogue-overview-light-narrow-darwin.png'), 'reviewed navigation');
    await run('--approve-overview', '--approval-source=fixture scoped approval');
    expect(await read()).toMatchObject({ releaseGate: true, catalogueOverviewDecision: 'pass', components: originalComponents });
    await fs.writeFile(path.join(snapshots, 'ov-button-dark-wide-darwin.png'), 'unreviewed component change');
    await run('--approve-overview');
    expect(await read()).toMatchObject({ releaseGate: false, catalogueOverviewDecision: 'pass', components: [{ decision: 'pending' }] });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
