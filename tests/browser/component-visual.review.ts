import { expect, test, type Locator, type Page } from '@playwright/test';
import { components } from '../../src/catalogue/index.js';

type Theme = 'light' | 'dark';
type SnapshotTarget = 'preview' | 'viewport';

interface ManualScenario {
  name: string;
  run: (page: Page, preview: Locator) => Promise<void>;
  target?: SnapshotTarget;
}

const marketingUrl = 'http://127.0.0.1:4321/';
const wide = { width: 1440, height: 900 };
const narrow = { width: 375, height: 812 };
const catalogueViewports = [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'narrow', width: 375, height: 812 },
] as const;
const automaticStateProperties = ['loading', 'disabled', 'error', 'open'] as const;

const manualScenarios: Record<string, ManualScenario[]> = {
  'ov-tabs': [{
    name: 'selected',
    run: async (_page, preview) => setHostProperty(preview, 'ov-tabs', 'value', 'activity'),
  }],
  'ov-pagination': [{
    name: 'selected',
    run: async (_page, preview) => setHostProperty(preview, 'ov-pagination', 'currentPage', 8),
  }],
  'ov-accordion': [{
    name: 'expanded',
    run: async (_page, preview) => {
      await preview.locator('ov-accordion').locator('summary').first().click();
    },
  }],
  'ov-file-upload': [{
    name: 'populated',
    run: async (_page, preview) => {
      await preview.locator('ov-file-upload').locator('input[type="file"]').setInputFiles({
        name: 'project.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('candidate visual fixture'),
      });
    },
  }],
  'ov-stepper': [{
    name: 'selected',
    run: async (_page, preview) => setHostProperty(preview, 'ov-stepper', 'value', 'review'),
  }],
  'ov-tree': [{
    name: 'selected',
    run: async (_page, preview) => setHostProperty(preview, 'ov-tree', 'value', 'readme'),
  }, {
    name: 'collapsed',
    run: async (_page, preview) => {
      await preview.locator('ov-tree').getByRole('button', { name: 'Collapse src' }).click();
    },
  }],
};

for (const component of components) {
  const tag = component.api.tag;

  test.describe(tag, () => {
    for (const theme of ['light', 'dark'] as const) {
      test(`${theme} wide default`, async ({ page }) => {
        const preview = await openComponentPreview(page, tag, theme, wide);
        await expect(preview).toHaveScreenshot(`${tag}-${theme}-wide.png`);
      });
    }

    test('light narrow default', async ({ page }) => {
      const preview = await openComponentPreview(page, tag, 'light', narrow);
      await expect(preview).toHaveScreenshot(
        `${tag}-light-narrow.png`,
        tag === 'ov-date-input'
          ? { maxDiffPixels: 150, maxDiffPixelRatio: 0.02 } // Native date-picker chrome varies slightly across macOS patch releases.
          : undefined,
      );
    });

    const propNames = new Set(component.api.props.map((prop) => prop.name));
    for (const property of automaticStateProperties.filter((candidate) => propNames.has(candidate))) {
      test(`light wide ${property}`, async ({ page }) => {
        const preview = await openComponentPreview(page, tag, 'light', wide);
        await setHostProperty(preview, tag, property, property === 'error' ? 'Review this field before continuing.' : true);
        await captureState(page, preview, `${tag}-light-wide-${property}.png`, property === 'open' ? 'viewport' : 'preview');
      });
    }

    for (const scenario of manualScenarios[tag] ?? []) {
      test(`light wide ${scenario.name}`, async ({ page }) => {
        const preview = await openComponentPreview(page, tag, 'light', wide);
        await scenario.run(page, preview);
        await settleComponents(preview);
        await captureState(page, preview, `${tag}-light-wide-${scenario.name}.png`, scenario.target ?? 'preview');
      });
    }
  });
}

test('manual scenarios only reference catalogue components', () => {
  const tags = new Set(components.map((component) => component.api.tag));
  expect(Object.keys(manualScenarios).filter((tag) => !tags.has(tag))).toEqual([]);
});

test.describe('expanded catalogue candidates', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of catalogueViewports) {
      test(`${theme} ${viewport.name} overview`, async ({ page }) => {
        await openMarketingReview(page, theme, viewport);
        await expect(page).toHaveScreenshot(`catalogue-overview-${theme}-${viewport.name}.png`, { fullPage: true });
      });
    }

    test(`${theme} wide detail`, async ({ page }) => {
      await openMarketingReview(page, theme, wide);
      await page.locator('[data-catalogue-select="ov-button"]').click();
      await expect(page.locator('[data-detail]')).toBeVisible();
      await expect(page).toHaveScreenshot(`catalogue-detail-${theme}-wide.png`, { fullPage: true });
    });
  }
});

async function openComponentPreview(page: Page, tag: string, theme: Theme, viewport: { width: number; height: number }) {
  await openMarketingReview(page, theme, viewport);
  await page.getByRole('searchbox', { name: 'Search components and recipes' }).fill(tag);
  await page.locator(`[data-catalogue-select="${tag}"]`).click();
  const preview = page.locator('[data-component-preview]');
  await expect(preview).toBeVisible();
  await expect(preview.locator(tag).first()).toHaveCount(1);
  await settleComponents(preview);
  return preview;
}

async function openMarketingReview(page: Page, theme: Theme, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(marketingUrl);
  await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
  await page.waitForFunction(() => Boolean(document.querySelector('[data-view="catalogue"]')));
  await page.evaluate(() => document.fonts.ready);
}

async function setHostProperty(preview: Locator, tag: string, property: string, value: unknown) {
  const host = preview.locator(tag).first();
  await host.evaluate((element, next) => {
    (element as HTMLElement & Record<string, unknown>)[next.property] = next.value;
  }, { property, value });
  await settleComponents(preview);
}

async function settleComponents(preview: Locator) {
  await preview.evaluate(async (root) => {
    const elements = [root, ...root.querySelectorAll('*')];
    await Promise.all(elements.map((element) => {
      const updateComplete = (element as Element & { updateComplete?: Promise<unknown> }).updateComplete;
      return updateComplete ?? Promise.resolve();
    }));
  });
}

async function captureState(page: Page, preview: Locator, name: string, target: SnapshotTarget) {
  if (target === 'viewport') await expect(page).toHaveScreenshot(name, { fullPage: false });
  else await expect(preview).toHaveScreenshot(name);
}
