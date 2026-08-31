# Stepper

```html
<ov-stepper></ov-stepper>
```

```ts
const stepper = document.querySelector('ov-stepper')!;
stepper.items = [
  { value: 'details', label: 'Details' },
  { value: 'access', label: 'Access' },
  { value: 'review', label: 'Review' },
];
stepper.value = 'access';
```

Use a stepper to show sequence and progress. Keep navigation and validation actions in the owning workflow.

The horizontal layout centers each marker over its label and uses a continuous connector between steps. Completed and active connectors are emphasized; upcoming connectors remain subdued. Set `orientation="vertical"` when the workflow needs more room for descriptions.
