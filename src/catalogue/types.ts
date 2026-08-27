export type CatalogueKind = 'component' | 'recipe';

export interface ComponentProp {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  reflected?: boolean;
  default?: string;
}

export interface ComponentEvent {
  name: string;
  detail?: string;
  description: string;
}

export interface ComponentApi {
  tag: string;
  importPath: string;
  props: ComponentProp[];
  events: ComponentEvent[];
  slots: string[];
  cssCustomProperties: string[];
  parts: string[];
}

export interface ComponentGuidance {
  useWhen: string[];
  avoidWhen: string[];
  constraints: string[];
  requiredStates?: string[];
  requiredProps?: string[];
  disallowedChildren?: string[];
  example: string;
}

export interface ComponentDescriptor {
  id: string;
  kind: 'component';
  title: string;
  description: string;
  category: string;
  tags: string[];
  api: ComponentApi;
  guidance: ComponentGuidance;
}

export interface RecipeDescriptor {
  id: string;
  kind: 'recipe';
  title: string;
  description: string;
  category: string;
  tags: string[];
  useWhen: string[];
  avoidWhen: string[];
  components: string[];
  requiredStates: string[];
  constraints: string[];
  example: string;
  composition: string[];
}

export type Descriptor = ComponentDescriptor | RecipeDescriptor;

export interface ProjectManifest {
  version: 1;
  added: string[];
  recipes: string[];
  entry: string;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  ruleId: string;
  severity: DiagnosticSeverity;
  message: string;
  file?: string;
  line?: number;
  suggestion: string;
}
