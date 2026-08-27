# Spike 002 — Framework portability

## Question

Can an Ovlira Lit component be consumed cleanly from Lit, React, Vue, and Angular?

## Experiment

Wrote minimal examples under `examples/frameworks/` using `ov-button` and `ov-select`. The examples use native tags, a ref/property assignment for non-string data, and DOM event listeners where framework event typing is uncertain.

## Result

Lit and plain HTML are direct. Vue supports custom-element configuration and property binding. Angular needs `CUSTOM_ELEMENTS_SCHEMA` and property assignment for arrays. React can render the tag, but reliable non-string property binding and dashed event names deserve a ref/effect bridge across React versions.

## Decision

Ship one Lit implementation and document small framework-specific consumption patterns. Do not add wrappers or automatic conversion in v0.1.

## Consequence for Ovlira

Portability means the component layer can travel between stacks, not that every framework receives identical authoring ergonomics.

References: [React custom elements](https://react.dev/reference/react-dom/components), [Vue and Web Components](https://vuejs.org/guide/extras/web-components), [Angular Elements](https://angular.dev/guide/elements).
