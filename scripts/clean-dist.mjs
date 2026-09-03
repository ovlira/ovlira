import { rm } from 'node:fs/promises';
import path from 'node:path';

const target = process.argv[2] ?? 'dist';
await rm(path.resolve(target), { recursive: true, force: true });
