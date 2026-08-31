import { LitElement, css, html, nothing } from 'lit';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/** A compact identity marker with image, initials, and status fallbacks. */
export class OvAvatar extends LitElement {
  static properties = {
    name: { type: String, reflect: true },
    src: { type: String, reflect: true },
    alt: { type: String, reflect: true },
    size: { type: String, reflect: true },
    status: { type: String, reflect: true },
  };

  name = '';
  src = '';
  alt = '';
  size: AvatarSize = 'md';
  status: AvatarStatus | '' = '';
  private imageFailed = false;

  static styles = css`
    :host { display: inline-block; }
    .avatar { align-items: center; background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 50%; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: inline-flex; font: 600 var(--ov-text-sm, 0.82rem) / 1 var(--ov-font-sans, sans-serif); justify-content: center; overflow: visible; position: relative; }
    :host([size='sm']) .avatar { block-size: 2rem; font-size: var(--ov-text-xs, 0.72rem); inline-size: 2rem; }
    :host([size='md']) .avatar { block-size: 2.5rem; inline-size: 2.5rem; }
    :host([size='lg']) .avatar { block-size: 3.25rem; font-size: var(--ov-text-md, 0.875rem); inline-size: 3.25rem; }
    img { block-size: 100%; inline-size: 100%; object-fit: cover; }
    .initials { letter-spacing: 0.02em; }
    .status { background: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); border: 2px solid var(--ov-surface, var(--ov-color-surface, #ffffff)); border-radius: 50%; block-size: 0.72rem; inset-block-end: -0.08rem; inset-inline-end: -0.08rem; position: absolute; inline-size: 0.72rem; }
    .status.online { background: var(--ov-good, var(--ov-color-success, #15743a)); }
    .status.away { background: var(--ov-warn, var(--ov-color-warning, #805c00)); }
    .status.busy { background: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    .status.offline { background: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('src')) this.imageFailed = false;
  }

  render() {
    const label = this.accessibleLabel;
    return html`
      <span class="avatar" role="img" aria-label=${label} part="avatar">
        ${this.src && !this.imageFailed ? html`<img src=${this.src} alt="" @error=${this.handleImageError} part="image">` : html`<span class="initials" aria-hidden="true" part="initials">${this.initials}</span>`}
        ${this.status ? html`<span class="status ${this.status}" aria-hidden="true" part="status"></span>` : nothing}
      </span>
    `;
  }

  private get initials() {
    const words = this.name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  }

  private get accessibleLabel() {
    const identity = this.alt || this.name || 'User';
    return this.status ? `${identity}, ${this.statusLabel}` : identity;
  }

  private get statusLabel() {
    return this.status ? this.status.charAt(0).toUpperCase() + this.status.slice(1) : '';
  }

  private handleImageError = () => {
    this.imageFailed = true;
    this.requestUpdate();
    this.dispatchEvent(new Event('image-error', { bubbles: true, composed: true }));
  };
}

customElements.define('ov-avatar', OvAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'ov-avatar': OvAvatar;
  }
}
