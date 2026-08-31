import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const manifestPath = path.resolve('docs/design/component-visual-manifest.json');
const cataloguePath = path.resolve('src/catalogue/components.json');
const snapshotsDirectory = path.resolve('tests/browser/component-visual.review.ts-snapshots');

describe('approved component visual manifest', () => {
  it('binds every approved catalogue screenshot to its current contents', async () => {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const catalogue = JSON.parse(await fs.readFile(cataloguePath, 'utf8'));

    expect(manifest).toMatchObject({
      version: 2,
      baselineStatus: 'approved',
      releaseGate: true,
      approval: { decision: 'pass' },
      catalogueOverviewDecision: 'pass',
    });
    expect(manifest.components).toHaveLength(catalogue.length);
    expect(manifest.components.map((component: { tag: string }) => component.tag)).toEqual(
      catalogue.map((component: { api: { tag: string } }) => component.api.tag),
    );

    const snapshots = [
      ...manifest.catalogueOverview,
      ...manifest.components.flatMap((component: { decision: string; snapshots: unknown[] }) => {
        expect(component.decision).toBe('pass');
        return component.snapshots;
      }),
    ];
    expect(new Set(snapshots.map((snapshot: { file: string }) => snapshot.file)).size).toBe(snapshots.length);

    for (const snapshot of snapshots as Array<{ file: string; sha256: string; status: string }>) {
      const contents = await fs.readFile(path.join(snapshotsDirectory, snapshot.file));
      expect(snapshot.status, snapshot.file).toBe('approved');
      expect(snapshot.sha256, snapshot.file).toBe(createHash('sha256').update(contents).digest('hex'));
    }
  });
});
