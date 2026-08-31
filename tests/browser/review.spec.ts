import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { recipeFixtures } from '../../src/recipes/fixtures.js';
import { openFixture } from './helpers.js';

test('settings save exposes observable success feedback', async ({ page }) => {
  await openFixture(page, 'page.settings', 'success');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Your workspace details are up to date.')).toBeVisible();
});

test('search preserves the query and filters the result set', async ({ page }) => {
  await openFixture(page, 'page.search', 'results');
  await page.getByLabel('Search records').fill('Field notes');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('1 match')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Field notes' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Northstar studio' })).toHaveCount(0);
});

test('CRUD creation, detail editing, empty recovery, and shell navigation remain functional', async ({ page }) => {
  await openFixture(page, 'page.crud-table', 'records');
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByLabel('Project name').fill('Atlas');
  await page.getByRole('button', { name: 'Add project' }).click();
  await expect(page.getByText('The new project is ready to open.')).toBeVisible();

  await openFixture(page, 'page.detail', 'ready');
  await page.getByRole('button', { name: 'Edit record' }).click();
  await page.getByLabel('Record name').fill('Atlas');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('heading', { name: 'Atlas', exact: true })).toBeVisible();

  await openFixture(page, 'state.empty', 'empty');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByText('The new project is ready to open.')).toBeVisible();

  await openFixture(page, 'shell.application', 'default');
  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
});

for (const fixture of recipeFixtures) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${fixture.id} has no automated accessibility violations in ${theme}`, async ({ page }) => {
      await openFixture(page, fixture.id, fixture.defaultState, theme);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations, results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
    });
  }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
  test(`fixtures do not overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const fixture of recipeFixtures) {
      await openFixture(page, fixture.id, fixture.defaultState);
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document, fixture.id).toBeLessThanOrEqual(dimensions.viewport);
    }
  });
}

test('narrow interactive targets remain touch-sized', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const fixture of recipeFixtures) {
    await openFixture(page, fixture.id, fixture.defaultState);
    const controls = await page.getByRole('button').or(page.getByRole('link')).all();
    for (const control of controls) {
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      expect(box?.height ?? 0, `${fixture.id}: ${await control.getAttribute('aria-label') ?? await control.textContent()}`).toBeGreaterThanOrEqual(44);
    }
  }
});

