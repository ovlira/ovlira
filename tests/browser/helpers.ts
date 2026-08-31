import type { Page } from '@playwright/test';
import type { RecipeFixtureId } from '../../src/recipes/fixtures.js';

export type ReviewTheme = 'light' | 'dark' | 'contrast';

export async function openFixture(page: Page, recipe: RecipeFixtureId, state: string, theme: ReviewTheme = 'light') {
  const params = new URLSearchParams({ mode: 'fixture', recipe, state, theme });
  await page.goto(`/?${params}`);
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.evaluate(() => document.fonts.ready);
}
