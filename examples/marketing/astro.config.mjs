import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ovlira.dev',
  devToolbar: { enabled: false },
  outDir: '../../reports/marketing-dist',
  build: { format: 'directory' },
});
