# Tabs

```html
<ov-tabs label="Project views" value="overview"></ov-tabs>
```

```ts
const tabs = document.querySelector('ov-tabs')!;
tabs.items = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
];
tabs.innerHTML = `
  <p slot="overview">A summary of the project.</p>
  <p slot="activity">Recent project activity.</p>
  <p slot="settings">Project preferences.</p>
`;
tabs.addEventListener('change', (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail;
  console.log(value);
});
```

Use tabs for related views that share context. Each panel is provided through a named slot matching its tab value.
