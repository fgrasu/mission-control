/**
 * <mission-control>
 * ============================================================================
 * Isolated, dependency-free Web Component rendering a grid of "mission"
 * cards from a REST API, with STATUS/TYPE filtering and per-mission actions
 * (enroll / pause / resume / claim reward).
 *
 * WHY A WEB COMPONENT
 *   Native Custom Elements + Shadow DOM -> works in any framework (or none),
 *   ships as one <script> tag, and its CSS can never leak in or out.
 *
 * BROWSER SUPPORT
 *   Custom Elements v1 + Shadow DOM v1 + <template>, standard since ~2018:
 *   Chrome/Edge 67+, Firefox 63+, Safari 10.1+. No polyfills needed.
 *
 * INTEGRATION
 *   <script src="mission-control.js"></script>
 *   <mission-control api-base="/api/missions"></mission-control>
 *
 * THEMING
 *   Colors, radius, font, and per-type card background images are all set
 *   via one JSON object, sent either as the `theme` attribute (a JSON
 *   string — works from any stack) or the `.theme` JS property (a plain
 *   object — no stringify/parse needed):
 *
 *     <mission-control theme='{
 *       "colors": { "bg": "#f5f3ee", "cardBg": "#fff", "accent": "#1f6f5c" },
 *       "borderRadius": "20px",
 *       "fontFamily": "Georgia, serif",
 *       "cardImages": { "promo": "https://cdn.example.com/promo.jpg" }
 *     }'></mission-control>
 *
 *     el.theme = { colors: { accent: '#ff4d4d' } }; // same effect, no JSON
 *
 *   Every field is optional and merges over the built-in defaults. Both
 *   methods are reactive — re-applying re-themes instantly. Invalid JSON
 *   logs a warning and falls back to defaults instead of failing.
 *
 *   `cardImages` keys match the mission `type` field exactly (see below).
 *   A type with no image configured falls back to a small built-in SVG.
 *
 *   Anything beyond the JSON schema can still be reached with raw CSS
 *   custom properties from host CSS (e.g. `mission-control { --mc-card-box-shadow: ... }`),
 *   since the JSON theme is sugar over those same variables — see
 *   THEME_PATH_TO_CSS_VAR for the full mapping.
 *
 * API CONTRACT (swap mock-api.js for a real backend; this is the only
 * contract this component relies on):
 *
 *   GET  {api-base}/missions                      -> { missions: Mission[] }
 *   POST {api-base}/missions/:id/enroll|pause|resume|claim -> { mission: Mission }
 *
 *   Mission = {
 *     id, title, type,       // 'primaryType' | 'secondaryType' | 'tertiaryType' | 'promo'
 *     enabled,                // boolean
 *     status,                 // 'ready' | 'active' | 'paused' | 'completed'
 *     startDate, endDate,     // ISO date string or null
 *     tasks: [{ title, completed }]
 *   }
 * ============================================================================
 */

(function () {
  'use strict';

  const TAG_NAME = 'mission-control';

  // ===========================================================================
  // CONSTANTS — domain vocabulary used throughout rendering & theming
  // ===========================================================================

  const TYPE_LABELS = {
    primaryType: 'Mystery Wheel',
    secondaryType: 'Mystery Slot',
    tertiaryType: 'Mystery Shuffle',
    promo: 'Promo'
  };
  const CARD_IMAGE_TYPES = Object.keys(TYPE_LABELS);

  const STATUS_FILTERS = [
    { value: 'available', label: 'Available' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'expired', label: 'Expired' }
  ];

  const STATUS_LABELS = { ready: 'Available', active: 'Active', paused: 'Paused', completed: 'Completed' };

  const ACTIONS = ['enroll', 'pause', 'resume', 'claim'];

  const TOAST_MESSAGES = {
    enroll: 'Mission started.',
    pause: 'Mission paused.',
    resume: 'Mission resumed.',
    claim: 'Reward claimed!'
  };

  /**
   * Theme JSON dot-path -> CSS custom property it sets on :host.
   * `cardImages` is deliberately excluded: it drives markup (which
   * background each card renders), not a CSS variable.
   */
  const THEME_PATH_TO_CSS_VAR = {
    'colors.bg': '--mc-bg-color',
    'colors.cardBg': '--mc-card-bg-color',
    'colors.surface': '--mc-surface-color',
    'colors.text': '--mc-text-color',
    'colors.textSoft': '--mc-text-color-soft',
    'colors.textFaint': '--mc-text-color-faint',
    'colors.border': '--mc-border-color',
    'colors.accent': '--mc-accent-color',
    'colors.accentHover': '--mc-accent-color-hover',
    'colors.success': '--mc-success-color',
    'colors.warning': '--mc-warning-color',
    borderRadius: '--mc-border-radius',
    borderRadiusSmall: '--mc-border-radius-sm',
    cardShadow: '--mc-card-box-shadow',
    fontFamily: '--mc-font-family'
  };

  // ===========================================================================
  // STYLES — every color/radius/font token has a themeable fallback via
  // var(--theme-var, default), so the JSON theme above can override any of
  // them without touching this stylesheet.
  // ===========================================================================

  const STYLES = `
    :host {
      --mc-bg: var(--mc-bg-color, #0d1117);
      --mc-surface: var(--mc-card-bg-color, #161b22);
      --mc-surface-2: var(--mc-surface-color, #1c2330);
      --mc-ink: var(--mc-text-color, #f3f4f6);
      --mc-ink-soft: var(--mc-text-color-soft, #9aa3af);
      --mc-ink-faint: var(--mc-text-color-faint, #6b7280);
      --mc-line: var(--mc-border-color, #262d3a);

      --mc-blue: var(--mc-accent-color, #5b5ff0);
      --mc-blue-hover: var(--mc-accent-color-hover, var(--mc-accent-color, #6f72f4));
      --mc-amber: var(--mc-warning-color, #d99a3d);
      --mc-amber-soft: var(--mc-warning-color-soft, var(--mc-warning-color, #f0c479));
      --mc-green: var(--mc-success-color, #2ecc71);
      --mc-green-soft: var(--mc-success-color-soft, var(--mc-success-color, #4fdd8c));

      --mc-radius: var(--mc-border-radius, 12px);
      --mc-radius-sm: var(--mc-border-radius-sm, 8px);
      --mc-card-shadow: var(--mc-card-box-shadow, none);
      --mc-font: var(--mc-font-family, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);

      display: block;
      font-family: var(--mc-font);
      color: var(--mc-ink);
      box-sizing: border-box;
    }
    :host * { box-sizing: border-box; }
    :host([hidden]) { display: none; }

    .mc-root { background: var(--mc-bg); padding: 28px; border-radius: calc(var(--mc-radius) + 4px); }

    /* ---- Toolbar / filters ---- */
    .mc-toolbar { display: flex; justify-content: flex-end; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
    .mc-filter { display: flex; flex-direction: column; gap: 6px; position: relative; }
    .mc-filter-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
      color: var(--mc-ink-faint); text-transform: uppercase;
    }
    .mc-filter-btn {
      appearance: none; background: var(--mc-surface); border: 1px solid var(--mc-line);
      color: var(--mc-ink); font: 700 14px var(--mc-font); letter-spacing: 0.04em;
      text-transform: uppercase; padding: 10px 14px; border-radius: var(--mc-radius-sm);
      cursor: pointer; display: flex; align-items: center; justify-content: space-between;
      gap: 16px; min-width: 150px;
    }
    .mc-filter-btn:hover { border-color: var(--mc-ink-faint); }
    .mc-filter-btn:focus-visible { outline: 2px solid var(--mc-blue); outline-offset: 2px; }
    .mc-filter-chevron { width: 10px; height: 10px; flex: 0 0 auto; color: var(--mc-amber-soft); transition: transform 140ms ease; }
    .mc-filter[data-open="true"] .mc-filter-chevron { transform: rotate(180deg); }

    .mc-filter-menu {
      position: absolute; top: calc(100% + 6px); right: 0; left: 0;
      background: var(--mc-surface-2); border: 1px solid var(--mc-line); border-radius: var(--mc-radius-sm);
      overflow: hidden; box-shadow: 0 12px 28px -8px rgba(0,0,0,0.55); z-index: 20; display: none;
    }
    .mc-filter[data-open="true"] .mc-filter-menu { display: block; }
    .mc-filter-option {
      padding: 10px 14px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em;
      text-transform: uppercase; color: var(--mc-ink-soft); cursor: pointer;
    }
    .mc-filter-option:hover { background: var(--mc-surface); color: var(--mc-ink); }
    .mc-filter-option[data-selected="true"] { background: var(--mc-blue); color: #fff; }

    /* ---- Grid & cards ---- */
    .mc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

    .mc-card {
      position: relative; background: var(--mc-surface); border: 1px solid var(--mc-line);
      border-radius: var(--mc-radius); box-shadow: var(--mc-card-shadow); padding: 18px;
      display: flex; flex-direction: column; gap: 14px; overflow: hidden; isolation: isolate;
    }
    .mc-card[data-disabled="true"] { opacity: 0.5; }
    .mc-card[data-type="promo"] {
      border-color: rgba(217,154,61,0.55);
      box-shadow: 0 0 0 1px rgba(217,154,61,0.18), 0 0 24px -6px rgba(217,154,61,0.35);
    }

    .mc-card-art {
      position: absolute; inset: 0; z-index: -1; display: flex; align-items: center;
      justify-content: flex-end; opacity: 0.5; color: var(--mc-line); pointer-events: none;
    }
    .mc-card-art svg { height: 180%; transform: translateX(18%); }
    .mc-card-art::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg, var(--mc-surface) 35%, transparent 85%);
    }
    .mc-card-art[data-image="true"] { opacity: 1; background-size: cover; background-position: center; }
    .mc-card-art[data-image="true"]::after { background: linear-gradient(90deg, var(--mc-surface) 30%, transparent 90%); }

    .mc-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .mc-card-title-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mc-card-title { font-size: 16px; font-weight: 700; margin: 0; line-height: 1.3; }

    .mc-timer { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--mc-amber-soft); white-space: nowrap; }
    .mc-timer svg { width: 13px; height: 13px; }

    .mc-status-pill {
      font-size: 11px; font-weight: 700; letter-spacing: 0.02em; padding: 3px 10px;
      border-radius: 999px; white-space: nowrap; border: 1px solid currentColor; flex: 0 0 auto;
    }
    .mc-status-pill[data-status="ready"]     { color: var(--mc-ink-soft); }
    .mc-status-pill[data-status="active"]    { color: var(--mc-blue-hover); }
    .mc-status-pill[data-status="paused"]    { color: var(--mc-amber-soft); }
    .mc-status-pill[data-status="completed"] { color: var(--mc-green-soft); }
    .mc-status-pill[data-status="locked"]    { color: var(--mc-ink-faint); }

    .mc-tasks { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
    .mc-task {
      position: relative; flex: 1 1 140px; background: var(--mc-surface-2); border: 1px solid transparent;
      border-radius: var(--mc-radius-sm); padding: 10px 22px 10px 12px; font-size: 13px;
      line-height: 1.35; color: var(--mc-ink-soft);
    }
    .mc-task[data-completed="true"] { color: var(--mc-ink); border-color: var(--mc-green); box-shadow: inset 0 -2px 0 var(--mc-green); }
    .mc-task-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: var(--mc-ink-faint); }
    .mc-task[data-completed="true"] .mc-task-dot { background: var(--mc-green); }

    .mc-footer { margin-top: auto; }

    .mc-cta {
      appearance: none; border: none; font: 700 14px var(--mc-font); padding: 12px 16px;
      border-radius: var(--mc-radius-sm); cursor: pointer; width: 100%;
      transition: filter 120ms ease, transform 120ms ease;
    }
    .mc-cta:hover:not(:disabled) { filter: brightness(1.08); }
    .mc-cta:active:not(:disabled) { transform: scale(0.985); }
    .mc-cta:focus-visible { outline: 2px solid var(--mc-blue); outline-offset: 2px; }
    .mc-cta:disabled { cursor: not-allowed; opacity: 0.55; }

    .mc-cta[data-action="enroll"] { background: var(--mc-blue); color: #fff; }
    .mc-cta[data-action="pause"]  { background: var(--mc-blue); color: #fff; }
    .mc-cta[data-action="resume"] { background: var(--mc-amber); color: #1a1306; }
    .mc-cta[data-action="claim"]  { background: var(--mc-green); color: #06210f; }
    .mc-cta[data-action="locked"] { background: var(--mc-surface-2); color: var(--mc-ink-faint); border: 1px solid var(--mc-line); }
    .mc-cta[data-action="done"]   { background: var(--mc-surface-2); color: var(--mc-ink-faint); border: 1px dashed var(--mc-line); }

    .mc-empty, .mc-error, .mc-loading {
      grid-column: 1 / -1; font-size: 14px; color: var(--mc-ink-soft); padding: 40px 12px;
      text-align: center; border: 1px dashed var(--mc-line); border-radius: var(--mc-radius);
    }
    .mc-error { color: #ff8b7a; border-color: #4a2620; background: #21130f; }

    .mc-toast {
      position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(8px);
      background: var(--mc-surface-2); border: 1px solid var(--mc-line); color: var(--mc-ink);
      padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600;
      opacity: 0; pointer-events: none; transition: opacity 180ms ease, transform 180ms ease;
      z-index: 9999; box-shadow: 0 12px 28px -8px rgba(0,0,0,0.6);
    }
    .mc-toast[data-visible="true"] { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }

    @media (prefers-reduced-motion: reduce) {
      .mc-cta, .mc-filter-chevron, .mc-toast { transition: none; }
    }
    @media (max-width: 720px) {
      .mc-grid { grid-template-columns: 1fr; }
      .mc-toolbar { justify-content: flex-start; }
      .mc-filter, .mc-filter-btn { min-width: 0; flex: 1 1 140px; }
    }
  `;

  // ===========================================================================
  // SVG ASSETS — chevron/timer icons + per-type decorative card art, all
  // inline so the component never issues an image request unless the
  // caller supplies a cardImages URL via the theme.
  // ===========================================================================

  const ICON_CHEVRON = `<svg class="mc-filter-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const ICON_TIMER = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="9" r="6" stroke="currentColor" stroke-width="1.4"/>
    <path d="M8 6v3l2 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 1.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;

  const CARD_ART = {
    primaryType: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="92" stroke="currentColor" stroke-width="3" fill="none"/>
      <circle cx="100" cy="100" r="70" stroke="currentColor" stroke-width="2" fill="none"/>
      <g stroke="currentColor" stroke-width="2">
        ${Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const [x1, y1] = [100 + Math.cos(a) * 70, 100 + Math.sin(a) * 70];
          const [x2, y2] = [100 + Math.cos(a) * 92, 100 + Math.sin(a) * 92];
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
        }).join('')}
      </g>
      <circle cx="100" cy="100" r="6" fill="currentColor"/>
    </svg>`,
    secondaryType: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="60" width="120" height="80" rx="10" stroke="currentColor" stroke-width="3" fill="none"/>
      <rect x="55" y="74" width="90" height="14" rx="3" fill="currentColor"/>
      <circle cx="65" cy="112" r="8" fill="currentColor"/><circle cx="90" cy="112" r="8" fill="currentColor"/>
      <circle cx="115" cy="112" r="8" fill="currentColor"/><circle cx="140" cy="112" r="8" fill="currentColor"/>
    </svg>`,
    tertiaryType: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="60" height="90" rx="8" stroke="currentColor" stroke-width="3" fill="none" transform="rotate(-8 90 85)"/>
      <rect x="90" y="55" width="60" height="90" rx="8" stroke="currentColor" stroke-width="3" fill="none" transform="rotate(8 120 100)"/>
    </svg>`,
    promo: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,30 120,80 175,85 132,118 148,172 100,140 52,172 68,118 25,85 80,80" stroke="currentColor" stroke-width="3" fill="none"/>
    </svg>`
  };

  // ===========================================================================
  // MARKUP TEMPLATE — cloned into the shadow root once per instance.
  // ===========================================================================

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>${STYLES}</style>
    <div class="mc-root">
      <div class="mc-toolbar">
        <div class="mc-filter" data-filter="status" data-open="false">
          <span class="mc-filter-label">Status</span>
          <button class="mc-filter-btn" type="button" aria-haspopup="listbox">
            <span class="mc-filter-current">Available</span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" role="listbox"></div>
        </div>
        <div class="mc-filter" data-filter="type" data-open="false">
          <span class="mc-filter-label">Type</span>
          <button class="mc-filter-btn" type="button" aria-haspopup="listbox">
            <span class="mc-filter-current">All</span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" role="listbox"></div>
        </div>
      </div>
      <div id="mc-content"></div>
    </div>
    <div class="mc-toast" id="mc-toast" role="status" aria-live="polite"></div>
  `;

  // ===========================================================================
  // HELPERS — small pure functions, no `this`, easy to reason about in
  // isolation and reuse across render methods.
  // ===========================================================================

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  };

  const getByPath = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);

  /** Maps a STATUS filter value to the mission fields it should match. */
  function matchesStatusFilter(mission, filterValue) {
    switch (filterValue) {
      case 'available': return mission.status === 'ready' && mission.enabled !== false;
      case 'active': return mission.status === 'active' || mission.status === 'paused';
      case 'completed': return mission.status === 'completed';
      case 'expired': return mission.enabled === false;
      default: return true;
    }
  }

  /**
   * The entire CTA state machine: maps a mission's status (+ enabled,
   * + whether some other mission is already active) to one button.
   */
  function resolveCta(mission, activeMissionExists, isDisabled) {
    if (isDisabled) return { action: 'locked', label: 'Expired', disabled: true };

    switch (mission.status) {
      case 'ready':
        return activeMissionExists
          ? { action: 'locked', label: 'Finish active mission first', disabled: true }
          : { action: 'enroll', label: 'Enroll', disabled: false };
      case 'active': {
        const allDone = mission.tasks?.length && mission.tasks.every((t) => t.completed);
        return allDone
          ? { action: 'claim', label: 'Claim Reward', disabled: false }
          : { action: 'pause', label: 'Pause', disabled: false };
      }
      case 'paused':
        return activeMissionExists
          ? { action: 'locked', label: 'Finish active mission first', disabled: true }
          : { action: 'resume', label: 'Resume', disabled: false };
      case 'completed':
        return { action: 'done', label: 'Claimed', disabled: true };
      default:
        return { action: 'locked', label: 'Unavailable', disabled: true };
    }
  }

  function formatCountdown(endDateIso) {
    const diffMs = new Date(endDateIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Expires in ${hours}h:${String(minutes).padStart(2, '0')}m`;
  }

  /** Builds the background-art layer for a card: custom image if themed, else built-in SVG. */
  function renderCardArt(type, theme) {
    const imageUrl = CARD_IMAGE_TYPES.includes(type) ? theme.cardImages?.[type] : null;
    if (!imageUrl) return `<div class="mc-card-art" aria-hidden="true">${CARD_ART[type] || ''}</div>`;

    // CSS url() breaks on unescaped quotes; this URL may come from untrusted JSON.
    const safeUrl = encodeURI(String(imageUrl)).replace(/"/g, '%22');
    return `<div class="mc-card-art" data-image="true" aria-hidden="true" style="background-image:url(&quot;${safeUrl}&quot;)"></div>`;
  }

  function renderTaskList(tasks) {
    if (!tasks.length) return '';
    const items = tasks
      .map((t) => `
        <li class="mc-task" data-completed="${!!t.completed}">
          <span class="mc-task-dot" aria-hidden="true"></span>${escapeHtml(t.title)}
        </li>`)
      .join('');
    return `<ul class="mc-tasks">${items}</ul>`;
  }

  function renderFilterOptions(options, selectedValue) {
    return options
      .map((o) => `<div class="mc-filter-option" role="option" data-value="${o.value}" data-selected="${
        selectedValue === o.value
      }">${escapeHtml(o.label)}</div>`)
      .join('');
  }

  // ===========================================================================
  // COMPONENT
  // ===========================================================================

  class MissionControl extends HTMLElement {
    static get observedAttributes() {
      return ['api-base', 'theme'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

      this._missions = [];
      this._pendingIds = new Set();
      this._theme = {};
      this._filters = { status: 'available', type: 'all' };
      this._countdownTimer = null;
      this._toastTimer = null;

      this._contentEl = this.shadowRoot.getElementById('mc-content');
      this._toastEl = this.shadowRoot.getElementById('mc-toast');

      this._contentEl.addEventListener('click', (e) => this._onCardClick(e));
      this._onDocClick = (e) => {
        if (!e.composedPath().some((el) => el.classList?.contains('mc-filter'))) this._closeAllFilters();
      };

      this._initFilters();
    }

    connectedCallback() {
      document.addEventListener('click', this._onDocClick);
      if (this.hasAttribute('theme')) this._setThemeFromAttribute(this.getAttribute('theme'));
      this.load();
      this._countdownTimer = setInterval(() => this._updateTimers(), 60000);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._onDocClick);
      clearInterval(this._countdownTimer);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal || !this.isConnected) return;
      if (name === 'api-base') this.load();
      if (name === 'theme') this._setThemeFromAttribute(newVal);
    }

    // ---- Public API ----------------------------------------------------

    get apiBase() {
      return this.getAttribute('api-base') || '/api';
    }

    /** Theme as a plain object. Setting it also reflects to the `theme` attribute. */
    get theme() {
      return this._theme;
    }

    set theme(value) {
      this._applyTheme(value || {});
      const serialized = JSON.stringify(value || {});
      if (this.getAttribute('theme') !== serialized) this.setAttribute('theme', serialized);
    }

    refresh() {
      return this.load();
    }

    async load() {
      this._renderState('loading');
      try {
        const res = await fetch(`${this.apiBase}/missions`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        this._missions = (await res.json()) || [];
        console.log('this._missions: ', this._missions)
        this._render();
      } catch (err) {
        this._renderState('error', err.message || 'Could not load missions.');
      }
    }

    // ---- Theming ---------------------------------------------------------

    _setThemeFromAttribute(rawValue) {
      if (!rawValue) return this._applyTheme({});
      try {
        this._applyTheme(JSON.parse(rawValue));
      } catch (err) {
        console.warn(`[${TAG_NAME}] Invalid JSON in "theme" attribute, falling back to defaults.`, err);
        this._applyTheme({});
      }
    }

    /** Pushes theme.colors/borderRadius/fontFamily to CSS vars; cardImages just triggers a re-render. */
    _applyTheme(themeObj) {
      this._theme = themeObj || {};
      for (const [path, cssVar] of Object.entries(THEME_PATH_TO_CSS_VAR)) {
        const value = getByPath(this._theme, path);
        value ? this.style.setProperty(cssVar, value) : this.style.removeProperty(cssVar);
      }
      if (this._missions.length) this._render();
    }

    // ---- Filters -----------------------------------------------------------

    _initFilters() {
      this._typeFilterOptions = [{ value: 'all', label: 'All' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))];
      this._paintFilterMenu('status', STATUS_FILTERS);
      this._paintFilterMenu('type', this._typeFilterOptions);

      this.shadowRoot.querySelectorAll('.mc-filter').forEach((filterEl) => {
        const key = filterEl.dataset.filter;
        const options = key === 'status' ? STATUS_FILTERS : this._typeFilterOptions;

        filterEl.querySelector('.mc-filter-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = filterEl.dataset.open === 'true';
          this._closeAllFilters();
          filterEl.dataset.open = wasOpen ? 'false' : 'true';
        });

        filterEl.querySelector('.mc-filter-menu').addEventListener('click', (e) => {
          const opt = e.target.closest('.mc-filter-option');
          if (!opt) return;
          this._filters[key] = opt.dataset.value;
          this._paintFilterMenu(key, options);
          filterEl.querySelector('.mc-filter-current').textContent = opt.textContent;
          filterEl.dataset.open = 'false';
          this._render();
        });
      });
    }

    _paintFilterMenu(key, options) {
      const menu = this.shadowRoot.querySelector(`.mc-filter[data-filter="${key}"] .mc-filter-menu`);
      menu.innerHTML = renderFilterOptions(options, this._filters[key]);
    }

    _closeAllFilters() {
      this.shadowRoot.querySelectorAll('.mc-filter').forEach((el) => (el.dataset.open = 'false'));
    }

    // ---- Actions (enroll / pause / resume / claim) --------------------------

    async _onCardClick(e) {
      const btn = e.target.closest('.mc-cta');
      const { id, action } = btn?.dataset || {};
      if (!btn || btn.disabled || !id || !ACTIONS.includes(action)) return;

      this._pendingIds.add(id);
      this._render();

      try {
        const res = await fetch(`${this.apiBase}/missions/${encodeURIComponent(id)}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Action failed (${res.status})`);
        }
        const { mission } = await res.json();
        this._applyMissionUpdate(mission);
        this._toast(TOAST_MESSAGES[action] || 'Done.');
        this.dispatchEvent(new CustomEvent('mission-action', { detail: { id, action, mission }, bubbles: true, composed: true }));
      } catch (err) {
        this._toast(err.message || 'Something went wrong.', true);
      } finally {
        this._pendingIds.delete(id);
        this._render();
      }
    }

    /** Merges a server-updated mission into local state. Only one mission may be active at a time. */
    _applyMissionUpdate(updated) {
      if (!updated) return;
      const idx = this._missions.findIndex((m) => m.id === updated.id);
      idx > -1 ? (this._missions[idx] = updated) : this._missions.push(updated);

      if (updated.status === 'active') {
        this._missions = this._missions.map((m) =>
          m.id !== updated.id && m.status === 'active' ? { ...m, status: 'paused' } : m
        );
      }
    }

    _toast(message, isError) {
      clearTimeout(this._toastTimer);
      this._toastEl.textContent = message;
      this._toastEl.style.borderColor = isError ? '#5a2c22' : '';
      this._toastEl.style.color = isError ? '#ff8b7a' : '';
      this._toastEl.dataset.visible = 'true';
      this._toastTimer = setTimeout(() => (this._toastEl.dataset.visible = 'false'), 2600);
    }

    _updateTimers() {
      this.shadowRoot.querySelectorAll('.mc-timer[data-end]').forEach((el) => {
        el.querySelector('.mc-timer-text').textContent = formatCountdown(el.dataset.end);
      });
    }

    // ---- Rendering -----------------------------------------------------------

    _renderState(kind, message) {
      const markup = {
        loading: `<div class="mc-loading">Loading missions…</div>`,
        error: `<div class="mc-error">${escapeHtml(message)}</div>`,
        empty: `<div class="mc-empty">No missions match these filters.</div>`
      }[kind];
      this._contentEl.innerHTML = `<div class="mc-grid">${markup}</div>`;
    }

    _render() {
      const filtered = this._missions.filter(
        (m) => matchesStatusFilter(m, this._filters.status) && (this._filters.type === 'all' || m.type === this._filters.type)
      );
      if (!filtered.length) return this._renderState('empty');

      const activeMissionExists = this._missions.some((m) => m.status === 'active');
      const cards = filtered.map((m) => this._renderCard(m, activeMissionExists)).join('');
      this._contentEl.innerHTML = `<div class="mc-grid">${cards}</div>`;
    }

    _renderCard(mission, activeMissionExists) {
      const { id, title, type, enabled, status, endDate, tasks = [] } = mission;
      const isDisabled = enabled === false;
      const isPending = this._pendingIds.has(id);
      const cta = resolveCta(mission, activeMissionExists, isDisabled);

      const showCountdown = type === 'promo' && endDate && status !== 'completed';
      const headerRight = showCountdown
        ? `<span class="mc-timer" data-end="${endDate}">${ICON_TIMER}<span class="mc-timer-text">${formatCountdown(endDate)}</span></span>`
        : `<span class="mc-status-pill" data-status="${isDisabled ? 'locked' : status}">${isDisabled ? 'Expired' : STATUS_LABELS[status] || status}</span>`;

      return `
        <article class="mc-card" data-status="${status}" data-type="${type}" data-disabled="${isDisabled}">
          ${renderCardArt(type, this._theme)}
          <div class="mc-card-top">
            <div class="mc-card-title-group"><h3 class="mc-card-title">${escapeHtml(title)}</h3></div>
            ${headerRight}
          </div>
          ${renderTaskList(tasks)}
          <div class="mc-footer">
            <button class="mc-cta" type="button" data-id="${escapeHtml(id)}" data-action="${cta.action}" ${cta.disabled || isPending ? 'disabled' : ''}>
              ${isPending ? 'Working…' : escapeHtml(cta.label)}
            </button>
          </div>
        </article>
      `;
    }
  }

  if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, MissionControl);
})();
