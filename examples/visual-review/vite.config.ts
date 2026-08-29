import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(configDirectory, '../..');
const reviewBuildDirectory = path.join(repositoryRoot, 'reports', 'visual-review-dist');

export default defineConfig({
  root: configDirectory,
  server: { fs: { allow: [repositoryRoot] } },
  build: { outDir: reviewBuildDirectory, emptyOutDir: true },
});
