# Combobox

```html
<ov-combobox label="Project owner" placeholder="Search people"></ov-combobox>
```

```ts
const owner = document.querySelector('ov-combobox')!;
owner.options = [
  { value: 'maya', label: 'Maya Chen' },
  { value: 'jon', label: 'Jon Bell' },
  { value: 'anika', label: 'Anika Rao' },
];
owner.addEventListener('change', (event) => {
  console.log((event as CustomEvent<{ value: string }>).detail.value);
});
```

Use a combobox when users need to filter a longer known option list. Remote loading and persistence remain application concerns.
