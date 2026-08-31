import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const referenceUrl = 'http://127.0.0.1:4174/ui.html';
const viewports = [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'narrow', width: 375, height: 812 },
] as const;

async function openReference(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((selectedTheme) => localStorage.setItem('ovlira-theme', selectedTheme), theme);
  await page.goto(referenceUrl);
  await page.locator('.app').waitFor();
  await page.waitForFunction(() => !document.querySelector('[v-cloak]'));
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ['light', 'dark'] as const) {
  test(`authored reference has no automated accessibility violations in ${theme}`, async ({ page }) => {
    await openReference(page, theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
  });

  for (const viewport of viewports) {
    test(`authored reference ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openReference(page, theme);
      await expect(page).toHaveScreenshot(`design-reference-${theme}-${viewport.name}.png`, { fullPage: true });
    });
  }
}
