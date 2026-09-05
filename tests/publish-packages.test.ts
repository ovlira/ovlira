// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { publishCandidate } from '../scripts/publish-packages.mjs';

const candidate = { name: '@ovlira/elements', version: '0.4.0', integrity: 'sha512-candidate', tarball: '/tmp/candidate.tgz' };

it('skips only an identical already-published artifact', async () => {
  const run = vi.fn().mockResolvedValue({ stdout: JSON.stringify(candidate.integrity) });
  expect(await publishCandidate(candidate, run)).toBe('already-published-identical');
  expect(run).toHaveBeenCalledTimes(1);
});
it('refuses a published artifact with different integrity', async () => {
  const run = vi.fn().mockResolvedValue({ stdout: JSON.stringify('sha512-other') });
  await expect(publishCandidate(candidate, run)).rejects.toThrow('different integrity');
  expect(run).toHaveBeenCalledTimes(1);
});
it('publishes an absent candidate but does not treat authentication failure as absence', async () => {
  const run = vi.fn().mockRejectedValueOnce({ stdout: JSON.stringify({ error: { code: 'E404' } }) }).mockResolvedValueOnce({ stdout: '' });
  expect(await publishCandidate(candidate, run)).toBe('published');
  expect(run).toHaveBeenLastCalledWith('npm', ['publish', '/tmp/candidate.tgz', '--access', 'public']);
  const unauthorized = { stdout: JSON.stringify({ error: { code: 'E401' } }) };
  const denied = vi.fn().mockRejectedValue(unauthorized);
  await expect(publishCandidate(candidate, denied)).rejects.toBe(unauthorized);
  expect(denied).toHaveBeenCalledTimes(1);
});
