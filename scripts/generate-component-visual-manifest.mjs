import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cataloguePath = path.join(repositoryRoot, 'src', 'catalogue', 'components.json');
const snapshotsDirectory = path.join(repositoryRoot, 'tests', 'browser', 'component-visual.review.ts-snapshots');
const manifestPath = path.join(repositoryRoot, 'docs', 'design', 'component-visual-manifest.json');
const approve = process.argv.includes('--approve');
const approveOverview = process.argv.includes('--approve-overview');
const approvalSource = readOption('--approval-source') ?? 'user-confirmed review';

const components = JSON.parse(await fs.readFile(cataloguePath, 'utf8'));
const snapshotFiles = (await fs.readdir(snapshotsDirectory)).filter((file) => file.endsWith('.png')).sort();
const snapshotHashes = new Map(await Promise.all(snapshotFiles.map(async (file) => [file, await hashFile(path.join(snapshotsDirectory, file))])));
const existing = await readExistingManifest();
const existingReviews = new Map((existing.components ?? []).map((component) => [component.tag, component]));

const reviewComponents = components.map((component) => {
  const tag = component.api.tag;
  const snapshots = snapshotFiles
    .filter((file) => file.startsWith(`${tag}-`))
    .map((file) => parseComponentSnapshot(tag, file, snapshotHashes.get(file)));
  const required = [
    `${tag}-light-wide-darwin.png`,
    `${tag}-dark-wide-darwin.png`,
    `${tag}-light-narrow-darwin.png`,
  ];
  const missing = required.filter((file) => !snapshotFiles.includes(file));
  if (missing.length) throw new Error(`${tag} is missing candidate snapshots: ${missing.join(', ')}`);
  const previous = existingReviews.get(tag);
  const decision = approve || (previous?.decision === 'pass' && sameSnapshotSet(previous.snapshots, snapshots)) ? 'pass' : 'pending';
  return {
    tag,
    descriptorId: component.id,
    decision,
    reviewNotes: previous?.reviewNotes ?? '',
    snapshots: snapshots.map((snapshot) => ({ ...snapshot, status: decision === 'pass' ? 'approved' : 'candidate' })),
  };
});

const currentCatalogueOverview = snapshotFiles
  .filter((file) => file.startsWith('catalogue-'))
  .map((file) => ({ file, sha256: snapshotHashes.get(file) }));
const catalogueOverviewDecision = approve || approveOverview || (
  existing.catalogueOverviewDecision === 'pass'
  && sameSnapshotSet(existing.catalogueOverview, currentCatalogueOverview)
) ? 'pass' : 'pending';
const catalogueOverview = currentCatalogueOverview.map((snapshot) => ({
  ...snapshot,
  status: catalogueOverviewDecision === 'pass' ? 'approved' : 'candidate',
}));
const allPassed = catalogueOverviewDecision === 'pass' && reviewComponents.every((component) => component.decision === 'pass');
const approval = allPassed
  ? (approve || approveOverview ? { decision: 'pass', date: new Date().toISOString().slice(0, 10), source: approvalSource } : existing.approval)
  : null;

const manifest = {
  version: 2,
  catalogue: '../../src/catalogue/components.json',
  suite: '../../tests/browser/component-visual.review.ts',
  config: '../../playwright.component-visual.config.ts',
  screenshots: '../../tests/browser/component-visual.review.ts-snapshots',
  viewports: [
    { name: 'wide', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024, scope: 'catalogue overview only' },
    { name: 'narrow', width: 375, height: 812 },
  ],
  schemes: ['light', 'dark'],
  baselineStatus: allPassed ? 'approved' : 'candidate',
  releaseGate: allPassed,
  approval,
  catalogueOverviewDecision,
  catalogueOverview,
  components: reviewComponents,
  observations: (existing.observations ?? [{
    component: 'ov-drawer',
    theme: 'light',
    viewport: 'wide',
    state: 'open',
    status: 'needs-human-review',
    detail: 'The public contract declares right as the default placement, but the candidate capture renders the panel on the left.',
  }]).map((observation) => approve && observation.status === 'needs-human-review'
    ? { ...observation, status: 'accepted-in-review' }
    : observation),
  notes: [
    'The suite derives its default component matrix from the catalogue rather than duplicating a component list.',
    'State captures are derived from public API properties plus bounded component-specific scenarios.',
    'A changed or newly added screenshot resets its review decision to pending on manifest regeneration.',
  ],
};

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Component visual manifest: ${reviewComponents.length} components, ${snapshotFiles.length} screenshots, ${manifest.baselineStatus}.`);

function parseComponentSnapshot(tag, file, sha256) {
  const suffix = file.slice(tag.length + 1);
  const match = /^(light|dark)-(wide|narrow)(?:-(.+))?-darwin\.png$/.exec(suffix);
  if (!match) throw new Error(`Unrecognized component snapshot name: ${file}`);
  return {
    file,
    sha256,
    theme: match[1],
    viewport: match[2],
    state: match[3] ?? 'default',
  };
}

function sameSnapshotSet(previous = [], current = []) {
  return previous.length === current.length && current.every((snapshot, index) => {
    const prior = previous[index];
    return prior?.file === snapshot.file && prior?.sha256 === snapshot.sha256;
  });
}

async function hashFile(file) {
  return createHash('sha256').update(await fs.readFile(file)).digest('hex');
}

function readOption(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function readExistingManifest() {
  try {
    const value = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return {};
    throw error;
  }
}
