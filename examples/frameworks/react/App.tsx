import { useEffect, useRef } from 'react';
import 'ovlira/components/button.js';
import 'ovlira/components/select.js';

export function App() {
  const selectRef = useRef<HTMLElement & { options: { value: string; label: string }[] }>(null);

  useEffect(() => {
    if (selectRef.current) selectRef.current.options = [
      { value: 'eu', label: 'Europe' },
      { value: 'us', label: 'United States' },
    ];
  }, []);

  return <>
    <ov-button variant="primary">Save</ov-button>
    <ov-select ref={selectRef} label="Region" />
  </>;
}
