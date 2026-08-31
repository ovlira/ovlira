import type { ComponentDescriptor, Descriptor, RecipeDescriptor } from './types.js';

export interface MetadataIssue {
  code: string;
  path: string;
  message: string;
}

export interface MetadataReport {
  version: 1;
  valid: boolean;
  componentCount: number;
  recipeCount: number;
  issues: MetadataIssue[];
}

export function validateCatalogue(descriptors: Descriptor[]): MetadataReport {
  const issues: MetadataIssue[] = [];
  const ids = new Set<string>();
  const tags = new Set<string>();
  for (const [index, descriptor] of descriptors.entries()) {
    const path = `${descriptor.kind}[${index}]`;
    if (!descriptor.id || !descriptor.title || !descriptor.description) issues.push({ code: 'metadata.required', path, message: 'id, title, and description are required.' });
    if (ids.has(descriptor.id)) issues.push({ code: 'metadata.duplicate-id', path: `${path}.id`, message: `Duplicate descriptor ID “${descriptor.id}”.` });
    ids.add(descriptor.id);
    if (descriptor.kind === 'component') validateComponent(descriptor, path, tags, issues);
    else validateRecipe(descriptor, path, tags, issues);
  }
  const componentTags = new Set(descriptors.filter((descriptor): descriptor is ComponentDescriptor => descriptor.kind === 'component').map((descriptor) => descriptor.api.tag));
  for (const descriptor of descriptors.filter((item): item is RecipeDescriptor => item.kind === 'recipe')) {
    for (const tag of descriptor.components) if (!componentTags.has(tag)) issues.push({ code: 'recipe.unknown-component', path: `${descriptor.id}.components`, message: `Recipe references unknown component “${tag}”.` });
  }
  return { version: 1, valid: issues.length === 0, componentCount: descriptors.filter((descriptor) => descriptor.kind === 'component').length, recipeCount: descriptors.filter((descriptor) => descriptor.kind === 'recipe').length, issues };
}

function validateComponent(component: ComponentDescriptor, path: string, tags: Set<string>, issues: MetadataIssue[]) {
  if (!/^ov-[a-z0-9-]+$/.test(component.api.tag)) issues.push({ code: 'metadata.invalid-tag', path: `${path}.api.tag`, message: 'Component tags must be lowercase custom-element names beginning with ov-.' });
  if (tags.has(component.api.tag)) issues.push({ code: 'metadata.duplicate-tag', path: `${path}.api.tag`, message: `Duplicate component tag “${component.api.tag}”.` });
  tags.add(component.api.tag);
  const propNames = new Set<string>();
  for (const prop of component.api.props) {
    if (propNames.has(prop.name)) issues.push({ code: 'metadata.duplicate-prop', path: `${path}.api.props`, message: `Duplicate property “${prop.name}”.` });
    propNames.add(prop.name);
  }
  for (const required of component.guidance.requiredProps ?? []) if (!propNames.has(required)) issues.push({ code: 'metadata.required-prop-not-in-api', path: `${path}.guidance.requiredProps`, message: `Required property “${required}” is not present in the component API.` });
  if (!component.guidance.example) issues.push({ code: 'metadata.example-required', path: `${path}.guidance.example`, message: 'Every component needs an example path.' });
}

function validateRecipe(recipe: RecipeDescriptor, path: string, _tags: Set<string>, issues: MetadataIssue[]) {
  if (!recipe.components.length && recipe.requiredStates.length) issues.push({ code: 'metadata.recipe-components', path: `${path}.components`, message: 'A recipe with required states must name at least one component.' });
  if (new Set(recipe.requiredStates).size !== recipe.requiredStates.length) issues.push({ code: 'metadata.duplicate-state', path: `${path}.requiredStates`, message: 'Recipe required states must be unique.' });
  if (!recipe.example) issues.push({ code: 'metadata.example-required', path: `${path}.example`, message: 'Every recipe needs an example path.' });
  if (!Array.isArray(recipe.contentRegions) || !recipe.contentRegions.length) issues.push({ code: 'metadata.recipe-content-regions', path: `${path}.contentRegions`, message: 'Every recipe needs at least one content region for adaptation.' });
  for (const key of ['data', 'actions', 'navigation'] as const) {
    const extension = recipe.extensionPoints?.[key];
    if (!Array.isArray(extension) || !extension.length) issues.push({ code: 'metadata.recipe-extension-points', path: `${path}.extensionPoints.${key}`, message: `Every recipe needs at least one ${key} extension point.` });
  }
}
