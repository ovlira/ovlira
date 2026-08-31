# Breadcrumbs

```html
<ov-breadcrumbs label="Project path"></ov-breadcrumbs>
```

```ts
const breadcrumbs = document.querySelector('ov-breadcrumbs')!;
breadcrumbs.items = [
  { label: 'Projects', href: '/projects' },
  { label: 'Northstar studio', href: '/projects/northstar' },
  { label: 'Settings' },
];
```

Use real links for parent locations. The final item is rendered as the current page.
