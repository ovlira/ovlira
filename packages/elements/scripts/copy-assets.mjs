import { copyFile, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await Promise.all([
  copyFile(new URL('../src/default-theme.css', import.meta.url), new URL('../dist/default-theme.css', import.meta.url)),
  copyFile(new URL('../src/tokens.json', import.meta.url), new URL('../dist/tokens.json', import.meta.url)),
]);
