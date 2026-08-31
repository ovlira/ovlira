import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const manifestPath = path.resolve('docs/design/reference-manifest.json');
const themePath = path.resolve('docs/design/ovlira-contrast-theme.css');
const snapshotDirectories = [
  path.resolve('tests/browser/reference.spec.ts-snapshots'),
  path.resolve('tests/browser/visual.spec.ts-snapshots'),
];

describe('approved contrasting-theme evidence', () => {
  it('matches the approved artifact and rendered baseline contents', async () => {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const contrast = manifest.contrastingTheme;
    expect(manifest.contrastingThemeStatus).toBe('approved');
    expect(contrast).toMatchObject({
      selector: 'contrast',
      approval: { decision: 'pass' },
      baselineStatus: 'approved',
      baselineApproval: { decision: 'pass' },
      evidence: { snapshotCount: 33 },
    });

    const artifact = await fs.readFile(themePath);
    expect(contrast.artifactSha256).toBe(createHash('sha256').update(artifact).digest('hex'));

    const snapshots = (await Promise.all(snapshotDirectories.map(async (directory) => {
      const files = await fs.readdir(directory);
      return files
        .filter((file) => file.includes('-contrast-') && file.endsWith('-darwin.png'))
        .map((file) => path.join(directory, file));
    }))).flat().sort();
    expect(snapshots).toHaveLength(contrast.evidence.snapshotCount);

    const evidence = createHash('sha256');
    for (const snapshot of snapshots) {
      const relative = path.relative(process.cwd(), snapshot);
      evidence.update(relative);
      evidence.update('\0');
      evidence.update(await fs.readFile(snapshot));
      evidence.update('\0');
    }
    expect(contrast.evidence.sha256).toBe(evidence.digest('hex'));
  });
});
