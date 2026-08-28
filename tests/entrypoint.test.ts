import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function runNode(entry: string, args: string[]) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout, stderr }));
  });
}

describe('published CLI entrypoint', () => {
  it('runs when invoked through an npm-style .bin symlink', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-bin-'));
    const link = path.join(directory, 'ovlira');
    try {
      await fs.symlink(path.resolve('dist/cli/bin.js'), link);
      const result = await runNode(link, ['--version']);
      expect(result).toMatchObject({ code: 0, stderr: '' });
      expect(result.stdout.trim()).toBe('0.2.1');
      const help = await runNode(link, ['--help']);
      expect(help.code).toBe(0);
      expect(help.stdout).toContain('ovlira — local, agent-first UI building blocks');
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
