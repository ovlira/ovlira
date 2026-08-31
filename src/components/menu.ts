import { LitElement, css, html, nothing } from 'lit';

export interface MenuItem {
  value: string;
  label: string;
  disabled?: boolean;
  tone?: 'neutral' | 'danger';
}

export interface MenuSelectDetail {
  value: string;
  label: string;
}

let menuId = 0;

/** A compact action menu with native button and menuitem semantics. */
export class OvMenu extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    items: { type: Array },
  };

  label = 'Actions';
  open = false;
  disabled = false;
  items: MenuItem[] = [];
  private readonly instanceId = `ov-menu-${++menuId}`;
  private activeIndex = -1;

  static styles = css`
    :host { display: inline-block; position: relative; }
    .trigger { align-items: center; appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-md, 7px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; display: inline-flex; font: 500 var(--ov-text-sm, 0.82rem) / 1.2 var(--ov-font-sans, sans-serif); gap: 0.45rem; justify-content: center; min-height: var(--ov-touch-target, 2.75rem); padding: 0.45rem 0.65rem; }
    .trigger:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .trigger:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .trigger:disabled { cursor: not-allowed; opacity: 0.56; }
    .menu { background: var(--ov-surface-raised, var(--ov-color-surface-raised, #fff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-lg, 8px); box-shadow: var(--ov-shadow-md, 0 10px 30px rgb(0 0 0 / 0.12)); display: grid; inset-block-start: calc(100% + 0.35rem); inset-inline-end: 0; min-inline-size: 12rem; padding: 0.3rem; position: absolute; z-index: 10; }
    .menu[hidden] { display: none; }
    .item { appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; font: 400 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-touch-target, 2.75rem); padding: 0.55rem 0.65rem; text-align: start; }
    .item:hover, .item.active { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); }
    .item.danger { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    .item:disabled { cursor: not-allowed; opacity: 0.5; }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    if (this.open) {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown);
      this.activeIndex = this.firstEnabledIndex();
      this.dispatchEvent(new Event('open', { bubbles: true, composed: true }));
      this.updateComplete.then(() => this.focusActiveItem());
    } else {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
      this.activeIndex = -1;
      if (changed.get('open') !== undefined) this.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    }
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <button class="trigger" type="button" part="trigger" aria-haspopup="menu" aria-expanded=${String(this.open)} aria-controls=${this.instanceId}-list ?disabled=${this.disabled} @click=${this.toggleMenu} @keydown=${this.handleTriggerKeydown}>
        <slot name="trigger">${this.label}</slot>
      </button>
      <div id=${this.instanceId}-list class="menu" role="menu" part="menu" ?hidden=${!this.open} @keydown=${this.handleMenuKeydown}>
        ${this.items.map((item, index) => html`
          <button
            class="item ${item.tone === 'danger' ? 'danger' : ''} ${index === this.activeIndex ? 'active' : ''}"
            type="button"
            role="menuitem"
            part="item"
            data-index=${index}
            ?disabled=${Boolean(item.disabled)}
            aria-disabled=${item.disabled ? 'true' : 'false'}
            @click=${() => this.selectItem(index)}
            @mouseenter=${() => this.setActiveIndex(index)}
          >${item.label}</button>
        `)}
      </div>
    `;
  }

  private toggleMenu = () => {
    if (this.disabled) return;
    this.open = !this.open;
  };

  private handleTriggerKeydown = (event: KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!this.open) this.open = true;
    else if (event.key === 'ArrowUp') this.focusItem(this.lastEnabledIndex());
    else this.focusActiveItem();
  };

  private handleMenuKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu();
      return;
    }
    if (event.key === 'Tab') {
      this.closeMenu(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
      this.focusActiveItem();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.focusItem(event.key === 'Home' ? this.firstEnabledIndex() : this.lastEnabledIndex());
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.activeIndex >= 0) this.selectItem(this.activeIndex);
    }
  };

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (!event.composedPath().includes(this)) this.closeMenu();
  };

  private firstEnabledIndex() {
    return this.items.findIndex((item) => !item.disabled);
  }

  private lastEnabledIndex() {
    for (let index = this.items.length - 1; index >= 0; index -= 1) if (!this.items[index]?.disabled) return index;
    return -1;
  }

  private moveActive(direction: 1 | -1) {
    const enabled = this.items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0);
    if (!enabled.length) return;
    const currentPosition = enabled.indexOf(this.activeIndex);
    const nextPosition = (currentPosition + direction + enabled.length) % enabled.length;
    this.activeIndex = enabled[nextPosition] ?? enabled[0] ?? -1;
  }

  private setActiveIndex(index: number) {
    if (!this.items[index]?.disabled) this.activeIndex = index;
  }

  private focusActiveItem() {
    if (this.activeIndex >= 0) this.focusItem(this.activeIndex);
  }

  private focusItem(index: number) {
    if (index < 0 || this.items[index]?.disabled) return;
    this.activeIndex = index;
    this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLButtonElement>(`.item[data-index="${index}"]`)?.focus());
  }

  private selectItem(index: number) {
    const item = this.items[index];
    if (!item || item.disabled) return;
    this.dispatchEvent(new CustomEvent<MenuSelectDetail>('select', { detail: { value: item.value, label: item.label }, bubbles: true, composed: true }));
    this.closeMenu();
  }

  private closeMenu(restoreFocus = true) {
    if (!this.open) return;
    this.open = false;
    if (restoreFocus) this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus());
  }
}

customElements.define('ov-menu', OvMenu);

declare global {
  interface HTMLElementTagNameMap {
    'ov-menu': OvMenu;
  }
}
