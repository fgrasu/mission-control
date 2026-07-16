(function () {
  'use strict';

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  const TAG_NAME = 'mission-control';
  const ACTIONS = ['enroll', 'pause', 'resume', 'claim'];

  const DEFAULT_I18N = {
    filterLabels: { status: 'Status', type: 'Type' },
    statusLabels: { all: 'All', ready: 'Available', active: 'Active', paused: 'Paused', completed: 'Completed', expired: 'Expired' },
    typeLabels: { all: 'All', primary: 'Mystery Wheel', secondary: 'Mystery Slot', tertiary: 'Mystery Shuffle', promo: 'Promo' },
    ctaLabels: { enroll: 'Enroll', pause: 'Pause', resume: 'Resume', claim: 'Claim Reward', claimed: 'Claimed', expired: 'Expired', unavailable: 'Unavailable' },
    states: { loading: 'Loading missions…', error: 'Could not load missions.', empty: 'No missions match these filters.' },
    countdownLabel: 'Expires in',
    confirmModals: {
      enroll: { title: 'Are you sure you want to enroll in this mission?', body: '', confirmLabel: 'Enroll' },
      pause: { title: 'Are you sure you want to pause mission?', body: '', confirmLabel: 'Pause Mission' },
      resume: { title: 'Are you sure you want to resume mission?', body: '', confirmLabel: 'Resume Mission' },
      claim: { title: 'Are you sure you want to claim your reward?', body: '', confirmLabel: 'Claim Reward' }
    },
    successModals: {
      enroll: { title: "Congrats! You're enrolled to this mission", body: '', ctaLabel: 'Go to Active Missions' },
      claim: { title: 'Congrats! Reward claimed', body: '', ctaLabel: 'Close' }
    },
    errorModal: { title: 'Something went wrong', ctaLabel: 'Close' }
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
      --mc-modal-bg: #181A20;
      --mc-card-bg: #252F40;
      --mc-filter-bg: linear-gradient(180deg, #323744, #181A20);
      display: block;
      font-family: var(--mc-font);
      color: var(--mc-text);
      box-sizing: border-box;
    }
    :host * { box-sizing: border-box; }
    :host([hidden]) { display: none; }

    /* ---- Filters ---- */
    .mc-toolbar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
    .mc-filter { position: relative; display: flex; flex-direction: column; gap: 2px; width: 100%; }
    .mc-filter-label { font-size: 12px; font-weight: 300; opacity: 0.7; text-transform: uppercase; }
    .mc-filter-btn,
    .mc-filter-menu { border-radius: var(--mc-radius); color: var(--mc-text); background: var(--mc-filter-bg); border: 1px solid #38445B; box-shadow: 0 4px 8px #00000050; }
    .mc-filter-btn {
      display: flex; align-items: center; justify-content: space-between; z-index: 2; text-transform: uppercase;
      font-size: 16px; font-weight: 600; padding: 16px; cursor: pointer; appearance: none; filter: drop-shadow(0 4px 8px #00000050);
    }
    .mc-filter-chevron { flex: 0 0 auto; width: 12px; height: 12px; transition: transform 0.2s ease; color: var(--mc-tertiary); }
    .mc-filter[data-open="true"] .mc-filter-chevron { transform: rotate(180deg); }
    .mc-filter-menu { display: none; position: absolute; top: 100%; right: 0; left: 0; margin-top: 2px; overflow: hidden;  z-index: 1; }
    .mc-filter[data-open="true"] .mc-filter-menu { display: block; }
    .mc-filter-option { padding: 8px 16px; font-size: 16px; font-weight: 400; text-transform: uppercase; cursor: pointer; }
    .mc-filter-option:not([data-selected="true"]):hover { box-shadow: inset 0 0 200px #00000030; }
    .mc-filter-option[data-selected="true"] { background: var(--mc-primary); }

    /* ---- Grid & cards ---- */
    .mc-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 20px; }
    .mc-card {
      position: relative; display: flex; flex-direction: column; gap: 24px; border-radius: var(--mc-radius); padding: 16px;
      background-color: var(--mc-card-bg); border: 1px solid #38445B; box-shadow: 0 4px 8px 0 #00000080;
    }
    .mc-card[data-type="promo"] { background-color: #2f2a21; box-shadow: 0 4px 16px 0 #dbc04680; border: 1px solid #dbc04650; }
    .mc-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .mc-card-title { font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3; text-shadow: 0 4px 4px #00000075; }
    .mc-timer { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700; color: var(--mc-tertiary); white-space: nowrap; }
    .mc-timer strong { font-size: 20px; font-weight: 700; }
    .mc-timer svg { width: 32px; height: 32px; }
    .mc-status-pill {
      flex: none; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 16px;
      min-width: 70px; text-align: center; border: 1px solid #ffffff; color: var(--mc-text);
    }
    .mc-status-pill[data-status="active"]    { border-color: var(--mc-primary); }
    .mc-status-pill[data-status="paused"]    { border-color: var(--mc-primary); }
    .mc-status-pill[data-status="completed"] { border-color: var(--mc-secondary); color: var(--mc-secondary); }
    .mc-status-pill[data-status="expired"]   { border-color: var(--mc-danger); color: var(--mc-danger); }
    .mc-status-pill[data-status="promo"]     { border-color: var(--mc-tertiary); color: var(--mc-tertiary); }
    .mc-tasks { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .mc-task {
      position: relative; flex: 1 1 160px; font-size: 13px; padding: 8px 20px 8px 16px; border-radius: var(--mc-radius);
      color: var(--mc-text); background: #1C2230; border-bottom: 2px solid transparent; box-shadow: 0 4px 8px 0 #00000025;
    }
    .mc-task[data-completed="true"] { border-bottom-color: var(--mc-secondary); }
    .mc-task-dot {
      position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%;
      background: #ffffff50; filter: drop-shadow(0 0 2px #ffffff50);
    }
    .mc-task[data-completed="true"] .mc-task-dot { background: var(--mc-secondary); }
    .mc-card-footer { margin-top: auto; }
    .mc-cta {
      appearance: none; border: none; font: 700 16px var(--mc-font); padding: 13px 16px; width: 100%; cursor: pointer;
      border-radius: var(--mc-radius); transition: filter 0.2s ease; color: var(--mc-text); background: var(--mc-primary);
    }
    .mc-cta:hover:not(:disabled) { filter: brightness(1.1); }
    .mc-cta:disabled { cursor: not-allowed; box-shadow: inset 0 0 200px #00000060; }
    .mc-cta[data-action="resume"] { background: var(--mc-tertiary); box-shadow: inset 0 0 200px #00000040; }
    .mc-cta[data-action="claim"]  { background: var(--mc-secondary); }
    .mc-cta[data-action="done"]   { background: var(--mc-secondary); }
    .mc-empty, .mc-error, .mc-loading {
      grid-column: 1 / -1; font-size: 16px; padding: 48px 12px;
      text-align: center; border-radius: var(--mc-radius); border: 1px solid #ffffff20;
    }
    .mc-error { color: var(--mc-danger); border: 1px solid rgb(from var(--mc-danger) r g b / 75%); }

    /* ---- Modal  ---- */
    .mc-modal-overlay { position: fixed; inset: 0; z-index: 999; backdrop-filter: blur(2px); background: #00000090; }
    .mc-modal-overlay[hidden] { display: none; }
    .mc-modal {
      position: relative; display: flex; flex-direction: column; padding: 16px 24px 24px;
      width: min(600px, 100%); height: 100%; background: var(--mc-modal-bg); box-shadow: 0 4px 28px 0px #ffffff40;
    }
    .mc-modal button { margin-top: auto; }
    .mc-modal-close {
      position: absolute; top: 16px; right: 16px; display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 50%; font-size: 16px; line-height: 1; cursor: pointer; 
      border: none; color: #14161f; background: #ffffff;
    }
    .mc-modal-title { font-size: 26px; line-height: 1.2; font-weight: 700; margin: 4px 0 16px; padding-right: 24px; }
    .mc-modal-subtitle { font-size: 16px; font-weight: 300; opacity: 0.5; margin: 0 0 16px; }
    .mc-modal-body { font-size: 20px; font-weight: 300; margin-bottom: 16px; }
    .mc-modal-body p { margin: 0 0 8px; }

    @media (prefers-reduced-motion: reduce) {
      .mc-cta, .mc-modal-cta, .mc-filter-chevron { transition: none; }
    }
    @media (min-width: 720px) {
      .mc-grid { grid-template-columns: repeat(2, 1fr); }
      .mc-toolbar { display: flex; justify-content: flex-end; }
      .mc-filter { width: auto; min-width: 190px; }
      .mc-modal-overlay { padding: 24px; }
      .mc-modal { border-radius: var(--mc-radius); height: auto; min-height: 300px; margin: 80px auto 0; }
    }
  `;

  const ICON_CHEVRON = `<svg class="mc-filter-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const ICON_TIMER = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="currentColor" fill-rule="evenodd" d="M13 3.333a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2h-1v2.043a11.6 11.6 0 0 1 6.512 2.697l1.114-1.113a1 1 0 1 1 1.414 1.413l-1.114 1.115A11.666 11.666 0 1 1 15 6.376V4.333h-1a1 1 0 0 1-1-1m3 5a9.667 9.667 0 1 0 0 19.334 9.667 9.667 0 0 0 0-19.334" clip-rule="evenodd"/>
    <path fill="currentColor" d="M16 10.333a7.666 7.666 0 1 0 6.64 11.5L16 18z" opacity=".5"/>
  </svg>`;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>${STYLES}</style>
    <div class="mc-root">
      <div class="mc-toolbar" part="mc-toolbar">
        <div class="mc-filter" data-filter="status" data-open="false">
          <span class="mc-filter-label" data-role="status-label"></span>
          <button class="mc-filter-btn" type="button" part="mc-filter-btn" aria-haspopup="listbox">
            <span class="mc-filter-current"></span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" part="mc-filter-menu" role="listbox"></div>
        </div>
        <div class="mc-filter" data-filter="type" data-open="false">
          <span class="mc-filter-label" data-role="type-label"></span>
          <button class="mc-filter-btn" type="button" part="mc-filter-btn" aria-haspopup="listbox">
            <span class="mc-filter-current"></span>${ICON_CHEVRON}
          </button>
          <div class="mc-filter-menu" part="mc-filter-menu" role="listbox"></div>
        </div>
      </div>
      <div id="mc-content"></div>
    </div>
    <div class="mc-modal-overlay" id="mc-modal-overlay" part="mc-modal-overlay" hidden>
      <div class="mc-modal" part="mc-modal" role="dialog" aria-modal="true">
        <button class="mc-modal-close" id="mc-modal-close" type="button" aria-label="Close">&times;</button>
        <h2 class="mc-modal-title" id="mc-modal-title" part="mc-modal-title"></h2>
        <p class="mc-modal-subtitle" id="mc-modal-subtitle" part="mc-modal-subtitle"></p>
        <div class="mc-modal-body" id="mc-modal-body" part="mc-modal-body"></div>
        <button class="mc-cta" id="mc-modal-cta" type="button" part="mc-modal-cta"></button>
      </div>
    </div>
  `;

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  };

  function deepMerge(base, source) {
    if (!source) return base;
    const out = { ...base };
    for (const key of Object.keys(source)) {
      const value = source[key];
      const isPlainObject = value && typeof value === 'object' && !Array.isArray(value);
      out[key] = isPlainObject && base[key] ? deepMerge(base[key], value) : value;
    }
    return out;
  }

  // business logic? should be added in API response?
  function deriveType(mission) {
    if (mission.type) return mission.type;
    if (mission.expiresAt) return 'promo';
    if (mission.tasks?.length === 1) return 'primary';
    if (mission.tasks?.length === 2) return 'secondary';
    return 'tertiary';
  }

  function effectiveStatus(mission) {
    if (mission.status !== 'completed' && mission.expiresAt && new Date(mission.expiresAt).getTime() <= Date.now()) return 'expired';
    return mission.status;
  }

  function matchesFilters(mission, filters) {
    if (filters.type !== 'all' && mission.type !== filters.type) return false;
    if (filters.status === 'all') return true;
    const status = effectiveStatus(mission);
    if (filters.status === 'active') return status === 'active' || status === 'paused';
    return status === filters.status;
  }

  function renderTaskList(tasks) {
    if (!tasks?.length) return '';
    const items = tasks
      .map((t) => `
        <li class="mc-task" part="mc-task" data-completed="${!!t.completed}">
          <span class="mc-task-dot" aria-hidden="true"></span>${escapeHtml(t.title)}
        </li>`)
      .join('');
    return `<ul class="mc-tasks" part="mc-tasks">${items}</ul>`;
  }

  function renderFilterOptions(options, selectedValue) {
    return Object.entries(options)
      .map(([value, label]) => `<div class="mc-filter-option" role="option" data-value="${escapeHtml(value)}" data-selected="${selectedValue === value}">${escapeHtml(label)}</div>`)
      .join('');
  }

  function renderRichText(text) {
    return String(text ?? '').split(/\n{2,}/).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  }

  // ===========================================================================
  // COMPONENT
  // ===========================================================================

  class MissionControl extends HTMLElement {
    static get observedAttributes() {
      return ['api-base', 'translations'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

      this._missions = [];
      this._filters = { status: 'ready', type: 'all' };
      this._i18n = deepMerge(DEFAULT_I18N, {});
      this._pendingContext = null;
      this._countdownTimerId = null;

      this._contentEl = this.shadowRoot.getElementById('mc-content');
      this._modalOverlayEl = this.shadowRoot.getElementById('mc-modal-overlay');
      this._modalTitleEl = this.shadowRoot.getElementById('mc-modal-title');
      this._modalSubtitleEl = this.shadowRoot.getElementById('mc-modal-subtitle');
      this._modalBodyEl = this.shadowRoot.getElementById('mc-modal-body');
      this._modalCtaEl = this.shadowRoot.getElementById('mc-modal-cta');

      this._contentEl.addEventListener('click', (e) => this._onCardClick(e));
      this.shadowRoot.getElementById('mc-modal-close').addEventListener('click', () => this._closeModal());
      this._modalOverlayEl.addEventListener('click', (e) => {
        if (e.target === this._modalOverlayEl) this._closeModal();
      });

      this._onDocumentClick = (e) => {
        if (!e.composedPath().some((el) => el.classList?.contains('mc-filter'))) this._closeAllFilters();
      };
      this._onKeydown = (e) => {
        if (e.key === 'Escape' && !this._modalOverlayEl.hidden) this._closeModal();
      };

      this._initFilters();
    }

    connectedCallback() {
      document.addEventListener('click', this._onDocumentClick);
      document.addEventListener('keydown', this._onKeydown);
      if (this.hasAttribute('translations')) this._setTranslationsFromAttribute(this.getAttribute('translations'));
      if (!this._missions.length) this.load();
      this._countdownTimerId = setInterval(() => this._updateTimers(), 60000);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._onDocumentClick);
      document.removeEventListener('keydown', this._onKeydown);
      clearInterval(this._countdownTimerId);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal || !this.isConnected) return;
      if (name === 'api-base') this.load();
      if (name === 'translations') this._setTranslationsFromAttribute(newVal);
    }

    get apiBase() {
      return this.getAttribute('api-base') || '/api';
    }

    get translations() {
      return this._i18n;
    }

    set translations(value) {
      this._applyTranslations(value || {});
    }

    refresh() {
      return this.load();
    }

    async load() {
      this._renderState('loading');
      try {
        const res = await fetch(`${this.apiBase}/missions`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const missions = (await res.json()) || [];
        this._missions = missions.map((m) => ({ ...m, type: deriveType(m) }));
        this._render();
      } catch (err) {
        this._renderState('error', err.message || this._i18n.states.error);
      }
    }

    // ---- Translations ----

    _setTranslationsFromAttribute(raw) {
      if (!raw) return;
      try {
        this._applyTranslations(JSON.parse(raw));
      } catch (err) {
        console.warn(`[${TAG_NAME}] Invalid JSON in "translations" attribute.`, err);
      }
    }

    _applyTranslations(overrides) {
      this._i18n = deepMerge(DEFAULT_I18N, overrides);
      // this._paintFilterLabels();
      this._render();
    }

    // "Paused" isn't its own filter tab — a paused mission still shows up under "Active".
    _statusFilterOptions() {
      const { paused, ...rest } = this._i18n.statusLabels;
      return rest;
    }

    _typeFilterOptions() {
      return this._i18n.typeLabels;
    }

    // ---- Filters ----

    _initFilters() {
      this.shadowRoot.querySelector('[data-role="status-label"]').textContent = this._i18n.filterLabels.status;
      this.shadowRoot.querySelector('[data-role="type-label"]').textContent = this._i18n.filterLabels.type;
      this._paintFilterLabels();

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
          this._filters[key] = opt.dataset.value;
          this._paintFilterMenu(key, key === 'status' ? this._statusFilterOptions() : this._typeFilterOptions());
          filterEl.querySelector('.mc-filter-current').textContent = opt.textContent;
          filterEl.dataset.open = 'false';
          this._render();
        });
      });
    }

    _paintFilterLabels() {
      const statusOptions = this._statusFilterOptions();
      const typeOptions = this._typeFilterOptions();
      this._paintFilterMenu('status', statusOptions);
      this._paintFilterMenu('type', typeOptions);
      this.shadowRoot.querySelector('.mc-filter[data-filter="status"] .mc-filter-current').textContent =
        statusOptions[this._filters.status] ?? statusOptions.all;
      this.shadowRoot.querySelector('.mc-filter[data-filter="type"] .mc-filter-current').textContent =
        typeOptions[this._filters.type] ?? typeOptions.all;
    }

    _paintFilterMenu(key, options) {
      const menu = this.shadowRoot.querySelector(`.mc-filter[data-filter="${key}"] .mc-filter-menu`);
      menu.innerHTML = renderFilterOptions(options, this._filters[key]);
    }

    _closeAllFilters() {
      this.shadowRoot.querySelectorAll('.mc-filter').forEach((el) => (el.dataset.open = 'false'));
    }

    _selectStatusFilter(value) {
      this._filters.status = value;
      const options = this._statusFilterOptions();
      this._paintFilterMenu('status', options);
      this.shadowRoot.querySelector('.mc-filter[data-filter="status"] .mc-filter-current').textContent = options[value] ?? options.all;
      this._render();
    }

    // ---- Actions ----

    _onCardClick(e) {
      const btn = e.target.closest('.mc-cta');
      const { id, action } = btn?.dataset || {};
      if (!btn || btn.disabled || !id || !ACTIONS.includes(action)) return;
      const mission = this._missions.find((m) => m.id === id);
      if (mission) this._openConfirmModal(action, mission);
    }

    _openConfirmModal(action, mission) {
      const copy = this._i18n.confirmModals[action];
      if (!copy) return this._performAction(action, mission);
      this._pendingContext = { action, mission };
      this._renderModal({
        title: copy.title,
        subtitle: mission.title,
        body: copy.body,
        ctaLabel: copy.confirmLabel,
        action: action,
        onConfirm: () => this._performAction(action, mission)
      });
    }

    async _performAction(action, mission) {
      const id = mission.id;
      this._modalCtaEl.disabled = true;

      try {
        const res = await fetch(`${this.apiBase}/missions/${encodeURIComponent(id)}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Action failed (${res.status})`);
        }
        const { mission: updated } = await res.json();
        this._applyMissionUpdate(updated);
        this._render();
        this.dispatchEvent(new CustomEvent('mission-action', { detail: { id, action, mission: updated }, bubbles: true, composed: true }));
        this._openResultModal(action, updated);
      } catch (err) {
        this.dispatchEvent(new CustomEvent('mission-error', { detail: { id, action, error: err }, bubbles: true, composed: true }));
        this._openErrorModal(err);
      }
    }

    _openResultModal(action, mission) {
      const copy = this._i18n.successModals[action];
      if (!copy) return this._closeModal();

      this._renderModal({
        title: copy.title,
        subtitle: mission.title,
        body: copy.body,
        ctaLabel: copy.ctaLabel,
        action: action,
        onConfirm: () => {
          if (action === 'enroll') this._selectStatusFilter('active');
          this._closeModal();
        }
      });
    }

    _openErrorModal(err) {
      const copy = this._i18n.errorModal;
      this._renderModal({
        title: copy.title,
        subtitle: '',
        body: err?.message || '',
        ctaLabel: copy.ctaLabel,
        action: 'locked',
        onConfirm: () => this._closeModal()
      });
    }

    _renderModal({ title, subtitle, body, ctaLabel, action, onConfirm }) {
      this._modalTitleEl.textContent = title;
      this._modalSubtitleEl.textContent = subtitle || '';
      this._modalSubtitleEl.hidden = !subtitle;
      this._modalBodyEl.innerHTML = renderRichText(body);
      this._modalCtaEl.textContent = ctaLabel;
      this._modalCtaEl.dataset.action = action;
      this._modalCtaEl.disabled = false;
      this._modalCtaEl.onclick = onConfirm;
      this._modalOverlayEl.hidden = false;
    }

    _closeModal() {
      this._modalOverlayEl.hidden = true;
      this._pendingContext = null;
    }

    _applyMissionUpdate(updated) {
      if (!updated) return;
      updated.type = deriveType(updated);

      const idx = this._missions.findIndex((m) => m.id === updated.id);
      idx > -1 ? (this._missions[idx] = updated) : this._missions.push(updated);

      if (updated.status === 'active') {
        this._missions = this._missions.map((m) =>
          m.id !== updated.id && m.status === 'active' ? { ...m, status: 'paused' } : m
        );
      }
    }

    // ---- Rendering ----

    _resolveCta(mission, status) {
      const L = this._i18n.ctaLabels;
      switch (status) {
        case 'ready':
          return { action: 'enroll', label: L.enroll, disabled: false };
        case 'active':
          return { action: 'pause', label: L.pause, disabled: false };
        case 'paused':
          return { action: 'resume', label: L.resume, disabled: false };
        case 'completed':
          return mission.claimedAt
            ? { action: 'done', label: L.claimed, disabled: true }
            : { action: 'claim', label: L.claim, disabled: false };
        case 'expired':
          return { action: 'locked', label: L.expired, disabled: true };
        default:
          return { action: 'locked', label: L.unavailable, disabled: true };
      }
    }

    _formatCountdown(expiresAt) {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) return '';
      const totalMinutes = Math.ceil(diffMs / 60000);
      const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
      const minutes = String(totalMinutes % 60).padStart(2, '0');
      return `${this._i18n.countdownLabel} <strong>${hours}h:${minutes}m</strong>`;
    }

    _updateTimers() {
      this.shadowRoot.querySelectorAll('.mc-timer[data-end]').forEach((el) => {
        el.querySelector('.mc-timer-text').innerHTML = this._formatCountdown(el.dataset.end);
      });
      if (this._missions.some((m) => effectiveStatus(m) === 'expired' && m.status !== 'expired' && m.status !== 'completed')) {
        this._render();
      }
    }

    _renderState(kind, message) {
      const markup = {
        loading: `<div class="mc-loading" part="mc-state-loading">${escapeHtml(this._i18n.states.loading)}</div>`,
        empty: `<div class="mc-empty" part="mc-state-empty">${escapeHtml(this._i18n.states.empty)}</div>`,
        error: `<div class="mc-error" part="mc-state-error">${escapeHtml(message)}</div>`
      }[kind];
      this._contentEl.innerHTML = `<div class="mc-grid" part="mc-grid">${markup}</div>`;
    }

    _render() {
      const filtered = this._missions.filter((m) => matchesFilters(m, this._filters));
      if (!filtered.length) return this._renderState('empty');

      const cards = filtered.map((m) => this._renderCard(m)).join('');
      this._contentEl.innerHTML = `<div class="mc-grid" part="mc-grid">${cards}</div>`;
    }

    _renderCard(mission) {
      const { id, title, type, expiresAt, tasks = [] } = mission;
      const status = effectiveStatus(mission);
      const cta = this._resolveCta(mission, status);

      const isLivePromo = type === 'promo' && status !== 'completed' && status !== 'expired';
      const headerRight = isLivePromo
        ? `<span class="mc-timer" part="mc-timer" data-end="${expiresAt}"><span class="mc-timer-text">${this._formatCountdown(expiresAt)}</span>${ICON_TIMER}</span>
           <span class="mc-status-pill" part="mc-status-pill" data-status="promo">${escapeHtml(this._i18n.typeLabels.promo)}</span>`
        : `<span class="mc-status-pill" part="mc-status-pill" data-status="${status}">${escapeHtml(this._i18n.statusLabels[status] || status)}</span>`;

      return `
        <article class="mc-card" part="mc-card mc-card-${type}" data-status="${status}" data-type="${type || ''}">
          <div class="mc-card-top">
            <h3 class="mc-card-title" part="mc-card-title">${escapeHtml(title)}</h3>
            ${headerRight}
          </div>
          ${renderTaskList(tasks)}
          <div class="mc-card-footer">
            <button class="mc-cta" type="button" part="mc-cta" data-id="${escapeHtml(id)}" data-action="${cta.action}" ${cta.disabled ? 'disabled' : ''}>
              ${escapeHtml(cta.label)}
            </button>
          </div>
        </article>
      `;
    }
  }

  if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, MissionControl);
})();
