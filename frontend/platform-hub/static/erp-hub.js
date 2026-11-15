/* 4_ERP · ERP HUB dashboard script.
 * The reference interface (rendering, tables, charts, drawers) with its data layer
 * replaced: everything is loaded from GET /api/dashboard. */
'use strict';
"use strict";

/* ------------------------------ icon set ---------------------------------- */
const ICON = {
  dash:'<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  inbox:'<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"/>',
  idcard:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14.5 10h4M14.5 13.5h3"/>',
  users:'<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.8"/>',
  shield:'<path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  prison:'<path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M8 8v13M12 8v13M16 8v13M3 21h18"/>',
  police:'<path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9.5 4.6-1.3 8-5.1 8-9.5V6l-8-3Z"/><path d="M12 8v8M8.5 11h7"/>',
  flask:'<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  fingerprint:'<path d="M12 4a8 8 0 0 1 8 8v2"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"/><path d="M7 20a13 13 0 0 1-.6-4v-4"/><path d="M11 12v5a7 7 0 0 0 .5 2.5"/>',
  court:'<path d="M12 3v3M5 20h14M6 20V10m12 10V10M3 10h18"/><path d="M12 6 3 10h18L12 6Z"/><path d="M9 20v-5m6 5v-5"/>',
  sync:'<path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"/>',
  pulse:'<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  database:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>',
  heart:'<path d="M12 20s-7-4.3-7-9.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.8c0 4.9-7 9.2-7 9.2Z"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 3v18M11 8h4M11 12h4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  chevDown:'<path d="m6 9 6 6 6-6"/>',
  chevLeft:'<path d="m15 18-6-6 6-6"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  arrowRight:'<path d="m9 18 6-6-6-6"/>',
  arrowUpDown:'<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>',
  download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  lock:'<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  filter:'<path d="M4 5h16l-6 7v6l-4 2v-8Z"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3.3-6.9"/><path d="M21 4v5h-5"/>',
  api:'<path d="M8 6 3 12l5 6M16 6l5 6-5 6"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sparkle:'<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>'
};
function svg(name, cls){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="'+(cls||'')+'" aria-hidden="true">'+(ICON[name]||'')+'</svg>';
}

/* --------------------------- source systems ------------------------------- */
/* Ports, names and the two documented form identifiers come from the README.
   The remaining form ids are illustrative placeholders (flagged in the UI). */
/* ------------------------------- helpers ---------------------------------- */
let NOW = new Date();
const DAY = 86400000;
const nf = new Intl.NumberFormat('en-IN');
const num = n => nf.format(n);
const pct = (a, b) => b ? (a / b * 100) : 0;
const pctS = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d){ return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
function fmtTime(d){ return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function fmtDateTime(d){ return fmtDate(d) + ' · ' + fmtTime(d); }
function rel(d){
  const s = Math.max(1, Math.round((NOW - d) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago';
  const dd = Math.round(h / 24);
  if (dd < 30) return dd + ' d ago';
  return fmtDate(d);
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));


/* ------------------------------ real data --------------------------------- *
 * Everything below is filled from GET /api/dashboard. Nothing is generated.   */
const PALETTE = ['#0E9F6B','#2BAFA0','#7FD3AE','#0A7C54','#2B4A42','#4FB9A8','#7A9E92'];
const PORTAL_ICON = { eprisons:'prison', cctns:'police', eforensics:'flask', uidai:'fingerprint', ecourts:'court' };
let SYSTEMS = [], SYS_MAP = {}, SYS_COLOR = {};
let CITIZENS = [], INTAKES = [], SYNC = [], AUDIT = [], SUBMISSIONS = [];
let TOTALS = { intake: 0, citizens: 0 };
let DATA = null, EARLIEST = new Date(), LOAD_ERROR = null;

const sysName = code => (SYS_MAP[code] && SYS_MAP[code].name) || code || '—';
const sysPort = code => (SYS_MAP[code] && SYS_MAP[code].port) || '—';
const hostPort = code => location.hostname + ':' + sysPort(code);

/* the database stores UTC as 'YYYY-MM-DD HH:MM:SS' */
function parseUtc(s){
  if (!s) return new Date(NaN);
  return new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z'));
}
function parsePayload(text){
  if (text && typeof text === 'object') return text;
  try { return JSON.parse(text); } catch (e) { return null; }
}
function distinctOptions(rows, key){
  return Array.from(new Set(rows.map(r => r[key]).filter(Boolean))).sort().map(v => ({ value:v, label:v }));
}
const sysOptions = () => SYSTEMS.map(s => ({ value:s.code, label:s.name }));
const distinctForms = () => {
  const seen = new Map();
  INTAKES.forEach(r => { if (!seen.has(r.form)) seen.set(r.form, r.formLabel || r.form); });
  return Array.from(seen, ([value, label]) => ({ value, label: label.length > 44 ? label.slice(0, 43) + '…' : label }))
    .sort((x, y) => x.label.localeCompare(y.label));
};

function applyData(d){
  DATA = d;
  NOW = new Date(d.generatedAt);

  SYSTEMS = d.platform.portals.map(p => ({
    code:p.code, name:p.name, short:p.name, port:p.port, hostname:p.hostname, forms:p.forms
  }));
  const erpSystems = (d.erp.summary && d.erp.summary.bySystem) || [];
  erpSystems.forEach(s => {
    if (!SYSTEMS.some(x => x.code === s.code)) SYSTEMS.push({ code:s.code, name:s.name || s.code, short:s.name || s.code, port:null, hostname:'', forms:0 });
  });
  SYS_MAP = Object.fromEntries(SYSTEMS.map(s => [s.code, s]));
  SYS_COLOR = Object.fromEntries(SYSTEMS.map((s, i) => [s.code, PALETTE[i % PALETTE.length]]));

  TOTALS = {
    intake: d.erp.summary ? d.erp.summary.intake : 0,
    citizens: d.erp.summary ? d.erp.summary.citizens : 0
  };

  const byId = new Map();
  CITIZENS = d.erp.citizens.map(c => {
    const o = { id:c.id, ref:c.citizen_ref, fullName:c.full_name, email:c.email || '—', mobile:c.mobile || '—',
      firstSeenIn:c.first_seen_in, createdAt:parseUtc(c.created_at), records:c.intake_count || 0 };
    byId.set(c.id, o);
    return o;
  });

  const intakeById = new Map();
  /* the API lists newest first; the views expect oldest first */
  INTAKES = d.erp.intakes.slice().reverse().map(r => {
    const cit = byId.get(r.citizen_id) || { id:null, ref:'—', fullName:r.full_name || '—', email:r.email || '—', mobile:'—',
      firstSeenIn:r.source_system, createdAt:parseUtc(r.received_at), records:0 };
    const o = {
      id:r.id, system:r.source_system, form:r.source_form, formLabel:r.subject || r.source_form,
      sourceReference:r.source_reference, citizen:cit, receivedAt:parseUtc(r.received_at),
      route:r.source_route, subject:r.subject || '', intakeRef:r.intake_ref,
      fields:(r.fields || []).map(f => ({ label:f.label || f.name, value:f.value == null ? '' : String(f.value) }))
    };
    intakeById.set(r.id, o);
    return o;
  });
  const intakeByRef = new Map(INTAKES.map(r => [r.intakeRef, r]));

  SYNC = d.platform.sync.map(s => {
    const http = s.httpStatus == null ? 0 : s.httpStatus;
    return {
      at:parseUtc(s.attemptedAt), system:s.siteCode || '', entity:s.entity, submission:s.localRef,
      erpRef:s.erpRef || null, http,
      result: s.status === 'failed' ? 'rolled_back' : (http === 200 ? 'duplicate' : 'kept'),
      intake:intakeByRef.get(s.erpRef) || null, reason:s.message || null
    };
  }).sort((x, y) => y.at - x.at);

  const refFor = a => {
    if (a.entity === 'intake'){ const r = intakeById.get(Number(a.entity_id)); if (r) return r.intakeRef; }
    if (a.entity === 'citizen'){ const c = byId.get(Number(a.entity_id)); if (c) return c.ref; }
    return String(a.entity_id);
  };
  AUDIT = d.erp.audit.map(a => ({
    at:parseUtc(a.occurred_at), entity:a.entity, action:a.action, maker:a.maker, approver:a.approver,
    details:a.details || '', ref:refFor(a)
  }));

  SUBMISSIONS = d.platform.submissions.map(s => ({
    ref:s.reference, system:s.siteCode, person:s.person || '—', erpRef:s.erpRef || null,
    status:s.erpRef ? 'committed' : 'pending', at:parseUtc(s.createdAt)
  }));
  SYNC.filter(s => s.result === 'rolled_back' && s.entity === 'submission').forEach(s => {
    SUBMISSIONS.push({ ref:s.submission, system:s.system, person:'—', erpRef:null, status:'rolled_back', at:s.at });
  });
  SUBMISSIONS.sort((x, y) => y.at - x.at);

  const stamps = [].concat(INTAKES.map(r => r.receivedAt), SYNC.map(s => s.at), AUDIT.map(a => a.at))
    .filter(t => !isNaN(t));
  EARLIEST = stamps.length ? new Date(Math.min.apply(null, stamps.map(t => t.getTime()))) : NOW;
}

/* days covered by "All": from the first recorded event to today (at least a week, at most a year) */
function allSpan(){
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const first = new Date(EARLIEST.getFullYear(), EARLIEST.getMonth(), EARLIEST.getDate());
  return Math.min(366, Math.max(7, Math.round((today - first) / DAY) + 1));
}

/* --------------------------- period filtering ----------------------------- */
const state = { days: 30, view: 'dashboard', collapsed: false, activityDays: 30 };

function windowStart(days){
  if (days === 'all' || days >= 120) return EARLIEST;
  const midnight = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  return new Date(midnight.getTime() - (Number(days) - 1)*DAY);
}
function inScope(date, days){ return date >= windowStart(days) && date <= new Date(NOW.getTime() + DAY); }

function metrics(days){
  const intakes = INTAKES.filter(r => inScope(r.receivedAt, days));
  const attempts = SYNC.filter(s => inScope(s.at, days));
  const kept = attempts.filter(s => s.result === 'kept').length;
  const dup = attempts.filter(s => s.result === 'duplicate').length;
  const rolled = attempts.filter(s => s.result === 'rolled_back').length;
  const audit = AUDIT.filter(a => inScope(a.at, days)).length;
  const perSystem = SYSTEMS.map(s => {
    const rows = intakes.filter(r => r.system === s.code);
    const att = attempts.filter(a => a.system === s.code);
    return {
      code:s.code, name:s.name,
      records: rows.length,
      kept: att.filter(a => a.result !== 'rolled_back').length,
      rolled: att.filter(a => a.result === 'rolled_back').length,
      attempts: att.length
    };
  });
  return {
    intakes, attempts, kept, dup, rolled, audit, perSystem,
    success: kept + dup,
    totalAttempts: attempts.length,
    citizens: TOTALS.citizens,
    secondsWindow: days
  };
}

function dailySeries(days){
  const span = (days === 'all' || days >= 120) ? allSpan() : Number(days);
  const buckets = [];
  const start = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (span - 1));
  for (let i = 0; i < span; i++){
    const d = new Date(start.getTime() + i*DAY);
    buckets.push({ d, received:0, refused:0 });
  }
  const keyOf = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - start) / DAY);
  INTAKES.forEach(r => { const k = keyOf(r.receivedAt); if (k >= 0 && k < span) buckets[k].received++; });
  SYNC.filter(s => s.result === 'rolled_back').forEach(s => { const k = keyOf(s.at); if (k >= 0 && k < span) buckets[k].refused++; });
  return buckets;
}

/* ============================== NAVIGATION ================================ */
let NAV = [];
function buildNav(){
  NAV = [
  { id:'g1', index:'01', label:'Overview', items:[
    { view:'dashboard', label:'Dashboard', icon:'dash' },
    { view:'overview',  label:'System Overview', icon:'layers' }
  ]},
  { id:'g2', index:'02', label:'ERP Management', items:[
    { view:'intake',   label:'Received Records', icon:'inbox', badge:true },
    { view:'lookup',   label:'Person Lookup', icon:'idcard' },
    { view:'citizens', label:'Citizens', icon:'users', badgeCitizens:true },
    { view:'audit',    label:'Audit Trail', icon:'shield' }
  ]},
  { id:'g3', index:'03', label:'Government Portals', items: SYSTEMS.map(s => ({
      view:'portal:' + s.code, label:s.name, icon:PORTAL_ICON[s.code],
      port:s.port, ext:true, portal:true
  })).concat([{ view:'portals', label:'All portals', icon:'grid' }]) },
  { id:'g4', index:'04', label:'Integration Monitoring', items:[
    { view:'sync',          label:'Sync Activity', icon:'sync' },
    { view:'integration',   label:'Integration Status', icon:'pulse' },
    { view:'submissions',   label:'Submission Monitoring', icon:'monitor' }
  ]},
  { id:'g5', index:'05', label:'System', items:[
    { view:'database', label:'Database Overview', icon:'database' },
    { view:'health',   label:'System Health', icon:'heart' },
    { view:'docs',     label:'Documentation', icon:'book' }
  ]}
];
}

function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(g => `
    <div class="nav-group" data-group="${g.id}">
      <button class="nav-group-head" type="button" aria-expanded="true">
        <span class="grp-index">${g.index}</span><span>${esc(g.label)}</span>
        <svg class="grp-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="nav-items">
        ${g.items.map(it => navItemHTML(it)).join('')}
      </div>
    </div>`).join('');
  nav.querySelectorAll('.nav-group-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const grp = btn.closest('.nav-group');
      grp.classList.toggle('is-closed');
      btn.setAttribute('aria-expanded', String(!grp.classList.contains('is-closed')));
    });
  });
  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v.startsWith('portal:')) { openPortal(v.split(':')[1]); return; }
      goto(v);
      if (window.innerWidth <= 900) closeMobileNav();
    });
    btn.addEventListener('mouseenter', () => { if (state.collapsed) showRailTip(btn); });
    btn.addEventListener('mouseleave', hideRailTip);
    btn.addEventListener('focus', () => { if (state.collapsed) showRailTip(btn); });
    btn.addEventListener('blur', hideRailTip);
  });
}
function navItemHTML(it){
  const badge = it.badge ? '<span class="nav-badge" data-badge="intake">—</span>' : '';
  const badgeC = it.badgeCitizens ? '<span class="nav-badge" data-badge="citizens">—</span>' : '';
  const port = it.port ? `<span class="nav-port">:${it.port}</span>` : '';
  const ext = it.ext ? svg('external','nav-ext') : '';
  return `<button class="nav-item" type="button" data-view="${it.view}" data-tip="${esc(it.label)}${it.port ? ' · :'+it.port : ''}">
    ${svg(it.icon,'ic')}
    <span class="nav-label">${esc(it.label)}</span>
    ${badge}${badgeC}${port}${ext}
  </button>`;
}
function updateNavBadges(){
  const n = TOTALS.intake;
  document.querySelectorAll('[data-badge="intake"]').forEach(el => el.textContent = num(n));
  document.querySelectorAll('[data-badge="citizens"]').forEach(el => el.textContent = num(TOTALS.citizens));
}
function setActiveNav(view){
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
}

/* rail tooltip */
const railTipEl = document.getElementById('railTip');
function showRailTip(btn){
  railTipEl.textContent = btn.dataset.tip || '';
  const r = btn.getBoundingClientRect();
  railTipEl.style.left = (r.right + 10) + 'px';
  railTipEl.style.top = (r.top + r.height/2 - 15) + 'px';
  railTipEl.classList.add('show');
}
function hideRailTip(){ railTipEl.classList.remove('show'); }

/* collapse / expand */
const app = document.getElementById('app');
const collapseBtn = document.getElementById('collapseBtn');
function applyCollapse(collapsed){
  state.collapsed = collapsed;
  app.classList.toggle('is-collapsed', collapsed);
  collapseBtn.setAttribute('aria-expanded', String(!collapsed));
  collapseBtn.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  hideRailTip();
}
collapseBtn.addEventListener('click', () => applyCollapse(!state.collapsed));

/* mobile off-canvas */
const navScrim = document.getElementById('navScrim');
function openMobileNav(){ app.classList.add('nav-open'); navScrim.hidden = false; navScrim.classList.add('show'); }
function closeMobileNav(){ app.classList.remove('nav-open'); navScrim.classList.remove('show'); setTimeout(()=>{ if(!app.classList.contains('nav-open')) navScrim.hidden = true; }, 240); }
document.getElementById('menuBtn').addEventListener('click', openMobileNav);
document.getElementById('navClose').addEventListener('click', closeMobileNav);
const searchToggle = document.getElementById('searchToggle');
const topbarEl = document.querySelector('.topbar');
if (searchToggle){
  searchToggle.addEventListener('click', () => {
    const open = topbarEl.classList.toggle('search-open');
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => searchInput.focus(), 30);
  });
}
function closeSearchBar(){
  if (topbarEl.classList.contains('search-open')){
    topbarEl.classList.remove('search-open');
    searchToggle.setAttribute('aria-expanded','false');
    searchPop.classList.remove('open');
  }
}
navScrim.addEventListener('click', closeMobileNav);

/* ------------------------------- routing ---------------------------------- */
/* The view is part of the address, and every move is a history entry, so Back
   and Forward walk through the hub's own pages instead of leaving it. */
function goto(view, fromHistory){
  const target = document.getElementById('view-' + view);
  if (!target) return;
  state.view = view;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v === target));
  setActiveNav(view);
  document.getElementById('crumbNow').textContent = target.dataset.title || '';
  document.getElementById('crumbSection').textContent = target.dataset.section || '';
  window.scrollTo({ top:0, behavior:'smooth' });
  hideRailTip();
  if (typeof closeSearchBar === 'function') closeSearchBar();
  try {
    // location.pathname, not '#' + view: a move drops the ?ref= / ?q= the person
    // lookup writes while it has someone on screen, so arriving at a view starts it.
    const url = location.pathname + '#' + view;
    const same = url === location.pathname + location.search + location.hash;
    if (fromHistory) { /* the address is already the one being shown */ }
    else if (same) history.replaceState({ view: view }, '', url);
    else history.pushState({ view: view }, '', url);
  } catch(e){}
  renderView(view, fromHistory);
}
document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => goto(btn.dataset.goto)));
window.addEventListener('popstate', () => {
  const v = (location.hash || '').replace('#','');
  goto(document.getElementById('view-' + v) ? v : 'dashboard', true);
});

/* ------------------------------- toasts ----------------------------------- */
const toasts = document.getElementById('toasts');
function toast(title, body, iconName){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="t-ic">${svg(iconName || 'info')}</span><div class="t-body"><b>${esc(title)}</b>${body ? '<br>' + body : ''}</div>`;
  toasts.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 4400);
}

/* --------------------------- chart tooltip -------------------------------- */
let chartTip;
function tipEl(){
  if (!chartTip){ chartTip = document.createElement('div'); chartTip.className = 'chart-tip'; document.body.appendChild(chartTip); }
  return chartTip;
}
function showTip(html, x, y){
  const t = tipEl();
  t.innerHTML = html;
  t.classList.add('show');
  const w = t.offsetWidth, h = t.offsetHeight;
  let left = x + 14, top = y - h - 12;
  if (left + w > window.innerWidth - 12) left = x - w - 14;
  if (top < 8) top = y + 16;
  t.style.left = left + 'px';
  t.style.top = top + 'px';
}
function hideTip(){ if (chartTip) chartTip.classList.remove('show'); }

/* ================================ CHARTS ================================= */
function niceMax(v){
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}
function smoothPath(pts){
  if (!pts.length) return '';
  if (pts.length < 3) return 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L');
  const d = ['M' + pts[0][0] + ' ' + pts[0][1]];
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    const c1x = p1[0] + (p2[0]-p0[0])/6, c1y = p1[1] + (p2[1]-p0[1])/6;
    const c2x = p2[0] - (p3[0]-p1[0])/6, c2y = p2[1] - (p3[1]-p1[1])/6;
    d.push('C' + [c1x,c1y,c2x,c2y,p2[0],p2[1]].map(v => Math.round(v*100)/100).join(' '));
  }
  return d.join(' ');
}

function sparkline(values, color){
  const w = 82, h = 30, pad = 2;
  if (!values.length) return '';
  const max = Math.max.apply(null, values) || 1;
  const min = Math.min.apply(null, values);
  const span = Math.max(1, max - Math.min(min, max*0.6));
  const pts = values.map((v, i) => [
    pad + i * (w - pad*2) / Math.max(1, values.length - 1),
    h - pad - ((v - Math.min(min, max*0.6)) / span) * (h - pad*2)
  ]);
  const id = 'sg' + Math.random().toString(36).slice(2, 8);
  const line = smoothPath(pts);
  const area = line + ' L' + (w-pad) + ' ' + h + ' L' + pad + ' ' + h + ' Z';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".26"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${id})"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function renderDonut(el, items, centerLabel){
  const total = items.reduce((a,b) => a + b.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R, SW = 17, size = 168, cx = size/2, cy = size/2;
  let offset = 0;
  const arcs = items.map((it, i) => {
    const len = (it.value / total) * C;
    const gap = items.length > 1 ? 2.5 : 0;
    const seg = `<circle class="dseg" data-i="${i}" cx="${cx}" cy="${cy}" r="${R}" fill="none"
      stroke="${it.color}" stroke-width="${SW}" stroke-linecap="butt"
      stroke-dasharray="${Math.max(0.5, len - gap)} ${C - Math.max(0.5, len - gap)}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"
      style="transition:stroke-width .16s ease,opacity .16s ease"></circle>`;
    offset += len;
    return seg;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribution of received records by source system">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#F1F7F3" stroke-width="${SW}"></circle>
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="donut-center">${num(total)}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-center-sub">${(centerLabel || 'TOTAL RECORDS').toUpperCase()}</text>
  </svg>`;
  const legend = document.getElementById('donutLegend');
  if (legend){
    legend.innerHTML = items.map((it, i) => `
      <div class="dl-row" data-i="${i}">
        <span class="lg-dot" style="background:${it.color}"></span>
        <span class="dl-name">${esc(it.name)}</span>
        <span class="dl-val">${num(it.value)}<span style="color:var(--text-3);font-weight:600"> · ${pct(it.value,total).toFixed(0)}%</span></span>
      </div>`).join('');
  }
  const sEl = el.querySelector('svg');
  el.querySelectorAll('.dseg').forEach(seg => {
    seg.addEventListener('mousemove', e => {
      const i = +seg.dataset.i, it = items[i];
      el.querySelectorAll('.dseg').forEach(o => { o.style.strokeWidth = (o === seg ? SW + 5 : SW); o.style.opacity = (o === seg ? 1 : .58); });
      if (legend) legend.querySelectorAll('.dl-row').forEach((r, j) => r.classList.toggle('is-dim', j !== i));
      showTip(`<div class="ct-title">${esc(it.name)}</div><div class="ct-row"><span class="ct-dot" style="background:${it.color}"></span>records<b>${num(it.value)}</b></div><div class="ct-row" style="color:#A9C3B8;font-size:10.5px">${pctS(it.value,total)} of intake</div>`, e.clientX, e.clientY);
    });
    seg.addEventListener('mouseleave', () => {
      el.querySelectorAll('.dseg').forEach(o => { o.style.strokeWidth = SW; o.style.opacity = 1; });
      if (legend) legend.querySelectorAll('.dl-row').forEach(r => r.classList.remove('is-dim'));
      hideTip();
    });
  });
  if (sEl) sEl.addEventListener('mouseleave', hideTip);
}

function renderAreaChart(el, buckets){
  const W = 780, H = 268, L = 46, R = 16, T = 18, B = 30;
  const innerW = W - L - R, innerH = H - T - B;
  const maxVal = niceMax(Math.max(1, ...buckets.map(b => b.received), ...buckets.map(b => b.refused)));
  const xOf = i => L + (buckets.length === 1 ? innerW/2 : i * innerW / (buckets.length - 1));
  const yOf = v => T + innerH - (v / maxVal) * innerH;
  const okPts = buckets.map((b, i) => [xOf(i), yOf(b.received)]);
  const badPts = buckets.map((b, i) => [xOf(i), yOf(b.refused)]);
  const gridVals = [0, .2, .4, .6, .8, 1].map(f => maxVal * f);
  const grid = gridVals.map(v => `
    <line x1="${L}" y1="${yOf(v)}" x2="${W-R}" y2="${yOf(v)}" stroke="#EDF4F0" stroke-width="1"/>
    <text x="${L-9}" y="${yOf(v)+3.5}" text-anchor="end" font-size="10" fill="#66766F" font-weight="600">${num(Math.round(v))}</text>`).join('');
  const tickCount = Math.min(6, buckets.length);
  let ticks = '';
  for (let k = 0; k < tickCount; k++){
    const i = Math.round(k * (buckets.length - 1) / Math.max(1, tickCount - 1));
    const b = buckets[i];
    const lbl = buckets.length <= 7 ? MONTHS[b.d.getMonth()] + ' ' + b.d.getDate() : b.d.getDate() + ' ' + MONTHS[b.d.getMonth()];
    ticks += `<text x="${xOf(i)}" y="${H-10}" text-anchor="middle" font-size="10" fill="#66766F" font-weight="600">${lbl}</text>`;
  }
  const okLine = smoothPath(okPts);
  const badLine = smoothPath(badPts);
  const okArea = okLine + ` L${xOf(buckets.length-1)} ${T+innerH} L${L} ${T+innerH} Z`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Received records and refused attempts over time">
    <defs>
      <linearGradient id="gradOk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0E9F6B" stop-opacity=".22"/><stop offset="100%" stop-color="#0E9F6B" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}${ticks}
    <path d="${okArea}" fill="url(#gradOk)"/>
    <path d="${okLine}" fill="none" stroke="#0E9F6B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${badLine}" fill="none" stroke="#D8A64E" stroke-width="1.7" stroke-dasharray="4 4" stroke-linecap="round"/>
    <line id="focusLine" x1="0" y1="${T}" x2="0" y2="${T+innerH}" stroke="#9FD8BC" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
    <circle id="focusOk" r="4.5" fill="#fff" stroke="#0E9F6B" stroke-width="2.4" opacity="0"/>
    <circle id="focusBad" r="3.5" fill="#fff" stroke="#D8A64E" stroke-width="2" opacity="0"/>
    <rect id="hit" x="${L}" y="${T}" width="${innerW}" height="${innerH}" fill="transparent" style="cursor:crosshair"/>
  </svg>`;

  const svgEl = el.querySelector('svg');
  const focusLine = svgEl.querySelector('#focusLine');
  const focusOk = svgEl.querySelector('#focusOk');
  const focusBad = svgEl.querySelector('#focusBad');
  const hit = svgEl.querySelector('#hit');

  function move(evt){
    const box = svgEl.getBoundingClientRect();
    const px = (evt.clientX - box.left) / box.width * W;
    let i = Math.round((px - L) / (innerW / Math.max(1, buckets.length - 1)));
    i = Math.max(0, Math.min(buckets.length - 1, i));
    const b = buckets[i];
    const x = xOf(i);
    focusLine.setAttribute('x1', x); focusLine.setAttribute('x2', x); focusLine.setAttribute('opacity','1');
    focusOk.setAttribute('cx', x); focusOk.setAttribute('cy', yOf(b.received)); focusOk.setAttribute('opacity','1');
    focusBad.setAttribute('cx', x); focusBad.setAttribute('cy', yOf(b.refused)); focusBad.setAttribute('opacity', b.refused ? '1' : '0');
    showTip(`<div class="ct-title">${fmtDate(b.d)}</div>
      <div class="ct-row"><span class="ct-dot" style="background:#3FC594"></span>Received<b>${num(b.received)}</b></div>
      <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>Refused<b>${num(b.refused)}</b></div>`, evt.clientX, evt.clientY);
  }
  hit.addEventListener('mousemove', move);
  hit.addEventListener('mouseleave', () => {
    focusLine.setAttribute('opacity','0'); focusOk.setAttribute('opacity','0'); focusBad.setAttribute('opacity','0'); hideTip();
  });
}

function renderBars(el, rows, opts){
  const max = Math.max(1, ...rows.map(r => r.kept + r.rolled));
  el.innerHTML = rows.map(r => {
    const keptPct = (r.kept / max) * 100, rollPct = (r.rolled / max) * 100;
    return `<div class="bar-row">
      <div class="bar-name"><span class="sys-dot" style="background:${SYS_COLOR[r.code]}"></span><span>${esc(r.name)}</span></div>
      <div class="bar-track" data-name="${esc(r.name)}" data-kept="${r.kept}" data-rolled="${r.rolled}">
        <div class="bar-fill" style="width:${keptPct}%"></div>
        <div class="bar-fill alt" style="width:${rollPct}%"></div>
      </div>
      <div class="bar-val">${num(r.kept + r.rolled)}<small>${r.rolled ? r.rolled + ' back' : 'all kept'}</small></div>
    </div>`;
  }).join('');
  el.querySelectorAll('.bar-track').forEach(t => {
    t.addEventListener('mousemove', e => {
      showTip(`<div class="ct-title">${esc(t.dataset.name)}</div>
        <div class="ct-row"><span class="ct-dot" style="background:#3FC594"></span>Kept<b>${num(+t.dataset.kept)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>Rolled back<b>${num(+t.dataset.rolled)}</b></div>`, e.clientX, e.clientY);
    });
    t.addEventListener('mouseleave', hideTip);
  });
}

function renderHealthRows(el, m, compact){
  const rows = [
    { name:'201 · new intake written', value:m.kept, color:'var(--success)', tone:'ok' },
    { name:'200 · duplicate retry absorbed', value:m.dup, color:'#4FB9A8', tone:'info' },
    { name:'4xx / 5xx · rolled back', value:m.rolled, color:'#D8A64E', tone:'warn' }
  ];
  el.innerHTML = rows.map(r => `
    <div class="health-row">
      <span class="lg-dot" style="background:${r.color}"></span>
      <span class="hr-name">${r.name}</span>
      <span class="hr-val">${num(r.value)}</span>
      <span class="hr-pct">${pctS(r.value, m.totalAttempts)}</span>
    </div>`).join('') + (compact ? '' : `
    <div class="health-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:11px">
      <span class="lg-dot" style="background:var(--ink)"></span>
      <span class="hr-name" style="color:var(--ink);font-weight:800">Commit rate</span>
      <span class="hr-val">${pctS(m.kept + m.dup, m.totalAttempts)}</span>
      <span class="hr-pct"></span>
    </div>`);
}

function renderMeter(el, m){
  const segs = [
    { v:m.kept, c:'var(--success)' },
    { v:m.dup, c:'#4FB9A8' },
    { v:m.rolled, c:'#D8A64E' }
  ];
  el.innerHTML = segs.map(s => `<span style="width:${pct(s.v, m.totalAttempts).toFixed(2)}%;background:${s.c}"></span>`).join('');
}

/* =============================== TABLES ================================== */
const SORT_ICON = '<svg class="sort-ind" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>';

function optionsOf(f){ return typeof f.options === 'function' ? f.options() : f.options; }

function createTable(host, cfg){
  const st = { q:'', page:1, sortKey: cfg.defaultSort || null, dir: cfg.defaultDir || 'desc', filters:{} };
  cfg.filters = cfg.filters || [];
  cfg.filters.forEach(f => st.filters[f.key] = f.value || '');
  host.innerHTML = `
    <div class="tbl-toolbar">
      <div class="tbl-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        <input type="search" placeholder="${esc(cfg.searchPlaceholder || 'Search…')}" aria-label="${esc(cfg.searchPlaceholder || 'Search table')}">
      </div>
      ${cfg.filters.map(f => `<select class="field" data-filter="${f.key}" aria-label="${esc(f.label)}">
        <option value="">${esc(f.label)}</option>
        ${optionsOf(f).map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}
      </select>`).join('')}
      <button class="btn btn-sm" data-act="export" type="button">${svg('download')} Export</button>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead></thead><tbody></tbody></table></div>
    <div class="pager">
      <div class="pager-info"></div>
      <div class="pager-btns"></div>
    </div>`;

  const qInput = host.querySelector('.tbl-search input');
  const thead = host.querySelector('thead');
  const tbody = host.querySelector('tbody');
  const pagerInfo = host.querySelector('.pager-info');
  const pagerBtns = host.querySelector('.pager-btns');

  function filtered(){
    let rows = cfg.rows();
    const q = st.q.trim().toLowerCase();
    if (q) rows = rows.filter(r => cfg.searchKeys(r).join(' ').toLowerCase().includes(q));
    cfg.filters.forEach(f => {
      const v = st.filters[f.key];
      if (v) rows = rows.filter(r => f.match(r, v));
    });
    if (st.sortKey){
      const col = cfg.columns.find(c => c.key === st.sortKey);
      if (col && col.sortValue){
        rows = rows.slice().sort((a,b) => {
          const av = col.sortValue(a), bv = col.sortValue(b);
          if (av === bv) return 0;
          const res = av > bv ? 1 : -1;
          return st.dir === 'asc' ? res : -res;
        });
      }
    }
    return rows;
  }

  function drawHead(){
    thead.innerHTML = '<tr>' + cfg.columns.map(c => {
      const sorted = st.sortKey === c.key;
      return `<th class="${c.sortable ? 'sortable' : ''} ${sorted ? 'is-sorted' : ''} ${c.align === 'right' ? 'col-right' : ''}" ${c.sortable ? `data-sort="${c.key}"` : ''} ${sorted ? `aria-sort="${st.dir === 'asc' ? 'ascending' : 'descending'}"` : ''}>
        <span class="th-inner">${esc(c.label)}${c.sortable ? SORT_ICON : ''}</span></th>`;
    }).join('') + '</tr>';
    thead.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (st.sortKey === k) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
      else { st.sortKey = k; st.dir = k === 'received' || k === 'at' ? 'desc' : 'asc'; }
      st.page = 1; drawHead(); drawBody();
    }));
  }

  function drawBody(){
    const rows = filtered();
    const per = cfg.pageSize || 8;
    const pages = Math.max(1, Math.ceil(rows.length / per));
    if (st.page > pages) st.page = pages;
    const start = (st.page - 1) * per;
    const slice = rows.slice(start, start + per);

    if (!slice.length){
      tbody.innerHTML = `<tr><td colspan="${cfg.columns.length}"><div class="tbl-empty">
        ${svg('search')}<div>${esc(cfg.emptyText || 'Nothing matches these filters.')}</div>
        <button class="btn btn-sm btn-ghost" data-act="reset" type="button" style="margin-top:10px">Clear filters</button>
      </div></td></tr>`;
      tbody.querySelector('[data-act="reset"]').addEventListener('click', reset);
    } else {
      tbody.innerHTML = slice.map((r, idx) => `<tr class="${cfg.onRow ? 'clickable' : ''}" data-idx="${start + idx}">` +
        cfg.columns.map(c => `<td class="${c.align === 'right' ? 'col-right' : ''} ${c.nowrap ? 'nowrap' : ''}">${c.render(r)}</td>`).join('') +
        '</tr>').join('');
      tbody.querySelectorAll('tr[data-idx]').forEach(tr => {
        if (!cfg.onRow) return;
        tr.addEventListener('click', e => {
          if (e.target.closest('[data-stop]')) return;
          cfg.onRow(rows[+tr.dataset.idx]);
        });
      });
    }
    pagerInfo.innerHTML = rows.length
      ? `Showing <b>${num(start + 1)}–${num(Math.min(start + per, rows.length))}</b> of <b>${num(rows.length)}</b>`
      : 'No rows';
    let btns = `<button class="pg" data-p="prev" ${st.page === 1 ? 'disabled' : ''} aria-label="Previous page">${svg('chevLeft')}</button>`;
    const windowPages = [];
    let from = Math.max(1, st.page - 2), to = Math.min(pages, from + 4);
    from = Math.max(1, to - 4);
    for (let p = from; p <= to; p++) windowPages.push(p);
    btns += windowPages.map(p => `<button class="pg ${p === st.page ? 'is-active' : ''}" data-p="${p}">${p}</button>`).join('');
    btns += `<button class="pg" data-p="next" ${st.page === pages ? 'disabled' : ''} aria-label="Next page">${svg('arrowRight')}</button>`;
    pagerBtns.innerHTML = btns;
    pagerBtns.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.p;
      if (v === 'prev') st.page = Math.max(1, st.page - 1);
      else if (v === 'next') st.page = Math.min(pages, st.page + 1);
      else st.page = +v;
      drawBody();
    }));
    if (cfg.onCount) cfg.onCount(rows.length);
  }

  function reset(){
    st.q = ''; st.page = 1; st.filters = {};
    cfg.filters.forEach(f => st.filters[f.key] = '');
    qInput.value = '';
    host.querySelectorAll('[data-filter]').forEach(s => s.value = '');
    drawBody();
  }

  qInput.addEventListener('input', () => { st.q = qInput.value; st.page = 1; drawBody(); });
  host.querySelectorAll('[data-filter]').forEach(sel => sel.addEventListener('change', () => {
    st.filters[sel.dataset.filter] = sel.value; st.page = 1; drawBody();
  }));
  host.querySelector('[data-act="export"]').addEventListener('click', () => {
    const rows = filtered();
    const head = cfg.columns.filter(c => c.label).map(c => '"' + c.label.replace(/"/g,'""') + '"').join(',');
    const body = rows.map(r => cfg.columns.filter(c => c.label).map(c => {
      let v = (c.csv ? c.csv(r) : String(c.raw ? c.raw(r) : '')).replace(/<[^>]*>/g,'');
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; /* a spreadsheet must not read a value as a formula */
      v = v.replace(/"/g,'""');
      return '"' + v + '"';
    }).join(',')).join('\n');
    downloadCSV((cfg.exportName || 'erp-export') + '.csv', head + '\n' + body);
    toast('CSV exported', num(rows.length) + ' rows from the current filter.', 'download');
  });

  drawHead(); drawBody();
  function syncFilterOptions(){
    host.querySelectorAll('select[data-filter]').forEach(sel => {
      const f = cfg.filters.find(x => x.key === sel.dataset.filter);
      if (!f || typeof f.options !== 'function') return;
      const keep = sel.value;
      sel.innerHTML = '<option value="">' + esc(f.label) + '</option>' +
        optionsOf(f).map(o => '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('');
      sel.value = Array.from(sel.options).some(o => o.value === keep) ? keep : '';
      st.filters[f.key] = sel.value;
    });
  }
  return { refresh(){ syncFilterOptions(); drawHead(); drawBody(); } };
}

function downloadCSV(filename, text){
  try {
    const blob = new Blob(['\ufeff' + text], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
  } catch(err){ toast('Download blocked', 'Your browser blocked the file download in this preview.', 'alert'); }
}

function sysChip(code){
  const s = SYS_MAP[code];
  return `<span class="sys-cell"><span class="sys-dot" style="background:${SYS_COLOR[code] || '#87968F'}"></span>${esc(s ? s.short : code)}</span>`;
}
function resultPill(r){
  if (r === 'pending') return '<span class="pill pill-neutral">'+svg('refresh')+'pending</span>';
  if (r === 'kept' || r === 'committed') return '<span class="pill pill-ok">'+svg('check')+'kept</span>';
  if (r === 'duplicate') return '<span class="pill pill-info">'+svg('refresh')+'duplicate</span>';
  return '<span class="pill pill-warn">'+svg('alert')+'rolled back</span>';
}
function httpPill(code){
  if (!code) return '<span class="pill pill-neutral" title="no HTTP status was recorded">—</span>';
  const ok = code === 200 || code === 201;
  return `<span class="pill ${ok ? 'pill-ok' : 'pill-danger'}" style="font-family:var(--mono);font-weight:700">${code}</span>`;
}

/* --------------------------- table definitions ---------------------------- */
const TABLES = {};

const intakeColumns = [
  { key:'ref', label:'Intake reference', sortable:true, render:r => `<div class="t-main mono" style="color:var(--ink)">${esc(r.intakeRef)}</div>`,
    sortValue:r => r.intakeRef, csv:r => r.intakeRef },
  { key:'citizen', label:'Citizen', sortable:true,
    render:r => `<div class="t-main">${esc(r.citizen.fullName)}</div><div class="t-sub">${esc(r.citizen.ref)}</div>`,
    sortValue:r => r.citizen.fullName, csv:r => r.citizen.fullName + ' (' + r.citizen.ref + ')' },
  { key:'system', label:'Source system', sortable:true, render:r => sysChip(r.system), sortValue:r => r.system, csv:r => sysName(r.system) },
  { key:'form', label:'Source form', sortable:true,
    render:r => `<div class="mono">${esc(r.form)}</div><div class="t-sub">${esc(r.formLabel)}</div>`,
    sortValue:r => r.form, csv:r => r.form },
  { key:'source', label:'Source reference', render:r => `<span class="mono">${esc(r.sourceReference)}</span>`, csv:r => r.sourceReference },
  { key:'received', label:'Received', sortable:true, nowrap:true,
    render:r => `<div class="t-main" style="font-weight:600">${fmtDate(r.receivedAt)}</div><div class="t-sub">${rel(r.receivedAt)}</div>`,
    sortValue:r => r.receivedAt.getTime(), csv:r => fmtDateTime(r.receivedAt) },
  { key:'status', label:'Status', align:'right',
    render:r => `<div class="row-actions"><span class="pill pill-ok">${svg('check')}received</span><button class="btn btn-xs" type="button">View</button></div>`,
    csv:() => 'received' }
];

function defineTables(){
  const recentHost = document.querySelector('[data-table="recent"]');
  TABLES.recent = createTable(recentHost, {
    columns: intakeColumns,
    rows: () => INTAKES.slice().reverse().filter(r => inScope(r.receivedAt, state.days)).slice(0, 60),
    searchPlaceholder:'Search intake ref, citizen or source ref…',
    searchKeys: r => [r.intakeRef, r.citizen.fullName, r.citizen.ref, r.sourceReference, r.form, sysName(r.system)],
    filters:[{ key:'system', label:'All source systems', options:sysOptions, match:(r,v) => r.system === v }],
    pageSize:6,
    defaultSort:'received', defaultDir:'desc',
    onRow: r => openRecord(r),
    exportName:'erp-recent-records',
    emptyText:'No records in this date range.'
  });

  TABLES.intake = createTable(document.querySelector('[data-table="intake"]'), {
    columns: intakeColumns,
    rows: () => INTAKES.slice().reverse(),
    searchPlaceholder:'Search intake ref, citizen, source form or reference…',
    searchKeys: r => [r.intakeRef, r.citizen.fullName, r.citizen.ref, r.citizen.email, r.sourceReference, r.form, sysName(r.system)],
    filters:[
      { key:'system', label:'All source systems', options:sysOptions, match:(r,v) => r.system === v },
      { key:'form', label:'All forms', options:distinctForms, match:(r,v) => r.form === v }
    ],
    pageSize:8,
    defaultSort:'received', defaultDir:'desc',
    onRow: r => openRecord(r),
    exportName:'erp-received-records',
    onCount: n => { const el = document.getElementById('intakeCountSub'); if (el) el.textContent = num(n) + ' rows · newest first · GET /api/intake?limit=5000'; }
  });

  TABLES.citizens = createTable(document.querySelector('[data-table="citizens"]'), {
    columns:[
      { key:'ref', label:'Citizen reference', sortable:true, render:r => `<span class="mono" style="color:var(--ink);font-weight:600">${esc(r.ref)}</span>`, sortValue:r => r.ref, csv:r => r.ref },
      { key:'name', label:'Name', sortable:true, render:r => `<div class="t-main">${esc(r.fullName)}</div>`, sortValue:r => r.fullName, csv:r => r.fullName },
      { key:'email', label:'Email', render:r => `<span class="mono">${esc(r.email)}</span>`, csv:r => r.email },
      { key:'mobile', label:'Mobile', render:r => `<span class="mono">${esc(r.mobile)}</span>`, csv:r => r.mobile },
      { key:'seen', label:'First seen in', sortable:true, render:r => sysChip(r.firstSeenIn), sortValue:r => r.firstSeenIn, csv:r => sysName(r.firstSeenIn) },
      { key:'records', label:'Records', align:'right', sortable:true, render:r => `<span class="t-main">${num(countIntakes(r))}</span>`, sortValue:r => countIntakes(r), csv:r => countIntakes(r) }
    ],
    rows: () => CITIZENS,
    searchPlaceholder:'Search name, citizen ref, email or mobile…',
    searchKeys: r => [r.ref, r.fullName, r.email, r.mobile],
    filters:[{ key:'sys', label:'All source systems', options:sysOptions, match:(r,v) => r.firstSeenIn === v }],
    pageSize:8,
    defaultSort:'records', defaultDir:'desc',
    onRow: r => openCitizen(r),
    exportName:'erp-citizens',
    onCount: n => { const el = document.getElementById('citizenCountSub'); if (el) el.textContent = num(n) + ' citizens · one registration works on all five portals'; }
  });

  TABLES.audit = createTable(document.querySelector('[data-table="audit"]'), {
    columns:[
      { key:'at', label:'Occurred at', sortable:true, nowrap:true, render:r => `<div class="t-main" style="font-weight:600">${fmtDate(r.at)}</div><div class="t-sub">${fmtTime(r.at)} · ${rel(r.at)}</div>`, sortValue:r => r.at.getTime(), csv:r => fmtDateTime(r.at) },
      { key:'entity', label:'Entity', sortable:true, render:r => `<span class="mono" style="color:var(--ink)">${esc(r.entity)}</span>`, sortValue:r => r.entity, csv:r => r.entity },
      { key:'action', label:'Action', sortable:true, render:r => `<span class="pill pill-mint">${esc(r.action)}</span>`, sortValue:r => r.action, csv:r => r.action },
      { key:'maker', label:'Maker', sortable:true, render:r => `<span class="maker">${esc(r.maker)}</span>`, sortValue:r => r.maker, csv:r => r.maker },
      { key:'ref', label:'Reference', render:r => `<span class="mono">${esc(r.ref)}</span>`, csv:r => r.ref }
    ],
    rows: () => AUDIT,
    searchPlaceholder:'Search entity, action, maker or reference…',
    searchKeys: r => [r.entity, r.action, r.maker, r.ref],
    filters:[
      { key:'entity', label:'All entities', options:() => distinctOptions(AUDIT, 'entity'), match:(r,v) => r.entity === v },
      { key:'maker', label:'All makers', options:() => distinctOptions(AUDIT, 'maker'), match:(r,v) => r.maker === v }
    ],
    pageSize:10,
    defaultSort:'at', defaultDir:'desc',
    exportName:'erp-audit-trail',
    onCount: n => { const el = document.getElementById('auditCountSub'); if (el) el.textContent = num(n) + ' events · append-only (INSERT only)'; }
  });

  const syncColumns = [
    { key:'at', label:'Attempted at', sortable:true, nowrap:true, render:r => `<div class="t-main" style="font-weight:600">${fmtDate(r.at)}</div><div class="t-sub">${fmtTime(r.at)} · ${rel(r.at)}</div>`, sortValue:r => r.at.getTime(), csv:r => fmtDateTime(r.at) },
    { key:'system', label:'Source system', sortable:true, render:r => sysChip(r.system), sortValue:r => r.system, csv:r => sysName(r.system) },
    { key:'sub', label:'Submission ref', render:r => `<span class="mono">${esc(r.submission)}</span>`, csv:r => r.submission },
    { key:'erp', label:'ERP intake ref', render:r => r.erpRef ? `<span class="mono" style="color:var(--emerald-ink)">${esc(r.erpRef)}</span>` : '<span style="color:var(--text-3);font-size:11.5px">— not created</span>', csv:r => r.erpRef || '' },
    { key:'http', label:'HTTP', align:'right', render:r => httpPill(r.http), csv:r => r.http },
    { key:'res', label:'Result', align:'right', render:r => resultPill(r.result), csv:r => r.result }
  ];
  TABLES.sync = createTable(document.querySelector('[data-table="sync"]'), {
    columns: syncColumns,
    rows: () => SYNC,
    searchPlaceholder:'Search submission ref, intake ref or system…',
    searchKeys: r => [r.submission, r.erpRef, r.system, String(r.http), r.result],
    filters:[
      { key:'result', label:'All results', options:[{ value:'kept', label:'Kept (201)' }, { value:'duplicate', label:'Duplicate (200)' }, { value:'rolled_back', label:'Rolled back' }], match:(r,v) => r.result === v },
      { key:'system', label:'All source systems', options:sysOptions, match:(r,v) => r.system === v }
    ],
    pageSize:10,
    defaultSort:'at', defaultDir:'desc',
    onRow: r => openSyncAttempt(r),
    exportName:'erp-sync-ledger',
    onCount: n => { const el = document.getElementById('syncCountSub'); if (el) el.textContent = num(n) + ' attempts · erp_sync ledger · synchronous write-through'; }
  });

  TABLES.syncMini = createTable(document.querySelector('[data-table="syncMini"]'), {
    columns:[
      { key:'at', label:'When', sortable:true, nowrap:true, render:r => `<div class="t-main" style="font-weight:600">${rel(r.at)}</div><div class="t-sub">${fmtTime(r.at)}</div>`, sortValue:r => r.at.getTime(), csv:r => fmtDateTime(r.at) },
      { key:'system', label:'Source', render:r => sysChip(r.system), csv:r => sysName(r.system) },
      { key:'sub', label:'Submission', render:r => `<span class="mono">${esc(r.submission)}</span>`, csv:r => r.submission },
      { key:'erp', label:'ERP intake', render:r => r.erpRef ? `<span class="mono">${esc(r.erpRef)}</span>` : '<span style="color:var(--text-3);font-size:11.5px">—</span>', csv:r => r.erpRef || '' },
      { key:'http', label:'HTTP', align:'right', render:r => httpPill(r.http), csv:r => r.http }
    ],
    rows: () => SYNC.filter(s => inScope(s.at, state.days)),
    searchPlaceholder:'Search refs…',
    searchKeys: r => [r.submission, r.erpRef, r.system],
    filters:[],
    pageSize:6,
    defaultSort:'at', defaultDir:'desc',
    onRow: r => openSyncAttempt(r),
    exportName:'erp-sync-recent'
  });

  TABLES.submissions = createTable(document.querySelector('[data-table="submissions"]'), {
    columns:[
      { key:'ref', label:'Submission ref', sortable:true, render:r => `<span class="mono" style="color:var(--ink);font-weight:600">${esc(r.ref)}</span>`, sortValue:r => r.ref, csv:r => r.ref },
      { key:'system', label:'Portal', sortable:true, render:r => sysChip(r.system), sortValue:r => r.system, csv:r => sysName(r.system) },
      { key:'person', label:'Person', render:r => `<div class="t-main">${esc(r.person)}</div>`, csv:r => r.person },
      { key:'erp', label:'ERP intake ref', render:r => r.erpRef ? `<span class="mono" style="color:var(--emerald-ink)">${esc(r.erpRef)}</span>` : '<span style="color:var(--text-3);font-size:11.5px">— not mirrored</span>', csv:r => r.erpRef || '' },
      { key:'at', label:'Submitted', sortable:true, nowrap:true, render:r => `<div class="t-main" style="font-weight:600">${fmtDate(r.at)}</div><div class="t-sub">${rel(r.at)}</div>`, sortValue:r => r.at.getTime(), csv:r => fmtDateTime(r.at) },
      { key:'status', label:'Status', align:'right', render:r => resultPill(r.status), csv:r => r.status }
    ],
    rows: () => SUBMISSIONS,
    searchPlaceholder:'Search submission ref, portal or person…',
    searchKeys: r => [r.ref, r.system, r.person, r.erpRef],
    filters:[{ key:'status', label:'All statuses', options:[{ value:'committed', label:'Committed' }, { value:'pending', label:'Pending' }, { value:'rolled_back', label:'Rolled back' }], match:(r,v) => r.status === v }],
    pageSize:10,
    defaultSort:'at', defaultDir:'desc',
    exportName:'platform-submissions',
    onCount: n => { const el = document.getElementById('subCountSub'); if (el) el.textContent = num(n) + ' submissions · hub-owned data, shown read-only'; }
  });
}
function countIntakes(c){ return c.records; }

/* ============================ VIEW RENDERERS ============================= */
function setText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value; }

function renderDashboard(){
  const m = metrics(state.days);

  setText('kpiReceived', num(m.intakes.length));
  setText('kpiReceivedNote', num(m.intakes.length) + ' of ' + num(TOTALS.intake) + ' intake rows');
  setText('kpiReceivedRange', state.days === 'all' ? 'all time' : state.days + ' days');
  setText('kpiCitizens', num(TOTALS.citizens));
  setText('sourceCount', num(SYSTEMS.length) + ' registered source system' + (SYSTEMS.length === 1 ? '' : 's'));
  setText('kpiSuccess', num(m.success));
  setText('kpiSuccessNote', num(m.success) + ' of ' + num(m.totalAttempts) + ' attempts');
  setText('kpiRollback', num(m.rolled));
  setText('kpiAudit', num(m.audit));
  setText('kpiDupes', num(m.dup));

  const series = dailySeries(state.days).slice(-14).map(b => b.received);
  document.getElementById('sparkReceived').innerHTML = sparkline(series, '#0E9F6B');
  const cw = dailySeries(state.days).slice(-14);
  const startC = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (cw.length - 1));
  const cSeries = cw.map(b => CITIZENS.filter(c => {
    const d = new Date(c.createdAt.getFullYear(), c.createdAt.getMonth(), c.createdAt.getDate());
    return +d === +(new Date(b.d.getFullYear(), b.d.getMonth(), b.d.getDate()));
  }).length);
  document.getElementById('sparkCitizens').innerHTML = sparkline(cSeries.length ? cSeries : [0], '#4FB9A8');

  const donutItems = m.perSystem.filter(s => s.records > 0)
    .map(s => ({ name:s.name, value:s.records, color:SYS_COLOR[s.code] }))
    .sort((a,b) => b.value - a.value);
  if (donutItems.length) renderDonut(document.getElementById('chartDonut'), donutItems, 'total records');
  else document.getElementById('chartDonut').innerHTML = '<div class="tbl-empty">No records in this range.</div>';

  renderBars(document.getElementById('chartBars'), m.perSystem);
  renderMeter(document.getElementById('healthMeter'), m);
  renderHealthRows(document.getElementById('healthRows'), m, false);
  renderAreaChart(document.getElementById('chartActivity'), dailySeries(state.activityDays));

  const feed = document.getElementById('auditFeed');
  const recentAudit = AUDIT.filter(a => inScope(a.at, state.days)).slice(0, 5);
  feed.innerHTML = recentAudit.length ? recentAudit.map(a => `
    <div class="feed-item">
      <span class="feed-dot">${svg(a.entity === 'citizen' ? 'user' : a.entity === 'intake' ? 'inbox' : 'layers')}</span>
      <div class="feed-body">
        <div class="feed-line"><b>${esc(a.action)}</b> on <code>${esc(a.entity)}</code> · ${esc(a.ref)}</div>
        <div class="feed-meta"><span class="maker">${esc(a.maker)}</span><span class="sep"></span>${rel(a.at)}</div>
      </div>
    </div>`).join('') : '<div class="tbl-empty">No audit activity in this range.</div>';

  const quick = document.getElementById('portalQuick');
  quick.innerHTML = m.perSystem.map(s => `
    <button class="port-open" type="button" data-portal="${s.code}">
      <span class="sys-dot" style="background:${SYS_COLOR[s.code]};width:8px;height:8px;border-radius:50%"></span>
      <span class="po-main">
        <span class="po-name">${esc(s.name)}</span>
        <span class="po-sub">${hostPort(s.code)} · ${num(s.records)} records</span>
      </span>
      ${svg('external')}
    </button>`).join('');
  quick.querySelectorAll('[data-portal]').forEach(b => b.addEventListener('click', () => openPortal(b.dataset.portal)));

  if (TABLES.recent) TABLES.recent.refresh();
  if (TABLES.syncMini) TABLES.syncMini.refresh();
  updateNavBadges();
}

function renderIntegration(){
  const m = metrics(state.days);
  renderBars(document.getElementById('chartBarsFull'), m.perSystem);
  renderHealthRows(document.getElementById('healthRowsFull'), m, false);
  setText('attemptsTotal', num(m.totalAttempts));
}

function renderPortalsView(){
  setText('hubAddress', location.origin + '/');
  const m = metrics('all');
  const grid = document.getElementById('portalGrid');
  grid.innerHTML = SYSTEMS.map(s => {
    const stat = m.perSystem.find(x => x.code === s.code);
    return `<div class="portal-card">
      <div class="pc-top">
        <span class="pc-logo">${svg(PORTAL_ICON[s.code] || 'grid')}</span>
        <div style="flex:1;min-width:0">
          <div class="pc-name">${esc(s.name)}</div>
          <div class="pc-cat">${esc(s.hostname)}</div>
        </div>
        <span class="pc-port">:${s.port || '—'}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="pill pill-neutral">${num(s.forms)} forms</span>
        <span class="pill pill-mint">${num(stat.records)} records</span>
      </div>
      <div class="pc-foot">
        <span class="micro" style="font-family:var(--mono);font-size:10px">${hostPort(s.code)}</span>
        <button class="pc-open" type="button" data-portal="${s.code}">Open replica ${svg('external')}</button>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-portal]').forEach(b => b.addEventListener('click', () => openPortal(b.dataset.portal)));
}

function renderHealthView(){
  const rows = (DATA && DATA.services) || [];
  const dot = s => s === 'ok' ? 'si-dot' : (s === 'down' ? 'si-dot warn' : 'si-dot off');
  const meta = s => s.status === 'ok' ? (s.ms ? s.ms + ' ms' : 'ok')
    : s.status === 'down' ? 'not answering' : s.status === 'unavailable' ? 'unavailable' : 'unknown';
  document.getElementById('healthServices').innerHTML = rows.length ? rows.map(s => `
    <div class="status-item" title="${esc(s.detail || '')}">
      <span class="${dot(s.status)}"></span>
      <span class="si-name">${esc(s.name)}<small>${esc(s.sub || '')}</small></span>
      <span class="si-meta">${esc(meta(s))}</span>
    </div>`).join('') : '<div class="tbl-empty">No health information could be loaded.</div>';
}

const ERP_TABLE_ROLE = {
  source_system:'The registered source portals',
  citizen:'People seen by the ERP',
  intake:'Records received through the intake API',
  intake_field:'Field-level values per record',
  audit_log:'Append-only audit events'
};
function renderDatabase(){
  const erpDb = DATA && DATA.erp.database;
  document.getElementById('erpTables').innerHTML = erpDb ? erpDb.tables.map(t => `
    <tr><td class="mono" style="color:var(--ink);font-weight:600">${esc(t.name)}</td><td>${esc(ERP_TABLE_ROLE[t.name] || '')}</td><td class="col-right t-main">${num(t.rows)}</td></tr>`).join('')
    : '<tr><td colspan="3"><div class="tbl-empty">The ERP database could not be read.</div></td></tr>';
  const plat = DATA && DATA.platform.database;
  document.getElementById('platformTables').innerHTML = plat ? plat.tables.map(t => `
    <tr><td class="mono" style="color:var(--ink);font-weight:600">${esc(t.name)}</td><td class="col-right t-main">${num(t.rows)}</td></tr>`).join('')
    : '<tr><td colspan="2"><div class="tbl-empty">The platform database could not be read.</div></td></tr>';
  const pg = (DATA && DATA.services || []).find(s => s.key === 'postgres');
  document.getElementById('pgStatus').innerHTML = pg
    ? (pg.status === 'ok' ? 'Reachable from the ERP service.' : pg.status === 'down' ? 'Not answering: ' + esc(pg.detail || '') : 'Status unavailable: ' + esc(pg.detail || ''))
    : 'Status unavailable.';
}

function renderOverview(){
  const body = document.getElementById('ovPorts');
  if (!body) return;
  const rows = [];
  const hubPort = DATA && DATA.hub && DATA.hub.port;
  if (hubPort) rows.push(['' + hubPort, 'Platform hub', 'All five portals, one page']);
  ((DATA && DATA.platform && DATA.platform.portals) || []).forEach(p => rows.push(['' + p.port, p.name, 'Portal replica']));
  const target = DATA && DATA.erp && DATA.erp.target;
  const erpPort = target && (String(target).match(/:(\d+)\/?$/) || [])[1];
  if (erpPort) rows.push([erpPort, 'ERP backend + console', 'Reached over HTTP by the hub']);
  rows.sort((a, b) => Number(a[0]) - Number(b[0]));
  const hp = document.getElementById('ovHubPort'); if (hp) hp.textContent = hubPort ? ':' + hubPort : '';
  const ea = document.getElementById('ovErpAddr'); if (ea) ea.textContent = target ? String(target).replace(/^https?:\/\//, '') : '';
  body.innerHTML = rows.length
    ? rows.map(r => `<tr><td class="mono">${esc(r[0])}</td><td class="t-main">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')
    : '<tr><td colspan="3">No service information is available yet.</td></tr>';
}

function renderView(view, fromHistory){
  if (view === 'dashboard') renderDashboard();
  else if (view === 'integration') renderIntegration();
  else if (view === 'overview') renderOverview();
  else if (view === 'portals') renderPortalsView();
  else if (view === 'health') renderHealthView();
  else if (view === 'database') renderDatabase();
  else if (view === 'docs') renderDocsView();
  else if (view === 'lookup') mountLookup(fromHistory);
  else if (TABLES[view]) TABLES[view].refresh();
}

/* The person lookup is drawn by the shared module, mounted once. It keeps the person it is
   showing in the address (?ref=, ?q=), so the back button steps out of a profile; opening the
   view from the navigation is a fresh start, and the module returns to its idle panes. */
let LOOKUP = null;
function mountLookup(fromHistory){
  const host = document.getElementById('personLookup');
  if (LOOKUP || !host) {
    if (LOOKUP) { if (!fromHistory) LOOKUP.applyUrl(); LOOKUP.focus(); }
    return;
  }
  if (!window.PersonLookup || !window.WorkflowProgressCard){
    host.innerHTML = '<div class="card"><div class="card-title">Person lookup unavailable</div><div class="card-sub">Its script did not load. Reload the page.</div></div>';
    return;
  }
  LOOKUP = window.PersonLookup.mount(host, { api: '/api/lookup', urlState: true, loginUrl: '/login', revealAadhaar: true });
}

const DOCS = [
  { name:'Project README', path:'README.md', note:'Architecture, API, schema, ports, testing' },
  { name:'Architecture notes', path:'info/docs/architecture/ARCHITECTURE.md', note:'Runtime topology and write-through in text' },
  { name:'Architecture blueprint', path:'info/docs/architecture/blueprint.html', note:'Drawn ER diagrams, self-contained' },
  { name:'ERP schema', path:'database/sqlite/erp/schema.sql', note:'source_system · citizen · intake · intake_field · audit_log' },
  { name:'Platform schema', path:'database/sqlite/platform/schema.sql', note:'person · submission · erp_sync · portal tables' },
  { name:'PostgreSQL migration', path:'database/postgres/README.md', note:'Read-only copy into demo_replica' },
  { name:'Docker guide', path:'docker/README.md', note:'Hardened stack, ERP_ objects' },
  { name:'End-to-end tests', path:'tests/e2e/run-e2e-tests.js', note:'77 checks across both databases' },
  { name:'Replica notes', path:'backend/gov_replica/README.md', note:'Field-level fidelity, replica notice' }
];

function renderDocsView(){
  document.getElementById('docList').innerHTML = DOCS.map(d => `
    <div class="doc-row">
      <span class="doc-ic">${svg('file')}</span>
      <span class="doc-main">
        <span class="doc-name">${esc(d.name)}</span>
        <span class="doc-path">${esc(d.path)}</span>
        <span class="doc-note">${esc(d.note)}</span>
      </span>
      <button class="btn btn-xs" type="button" data-copy="${esc(d.path)}">${svg('copy')} Copy path</button>
    </div>`).join('');
  document.getElementById('docList').querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy)));
  document.getElementById('docApi').innerHTML = apiRowsHTML();
}

function apiRowsHTML(){
  const rows = [
    { m:'GET', p:'/api/dashboard', n:'Hub. One document with everything this dashboard shows: ERP records over HTTP, the platform ledger, health.' },
    { m:'POST', p:'ERP /api/intake', n:'The platform hands over one record. 201 created, 200 duplicate, 400/500 roll the portal back.' },
    { m:'GET', p:'ERP /api/intake?limit=5000&system=uidai', n:'Received records with their field values.' },
    { m:'GET', p:'ERP /api/citizens?limit=5000', n:'Citizens with their record counts.' },
    { m:'GET', p:'ERP /api/audit?limit=5000', n:'The append-only audit log, read only.' },
    { m:'GET', p:'ERP /api/summary', n:'Counts for the console.' },
    { m:'GET', p:'ERP /api/database', n:'Tables and row counts of erp.sqlite.' },
    { m:'GET', p:'ERP /api/health', n:'ERP database and PostgreSQL reachability.' },
    { m:'GET', p:'/api/sync', n:'The erp_sync write-through ledger.' },
    { m:'GET', p:'/api/submissions', n:'Platform submissions.' },
    { m:'GET', p:'/api/audit', n:'Platform-side audit events.' },
    { m:'GET', p:'/api/health', n:'Platform database, ERP and portal listener checks.' }
  ];
  return rows.map(r => `<div class="api-row">
    <div><span class="api-method ${r.m === 'POST' ? 'm-post' : 'm-get'}">${r.m}</span></div>
    <div><div class="api-path">${esc(r.p)}</div><div class="api-note">${esc(r.n)}</div></div>
  </div>`).join('');
}

function copyText(text){
  const done = () => toast('Copied', '<span style="font-family:var(--mono);font-size:11px">' + esc(text) + '</span>', 'copy');
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
  } catch(e){ toast('Copy blocked', 'Select the text and copy it manually.', 'alert'); }
}

/* ============================== PORTAL LINKS ============================= */
function openPortal(code){
  const s = SYS_MAP[code];
  if (!s || !s.port){ toast('Portal unavailable', 'No port is known for this portal.', 'alert'); return; }
  // Through the public edge the internal port is closed: the server sends the public one.
  const pub = DATA && DATA.publicPorts && DATA.publicPorts[String(s.port)];
  const url = location.protocol + '//' + location.hostname + ':' + (pub || s.port) + '/';
  let opened = null;
  try { opened = window.open(url, '_blank', 'noopener'); } catch(e){}
  toast('Local replica: ' + s.name,
    (opened ? 'Opened ' : 'Open ') + '<span style="font-family:var(--mono);font-size:11px">' + esc(url) + '</span>' +
    (opened ? ' in a new tab.' : ' in a new tab (your browser blocked the pop-up).') +
    ' A demonstration environment, not a government website.', 'external');
}
function openHub(){
  toast('Platform hub', 'You are already on the hub dashboard.', 'info');
}

/* ================================ DRAWER ================================ */
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');
function openDrawer(kicker, title, bodyHTML, footHTML){
  document.getElementById('drawerKicker').textContent = kicker;
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('drawerBody').innerHTML = bodyHTML;
  document.getElementById('drawerFoot').innerHTML = footHTML;
  drawer.classList.add('show');
  drawer.setAttribute('aria-hidden','false');
  scrim.classList.add('show');
  document.body.classList.add('no-scroll');
  drawer.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy)));
  drawer.tabIndex = -1; drawer.focus({ preventScroll:true });
}
function closeDrawer(){
  drawer.classList.remove('show');
  drawer.setAttribute('aria-hidden','true');
  scrim.classList.remove('show');
  document.body.classList.remove('no-scroll');
}
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);

function openRecord(r){
  const fields = r.fields;
  const attempts = SYNC.filter(s => s.submission === r.sourceReference);
  const body = `
    <div class="drawer-sec">
      <h4>Record</h4>
      <div class="kv">
        <div class="kv-row"><span class="kv-k">Intake ref</span><span class="kv-v mono">${esc(r.intakeRef)}</span></div>
        <div class="kv-row"><span class="kv-k">Source system</span><span class="kv-v">${esc(sysName(r.system))} · :${sysPort(r.system)}</span></div>
        <div class="kv-row"><span class="kv-k">Source form</span><span class="kv-v mono">${esc(r.form)}</span></div>
        <div class="kv-row"><span class="kv-k">Source reference</span><span class="kv-v mono">${esc(r.sourceReference)}</span></div>
        <div class="kv-row"><span class="kv-k">Received</span><span class="kv-v">${fmtDateTime(r.receivedAt)} · ${rel(r.receivedAt)}</span></div>
        <div class="kv-row"><span class="kv-k">Subject</span><span class="kv-v">${esc(r.subject || '—')}</span></div>
      </div>
    </div>
    <div class="drawer-sec">
      <h4>Citizen</h4>
      <div class="kv">
        <div class="kv-row"><span class="kv-k">Name</span><span class="kv-v">${esc(r.citizen.fullName)}</span></div>
        <div class="kv-row"><span class="kv-k">Citizen ref</span><span class="kv-v mono">${esc(r.citizen.ref)}</span></div>
        <div class="kv-row"><span class="kv-k">Email</span><span class="kv-v mono">${esc(r.citizen.email)}</span></div>
        <div class="kv-row"><span class="kv-k">Mobile</span><span class="kv-v mono">${esc(r.citizen.mobile)}</span></div>
      </div>
    </div>
    <div class="drawer-sec">
      <h4>intake_field values</h4>
      <div>${fields.map(f => `<span class="field-chip"><span class="fc-label">${esc(f.label)}</span><span class="fc-val">${esc(f.value)}</span></span>`).join('')}</div>
    </div>
    <div class="drawer-sec">
      <h4>Write-through attempts (erp_sync)</h4>
      <div class="kv">
        ${attempts.length ? attempts.map(a => `<div class="kv-row"><span class="kv-k">${fmtTime(a.at)} · ${rel(a.at)}</span><span class="kv-v">${httpPill(a.http)} ${resultPill(a.result)}</span></div>`).join('') : '<div class="kv-row"><span class="kv-k">—</span><span class="kv-v">No ledger row</span></div>'}
      </div>
    </div>`;
  const foot = `
    <span class="micro" style="flex:1">Source: <code style="font-family:var(--mono)">GET /api/intake</code></span>
    <button class="btn btn-sm" type="button" data-copy="${esc(r.intakeRef)}">${svg('copy')} Copy ref</button>
    <button class="btn btn-sm btn-primary" type="button" onclick="document.getElementById('drawerClose').click()">Close</button>`;
  openDrawer('Received record', r.intakeRef, body, foot);
}

function openCitizen(c){
  const records = INTAKES.filter(r => r.citizen === c).slice().reverse();
  const body = `
    <div class="drawer-sec">
      <h4>Citizen</h4>
      <div class="kv">
        <div class="kv-row"><span class="kv-k">Citizen ref</span><span class="kv-v mono">${esc(c.ref)}</span></div>
        <div class="kv-row"><span class="kv-k">Name</span><span class="kv-v">${esc(c.fullName)}</span></div>
        <div class="kv-row"><span class="kv-k">Email</span><span class="kv-v mono">${esc(c.email)}</span></div>
        <div class="kv-row"><span class="kv-k">Mobile</span><span class="kv-v mono">${esc(c.mobile)}</span></div>
        <div class="kv-row"><span class="kv-k">First seen in</span><span class="kv-v">${esc(sysName(c.firstSeenIn))}</span></div>
        <div class="kv-row"><span class="kv-k">First received</span><span class="kv-v">${fmtDate(c.createdAt)}</span></div>
        <div class="kv-row"><span class="kv-k">Records</span><span class="kv-v">${num(records.length)}</span></div>
      </div>
    </div>
    <div class="drawer-sec">
      <h4>Recent records</h4>
      <div class="kv">
        ${records.slice(0, 8).map(r => `<div class="kv-row"><span class="kv-k mono">${esc(r.intakeRef)}</span><span class="kv-v">${esc(sysName(r.system))}<span style="color:var(--text-3);font-weight:500"> · ${fmtDate(r.receivedAt)}</span></span></div>`).join('') || '<div class="kv-row"><span class="kv-k">—</span><span class="kv-v">No records</span></div>'}
      </div>
    </div>`;
  const foot = `<span class="micro" style="flex:1">Source: <code style="font-family:var(--mono)">GET /api/citizens</code></span>
    <button class="btn btn-sm" type="button" data-copy="${esc(c.ref)}">${svg('copy')} Copy ref</button>
    <button class="btn btn-sm btn-primary" type="button" onclick="document.getElementById('drawerClose').click()">Close</button>`;
  openDrawer('Citizen', c.ref, body, foot);
}

function openSyncAttempt(s){
  const body = `
    <div class="drawer-sec">
      <h4>Attempt</h4>
      <div class="kv">
        <div class="kv-row"><span class="kv-k">Attempted at</span><span class="kv-v">${fmtDateTime(s.at)} · ${rel(s.at)}</span></div>
        <div class="kv-row"><span class="kv-k">Source system</span><span class="kv-v">${esc(sysName(s.system))} · :${sysPort(s.system)}</span></div>
        <div class="kv-row"><span class="kv-k">Entity</span><span class="kv-v mono">${esc(s.entity)}</span></div>
        <div class="kv-row"><span class="kv-k">Submission ref</span><span class="kv-v mono">${esc(s.submission)}</span></div>
        <div class="kv-row"><span class="kv-k">ERP intake ref</span><span class="kv-v mono">${esc(s.erpRef || '— not created')}</span></div>
        <div class="kv-row"><span class="kv-k">HTTP status</span><span class="kv-v">${httpPill(s.http)}</span></div>
        <div class="kv-row"><span class="kv-k">Result</span><span class="kv-v">${resultPill(s.result)}</span></div>
        ${s.reason ? `<div class="kv-row"><span class="kv-k">Reason</span><span class="kv-v mono">${esc(s.reason)}</span></div>` : ''}
      </div>
    </div>
    <div class="drawer-sec">
      <h4>What this means</h4>
      <div class="f" style="font-size:12.5px;color:var(--text-2);line-height:1.6">
        ${s.result === 'rolled_back'
          ? 'The ERP refused the write, so the platform rolled its own row back. Nothing exists on either side, and there is no queue holding the record for a later retry.'
          : s.result === 'duplicate'
          ? 'The same <code style="font-family:var(--mono)">sourceSystem + sourceReference</code> arrived twice. The ERP answered 200 with <code style="font-family:var(--mono)">duplicate: true</code>, so no second intake row was created.'
          : 'The ERP wrote the intake row and answered 201. The platform then committed its own row — both databases or neither.'}
      </div>
    </div>`;
  const foot = `<span class="micro" style="flex:1">Source: <code style="font-family:var(--mono)">GET :4100/api/sync</code></span>
    <button class="btn btn-sm btn-primary" type="button" onclick="document.getElementById('drawerClose').click()">Close</button>`;
  openDrawer('Write-through attempt', s.submission, body, foot);
}

/* ================================= MODAL ================================ */
const modalWrap = document.getElementById('modalWrap');
function openModal(title, sub, bodyHTML){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalSub').innerHTML = sub || '';
  document.getElementById('modalBody').innerHTML = bodyHTML;
  modalWrap.classList.add('show');
  document.body.classList.add('no-scroll');
  const mEl = modalWrap.querySelector('.modal');
  mEl.tabIndex = -1; mEl.focus({ preventScroll:true });
}
function closeModal(){ modalWrap.classList.remove('show'); document.body.classList.remove('no-scroll'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
modalWrap.addEventListener('click', e => { if (e.target === modalWrap) closeModal(); });

function openApiMap(){
  openModal('API mapping', 'Which endpoint feeds each part of this console.', `
    <div style="margin-bottom:14px;font-size:12px;color:var(--text-2);line-height:1.6">
      The browser talks only to the hub. The hub reads the platform database itself and the ERP over HTTP.
      No endpoint here writes, and the ERP never opens the platform database.
    </div>
    ${apiRowsHTML()}
    <div class="table-note" style="margin-top:14px">
      ${svg('info')}
      <span>Neither service has a login of its own, so this console shows no profile menu or sign-in. Authentication and roles are a roadmap item.</span>
    </div>`);
}

/* ============================== GLOBAL SEARCH =========================== */
const searchInput = document.getElementById('globalSearch');
const searchPop = document.getElementById('searchPop');
let searchHits = [], searchCursor = -1;

function runSearch(q){
  const query = q.trim().toLowerCase();
  if (!query){ searchPop.classList.remove('open'); searchHits = []; return; }
  const recs = INTAKES.filter(r =>
    r.intakeRef.toLowerCase().includes(query) ||
    r.sourceReference.toLowerCase().includes(query) ||
    r.citizen.fullName.toLowerCase().includes(query) ||
    r.citizen.ref.toLowerCase().includes(query)
  ).slice(0, 5).map(r => ({ type:'record', row:r, title:r.intakeRef, sub:sysName(r.system) + ' · ' + r.citizen.fullName + ' · ' + rel(r.receivedAt) }));
  const ppl = CITIZENS.filter(c =>
    c.fullName.toLowerCase().includes(query) || c.ref.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
  ).slice(0, 3).map(c => ({ type:'citizen', row:c, title:c.fullName, sub:c.ref + ' · first seen in ' + sysName(c.firstSeenIn) }));
  searchHits = recs.concat(ppl);
  searchCursor = -1;
  searchPop.innerHTML = searchHits.length ? `
    <div class="sp-head">Received records</div>
    ${recs.map((h, i) => `<div class="sp-item" data-i="${i}" role="option"><div class="sp-main"><div class="sp-title">${esc(h.title)}</div><div class="sp-sub">${esc(h.sub)}</div></div>${svg('arrowRight')}</div>`).join('')}
    ${ppl.length ? '<div class="sp-head">Citizens</div>' : ''}
    ${ppl.map((h, i) => `<div class="sp-item" data-i="${recs.length + i}" role="option"><div class="sp-main"><div class="sp-title">${esc(h.title)}</div><div class="sp-sub">${esc(h.sub)}</div></div>${svg('arrowRight')}</div>`).join('')}
    <div class="sp-head" style="border-top:1px solid var(--border)">Live data · /api/intake · /api/citizens</div>`
    : `<div class="sp-empty">No intake records or citizens match “${esc(q)}”.</div>`;
  searchPop.classList.add('open');
  searchPop.querySelectorAll('.sp-item').forEach(el => {
    el.addEventListener('click', () => {
      const h = searchHits[+el.dataset.i];
      if (h.type === 'record') openRecord(h.row);
      else openCitizen(h.row);
      searchPop.classList.remove('open');
    });
  });
}
searchInput.addEventListener('input', () => runSearch(searchInput.value));
searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) runSearch(searchInput.value); });
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ searchPop.classList.remove('open'); searchInput.blur(); }
  if (e.key === 'Enter' && searchHits.length){
    const h = searchHits[Math.max(0, searchCursor)];
    if (h){ h.type === 'record' ? openRecord(h.row) : openCitizen(h.row); searchPop.classList.remove('open'); }
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    if (!searchHits.length) return;
    e.preventDefault();
    searchCursor = e.key === 'ArrowDown'
      ? Math.min(searchHits.length - 1, searchCursor + 1)
      : Math.max(0, searchCursor - 1);
    searchPop.querySelectorAll('.sp-item').forEach((el, i) => el.classList.toggle('hl', i === searchCursor));
  }
});
document.addEventListener('click', e => {
  if (!e.target.closest('.topbar-search')) searchPop.classList.remove('open');
});

/* ================================ EVENTS ================================ */
document.getElementById('periodSelect').addEventListener('change', e => {
  state.days = e.target.value === 'all' ? 'all' : Number(e.target.value);
  const other = document.getElementById('periodSelectIntegration');
  if (other) other.value = e.target.value;
  renderDashboard();
  if (state.view === 'integration') renderIntegration();
  toast('Date range applied', 'Showing ' + (state.days === 'all' ? 'all recorded activity' : 'the last ' + state.days + ' days') + ' of recorded activity.', 'filter');
});
const intPeriod = document.getElementById('periodSelectIntegration');
if (intPeriod) intPeriod.addEventListener('change', e => {
  state.days = e.target.value === 'all' ? 'all' : Number(e.target.value);
  document.getElementById('periodSelect').value = e.target.value;
  renderDashboard();
  renderIntegration();
  toast('Date range applied', 'Showing ' + (state.days === 'all' ? 'all recorded activity' : 'the last ' + state.days + ' days') + ' of recorded activity.', 'filter');
});

document.getElementById('activityRange').addEventListener('click', e => {
  const btn = e.target.closest('button[data-days]');
  if (!btn) return;
  state.activityDays = Number(btn.dataset.days);
  document.querySelectorAll('#activityRange button').forEach(b => b.classList.toggle('is-active', b === btn));
  renderAreaChart(document.getElementById('chartActivity'), dailySeries(state.activityDays));
});

document.getElementById('openRecordsBtn').addEventListener('click', () => goto('intake'));
document.getElementById('noticeClose').addEventListener('click', () => {
  const n = document.getElementById('protoNotice');
  n.style.display = 'none';
  toast('Notice dismissed', 'The Live badge in the header stays visible.', 'info');
});
const apiMapBtn = document.getElementById('apiMapBtn');
if (apiMapBtn) apiMapBtn.addEventListener('click', openApiMap);
document.querySelectorAll('[data-open-hub]').forEach(b => b.addEventListener('click', openHub));

document.getElementById('exportSummaryBtn').addEventListener('click', () => {
  const m = metrics(state.days);
  const lines = [
    ['ERP Hub — summary'],
    ['Range', state.days === 'all' ? 'all recorded activity' : 'last ' + state.days + ' days'],
    ['Generated', fmtDateTime(NOW)],
    [],
    ['Metric', 'Value'],
    ['Received records', m.intakes.length],
    ['Registered citizens', TOTALS.citizens],
    ['Successful integrations', m.success],
    ['Rolled-back syncs', m.rolled],
    ['Duplicate retries', m.dup],
    ['Audit events', m.audit],
    [],
    ['Source system', 'Records', 'Kept attempts', 'Rolled back']
  ].concat(m.perSystem.map(s => [sysName(s.code), s.records, s.kept, s.rolled]));
  downloadCSV('erp-summary.csv', lines.map(l => l.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n'));
  toast('Summary exported', 'The live counts shown on the dashboard.', 'download');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    if (modalWrap.classList.contains('show')) closeModal();
    else if (drawer.classList.contains('show')) closeDrawer();
    else if (app.classList.contains('nav-open')) closeMobileNav();
    else if (topbarEl.classList.contains('search-open')) closeSearchBar();
    hideTip();
  }
  if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){
    e.preventDefault(); searchInput.focus();
  }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const w = window.innerWidth;
    if (w > 900 && app.classList.contains('nav-open')) closeMobileNav();
    hideRailTip();
    if (state.view === 'dashboard') renderDashboard();
    if (state.view === 'integration') renderIntegration();
  }, 220);
});
window.addEventListener('scroll', hideTip, { passive:true });

/* ================================= INIT ================================= */
function renderStatus(){
  const notice = document.getElementById('protoNotice');
  const title = document.getElementById('noticeTitle');
  const text = document.getElementById('noticeText');
  if (!notice) return;
  let problems = [];
  if (LOAD_ERROR) problems.push('The dashboard could not load fresh data: ' + esc(LOAD_ERROR) + '.');
  if (DATA && !DATA.erp.ok) problems.push('The ERP service could not be read (' + esc(DATA.erp.error || 'unavailable') + '). Received records, citizens and the audit trail are empty until it answers.');
  if (DATA && DATA.truncated) {
    const t = Object.keys(DATA.truncated).filter(k => DATA.truncated[k]);
    if (t.length) problems.push('Showing the latest ' + num(DATA.limit) + ' rows of: ' + esc(t.join(', ')) + '.');
  }
  if (problems.length){
    title.textContent = LOAD_ERROR ? 'Could not refresh the data' : 'Some data is unavailable';
    text.innerHTML = problems.join(' ');
    notice.style.display = '';
  } else {
    notice.style.display = 'none';   /* nothing to report: no banner */
    title.textContent = ''; text.textContent = '';
  }
  if (DATA){
    setText('genAt', 'Updated ' + fmtTime(NOW));
    setText('todayChip', fmtDate(NOW));
    setText('wsSub', DATA.erp.target.replace(/^https?:\/\//, ''));
    setText('erpChipAddr', DATA.erp.target.replace(/^https?:\/\//, ''));
  }
}

async function fetchDashboard(){
  const res = await fetch('/api/dashboard', { cache:'no-store' });
  if (res.status === 401) { window.location.replace('/login'); throw new Error('signed out'); }   // the session ended: replace, so Back does not return to a page that cannot load
  if (!res.ok) throw new Error('the hub answered HTTP ' + res.status);
  return res.json();
}

function renderAll(){
  updateNavBadges();
  renderDashboard();
  renderPortalsView();
  renderHealthView();
  renderDatabase();
  renderIntegration();
  Object.keys(TABLES).forEach(k => TABLES[k].refresh());
}

let refreshing = false;
async function refresh(){
  if (refreshing) return;
  refreshing = true;
  try {
    applyData(await fetchDashboard());
    LOAD_ERROR = null;
  } catch (err){
    LOAD_ERROR = err.message || String(err);   /* the last good data stays on screen, flagged */
  }
  refreshing = false;
  renderStatus();
  if (DATA) renderAll();
}

async function init(){
  try { applyData(await fetchDashboard()); } catch (err){ LOAD_ERROR = err.message || String(err); }
  buildNav();
  renderNav();
  applyCollapse(window.innerWidth < 1180 && window.innerWidth > 900);
  defineTables();
  renderStatus();
  renderAll();

  const initial = (location.hash || '').replace('#','');
  const valid = ['dashboard','overview','intake','lookup','citizens','audit','portals','sync','integration','submissions','database','health','docs'];
  goto(valid.includes(initial) ? initial : 'dashboard', true);
  try { history.replaceState({ view: state.view }, '', '#' + state.view); } catch(e){}

  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  // Restored from the browser's cache by Back or Forward: ask for the data
  // again, so a session that has ended is noticed and this page goes to /login.
  window.addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
}
document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();
