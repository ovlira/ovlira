// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { build, type Rollup } from 'vite';

async function bundle(source: string) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-bundle-'));
  const entry = path.join(directory, 'entry.js');
  await fs.writeFile(entry, source);
  const output = await build({
    logLevel: 'silent',
    resolve: {
      preserveSymlinks: true,
      alias: [{ find: '@ovlira/elements', replacement: path.join(process.cwd(), 'packages/elements/dist') }],
    },
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: entry },
    },
  }) as Rollup.RollupOutput;
  return output.output.filter((item): item is Rollup.OutputChunk => item.type === 'chunk').map((item) => item.code).join('\n');
}

describe('@ovlira/elements package consumption', () => {
  it('bundles only explicitly imported component modules', async () => {
    const button = await bundle("import '@ovlira/elements/button.js';");
    expect(button).toContain('ov-button');
    expect(button).not.toContain('ov-tooltip');
    expect(button).not.toContain('ov-tree');

    const selected = await bundle("import '@ovlira/elements/button.js'; import '@ovlira/elements/tooltip.js';");
    expect(selected).toContain('ov-button');
    expect(selected).toContain('ov-tooltip');
    expect(selected).not.toContain('ov-tree');
  });

  it('retains an explicit register-all convenience entry', async () => {
    const all = await bundle("import '@ovlira/elements/register-all.js';");
    expect(all).toContain('ov-button');
    expect(all).toContain('ov-tooltip');
    expect(all).toContain('ov-tree');
  });
});
