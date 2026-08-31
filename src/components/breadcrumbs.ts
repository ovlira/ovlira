import { LitElement, css, html, nothing } from 'lit';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** A compact linked hierarchy with a clearly identified current location. */
export class OvBreadcrumbs extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    items: { type: Array },
  };

  label = 'Breadcrumb';
  items: BreadcrumbItem[] = [];

  static styles = css`
    :host { display: block; }
    nav { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-sm, 0.82rem) / 1.4 var(--ov-font-sans, sans-serif); }
    ol { align-items: center; display: flex; flex-wrap: wrap; gap: 0.35rem 0.5rem; list-style: none; margin: 0; padding: 0; }
    li { align-items: center; display: inline-flex; gap: 0.5rem; min-block-size: var(--ov-control-height, 2.5rem); min-inline-size: 0; }
    a { border-radius: var(--ov-radius-sm, 5px); color: inherit; padding-block: 0.35rem; text-decoration: none; }
    a:hover { color: var(--ov-text, var(--ov-color-ink, #171717)); text-decoration: underline; text-underline-offset: 0.2em; }
    a:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .current { color: var(--ov-text, var(--ov-color-ink, #171717)); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .separator { color: var(--ov-faint, #767676); user-select: none; }
    @media (max-width: 40rem) { li { min-block-size: var(--ov-touch-target, 2.75rem); } }
  `;

  render() {
    const lastIndex = this.items.length - 1;
    return html`
      <nav aria-label=${this.label} part="nav">
        <ol part="list">
          ${this.items.map((item, index) => html`
            <li part="item">
              ${index === lastIndex ? html`<span class="current" aria-current="page" part="current">${item.label}</span>` : item.href ? html`<a href=${item.href} part="link">${item.label}</a>` : html`<span part="label">${item.label}</span>`}
              ${index < lastIndex ? html`<span class="separator" aria-hidden="true" part="separator">/</span>` : nothing}
            </li>
          `)}
        </ol>
      </nav>
    `;
  }
}

customElements.define('ov-breadcrumbs', OvBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    'ov-breadcrumbs': OvBreadcrumbs;
  }
}
