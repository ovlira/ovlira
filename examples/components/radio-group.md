# Radio group

```html
<ov-radio-group label="Workspace visibility" name="visibility" value="team" help-text="Choose who can access this workspace."></ov-radio-group>
```

Assign the options as a DOM property:

```ts
const group = document.querySelector('ov-radio-group');
if (group) group.options = [
  { value: 'private', label: 'Only me' },
  { value: 'team', label: 'Everyone on the team' },
];
```
