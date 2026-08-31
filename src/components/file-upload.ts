import { LitElement, css, html, nothing } from 'lit';

let fileUploadId = 0;

/** A labelled native file picker with optional drag-and-drop support. */
export class OvFileUpload extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    accept: { type: String, reflect: true },
    multiple: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    files: { type: Array },
    helpText: { type: String, attribute: 'help-text' },
    error: { type: String },
  };

  label = '';
  name = '';
  accept = '';
  multiple = false;
  required = false;
  disabled = false;
  files: File[] = [];
  helpText = '';
  error = '';
  private readonly inputId = `ov-file-upload-${++fileUploadId}`;
  private isDragging = false;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: var(--ov-space-2, 0.5rem); }
    .field-label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    .drop-zone { align-items: center; border: 1px dashed var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-md, 7px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; display: grid; gap: var(--ov-space-1, 0.25rem); justify-items: center; min-block-size: 7rem; padding: var(--ov-space-4, 1rem); text-align: center; transition: background-color var(--ov-motion-fast, 120ms) ease, border-color var(--ov-motion-fast, 120ms) ease; }
    .drop-zone:hover, .drop-zone.dragging { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); border-color: var(--ov-focus, var(--ov-color-accent-strong, #525252)); }
    input:focus-visible + .drop-zone { border-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .prompt { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.35 var(--ov-font-sans, sans-serif); }
    .hint { font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    input { block-size: 1px; inline-size: 1px; opacity: 0; position: absolute; }
    input:disabled + .drop-zone { cursor: not-allowed; opacity: 0.56; }
    .file-list { display: grid; gap: var(--ov-space-1, 0.25rem); list-style: none; margin: 0; padding: 0; }
    .file { align-items: baseline; display: flex; font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); gap: var(--ov-space-2, 0.5rem); justify-content: space-between; }
    .file-name { color: var(--ov-text, var(--ov-color-ink, #171717)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); flex: none; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    @media (prefers-reduced-motion: reduce) { .drop-zone { transition: none; } }
  `;

  render() {
    const messageId = `${this.inputId}-message`;
    const labelId = `${this.inputId}-label`;
    return html`
      <div class="field" part="field">
        <span class="field-label" id=${labelId} part="label">${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}</span>
        <input id=${this.inputId} name=${this.name || nothing} type="file" accept=${this.accept || nothing} ?multiple=${this.multiple} ?required=${this.required} ?disabled=${this.disabled} aria-labelledby=${labelId} aria-describedby=${this.error || this.helpText ? messageId : nothing} @change=${this.handleInput}>
        <label class="drop-zone ${this.isDragging ? 'dragging' : ''}" for=${this.inputId} @dragenter=${this.handleDragEnter} @dragover=${this.handleDragOver} @dragleave=${this.handleDragLeave} @drop=${this.handleDrop}>
          <span class="prompt">${this.files.length ? `${this.files.length} file${this.files.length === 1 ? '' : 's'} selected` : 'Choose a file or drop it here'}</span>
          <span class="hint">${this.accept ? this.accept : 'Any file type'}${this.multiple ? ' · Multiple allowed' : ''}</span>
        </label>
        ${this.files.length ? html`<ul class="file-list" part="file-list" aria-label="Selected files">${this.files.map((file) => html`<li class="file" part="file"><span class="file-name">${file.name}</span><span class="file-size">${this.formatSize(file.size)}</span></li>`)}</ul>` : nothing}
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : nothing}
      </div>
    `;
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.setFiles(input.files ? [...input.files] : []);
  };

  private handleDragEnter = (event: DragEvent) => {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragging = true;
    this.requestUpdate();
  };

  private handleDragOver = (event: DragEvent) => {
    if (this.disabled) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  private handleDragLeave = (event: DragEvent) => {
    if (!this.isDragging || (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) return;
    this.isDragging = false;
    this.requestUpdate();
  };

  private handleDrop = (event: DragEvent) => {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragging = false;
    this.setFiles(event.dataTransfer?.files ? [...event.dataTransfer.files] : []);
  };

  private setFiles(nextFiles: File[]) {
    this.files = this.multiple ? nextFiles : nextFiles.slice(0, 1);
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { files: [...this.files] } }));
  }

  private formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

customElements.define('ov-file-upload', OvFileUpload);

declare global {
  interface HTMLElementTagNameMap {
    'ov-file-upload': OvFileUpload;
  }
}
