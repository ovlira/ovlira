import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const marketingUrl = 'http://127.0.0.1:4321/';

async function openMarketing(page: import('@playwright/test').Page, theme: 'light' | 'dark' = 'light') {
  await page.goto(marketingUrl);
  await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
  await page.waitForFunction(() => Boolean(document.querySelector('[data-view="catalogue"]')));
  await page.evaluate(() => document.fonts.ready);
}

test('marketing surface follows the reference shell and exposes the agent loop', async ({ page }) => {
  await openMarketing(page);
  await expect(page.getByRole('complementary')).toContainText('Local UI guidance for coding agents.');
  await page.getByRole('button', { name: 'Workflow', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Short, deterministic workflow', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Catalogue', exact: true }).first().click();
  await page.getByRole('button', { name: /page\.settings/ }).click();
  await expect(page.getByRole('heading', { name: 'page.settings', exact: true })).toBeVisible();
  await expect(page.getByText('ovlira inspect page.settings --section guidance --json')).toBeVisible();
});

test('catalogue inspection renders the shipped component preview', async ({ page }) => {
  await openMarketing(page);
  await page.getByRole('button', { name: /ov-button/ }).click();
  await expect(page.getByRole('heading', { name: 'Rendered preview', exact: true })).toBeVisible();
  const preview = page.locator('[data-component-preview]');
  await expect(preview.locator('ov-button').first()).toBeVisible();
  await expect(preview.locator('ov-button').first()).toContainText('Save changes');
  await expect(preview.locator('ov-button[loading]').locator('button')).toBeDisabled();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations, results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
});

test('catalogue uses a desktop master detail split and a mobile detail replacement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openMarketing(page);
  const listPanel = page.locator('[data-catalogue-list-panel]');
  const detail = page.locator('[data-detail]');
  const button = page.locator('[data-catalogue-select="ov-button"]');

  await expect(listPanel).toBeVisible();
  await expect(detail).toBeHidden();
  await expect(listPanel).toHaveCSS('grid-column-end', '-1');
  await button.click();
  await expect(listPanel).toBeVisible();
  await expect(detail).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to catalogue', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await expect(button).toHaveClass(/selected/);
  await expect(button).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(listPanel).toBeHidden();
  await expect(detail).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to catalogue', exact: true })).toBeVisible();
  const mobileResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(mobileResults.violations, mobileResults.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);

  await page.getByRole('button', { name: 'Back to catalogue', exact: true }).click();
  await expect(listPanel).toBeVisible();
  await expect(detail).toBeHidden();
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(listPanel).toHaveCSS('grid-column-end', '-1');
});

test('catalogue preview coverage includes every shipped component', async ({ page }) => {
  await openMarketing(page);
  for (const id of ['ov-button', 'ov-input', 'ov-select', 'ov-badge', 'ov-card', 'ov-alert', 'ov-page-header', 'ov-empty-state', 'ov-data-table', 'ov-application-shell']) {
    await page.locator(`[data-catalogue-select="${id}"]`).click();
    await expect(page.locator('[data-component-preview]')).toBeVisible();
    await expect(page.locator(`[data-component-preview] ${id}`).first()).toBeVisible();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`rendered button preview remains stable in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openMarketing(page, theme);
    await page.locator('[data-catalogue-select="ov-button"]').click();
    await expect(page.locator('[data-component-preview]')).toHaveScreenshot(`marketing-preview-button-${theme}.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [{ name: 'wide', width: 1440, height: 900 }, { name: 'narrow', width: 375, height: 812 }]) {
    test(`catalogue detail layout ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openMarketing(page, theme);
      await page.locator('[data-catalogue-select="ov-button"]').click();
      await expect(page.locator('[data-detail]')).toBeVisible();
      await expect(page).toHaveScreenshot(`marketing-detail-${theme}-${viewport.name}.png`, { fullPage: true });
    });
  }
}

test('marketing catalogue search and filters stay bounded', async ({ page }) => {
  await openMarketing(page);
  await page.getByRole('searchbox', { name: 'Search components and recipes' }).fill('settings');
  await expect(page.getByText('1 entry')).toBeVisible();
  await expect(page.getByRole('button', { name: /page\.settings/ })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search components and recipes' }).fill('');
  await page.getByRole('button', { name: 'Recipes', exact: true }).click();
  await expect(page.getByText('6 entries')).toBeVisible();
});

test('marketing theme and navigation controls are observable', async ({ page }) => {
  await openMarketing(page);
  await page.getByRole('button', { name: /Switch to dark theme/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Tokens', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Replaceable design tokens', exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`marketing surface has no automated accessibility violations in ${theme}`, async ({ page }) => {
    await openMarketing(page, theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
  test(`marketing surface does not overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openMarketing(page);
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document, `marketing at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.viewport);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [{ name: 'wide', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'narrow', width: 375, height: 812 }]) {
    test(`marketing surface ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openMarketing(page, theme);
      await expect(page).toHaveScreenshot(`marketing-${theme}-${viewport.name}.png`, { fullPage: true });
    });
  }
}

test('marketing interactive targets remain touch-sized on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openMarketing(page);
  const controls = await page.getByRole('button').or(page.getByRole('link')).all();
  for (const control of controls) {
    if (!await control.isVisible()) continue;
    const box = await control.boundingBox();
    expect(box?.height ?? 0, await control.textContent()).toBeGreaterThanOrEqual(44);
  }
});
