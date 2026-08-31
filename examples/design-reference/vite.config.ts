import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(configDirectory, '../..');

export default defineConfig({
  root: repositoryRoot,
  server: { fs: { allow: [repositoryRoot] } },
  build: {
    outDir: path.join(repositoryRoot, 'reports', 'design-reference-dist'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(repositoryRoot, 'ui.html') },
  },
});

