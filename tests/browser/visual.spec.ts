import { expect, test } from '@playwright/test';
import { recipeFixtures } from '../../src/recipes/fixtures.js';
import { openFixture } from './helpers.js';

const viewports = [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'narrow', width: 375, height: 812 },
] as const;
const themes = ['light', 'dark', 'contrast'] as const;

for (const fixture of recipeFixtures) {
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`${fixture.id} ${fixture.defaultState} ${theme} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openFixture(page, fixture.id, fixture.defaultState, theme);
        await expect(page).toHaveScreenshot(`${fixture.id}-${fixture.defaultState}-${theme}-${viewport.name}.png`, { fullPage: true });
      });
    }

    for (const state of fixture.states.filter((state) => state !== fixture.defaultState)) {
      test(`${fixture.id} ${state} ${theme} wide`, async ({ page }) => {
        await page.setViewportSize(viewports[0]);
        await openFixture(page, fixture.id, state, theme);
        await expect(page).toHaveScreenshot(`${fixture.id}-${state}-${theme}-wide.png`, { fullPage: true });
      });
    }
  }
}
