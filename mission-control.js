(function () {
  'use strict';

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  const TAG_NAME = 'mission-control';

  const ACTIONS = ['enroll', 'pause', 'resume', 'claim'];

  const STATUSES = {
    all: 'All',
    ready: 'Available',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    expired: 'Expired',
  };

  const TYPES = {
    all: 'All',
    primary: 'MYSTERY WHEEL',
    secondary: 'MYSTERY SLOT',
    tertiary: 'MYSTERY SHUFFLE',
    promo: 'PROMO',
  };

  const STYLES = `
    :host {
      --mc-font: Roboto, sans-serif;
      --mc-radius: 8px;
      --mc-text: #ffffff;
      --mc-primary: #4D5DFA;
      --mc-secondary: #24C15B;
      --mc-tertiary: #F5D547;
      --mc-danger: #FF6B5C;
      display: block;
      font-family: var(--mc-font);
      color: var(--mc-text);
      box-sizing: border-box;
    }
    :host * { box-sizing: border-box; }
    :host([hidden]) { display: none; }

    /* ---- Toolbar / filters ---- */
    .mc-toolbar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
    .mc-toolbar[data-single="true"] { grid-template-columns: 1fr; }
    .mc-filter { position: relative; display: flex; flex-direction: column; gap: 2px; width: 100%; }
    .mc-filter-label { font-size: 12px; font-weight: 300; opacity: 0.7; text-transform: uppercase; }
    .mc-filter-btn {
      display: flex; align-items: center; justify-content: space-between; min-width: 190px; z-index: 2; text-transform: uppercase;
      font-size: 16px; font-weight: 600; padding: 16px; border-radius: var(--mc-radius); cursor: pointer; appearance: none;
      color: var(--mc-text); background: #252932; border: 1px solid #3b414f; box-shadow: 0 4px 8px #00000080;
    }
    .mc-filter-chevron { flex: 0 0 auto; width: 12px; height: 12px; transition: transform 0.2s ease; color: var(--mc-tertiary); }
    .mc-filter[data-open="true"] .mc-filter-chevron { transform: rotate(180deg); }
    .mc-filter-menu {
      display: none; position: absolute; top: 100%; right: 0; left: 0; margin-top: 2px;
      overflow: hidden; border-radius: var(--mc-radius); z-index: 1;
      background: #252932; border: 1px solid #3b414f; box-shadow: 0 4px 8px #00000080;
    }
    .mc-filter[data-open="true"] .mc-filter-menu { display: block; }
    .mc-filter-option { padding: 8px 16px; font-size: 16px; font-weight: 400; text-transform: uppercase; cursor: pointer; }
    .mc-filter-option:hover { background: #323744; }
    .mc-filter-option[data-selected="true"] { background: var(--mc-primary); }

    /* ---- Grid & cards ---- */
    .mc-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 20px; }
    .mc-card {
      position: relative; display: flex; flex-direction: column; gap: 24px; border-radius: var(--mc-radius); padding: 16px;
      background: linear-gradient(180deg, #242D3E 0%, #2C3649 100%); border: 1px solid #38445B; box-shadow: 0 4px 8px 0 #00000080;
    }
    .mc-card[data-type="promo"] { background: #2f2a21; box-shadow: 0 4px 16px 0 #dbc04680; border: 1px solid #dbc04660; }
    .mc-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; }
    .mc-card-title { font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3; text-shadow: 0 4px 4px #00000075; }
    .mc-timer { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--mc-tertiary); white-space: nowrap; }
    .mc-timer svg { width: 13px; height: 13px; }
    .mc-status-pill { flex: none; font-size: 10px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; padding: 4px 10px; border-radius: 16px; border: 1px solid #ffffff; white-space: nowrap; }
    .mc-status-pill[data-status="ready"]     { border-color: #9aa2b1; color: #9aa2b1; }
    .mc-status-pill[data-status="active"]    { border-color: var(--mc-primary); color: #ffffff; }
    .mc-status-pill[data-status="paused"]    { border-color: var(--mc-primary); color: #ffffff; }
    .mc-status-pill[data-status="completed"] { border-color: var(--mc-secondary); color: var(--mc-secondary); }
    .mc-status-pill[data-status="expired"]   { border-color: var(--mc-danger); color: var(--mc-danger); }

    .mc-tasks { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .mc-task {
      position: relative; flex: 1 1 140px; font-size: 13px; padding: 10px 26px 10px 14px; border-radius: var(--mc-radius); 
      color: rgba(255,255,255,0.7); line-height: 1.3; background: #1C2230; border-bottom: 2px solid transparent;
    }
    .mc-task[data-completed="true"] { border-bottom-color: var(--mc-secondary); color: var(--mc-text); }
    .mc-task-dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #919592; }
    .mc-task[data-completed="true"] .mc-task-dot { background: var(--mc-secondary); }

    .mc-card-footer { margin-top: auto; }

    .mc-cta {
      appearance: none; border: none; font: 700 16px var(--mc-font); padding: 13px 16px;
      color: var(--mc-text); border-radius: var(--mc-radius); cursor: pointer; width: 100%;
      transition: filter 120ms ease, transform 120ms ease;
    }
    .mc-cta:hover:not(:disabled) { filter: brightness(1.08); }
    .mc-cta:focus-visible { outline: 2px solid var(--mc-primary); outline-offset: 2px; }
    .mc-cta:disabled { cursor: not-allowed; opacity: 0.55; }

    .mc-cta[data-action="enroll"] { background: var(--mc-primary); }
    .mc-cta[data-action="pause"]  { background: var(--mc-primary); }
    .mc-cta[data-action="resume"] { background: var(--mc-tertiary); }
    .mc-cta[data-action="claim"]  { background: var(--mc-secondary); }
    .mc-cta[data-action="locked"] { background: var(--mc-primary); }
    .mc-cta[data-action="done"]   { background: var(--mc-secondary); }

    .mc-empty, .mc-error, .mc-loading {
      grid-column: 1 / -1; font-size: 14px; padding: 40px 12px;
      text-align: center; border: 1px dashed #38445B; border-radius: var(--mc-radius);
    }
    .mc-error { color: #ff8b7a; border-color: #4a2620; background: #21130f; }

    .mc-toast {
      position: fixed; left: 50%; top: 48px; transform: translateX(-50%) translateY(8px);
      color: var(--mc-text); background: #181A20; box-shadow: 0 4px 28px 0 rgba(255, 255, 255, 0.40);
      padding: 16px 24px; border-radius: 8px; font-size: 20px; font-weight: 300;
      z-index: 9; pointer-events: none; transition: opacity 180ms ease, transform 180ms ease;
    }
    .mc-toast[data-visible="true"] { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }

    @media (prefers-reduced-motion: reduce) {
      .mc-cta, .mc-filter-chevron, .mc-toast { transition: none; }
    }
    @media (min-width: 720px) {
      .mc-grid { grid-template-columns: repeat(2, 1fr); }
      .mc-toolbar { display: flex; justify-content: flex-end; }
      .mc-filter { width: auto; }
    }
  `;

  const ICON_CHEVRON = `<svg class="mc-filter-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const ICON_TIMER = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="9" r="6" stroke="currentColor" stroke-width="1.4"/>
    <path d="M8 6v3l2 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 1.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>${STYLES}</style>
    <div class="mc-root">
      <div class="mc-toolbar">
        <div class="mc-filter" data-filter="status" data-open="false">
          <span class="mc-filter-label">Status</span>
          <button class="mc-filter-btn" type="button" aria-haspopup="listbox">
            <span class="mc-filter-current">${STATUSES.ready}</span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" role="listbox"></div>
        </div>
        <div class="mc-filter" data-filter="type" data-open="false">
          <span class="mc-filter-label">Type</span>
          <button class="mc-filter-btn" type="button" aria-haspopup="listbox">
            <span class="mc-filter-current">${TYPES.all}</span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" role="listbox"></div>
        </div>
      </div>
      <div id="mc-content"></div>
    </div>
    <div class="mc-toast" id="mc-toast" role="status" aria-live="polite"></div>
  `;

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  // business logic for types; should be set on BE?
  function assignMissionTypes(missions) {
    return missions.map(m => {
      if(m.expiresAt) m.type = 'promo';
      else if (m.tasks.length === 1) m.type = 'primary';
      else if (m.tasks.length === 2) m.type = 'secondary';
      else if (m.tasks.length === 3) m.type = 'tertiary';
      return m;
    })
  }

  function matchFilters(missions, filters) {
    return missions.filter((m) => 
      (filters.type === 'all' || m.type === filters.type) &&
      (filters.status === 'all' || m.status === filters.status || (m.status === 'paused' && filters.status === 'active')));
  }

  function resolveCta(mission, status) {
    switch (status) {
      case 'ready':
        return { action: 'enroll', label: 'Enroll', disabled: false };
      case 'active':
        return { action: 'pause', label: 'Pause', disabled: false };
      case 'paused':
        return { action: 'resume', label: 'Resume', disabled: false };
      case 'completed':
        return mission.claimedAt
          ? { action: 'done', label: 'Claimed', disabled: true }
          : { action: 'claim', label: 'Claim Reward', disabled: false };
      case 'expired':
        return { action: 'locked', label: 'Expired', disabled: true };
      default:
        return { action: 'locked', label: 'Unavailable', disabled: true };
    }
  }

  function formatCountdown(expiresAtIso) {
    const diffMs = new Date(expiresAtIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Expires in ${hours}h:${String(minutes).padStart(2, '0')}m`;
  }

  function renderTaskList(tasks) {
    if (!tasks || !tasks.length) return '';
    const items = tasks
      .map((t) => `
        <li class="mc-task" data-completed="${!!t.completed}">
          <span class="mc-task-dot" aria-hidden="true"></span>${escapeHtml(t.title)}
        </li>`)
      .join('');
    return `<ul class="mc-tasks">${items}</ul>`;
  }

  function renderFilterOptions(options, selectedValue) {
    return Object.keys(options)
      .map((key) => `<div class="mc-filter-option" role="option" data-value="${escapeHtml(key)}" data-selected="${selectedValue === key}">${escapeHtml(options[key])}</div>`)
      .join('');
  }

  // ===========================================================================
  // COMPONENT
  // ===========================================================================

  class MissionControl extends HTMLElement {
    static get observedAttributes() {
      return ['api-base'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

      this._missions = [];
      this._pendingIds = new Set();
      this._timerToast = null;
      this._timerCountdown = null;
      this._filters = { status: 'ready', type: 'all' };

      this._contentEl = this.shadowRoot.getElementById('mc-content');
      this._toastEl = this.shadowRoot.getElementById('mc-toast');

      this._contentEl.addEventListener('click', (e) => this._onCardClick(e));
      this._onClickOutside = (e) => {
        if (!e.composedPath().some((el) => el.classList?.contains('mc-filter'))) this._closeAllFilters();
      };

      this._initFilters();
    }

    connectedCallback() {
      document.addEventListener('click', this._onClickOutside);
      if (!this._missions.length) this.load();
      this._timerCountdown = setInterval(() => this._updateTimers(), 60000);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._onClickOutside);
      clearInterval(this._timerCountdown);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal || !this.isConnected) return;
      if (name === 'api-base') this.load();
    }

    get apiBase() {
      return this.getAttribute('api-base') || '/api';
    }

    refresh() {
      return this.load();
    }

    async load() {
      this._renderState('loading');
      try {
        const res = await fetch(`${this.apiBase}/missions`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        this._missions = assignMissionTypes(await res.json()) || [];
        this._render();
      } catch (err) {
        this._renderState('error', err.message || 'Could not load missions.');
      }
    }

    _initFilters() {
      const { paused, ...filtersStatuses } = STATUSES
      const filtersTypes = TYPES
      this._paintFilterMenu('status', filtersStatuses);
      this._paintFilterMenu('type', TYPES);

      this.shadowRoot.querySelectorAll('.mc-filter').forEach((filterEl) => {
        const key = filterEl.dataset.filter;

        filterEl.querySelector('.mc-filter-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = filterEl.dataset.open === 'true';
          this._closeAllFilters();
          filterEl.dataset.open = wasOpen ? 'false' : 'true';
        });

        filterEl.querySelector('.mc-filter-menu').addEventListener('click', (e) => {
          const opt = e.target.closest('.mc-filter-option');
          if (!opt) return;
          const options = key === 'status' ? filtersStatuses : filtersTypes;
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
        // this._toast();
        this.dispatchEvent(new CustomEvent('mission-action', { detail: { id, action, mission }, bubbles: true, composed: true }));
      } catch (err) {
        // this._toast();
        this.dispatchEvent(new CustomEvent('mission-error', { detail: { id, action, error: err }, bubbles: true, composed: true }));
      } finally {
        this._pendingIds.delete(id);
        this._render();
      }
    }

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

    // _toast(message) {
    //   clearTimeout(this._timerToast);
    //   this._toastEl.textContent = message;
    //   this._toastEl.style.borderColor = isError ? '#5a2c22' : '';
    //   this._toastEl.style.color = isError ? '#ff8b7a' : '';
    //   this._toastEl.dataset.visible = 'true';
    //   this._timerToast = setTimeout(() => (this._toastEl.dataset.visible = 'false'), 2600);
    // }

    _updateTimers() {
      this.shadowRoot.querySelectorAll('.mc-timer[data-end]').forEach((el) => {
        el.querySelector('.mc-timer-text').textContent = formatCountdown(el.dataset.end);
      });
      if (this._missions.some((m) => new Date(m.expiresAt).getTime() - Date.now() <= 0)) {
        this._render();
      }
    }

    _render() {
      const filtered = matchFilters(this._missions, this._filters);
      if (!filtered.length) return this._renderState('empty');

      const cards = filtered.map((m) => this._renderCard(m)).join('');
      this._contentEl.innerHTML = `<div class="mc-grid">${cards}</div>`;
    }

    _renderState(state, message) {
      const markup = {
        loading: `<div class="mc-loading">Loading missions…</div>`,
        error: `<div class="mc-error">${escapeHtml(message)}</div>`,
        empty: `<div class="mc-empty">No missions match these filters.</div>`
      }[state];
      this._contentEl.innerHTML = `<div class="mc-grid">${markup}</div>`;
    }

    _renderCard(mission) {
      const { id, title, type, status, expiresAt, tasks = [] } = mission;
      const isPending = this._pendingIds.has(id);
      const cta = resolveCta(mission, status);

      const showCountdown = Boolean(expiresAt) && status !== 'completed' && status !== 'expired';
      const headerRight = showCountdown
        ? `<span class="mc-timer" data-end="${expiresAt}">${ICON_TIMER}<span class="mc-timer-text">${formatCountdown(expiresAt)}</span></span>`
        : `<span class="mc-status-pill" data-status="${status}">${STATUSES[status] || status}</span>`;

      return `
        <article class="mc-card" data-status="${status}" data-type="${type || ''}">
          <div class="mc-card-top">
            <h3 class="mc-card-title">${escapeHtml(title)}</h3>
            ${headerRight}
          </div>
          ${renderTaskList(tasks)}
          <div class="mc-card-footer">
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
