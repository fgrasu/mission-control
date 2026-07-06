# Mission Control

A framework-free Web Component that renders a grid of mission/quest cards
from a REST API — with STATUS/TYPE filtering, JSON-based theming, and
built-in enroll / pause / resume / claim actions.

Drop it into any stack — React, Vue, Angular, plain HTML, a CMS — because
it's just a standard [Custom
Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
with a [Shadow
DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM),
not a framework-specific component.

![Browser support: Chrome/Edge 67+, Firefox 63+, Safari 10.1+](https://img.shields.io/badge/browsers-Chrome%2067%2B%20%C2%B7%20Firefox%2063%2B%20%C2%B7%20Safari%2010.1%2B-blue)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)

## Why a Web Component?

- **Zero framework lock-in.** Native browser API — no React/Vue/Angular
  required, and it works fine inside any of them too.
- **True style isolation.** Shadow DOM means the host page's CSS can't leak
  in, and this component's CSS can't leak out.
- **One file, one script tag.** No build step, no bundler, no npm install
  required to use it.

## Install

Pick whichever fits your project — all three load the exact same file.

### 1. Script tag from a CDN (fastest, zero tooling)

Once this repo has a tagged release, [jsDelivr](https://www.jsdelivr.com/)
and [unpkg](https://unpkg.com/) can serve it straight from GitHub or npm:

```html
<!-- from a GitHub release tag, via jsDelivr -->
<script src="https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/mission-control@v1.0.0/dist/mission-control.js"></script>

<!-- or, once published to npm -->
<script src="https://cdn.jsdelivr.net/npm/mission-control@1/dist/mission-control.js"></script>
<script src="https://unpkg.com/mission-control@1/dist/mission-control.js"></script>
```

### 2. Download the file directly

Grab [`dist/mission-control.js`](./dist/mission-control.js) from this repo
and self-host it:

```html
<script src="/path/to/mission-control.js"></script>
```

### 3. npm / a bundler

```bash
npm install mission-control
# or, before it's published to npm, straight from GitHub:
npm install github:YOUR_GITHUB_USERNAME/mission-control
```

```js
import 'mission-control'; // self-registers the <mission-control> element, no exports to use
```

## Usage

```html
<mission-control api-base="/api/missions"></mission-control>
<script src="mission-control.js"></script>
```

That's the whole integration. The component fetches `GET {api-base}/missions`
on connect and renders a card grid.

### API contract

Point `api-base` at any backend that implements this contract (see
[`examples/mock-api.js`](./examples/mock-api.js) for a working in-memory
mock you can copy and adapt):

```
GET  {api-base}/missions                                -> { missions: Mission[] }
POST {api-base}/missions/:id/enroll                      -> { mission: Mission }
POST {api-base}/missions/:id/pause                       -> { mission: Mission }
POST {api-base}/missions/:id/resume                      -> { mission: Mission }
POST {api-base}/missions/:id/claim                       -> { mission: Mission }
```

```ts
type Mission = {
  id: string;
  title: string;
  type: 'primaryType' | 'secondaryType' | 'tertiaryType' | 'promo';
  enabled: boolean;                 // false = locked/expired
  status: 'ready' | 'active' | 'paused' | 'completed';
  startDate: string | null;         // ISO date
  endDate: string | null;           // ISO date
  tasks: { title: string; completed: boolean }[];
};
```

Only one mission may be `active` at a time — the component's CTA buttons
enforce this client-side, and your backend should enforce it server-side too.

### Listening for actions

```js
document.querySelector('mission-control').addEventListener('mission-action', (e) => {
  const { id, action, mission } = e.detail; // action: 'enroll' | 'pause' | 'resume' | 'claim'
  console.log(`${action} on ${id}`, mission);
});
```

### Theming

Every visual token — colors, border radius, font, and per-type card
background images — is set with a single JSON object, sent either as the
`theme` attribute (a JSON string) or the `.theme` property (a plain object):

```html
<mission-control
  api-base="/api/missions"
  theme='{
    "colors": {
      "bg": "#f5f3ee",
      "cardBg": "#ffffff",
      "surface": "#f1efe8",
      "text": "#1d2321",
      "border": "#e2ddd2",
      "accent": "#1f6f5c",
      "warning": "#b8742e",
      "success": "#2e9c5b"
    },
    "borderRadius": "20px",
    "fontFamily": "Georgia, serif",
    "cardImages": {
      "primaryType": "https://cdn.example.com/wheel.jpg",
      "secondaryType": "https://cdn.example.com/slot.jpg",
      "tertiaryType": "https://cdn.example.com/shuffle.jpg",
      "promo": "https://cdn.example.com/promo.jpg"
    }
  }'
></mission-control>
```

```js
// Equivalent, from JS — no JSON.stringify/parse needed:
document.querySelector('mission-control').theme = {
  colors: { accent: '#ff4d4d' },
  cardImages: { promo: '/img/promo.jpg' }
};
```

Every field is optional and merges over the built-in (dark) defaults — send
only what you want to override. Both methods are reactive: re-applying
re-themes instantly, no reload needed. Invalid JSON in the attribute logs a
console warning and falls back to defaults rather than breaking the
component.

`cardImages` keys match the mission `type` field exactly. A type with no
image configured falls back to a small built-in decorative SVG.

Anything beyond this JSON schema can still be reached with raw CSS custom
properties from host-page CSS, since the theme object is sugar over them:

```css
mission-control {
  --mc-card-box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
```

### Other attributes & properties

| Name              | Type             | Description                                   |
| ------------------ | ---------------- | ---------------------------------------------- |
| `api-base`         | attribute        | Base URL the component fetches/posts against. |
| `theme`            | attribute (JSON) | See [Theming](#theming).                      |
| `.theme`           | property (object)| Same as above, no JSON round-trip.             |
| `.refresh()`       | method           | Re-fetches `GET {api-base}/missions`.          |
| `mission-action`   | event            | Fires after any enroll/pause/resume/claim.     |

## Local development / running the example

This is a zero-build project — there's nothing to compile. To try the demo
locally, serve the repo root with any static file server (a server is
needed only so `fetch()` works under `http://` instead of `file://`):

```bash
npx serve .
# then open http://localhost:3000/examples/
```

[`examples/index.html`](./examples/index.html) shows two side-by-side
instances (default theme + a live theme editor) wired up to
[`examples/mock-api.js`](./examples/mock-api.js), a small in-memory mock
backend that intercepts `fetch()` so you can see every state (ready, active,
paused, completed, expired, promo countdown) without a real server.

## Browser support

Custom Elements v1 + Shadow DOM v1 + `<template>` — standard since ~2018:
Chrome/Edge 67+, Firefox 63+, Safari 10.1+. No polyfills used or required
for any currently maintained browser.

## License

MIT — see [LICENSE](./LICENSE).
