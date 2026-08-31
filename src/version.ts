import { createRequire } from 'node:module';

interface PackageMetadata {
  version: string;
}

const packageMetadata = createRequire(import.meta.url)('../package.json') as PackageMetadata;

/** The package version exposed by the CLI and evaluation reports. */
export const packageVersion = packageMetadata.version;
