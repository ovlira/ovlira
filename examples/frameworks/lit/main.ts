import 'ovlira/components/button.js';
import 'ovlira/components/select.js';

document.querySelector('#app')!.innerHTML = `
  <ov-button variant="primary">Save</ov-button>
  <ov-select label="Region"></ov-select>
`;

const select = document.querySelector('ov-select');
if (select) select.options = [
  { value: 'eu', label: 'Europe' },
  { value: 'us', label: 'United States' },
];
