# Framework portability examples

These are minimal consumption snippets, not four framework packages. Import the custom-element module, use the stable tag, and use a ref/property assignment for array or object data. Native DOM events bubble from the custom element; framework-specific event typing can be layered on later.

- Lit: direct tags and property assignment.
- React: direct JSX tags; a ref/effect is the reliable bridge for non-string properties across React versions.
- Vue: configure Vite's `isCustomElement` for `ov-*`; use `.prop` or a ref for non-string properties.
- Angular: allow dash-case custom elements with `CUSTOM_ELEMENTS_SCHEMA`; set non-string properties through a view reference.

The snippets were documented from the current framework guidance. They intentionally do not add wrappers.
