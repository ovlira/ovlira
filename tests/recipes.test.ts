import { describe, expect, it } from 'vitest';
import { catalogue, recipes } from '../src/catalogue/index.js';
import { recipeFixtureMarkup, recipeFixtures } from '../src/recipes/fixtures.js';
import { validateCatalogue } from '../src/catalogue/validate.js';

describe('canonical recipe fixtures', () => {
  it('keeps catalogue dependencies and required states aligned with rendered markup', () => {
    for (const fixture of recipeFixtures) {
      const descriptor = recipes.find((recipe) => recipe.id === fixture.id);
      expect(descriptor, fixture.id).toBeDefined();

      const tags = [...recipeFixtureMarkup(fixture.id).matchAll(/<\/?(ov-[a-z-]+)/g)]
        .map((match) => match[1]);
      expect([...new Set(tags)].sort(), `${fixture.id} component dependencies`).toEqual([...descriptor!.components].sort());
      expect(fixture.states, `${fixture.id} required states`).toEqual(expect.arrayContaining(descriptor!.requiredStates));
      expect(descriptor!.contentRegions, `${fixture.id} content regions`).not.toHaveLength(0);
      expect(descriptor!.extensionPoints.data, `${fixture.id} data seams`).not.toHaveLength(0);
      expect(descriptor!.extensionPoints.actions, `${fixture.id} action seams`).not.toHaveLength(0);
      expect(descriptor!.extensionPoints.navigation, `${fixture.id} navigation seams`).not.toHaveLength(0);
    }
  });

  it('does not reintroduce card-heavy composition into the six screen fixtures', () => {
    for (const fixture of recipeFixtures) {
      expect(recipeFixtureMarkup(fixture.id), fixture.id).not.toContain('<ov-card');
    }
  });

  it('reports missing adaptation metadata without throwing', () => {
    const malformed = structuredClone(catalogue);
    const recipe = malformed.find((descriptor) => descriptor.id === 'page.settings') as Record<string, unknown>;
    delete recipe.contentRegions;
    delete recipe.extensionPoints;
    const report = validateCatalogue(malformed);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['metadata.recipe-content-regions', 'metadata.recipe-extension-points']));
  });
});
