# Progress

```html
<ov-progress label="Importing projects" value="68" max="100" show-value></ov-progress>
```

For work without a meaningful estimate, omit the value and set `indeterminate`:

```html
<ov-progress label="Preparing import" indeterminate></ov-progress>
```

Keep the value tied to the owning task state and do not imply completion before the operation confirms success.
