#!/usr/bin/env node
import { runCli } from './index.js';

// Keep the executable separate from the library module. npm and npx invoke a
// symlink in node_modules/.bin, so the CLI must not depend on argv[1] matching
// the source filename.
runCli(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
