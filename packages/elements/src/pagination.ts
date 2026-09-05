import { LitElement, css, html, nothing } from 'lit';

export type PaginationItem = number | 'ellipsis';

export interface PaginationChangeDetail {
  page: number;
}

/** A compact, accessible page navigator that leaves data fetching to its owner. */
export class OvPagination extends LitElement {
  static properties = {
    currentPage: { type: Number, attribute: 'current-page', reflect: true },
    totalPages: { type: Number, attribute: 'total-pages', reflect: true },
    label: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  currentPage = 1;
  totalPages = 1;
  label = 'Pagination';
  disabled = false;

  static styles = css`
    :host { display: block; }
    nav { align-items: center; display: flex; flex-wrap: wrap; gap: 0.15rem 0.3rem; }
    .pages { align-items: center; display: flex; flex-wrap: wrap; gap: 0.15rem; }
    button { appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; font: 400 var(--ov-text-sm, 0.82rem) / 1.2 var(--ov-font-sans, sans-serif); min-block-size: var(--ov-touch-target, 2.75rem); min-inline-size: var(--ov-touch-target, 2.75rem); padding: 0.45rem 0.55rem; }
    button:hover:not(:disabled) { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    button:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    button[aria-current='page'] { color: var(--ov-text, var(--ov-color-ink, #171717)); font-weight: 600; }
    button:disabled { cursor: not-allowed; opacity: 0.48; }
    .ellipsis { align-items: center; color: var(--ov-faint, #767676); display: inline-flex; justify-content: center; min-block-size: var(--ov-touch-target, 2.75rem); min-inline-size: 1.5rem; }
    .status { block-size: 1px; inline-size: 1px; overflow: hidden; position: absolute; clip: rect(0 0 0 0); white-space: nowrap; }
    @media (max-width: 40rem) { nav { justify-content: center; } .previous, .next { flex: 1 1 auto; } }
  `;

  render() {
    const total = this.pageCount;
    const current = this.page;
    return html`
      <nav aria-label=${this.label} part="nav">
        <button class="previous" type="button" part="previous" aria-label="Previous page" ?disabled=${this.disabled || current <= 1} @click=${() => this.goTo(current - 1)}>Previous</button>
        <div class="pages" part="pages">
          ${this.pageItems(total, current).map((item) => item === 'ellipsis'
            ? html`<span class="ellipsis" aria-hidden="true" part="ellipsis">…</span>`
            : html`<button type="button" part="page" aria-label="Page ${item}" aria-current=${item === current ? 'page' : nothing} ?disabled=${this.disabled} @click=${() => this.goTo(item)}>${item}</button>`)}
        </div>
        <button class="next" type="button" part="next" aria-label="Next page" ?disabled=${this.disabled || current >= total} @click=${() => this.goTo(current + 1)}>Next</button>
        <span class="status" role="status" aria-live="polite">Page ${current} of ${total}</span>
      </nav>
    `;
  }

  private get pageCount() {
    return Math.max(1, Math.floor(Number.isFinite(this.totalPages) ? this.totalPages : 1));
  }

  private get page() {
    return Math.min(this.pageCount, Math.max(1, Math.floor(Number.isFinite(this.currentPage) ? this.currentPage : 1)));
  }

  private pageItems(total: number, current: number): PaginationItem[] {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
    if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  }

  private goTo(page: number) {
    const next = Math.min(this.pageCount, Math.max(1, page));
    if (this.disabled || next === this.page) return;
    this.currentPage = next;
    this.dispatchEvent(new CustomEvent<PaginationChangeDetail>('change', { detail: { page: next }, bubbles: true, composed: true }));
  }
}

customElements.define('ov-pagination', OvPagination);

declare global {
  interface HTMLElementTagNameMap {
    'ov-pagination': OvPagination;
  }
}
