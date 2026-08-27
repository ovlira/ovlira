import componentData from './components.json' with { type: 'json' };
import recipeData from './recipes.json' with { type: 'json' };
import type { ComponentDescriptor, Descriptor, RecipeDescriptor } from './types.js';
import { validateCatalogue, type MetadataReport } from './validate.js';

export const components = componentData as ComponentDescriptor[];
export const recipes = recipeData as RecipeDescriptor[];
export const catalogue: Descriptor[] = [...components, ...recipes];
export const metadataReport: MetadataReport = validateCatalogue(catalogue);
export const catalogueSchemaVersion = 1 as const;

export interface RegistryIndex {
  byId: Record<string, string>;
  byTag: Record<string, string>;
  byCategory: Record<string, string[]>;
}

export const registryIndex: RegistryIndex = catalogue.reduce<RegistryIndex>((index, item) => {
  index.byId[item.id] = item.id;
  index.byCategory[item.category] ??= [];
  index.byCategory[item.category].push(item.id);
  if (item.kind === 'component') index.byTag[item.api.tag] = item.id;
  return index;
}, { byId: {}, byTag: {}, byCategory: {} });

export function resolveDescriptor(idOrTag: string): Descriptor | undefined {
  const query = idOrTag.toLowerCase();
  return catalogue.find((item) => {
    if (item.id.toLowerCase() === query) return true;
    if (item.kind === 'component') {
      return item.api.tag.toLowerCase() === query || item.title.toLowerCase().replaceAll(' ', '-') === query;
    }
    return item.title.toLowerCase().replaceAll(' ', '.') === query;
  });
}

export function componentForTag(tag: string): ComponentDescriptor | undefined {
  return components.find((item) => item.api.tag === tag);
}

export function searchCatalogue(query: string): Descriptor[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return catalogue.slice();
  return catalogue
    .map((item, index) => {
      const haystack = [item.id, item.title, item.description, item.category, ...item.tags].join(' ').toLowerCase();
      const score = terms.reduce((total, term) => {
        if (item.id.toLowerCase() === term) return total + 100;
        if (item.id.toLowerCase().includes(term)) return total + 30;
        if (item.title.toLowerCase().includes(term)) return total + 20;
        if (item.tags.some((tag) => tag.toLowerCase() === term)) return total + 15;
        if (haystack.includes(term)) return total + 5;
        return total;
      }, 0);
      return { item, score, index };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}
