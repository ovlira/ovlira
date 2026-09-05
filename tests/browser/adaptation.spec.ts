import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const domains = [
  { id: 'customers', title: 'Customers', singular: 'customer', owner: 'Owner', status: 'Lifecycle stage' },
  { id: 'equipment', title: 'Equipment', singular: 'asset', owner: 'Location', status: 'Availability' },
  { id: 'editorial', title: 'Articles', singular: 'article', owner: 'Editor', status: 'Publication status' },
];
for (const domain of domains) for (const theme of ['light', 'dark']) for (const width of [375, 1440]) {
  test(`${domain.id} ${theme} ${width}: create, validate, navigate and recover`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:4175/?domain=${domain.id}&theme=${theme}&empty=1&fail=1`);
    await expect(page.getByText('Could not load records', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('No records yet', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Create ${domain.singular}` }).click();
    await expect(page.getByLabel('Name')).toBeFocused();
    await page.getByRole('button', { name: `Add ${domain.singular}` }).click();
    await expect(page.getByText('Enter a name.', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell')).toHaveCount(0);
    await page.getByLabel('Name').fill('Atlas <draft>');
    await page.getByLabel(domain.owner).fill('Team');
    await page.getByLabel(domain.status).fill('Ready');
    await page.getByLabel(domain.status).press('Enter');
    await expect(page.getByText('Record created', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Atlas <draft>', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Open record' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Open record' })).toBeDisabled();
    await page.getByRole('combobox', { name: 'Open record' }).selectOption('2');
    await expect(page.getByRole('combobox', { name: 'Open record' })).toHaveValue('2');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('collection.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open record' }).click();
    await expect(page).toHaveURL(/#record\/2$/);
    await expect(page.getByRole('heading', { name: 'Atlas <draft>', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('detail.png'), fullPage: true });
    await page.goBack();
    await expect(page.getByRole('heading', { name: domain.title, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Atlas <draft>', exact: true })).toBeVisible();
  });
}
