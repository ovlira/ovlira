# Menu

```html
<ov-menu label="Project actions"></ov-menu>
```

```ts
const menu = document.querySelector('ov-menu')!;
menu.items = [
  { value: 'duplicate', label: 'Duplicate project' },
  { value: 'archive', label: 'Archive project', tone: 'danger' },
];
menu.addEventListener('select', (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail;
  console.log(value);
});
```

Use the optional `trigger` slot for non-interactive label content only. Escape closes an open menu and returns focus to its trigger.
