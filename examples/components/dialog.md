# Dialog

Use a dialog when a decision is genuinely interruptive and the user must resolve it before continuing. Keep the body concise, name the consequence, and provide a clear dismissal path when the decision is optional.

```html
<ov-dialog heading="Archive this project?" description="People will lose access to the project workspace." open modal>
  <p>This action can be reversed later from the project settings.</p>
  <span slot="actions">
    <ov-button variant="quiet">Cancel</ov-button>
    <ov-button variant="danger">Archive project</ov-button>
  </span>
</ov-dialog>
```

Set `open` from application state. Use `modal` only when the dialog should block the document; the default keeps the dialog in page context.
