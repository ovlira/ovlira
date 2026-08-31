import { describe, expect, it } from 'vitest';
import { recipes } from '../src/catalogue/index.js';
import { recipeFixtureMarkup, recipeFixtures } from '../src/recipes/fixtures.js';

describe('canonical recipe fixtures', () => {
  it('keeps catalogue dependencies and required states aligned with rendered markup', () => {
    for (const fixture of recipeFixtures) {
      const descriptor = recipes.find((recipe) => recipe.id === fixture.id);
      expect(descriptor, fixture.id).toBeDefined();

      const tags = [...recipeFixtureMarkup(fixture.id).matchAll(/<\/?(ov-[a-z-]+)/g)]
        .map((match) => match[1]);
      expect([...new Set(tags)].sort(), `${fixture.id} component dependencies`).toEqual([...descriptor!.components].sort());
      expect(fixture.states, `${fixture.id} required states`).toEqual(expect.arrayContaining(descriptor!.requiredStates));
    }
  });

  it('does not reintroduce card-heavy composition into the six screen fixtures', () => {
    for (const fixture of recipeFixtures) {
      expect(recipeFixtureMarkup(fixture.id), fixture.id).not.toContain('<ov-card');
    }
  });
});
