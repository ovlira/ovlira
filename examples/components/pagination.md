# Pagination

```html
<ov-pagination current-page="2" total-pages="12" label="Project pages"></ov-pagination>
```

```ts
const pagination = document.querySelector('ov-pagination')!;
pagination.addEventListener('change', (event) => {
  const { page } = (event as CustomEvent<{ page: number }>).detail;
  loadProjects(page);
});
```

Pagination owns the selected page and emits a change; the application owns fetching and rendering the records.
