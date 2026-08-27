import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import 'ovlira/components/button.js';
import 'ovlira/components/select.js';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ov-button variant="primary">Save</ov-button>
    <ov-select #region label="Region"></ov-select>
  `,
})
export class AppComponent {
  @ViewChild('region') region!: ElementRef<HTMLElement & { options: { value: string; label: string }[] }>;

  ngAfterViewInit() {
    this.region.nativeElement.options = [
      { value: 'eu', label: 'Europe' },
      { value: 'us', label: 'United States' },
    ];
  }
}
