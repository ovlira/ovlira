# Tree

```html
<ov-tree label="Project files"></ov-tree>
```

```ts
const tree = document.querySelector('ov-tree')!;
tree.items = [
  { value: 'src', label: 'src', children: [{ value: 'main', label: 'main.ts' }] },
  { value: 'readme', label: 'README.md' },
];
tree.expanded = ['src'];
tree.value = 'main';
```

Use a tree for nested resources or navigation. Keep values stable, manage `expanded` state in the owning application, and preserve the built-in keyboard navigation.
