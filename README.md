# Mission Control

A framework-free Web Component that renders a grid of mission cards from a REST API — with i18n support.

![Browser support](https://img.shields.io/badge/browsers-Chrome%2067%2B%20·%20Firefox%2063%2B%20·%20Safari%2010.1%2B-blue)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)


## Install

### Option 1 — Script tag via jsDelivr

```html
<script src="https://cdn.jsdelivr.net/gh/fgrasu/mission-control@v1.0.0/mission-control.js"></script>
```

jsDelivr serves directly from GitHub — no npm publish needed.

### Option 2 — npm / GitHub Packages (for bundled projects)

Install straight from GitHub — no npm registry account needed:

```bash
npm install @fgrasu/mission-control
```

Then import it (the script self-registers `<mission-control>`, no named
export is needed):

```js
import '@fgrasu/mission-control'
// <mission-control> is now defined in the browser
```

### Option 3 — Self-hosted

Download [`mission-control.js`](./mission-control.js) and serve it yourself:

```html
<script src="/path/to/mission-control.js"></script>
```


## Usage

```html
<script src="https://cdn.jsdelivr.net/gh/fgrasu/mission-control/mission-control.js"></script>

<mission-control api-base="/api/missions"></mission-control>
```

The component fetches `GET {api-base}/missions` on connect and renders a responsive card grid.

### API contract

Point `api-base` at any backend that implements this format:

```
GET  {api-base}/missions                   → Mission[]
POST {api-base}/missions/:id/enroll        → { mission: Mission }
POST {api-base}/missions/:id/pause         → { mission: Mission }
POST {api-base}/missions/:id/resume        → { mission: Mission }
POST {api-base}/missions/:id/claim         → { mission: Mission }
```

```ts
type Mission = {
  id: string;
  title: string;
  status: 'ready' | 'active' | 'paused' | 'completed' | 'expired';
  expiresAt: string | null;
  claimedAt: string | null;
  tasks: { title: string; completed: boolean }[];
}
```


### Translations

Translated text is supplied by the host page as a property or a JSON attribute:

```js
document.querySelector('mission-control').translations = {
  filterLabels: { status: 'Status', type: 'Type' },
  statusLabels: { all: 'All', ready: 'Available', active: 'Active', paused: 'Paused', completed: 'Completed', expired: 'Expired' },
  typeLabels: { all: 'All', primary: 'Mystery Wheel', secondary: 'Mystery Slot', tertiary: 'Mystery Shuffle', promo: 'Promo' },
  ctaLabels: { enroll: 'Enroll', pause: 'Pause', resume: 'Resume', claim: 'Claim Reward', claimed: 'Claimed', expired: 'Expired', unavailable: 'Unavailable' },
  states: { loading: 'Loading missions…', error: 'Could not load missions.', empty: 'No missions match these filters.' },
  countdown: { expiresIn: 'Expires in', expired: 'Expired' },
  confirmModals: {
    enroll: { title: 'Are you sure you want to enroll in this mission?', body: '', confirmLabel: 'Enroll' },
    pause: { title: 'Are you sure you want to pause mission?', body: '', confirmLabel: 'Pause Mission' },
    resume: { title: 'Are you sure you want to resume mission?', body: '', confirmLabel: 'Resume Mission' },
    claim: { title: 'Are you sure you want to claim your reward?', body: '', confirmLabel: 'Claim Reward' }
  },
  successModals: {
    enroll: { title: "Congrats! You're enrolled to this mission", body: '', ctaLabel: 'Go to Active Missions', ctaAction: 'goToActive' },
    claim: { title: 'Congrats! Reward claimed', body: '', ctaLabel: 'Close', ctaAction: 'close' }
  },
  errorModal: { title: 'Something went wrong', ctaLabel: 'Close' }
};
```

Only the keys you provide are overridden — anything you omit falls back to the built-in English copy, so partial translations are safe. The full set of overridable top-level keys:


### Styling from the parent page

Shadow DOM blocks normal CSS selectors from the outside. Two mechanisms reach in on purpose:

**1. CSS custom properties** — These pierce the Shadow DOM boundary and cascade down like any inherited property, so just set them on the element in your own stylesheet:

```css
mission-control {
  --mc-font: 'Roboto, sans-serif';
  --mc-radius: 8px;
  --mc-text: #ffffff;
  --mc-primary: #4D5DFA;
  --mc-secondary: #24C15B;
  --mc-tertiary: #F5D547;
  --mc-danger: #FF6B5C;
  --mc-modal-bg: #181A20;
  --mc-filter-bg: linear-gradient(180deg, #323744 0%, #252932 100%);
  --mc-card-bg: linear-gradient(180deg, #242D3E 0%, #2C3649 100%);
}
```

**2. `::part()`** — For anything above variables can't reach. Every structural element ships a `part` attribute:

| Part                               | Element                                          |
|------------------------------------|--------------------------------------------------|
| `mc-toolbar`, `mc-filter-btn`, `mc-filter-menu`                    | The filter toolbar            |
| `mc-grid`, `mc-state-loading`, `mc-state-empty`, `mc-state-error`  | The card grid container       |
| `mc-card`, `mc-card-title`, `mc-status-pill`, `mc-timer`, `mc-tasks`, `mc-task`, `mc-cta` | The cards and their subcomponents.    |
| `mc-modal-overlay`, `mc-modal`, `mc-modal-title`, `mc-modal-subtitle`, `mc-modal-body`, `mc-modal-cta` | The modals |

```css
mission-control::part(card) {
  border-radius: 20px;
}
```

### Attributes, properties & events

| Name             | Type              | Description                                                     |
|------------------|-------------------|-------------------------------------------------------------------|
| `api-base`       | attribute         | Base URL for all fetch/post calls.                               |
| `translations`   | attribute / property | Copy overrides — JSON string as an attribute, or a plain object as a property. See [Translations](#translations). |
| `.refresh()`     | method            | Re-fetches `GET {api-base}/missions`.                            |
| `mission-action` | CustomEvent       | Fires after any successful enroll/pause/resume/claim.            |
| `mission-error`  | CustomEvent       | Fires when an enroll/pause/resume/claim request fails.           |

```js
const el = document.querySelector('mission-control');

el.addEventListener('mission-action', (e) => {
  const { id, action, mission } = e.detail;
  // action: 'enroll' | 'pause' | 'resume' | 'claim'
});

el.addEventListener('mission-error', (e) => {
  const { id, action, error } = e.detail;
  // error: the thrown Error, e.g. error.message
});
```


## Browser support

Custom Elements v1 + Shadow DOM v1: Chrome/Edge 67+, Firefox 63+, Safari 10.1+. No polyfills used or required for any currently-maintained browser.


## License

MIT — see [LICENSE](./LICENSE).
