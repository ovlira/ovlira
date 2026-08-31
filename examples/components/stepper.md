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
