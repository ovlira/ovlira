import { LitElement, css, html, nothing } from 'lit';

export interface TreeItem {
  value: string;
  label: string;
  children?: TreeItem[];
  disabled?: boolean;
}

interface VisibleTreeItem {
  item: TreeItem;
  parentValue: string;
  level: number;
}

let treeId = 0;

/** An accessible hierarchical tree for file, navigation, and nested resource structures. */
export class OvTree extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    items: { type: Array },
    value: { type: String, reflect: true },
    expanded: { type: Array },
  };

  label = 'Tree';
  items: TreeItem[] = [];
  value = '';
  expanded: string[] = [];
  private activeValue = '';
  private readonly instanceId = `ov-tree-${++treeId}`;

  static styles = css`
    :host { display: block; min-inline-size: 0; }
    .tree { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 400 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); list-style: none; margin: 0; padding: 0; }
    .group { list-style: none; margin: 0; padding-inline-start: var(--ov-space-4, 1rem); }
    .item { min-inline-size: 0; outline: none; }
    .row { align-items: center; border-radius: var(--ov-radius-sm, 5px); cursor: pointer; display: grid; grid-template-columns: var(--ov-touch-target, 2.75rem) minmax(0, 1fr); min-block-size: var(--ov-touch-target, 2.75rem); }
    .item:focus-visible > .row { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .disclosure { align-items: center; appearance: none; background: transparent; border: 0; border-radius: inherit; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; display: inline-flex; font: 400 var(--ov-text-lg, 1rem) / 1 var(--ov-font-sans, sans-serif); height: var(--ov-touch-target, 2.75rem); justify-content: center; padding: 0; width: var(--ov-touch-target, 2.75rem); }
    .disclosure:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .disclosure:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: -2px; }
    .disclosure-space { display: block; height: var(--ov-touch-target, 2.75rem); width: var(--ov-touch-target, 2.75rem); }
    .label { min-inline-size: 0; overflow: hidden; padding-inline: var(--ov-space-2, 0.5rem); text-overflow: ellipsis; white-space: nowrap; }
    .item[aria-selected='true'] > .row { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .item[aria-disabled='true'] > .row { color: var(--ov-faint, var(--ov-color-muted, #767676)); cursor: not-allowed; opacity: 0.6; }
    .item[aria-disabled='true'] .disclosure { cursor: not-allowed; }
  `;

  render() {
    const visible = this.flattenVisible();
    const focusValue = this.activeValue || this.value || visible.find(({ item }) => !item.disabled)?.item.value || '';
    return html`<ul class="tree" role="tree" aria-label=${this.label} part="tree">${this.renderItems(this.items, '', 1, focusValue)}</ul>`;
  }

  private renderItems(items: TreeItem[], parentValue: string, level: number, focusValue: string): ReturnType<typeof html>[] {
    return items.map((item, index) => {
      const children = item.children ?? [];
      const hasChildren = children.length > 0;
      const isExpanded = hasChildren && this.isExpanded(item.value);
      const isSelected = item.value === this.value;
      return html`
        <li
          id=${`${this.instanceId}-${item.value}`}
          class="item"
          role="treeitem"
          part="item"
          data-value=${item.value}
          aria-level=${level}
          aria-posinset=${index + 1}
          aria-setsize=${items.length}
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${item.disabled ? 'true' : 'false'}
          aria-expanded=${hasChildren ? String(isExpanded) : nothing}
          tabindex=${item.value === focusValue && !item.disabled ? '0' : '-1'}
          @focus=${() => this.handleItemFocus(item.value)}
          @click=${(event: MouseEvent) => this.handleItemClick(event, item)}
          @keydown=${(event: KeyboardEvent) => this.handleItemKeydown(event, item)}
        >
          <div class="row" part="row">
            ${hasChildren
              ? html`<button class="disclosure" part="disclosure" type="button" tabindex="-1" aria-label=${`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`} @click=${(event: MouseEvent) => this.handleDisclosureClick(event, item)}>${isExpanded ? '−' : '+'}</button>`
              : html`<span class="disclosure-space" aria-hidden="true"></span>`}
            <span class="label" part="label">${item.label}</span>
          </div>
          ${hasChildren && isExpanded ? html`<ul class="group" role="group" part="group">${this.renderItems(children, item.value, level + 1, focusValue)}</ul>` : nothing}
        </li>
      `;
    });
  }

  private handleItemFocus(value: string) {
    this.activeValue = value;
  }

  private handleItemClick(event: MouseEvent, item: TreeItem) {
    if (event.defaultPrevented || item.disabled) return;
    this.selectItem(item);
  }

  private handleDisclosureClick(event: MouseEvent, item: TreeItem) {
    event.preventDefault();
    event.stopPropagation();
    if (!item.disabled) this.toggleItem(item.value);
  }

  private handleItemKeydown(event: KeyboardEvent, item: TreeItem) {
    if (item.disabled) return;
    const children = item.children ?? [];
    const visible = this.flattenVisible();
    const currentIndex = visible.findIndex(({ item: visibleItem }) => visibleItem.value === item.value);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.focusVisibleItem(visible, currentIndex + direction, direction);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.focusVisibleItem(visible, event.key === 'Home' ? 0 : visible.length - 1, event.key === 'Home' ? 1 : -1);
    } else if (event.key === 'ArrowRight' && children.length) {
      event.preventDefault();
      if (!this.isExpanded(item.value)) this.toggleItem(item.value);
      else this.focusVisibleItem(visible, currentIndex + 1, 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (children.length && this.isExpanded(item.value)) this.toggleItem(item.value);
      else {
        const parent = visible[currentIndex]?.parentValue;
        if (parent) this.focusTreeItem(parent);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectItem(item);
    }
  }

  private focusVisibleItem(visible: VisibleTreeItem[], startIndex: number, direction: 1 | -1) {
    for (let index = startIndex; index >= 0 && index < visible.length; index += direction) {
      const candidate = visible[index];
      if (candidate && !candidate.item.disabled) {
        this.focusTreeItem(candidate.item.value);
        return;
      }
    }
  }

  private focusTreeItem(value: string) {
    this.activeValue = value;
    this.requestUpdate();
    this.updateComplete.then(() => {
      const item = [...(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? [])].find((candidate) => candidate.dataset.value === value);
      item?.focus();
    });
  }

  private selectItem(item: TreeItem) {
    if (item.disabled) return;
    this.activeValue = item.value;
    this.value = item.value;
    this.dispatchEvent(new CustomEvent('select', { detail: { value: item.value, label: item.label }, bubbles: true, composed: true }));
  }

  private toggleItem(value: string) {
    const expanded = this.isExpanded(value);
    this.expanded = expanded ? this.expanded.filter((item) => item !== value) : [...this.expanded, value];
    this.dispatchEvent(new CustomEvent('toggle', { detail: { value, expanded: !expanded }, bubbles: true, composed: true }));
  }

  private isExpanded(value: string) {
    return this.expanded.includes(value);
  }

  private flattenVisible(items = this.items, parentValue = '', level = 1): VisibleTreeItem[] {
    const visible: VisibleTreeItem[] = [];
    for (const item of items) {
      visible.push({ item, parentValue, level });
      if (item.children?.length && this.isExpanded(item.value)) visible.push(...this.flattenVisible(item.children, item.value, level + 1));
    }
    return visible;
  }
}

customElements.define('ov-tree', OvTree);

declare global {
  interface HTMLElementTagNameMap {
    'ov-tree': OvTree;
  }
}
