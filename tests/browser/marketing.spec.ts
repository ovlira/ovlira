import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { components } from '../../src/catalogue/index.js';

const marketingUrl = 'http://127.0.0.1:4321/catalogue/';

async function openMarketing(page: Page, theme: 'light' | 'dark' = 'light') {
  await page.goto(marketingUrl);
  await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
  await page.waitForFunction(() => Boolean(document.querySelector('[data-view="catalogue"]')));
  await page.evaluate(
    (tags) => Promise.all(tags.map((tag) => customElements.whenDefined(tag))),
    components.map((component) => component.api.tag),
  );
  await page.evaluate(() => document.fonts.ready);
}

async function settleComponents(root: Locator) {
  await root.evaluate(async (element) => {
    for (let pass = 0; pass < 3; pass += 1) {
      const elements = [element, ...element.querySelectorAll('*')];
      await Promise.all(elements.map((candidate) => {
        const updateComplete = (candidate as Element & { updateComplete?: Promise<unknown> }).updateComplete;
        return updateComplete ?? Promise.resolve();
      }));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
}

test('marketing surface follows the reference shell and exposes the agent loop', async ({ page }) => {
  await openMarketing(page);
  await expect(page.getByRole('complementary')).toContainText('Local UI guidance for coding agents.');
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/ovlira/ovlira');
  await expect(page.getByRole('link', { name: 'npm' })).toHaveAttribute('href', 'https://www.npmjs.com/package/@ovlira/cli');
  await page.getByRole('link', { name: 'Workflow', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Short, deterministic workflow', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Catalogue', exact: true }).first().click();
  await page.getByRole('button', { name: /page\.settings/ }).click();
  await expect(page.getByRole('heading', { name: 'page.settings', exact: true })).toBeVisible();
  await expect(page.getByText('npm run ovlira -- inspect page.settings --section guidance --json')).toBeVisible();
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

test('marketing navigation uses real routes for intro, install, and catalogue', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.getByRole('heading', { name: 'Human design. Agent composition.', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Install Ovlira', exact: true }).click();
  await expect(page).toHaveURL(/\/install\/$/);
  await expect(page.getByRole('heading', { name: 'Install once. Compose locally.', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Catalogue', exact: true }).first().click();
  await expect(page).toHaveURL(/\/catalogue\/$/);
  await expect(page.getByRole('heading', { name: 'Components and recipes', exact: true })).toBeVisible();
});

test('every primary sidebar destination renders its own page', async ({ page }) => {
  const routes = [
    ['/', 'Human design. Agent composition.'],
    ['/catalogue/', 'Components and recipes'],
    ['/workflow/', 'Short, deterministic workflow'],
    ['/install/', 'Install once. Compose locally.'],
    ['/tokens/', 'Replaceable design tokens'],
    ['/validation/', 'Source-level validation'],
  ] as const;
  for (const [route, heading] of routes) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : `${route}$`}`));
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
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
  await expect(page).toHaveURL(/entry=ov-button/);
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
  await expect(page).toHaveURL(/\/catalogue\/$/);
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(listPanel).toHaveCSS('grid-column-end', '-1');
});

test('catalogue preview coverage includes every shipped component', async ({ page }) => {
  await openMarketing(page);
  for (const id of components.map((component) => component.api.tag)) {
    await page.locator(`[data-catalogue-select="${id}"]`).click();
    await expect(page.locator('[data-component-preview]')).toBeVisible();
    if (id === 'ov-drawer') {
      await expect(page.locator('[data-component-preview] [data-drawer-open]')).toBeVisible();
      await expect(page.locator('[data-component-preview] ov-drawer')).toHaveCount(1);
    } else await expect(page.locator(`[data-component-preview] ${id}`).first()).toBeVisible();
  }
});

test('dialog preview exposes native semantics and an explicit close path', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-dialog"]').click();
  const host = page.locator('[data-component-preview] ov-dialog').first();
  const dialog = host.locator('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', /ov-dialog-/);
  await expect(dialog).toHaveAttribute('aria-describedby', /ov-dialog-/);
  await host.evaluate((element) => { (element as HTMLElement & { modal: boolean }).modal = true; });
  await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await host.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(host).not.toHaveAttribute('open');
  await expect(dialog).toBeHidden();
});

test('toggle preview renders a circular handle inside its track', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-toggle"]').click();
  const geometry = await page.locator('[data-component-preview] ov-toggle').first().evaluate((host) => {
    const root = host.shadowRoot;
    const track = root?.querySelector<HTMLElement>('.toggle-control')?.getBoundingClientRect();
    const thumb = root?.querySelector<HTMLElement>('.thumb')?.getBoundingClientRect();
    return { track: track && { width: track.width, height: track.height }, thumb: thumb && { width: thumb.width, height: thumb.height } };
  });
  expect(geometry.track?.width ?? 0).toBeGreaterThan(geometry.thumb?.width ?? 0);
  expect(geometry.thumb?.width ?? 0).toBeGreaterThan(10);
  expect(Math.abs((geometry.thumb?.width ?? 0) - (geometry.thumb?.height ?? 0))).toBeLessThan(0.5);
});

test('spinner preview exposes a polite loading status', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-spinner"]').click();
  const status = page.locator('[data-component-preview] [role="status"]').first();
  await expect(status).toContainText('Loading projects');
  await expect(status).toHaveAttribute('aria-live', 'polite');
});

test('menu preview opens, selects an action, and restores trigger focus', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-menu"]').click();
  const host = page.locator('[data-component-preview] ov-menu').first();
  await settleComponents(host);
  const trigger = host.locator('button.trigger');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(host.getByRole('menuitem', { name: 'Duplicate project' })).toBeVisible();
  await host.getByRole('menuitem', { name: 'Duplicate project' }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('menu keyboard navigation opens on Enter and closes on Escape', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-menu"]').click();
  const host = page.locator('[data-component-preview] ov-menu').first();
  await settleComponents(host);
  const trigger = host.locator('button.trigger');
  await trigger.press('Enter');
  await expect(host.getByRole('menuitem', { name: 'Duplicate project' })).toBeFocused();
  await host.getByRole('menuitem', { name: 'Duplicate project' }).press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('pagination preview exposes current page and navigation controls', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-pagination"]').click();
  const host = page.locator('[data-component-preview] ov-pagination').first();
  await expect(host.locator('[aria-current="page"]')).toHaveText('4');
  await expect(host.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  await expect(host.getByRole('button', { name: 'Next page' })).toBeEnabled();
});

test('combobox preview exposes filtering and listbox semantics', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-combobox"]').click();
  const host = page.locator('[data-component-preview] ov-combobox').first();
  const input = host.getByRole('combobox', { name: 'Project owner' });
  await input.click();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(host.getByRole('option')).toHaveCount(4);
  await input.fill('Maya');
  await expect(host.getByRole('option')).toHaveCount(1);
  await host.getByRole('option', { name: 'Maya Chen' }).click();
  await expect(input).toHaveValue('Maya Chen');
});

test('combobox keyboard navigation selects the active option', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-combobox"]').click();
  const host = page.locator('[data-component-preview] ov-combobox').first();
  const input = host.getByRole('combobox', { name: 'Project owner' });
  await input.click();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Maya Chen');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('combobox preview keeps the field and dropdown options compact', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-combobox"]').click();
  const host = page.locator('[data-component-preview] ov-combobox').first();
  const input = host.getByRole('combobox', { name: 'Project owner' });
  await input.click();
  const heights = await host.locator('input, [role="option"]').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(heights[0]).toBeLessThanOrEqual(40.5);
  expect(heights.slice(1).every((height) => height <= 40.5)).toBe(true);
});

test('tabs preview exposes related panels and keyboard selection', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-tabs"]').click();
  const host = page.locator('[data-component-preview] ov-tabs').first();
  await expect(host.getByRole('tablist')).toHaveAttribute('aria-label', 'Project views');
  await expect(host.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  await expect(host.locator('[slot="overview"]')).toContainText('A summary of the project.');
  await host.getByRole('tab', { name: 'Overview' }).press('ArrowRight');
  await expect(host.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
  await expect(host.locator('[slot="activity"]')).toContainText('Recent project activity.');
});

test('toast preview exposes a live region and dismissal control', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-toast"]').click();
  const host = page.locator('[data-component-preview] ov-toast').first();
  await expect(host).toContainText('Your project is up to date.');
  await host.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(host).not.toHaveAttribute('open');
});

test('progress preview exposes native progress value and label', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-progress"]').click();
  const host = page.locator('[data-component-preview] ov-progress').first();
  await expect.poll(() => host.locator('progress').evaluate((element) => String((element as HTMLProgressElement).value))).toBe('68');
  await expect(host.locator('[part="value"]')).toHaveText('68%');
  await expect(host.getByText('Importing projects', { exact: true })).toBeVisible();
});

test('skeleton preview remains decorative inside a busy region', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-skeleton"]').click();
  const host = page.locator('[data-component-preview]');
  await expect(host.locator('[aria-busy="true"]')).toHaveAttribute('aria-label', 'Loading project details');
  await expect(host.locator('ov-skeleton').first().locator('[aria-hidden="true"]')).toBeVisible();
  const boxes = await host.locator('ov-skeleton').evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom };
  }));
  expect(boxes[1]!.top - boxes[0]!.bottom).toBeGreaterThanOrEqual(16);
});

test('tooltip preview exposes supplemental content for keyboard users', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-tooltip"]').click();
  const host = page.locator('[data-component-preview] ov-tooltip').first();
  await settleComponents(host);
  const trigger = host.getByRole('button', { name: 'Search help' });
  await expect(trigger).toHaveAttribute('aria-describedby', /ov-tooltip-/);
  await trigger.focus();
  await expect(host.getByRole('tooltip')).toBeVisible();
  await expect(host.getByRole('tooltip')).toContainText('Keyboard shortcut: /');
  await trigger.press('Escape');
  await expect(host.getByRole('tooltip')).toBeHidden();
});

test('avatar preview exposes identity and presence semantics', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-avatar"]').click();
  const host = page.locator('[data-component-preview] ov-avatar').first();
  await expect(host.locator('[part="avatar"]')).toHaveAttribute('aria-label', 'Maya Chen, Online');
  await expect(host.locator('[part="initials"]')).toHaveText('MC');
  await expect(host.locator('[part="status"]')).toHaveAttribute('aria-hidden', 'true');
});

test('breadcrumbs preview links parent locations and marks the current page', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-breadcrumbs"]').click();
  const host = page.locator('[data-component-preview] ov-breadcrumbs').first();
  await expect(host.getByRole('navigation', { name: 'Project path' })).toBeVisible();
  await expect(host.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#catalogue');
  await expect(host.getByRole('link', { name: 'Northstar studio' })).toBeVisible();
  await expect(host.locator('[aria-current="page"]')).toHaveText('Settings');
});

test('accordion preview opens one disclosure at a time', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-accordion"]').click();
  const host = page.locator('[data-component-preview] ov-accordion').first();
  await expect(host.locator('summary')).toHaveCount(2);
  await host.locator('summary').first().click();
  await expect(host.locator('details').first()).toHaveAttribute('open', '');
  await expect(host.locator('[part="panel"]').first()).toBeVisible();
  await expect(host.locator('[slot="summary"]')).toContainText('A concise overview of the project.');
  await host.locator('summary').nth(1).click();
  await expect(host.locator('details').nth(1)).toHaveAttribute('open', '');
  await expect(host.locator('details').first()).not.toHaveAttribute('open');
});

test('slider preview exposes a labelled native range and current value', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-slider"]').click();
  const host = page.locator('[data-component-preview] ov-slider').first();
  const slider = host.getByRole('slider', { name: 'Opacity' });
  await expect(slider).toHaveValue('68');
  await expect(host.locator('[part="value"]')).toHaveText('68');
  await slider.fill('82');
  await expect(host.locator('[part="value"]')).toHaveText('82');
});

test('file upload preview keeps a native picker and selected file list', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-file-upload"]').click();
  const host = page.locator('[data-component-preview] ov-file-upload').first();
  const input = host.locator('input[type="file"]');
  await expect(input).toHaveAttribute('aria-labelledby', /ov-file-upload-/);
  await input.setInputFiles({ name: 'project.zip', mimeType: 'application/zip', buffer: Buffer.from('archive') });
  await expect(host.locator('[part="file-list"]')).toContainText('project.zip');
});

test('date input preview exposes native date constraints', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-date-input"]').click();
  const host = page.locator('[data-component-preview] ov-date-input').first();
  const input = host.locator('input[type="date"]');
  await expect(input).toHaveValue('2026-03-12');
  await expect(input).toHaveAttribute('min', '2026-01-01');
  await expect(input).toHaveCSS('box-sizing', 'border-box');
  await expect(input).toHaveCSS('height', '44px');
});

test('number input preview exposes native spinbutton constraints', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-number-input"]').click();
  const host = page.locator('[data-component-preview] ov-number-input').first();
  const input = host.getByRole('spinbutton', { name: 'Seats' });
  await expect(input).toHaveValue('4');
  await expect(input).toHaveAttribute('min', '1');
  await expect(input).toHaveAttribute('max', '24');
  await expect(input).toHaveAttribute('step', '1');
});

test('popover preview exposes a dismissible contextual surface', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-popover"]').click();
  const host = page.locator('[data-component-preview] ov-popover').first();
  const trigger = host.getByRole('button', { name: 'View details' });
  const surface = host.getByRole('dialog', { name: 'Project details' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(surface).toBeVisible();
  await expect(host).toContainText('Last updated a few minutes ago by Maya Chen.');
  await trigger.press('Escape');
  await expect(surface).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('tree preview exposes nested selection and keyboard navigation', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-tree"]').click();
  const host = page.locator('[data-component-preview] ov-tree').first();
  const tree = host.getByRole('tree', { name: 'Project files' });
  await expect(tree).toBeVisible();
  await expect(host.getByRole('treeitem', { name: 'main.ts' })).toHaveAttribute('aria-level', '2');
  await expect(host.getByRole('treeitem', { name: 'main.ts' })).toHaveAttribute('aria-selected', 'true');
  const source = host.getByRole('treeitem', { name: 'src' });
  await source.getByRole('button', { name: 'Collapse src' }).click();
  await expect(host.getByRole('treeitem', { name: 'main.ts' })).toBeHidden();
  await source.getByRole('button', { name: 'Expand src' }).click();
  await expect(host.getByRole('treeitem', { name: 'main.ts' })).toBeVisible();
});

test('stepper preview exposes current workflow progress', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-stepper"]').click();
  const host = page.locator('[data-component-preview] ov-stepper').first();
  await expect(host.locator('[part="step"]')).toHaveCount(3);
  await expect(host.locator('[part="step"][aria-current="step"] [part="label"]')).toHaveText('Access');
  await expect(host.locator('[part="step"][data-state="complete"]')).toHaveCount(1);
  await expect(host.locator('[part="connector"]')).toHaveCount(2);
  await expect(host.locator('[part="connector"]').nth(0)).toHaveAttribute('data-state', 'complete');
  await expect(host.locator('[part="connector"]').nth(1)).toHaveAttribute('data-state', 'current');
  const geometry = await host.evaluate((element) => {
    const steps = [...(element.shadowRoot?.querySelectorAll<HTMLElement>('[part="step"]') ?? [])];
    return steps.map((step) => {
      const marker = step.querySelector<HTMLElement>('[part="marker"]')?.getBoundingClientRect();
      const label = step.querySelector<HTMLElement>('[part="label"]')?.getBoundingClientRect();
      const connector = step.querySelector<HTMLElement>('[part="connector"]')?.getBoundingClientRect();
      return {
        markerCenter: marker ? marker.left + marker.width / 2 : 0,
        labelCenter: label ? label.left + label.width / 2 : 0,
        connectorRight: connector?.right ?? 0,
        markerLeft: marker?.left ?? 0,
      };
    });
  });
  for (const step of geometry) expect(Math.abs(step.markerCenter - step.labelCenter)).toBeLessThan(1);
  for (let index = 0; index < geometry.length - 1; index += 1) {
    expect(Math.abs((geometry[index]?.connectorRight ?? 0) - (geometry[index + 1]?.markerLeft ?? 0))).toBeLessThan(1);
  }
});

test('drawer preview opens a native side-panel dialog', async ({ page }) => {
  await openMarketing(page);
  await page.locator('[data-catalogue-select="ov-drawer"]').click();
  const host = page.locator('[data-component-preview] ov-drawer').first();
  const drawer = host.locator('dialog');
  const trigger = page.locator('[data-component-preview] [data-drawer-open]');
  await expect(trigger).toBeVisible();
  await expect(drawer).toBeHidden();
  await trigger.click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute('aria-labelledby', /ov-drawer-/);
  await expect(host).toContainText('Choose filters that apply to this view.');
  const apply = host.getByRole('button', { name: 'Apply filters', exact: true });
  await expect(apply).toBeVisible();
  const surfaceBox = await host.locator('[part="surface"]').boundingBox();
  const applyBox = await apply.boundingBox();
  expect(surfaceBox).not.toBeNull();
  expect(applyBox).not.toBeNull();
  expect((applyBox?.y ?? 0) + (applyBox?.height ?? 0)).toBeLessThanOrEqual((surfaceBox?.y ?? 0) + (surfaceBox?.height ?? 0) + 1);
  await host.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(drawer).toBeHidden();
});

for (const theme of ['light', 'dark'] as const) {
  test(`rendered button preview remains stable in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openMarketing(page, theme);
    await page.locator('[data-catalogue-select="ov-button"]').click();
    const preview = page.locator('[data-component-preview]');
    await settleComponents(preview);
    await expect(preview).toHaveScreenshot(`marketing-preview-button-${theme}.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [{ name: 'wide', width: 1440, height: 900 }, { name: 'narrow', width: 375, height: 812 }]) {
    test(`catalogue detail layout ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openMarketing(page, theme);
      await page.locator('[data-catalogue-select="ov-button"]').click();
      const detail = page.locator('[data-detail]');
      await expect(detail).toBeVisible();
      await settleComponents(detail);
      await expect(page).toHaveScreenshot(`marketing-detail-${theme}-${viewport.name}.png`, { fullPage: true });
    });
  }
}

test('marketing catalogue search and filters stay bounded', async ({ page }) => {
  await openMarketing(page);
  await page.getByRole('searchbox', { name: 'Search components and recipes' }).fill('page.settings');
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
  await page.getByRole('link', { name: 'Tokens', exact: true }).first().click();
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
