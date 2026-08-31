# Drawer

```html
<button type="button" id="open-filters">Open filters</button>
<ov-drawer heading="Filters" description="Refine the visible projects.">
  <p>Choose filters that apply to this view.</p>
  <div slot="actions"><ov-button>Apply filters</ov-button></div>
</ov-drawer>

<script>
  document.querySelector('#open-filters')?.addEventListener('click', () => {
    document.querySelector('ov-drawer')?.setAttribute('open', '');
  });
</script>
```

Use a drawer for supplemental filters, navigation, or detail while the main task remains recognizable. Keep a clear close action and concise body content.
