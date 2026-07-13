# Mission Control

A framework-free Web Component that renders a grid of mission cards from a REST API — with STATUS/TYPE filtering, and built-in actions.

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
GET  {api-base}/missions                   → { missions: Mission[] }
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

### Attributes, properties & events

| Name             | Type              | Description                                          |
|------------------|-------------------|------------------------------------------------------|
| `api-base`       | attribute         | Base URL for all fetch/post calls.                   |
| `.refresh()`     | method            | Re-fetches `GET {api-base}/missions`.                |
| `mission-action` | CustomEvent       | Fires after any successful enroll/pause/resume/claim.|

```js
document.querySelector('mission-control').addEventListener('mission-action', (e) => {
  const { id, action, mission } = e.detail;
  // action: 'enroll' | 'pause' | 'resume' | 'claim'
});
```


## Browser support

Custom Elements v1 + Shadow DOM v1: Chrome/Edge 67+, Firefox 63+, Safari 10.1+. No polyfills used or required for any currently-maintained browser.


## License

MIT — see [LICENSE](./LICENSE).
