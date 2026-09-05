import { LitElement, css, html } from 'lit';

/** An article-like surface with optional header and footer slots. */
export class OvCard extends LitElement {
  static properties = { padding: { type: String, reflect: true } };
  padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  static styles = css`
    :host { display: block; }
    article { background: var(--ov-surface, var(--ov-color-surface, #ffffff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-lg, 8px); color: var(--ov-text, var(--ov-color-ink, #171717)); overflow: hidden; }
    .header, .body, .footer { padding: var(--ov-card-padding, 1.25rem); }
    .header { border-bottom: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); }
    .footer { border-top: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); }
    [hidden] { display: none; }
    .none { --ov-card-padding: 0; }
    .sm { --ov-card-padding: 0.75rem; }
    .md { --ov-card-padding: 1.25rem; }
    .lg { --ov-card-padding: 1.5rem; }
  `;

  render() {
    return html`
      <article part="card" class=${this.padding}>
        <div class="header" part="header"><slot name="header" @slotchange=${this.handleOptionalSlot}></slot></div>
        <div class="body" part="body"><slot></slot></div>
        <div class="footer" part="footer"><slot name="footer" @slotchange=${this.handleOptionalSlot}></slot></div>
      </article>
    `;
  }

  private handleOptionalSlot(event: Event) {
    const slot = event.target as HTMLSlotElement;
    if (slot.parentElement) slot.parentElement.hidden = slot.assignedElements().length === 0;
  }
}

customElements.define('ov-card', OvCard);
declare global { interface HTMLElementTagNameMap { 'ov-card': OvCard; } }
