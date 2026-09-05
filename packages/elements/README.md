# @ovlira/elements

Versioned Ovlira web components. Import only the elements a screen uses:

```ts
import '@ovlira/elements/button.js';
import '@ovlira/elements/tooltip.js';
```

Import `@ovlira/elements/register-all.js` only when deliberately registering the full catalogue.

Load the approved defaults before project-owned theme overrides:

```ts
import '@ovlira/elements/default-theme.css';
import './styles/ovlira-theme.css';
```
