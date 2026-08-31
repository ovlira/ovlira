# Accordion

```html
<ov-accordion></ov-accordion>
```

```ts
const accordion = document.querySelector('ov-accordion')!;
accordion.items = [
  { value: 'summary', label: 'Project summary' },
  { value: 'members', label: 'Members' },
];
```

Provide panel content with a matching named slot, for example `slot="summary"`. Use disclosure for optional detail, not content users must compare at the same time.
