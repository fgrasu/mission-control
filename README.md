# Mission Control

A framework-free Web Component that renders a grid of mission/quest cards
from a REST API — with STATUS/TYPE filtering, JSON-based theming, and
built-in enroll / pause / resume / claim actions.

Drop it into any stack — React, Vue, Angular, plain HTML, a CMS — because
it's just a standard [Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
with a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM),
not a framework-specific component.

![Browser support](https://img.shields.io/badge/browsers-Chrome%2067%2B%20·%20Firefox%2063%2B%20·%20Safari%2010.1%2B-blue)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Install

Three options — all load the same file.

### Option 1 — Script tag via jsDelivr (zero tooling, recommended)

```html
<!-- Always latest -->
<script src="https://cdn.jsdelivr.net/gh/fgrasu/mission-control/mission-control.js"></script>

<!-- Pinned to a release tag (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/fgrasu/mission-control@v1.0.0/mission-control.js"></script>
```

jsDelivr serves directly from GitHub — no npm publish needed. The `@v1.0.0`
URL works once you [create a release tag](#releasing-a-new-version).

### Option 2 — npm / GitHub Packages (for bundled projects)

Install straight from GitHub — no npm registry account needed:

```bash
npm install github:fgrasu/mission-control
```

Or, once published to npm under the scoped name:

```bash
npm install @fgrasu/mission-control
```

Then import it (the script self-registers `<mission-control>`, no named
export is needed):

```js
import '@fgrasu/mission-control';
// <mission-control> is now defined in the browser
```

### Option 3 — Self-hosted

Download [`mission-control.js`](./mission-control.js) and serve it yourself:

```html
<script src="/path/to/mission-control.js"></script>
```

---

## Usage

```html
<script src="https://cdn.jsdelivr.net/gh/fgrasu/mission-control/mission-control.js"></script>

<mission-control api-base="/api/missions"></mission-control>
```

The component fetches `GET {api-base}/missions` on connect and renders a
responsive card grid.

### API contract

Point `api-base` at any backend that implements this shape (see
[`examples/mock-api.js`](./examples/mock-api.js) for a working in-memory
mock you can copy and adapt):

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
  type: 'primaryType' | 'secondaryType' | 'tertiaryType' | 'promo';
  enabled: boolean;           // false = locked / expired card
  status: 'ready' | 'active' | 'paused' | 'completed';
  startDate: string | null;   // ISO 8601
  endDate: string | null;     // ISO 8601 — drives countdown timer on promo cards
  tasks: { title: string; completed: boolean }[];
};
```

> Only one mission may be `active` at a time. The component enforces this
> client-side; your backend should enforce it server-side too.

### Attributes, properties & events

| Name             | Type              | Description                                          |
|------------------|-------------------|------------------------------------------------------|
| `api-base`       | attribute         | Base URL for all fetch/post calls.                   |
| `theme`          | attribute (JSON)  | Full theme config — see [Theming](#theming).         |
| `.theme`         | JS property       | Same as above but as a plain object (no stringify).  |
| `.refresh()`     | method            | Re-fetches `GET {api-base}/missions`.                |
| `mission-action` | CustomEvent       | Fires after any successful enroll/pause/resume/claim.|

```js
document.querySelector('mission-control').addEventListener('mission-action', (e) => {
  const { id, action, mission } = e.detail;
  // action: 'enroll' | 'pause' | 'resume' | 'claim'
});
```

---

## Theming

All visual tokens — colors, radius, font, and per-type card background
images — are configured with a single JSON object. Send it as the `theme`
attribute (JSON string, works from any stack) or the `.theme` JS property
(plain object, no stringify round-trip):

```html
<mission-control
  api-base="/api/missions"
  theme='{
    "colors": {
      "bg":      "#f5f3ee",
      "cardBg":  "#ffffff",
      "surface": "#f1efe8",
      "text":    "#1d2321",
      "border":  "#e2ddd2",
      "accent":  "#1f6f5c",
      "warning": "#b8742e",
      "success": "#2e9c5b"
    },
    "borderRadius": "20px",
    "fontFamily": "Georgia, serif",
    "cardImages": {
      "primaryType":   "https://cdn.example.com/wheel.jpg",
      "secondaryType": "https://cdn.example.com/slot.jpg",
      "tertiaryType":  "https://cdn.example.com/shuffle.jpg",
      "promo":         "https://cdn.example.com/promo.jpg"
    }
  }'
></mission-control>
```

```js
// From JS — no JSON.stringify needed:
document.querySelector('mission-control').theme = {
  colors: { accent: '#ff4d4d' },
  cardImages: { promo: '/img/promo.jpg' }
};
```

**All fields are optional** and merge over the built-in dark defaults — send
only what you want to override. Both methods are reactive (re-applying
re-themes with no reload). Invalid JSON logs a warning and falls back to
defaults rather than breaking.

`cardImages` keys match the mission `type` field exactly. Types without a
configured image fall back to a built-in decorative SVG illustration.

For anything outside the JSON schema, raw CSS custom properties still work
as an escape hatch:

```css
mission-control {
  --mc-card-box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
```

### Full theme schema

```jsonc
{
  "colors": {
    "bg":           "#0d1117",   // root background
    "cardBg":       "#161b22",   // card surface
    "surface":      "#1c2330",   // task chip background
    "text":         "#f3f4f6",   // primary text
    "textSoft":     "#9aa3af",   // secondary text
    "textFaint":    "#6b7280",   // placeholder / disabled text
    "border":       "#262d3a",   // card & chip borders
    "accent":       "#5b5ff0",   // enroll/pause button, filter highlight
    "accentHover":  "",          // defaults to accent if omitted
    "success":      "#2ecc71",   // claim button, completed task dot
    "warning":      "#d99a3d"    // resume button, promo timer, paused pill
  },
  "borderRadius":      "12px",   // card radius (inner elements scale from this)
  "borderRadiusSmall": "8px",    // chip / button radius
  "cardShadow":        "none",   // card box-shadow
  "fontFamily":        "...",    // font stack for all text
  "cardImages": {
    "primaryType":   "",         // URL or path for Mystery Wheel card bg
    "secondaryType": "",         // URL or path for Mystery Slot card bg
    "tertiaryType":  "",         // URL or path for Mystery Shuffle card bg
    "promo":         ""          // URL or path for Promo card bg
  }
}
```

---

## Running the example locally

Zero build steps — just serve the repo root with any static file server:

```bash
npx serve .
# → open http://localhost:3000/examples/
```

[`examples/index.html`](./examples/index.html) shows two side-by-side
instances (default dark theme + a live theme editor) backed by
[`examples/mock-api.js`](./examples/mock-api.js), an in-memory fetch
interceptor that covers all mission states without needing a real server.

---

## Releasing a new version

1. Bump `"version"` in `package.json`.
2. Commit: `git commit -am "release: v1.x.x"`
3. Tag: `git tag v1.x.x`
4. Push both: `git push && git push --tags`
5. Create a GitHub Release from the tag (optional but enables the CDN pin URL).

jsDelivr picks up the new tag automatically — the pinned CDN URL goes live
within minutes of the push.

---

## Browser support

Custom Elements v1 + Shadow DOM v1: Chrome/Edge 67+, Firefox 63+, Safari
10.1+. No polyfills used or required for any currently-maintained browser.

---

## License

MIT — see [LICENSE](./LICENSE).
