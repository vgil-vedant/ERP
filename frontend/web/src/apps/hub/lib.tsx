// Icons, formatting and small helpers shared by the hub components (ported from erp-hub.js).
export const ICON: Record<string, string> = {
  dash: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  inbox: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"/>',
  users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.8"/>',
  shield: '<path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  prison: '<path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M8 8v13M12 8v13M16 8v13M3 21h18"/>',
  police: '<path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9.5 4.6-1.3 8-5.1 8-9.5V6l-8-3Z"/><path d="M12 8v8M8.5 11h7"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  fingerprint: '<path d="M12 4a8 8 0 0 1 8 8v2"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"/><path d="M7 20a13 13 0 0 1-.6-4v-4"/><path d="M11 12v5a7 7 0 0 0 .5 2.5"/>',
  court: '<path d="M12 3v3M5 20h14M6 20V10m12 10V10M3 10h18"/><path d="M12 6 3 10h18L12 6Z"/><path d="M9 20v-5m6 5v-5"/>',
  sync: '<path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"/>',
  pulse: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>',
  heart: '<path d="M12 20s-7-4.3-7-9.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.8c0 4.9-7 9.2-7 9.2Z"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14.5 10h4M14.5 13.5h3"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 3v18M11 8h4M11 12h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  arrowRight: '<path d="m9 18 6-6-6-6"/>',
  arrowUpDown: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8Z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3.3-6.9"/><path d="M21 4v5h-5"/>',
  api: '<path d="M8 6 3 12l5 6M16 6l5 6-5 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sparkle: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
};

/** Same icon markup as the old page: 24x24, stroke 1.9, inherits colour and size from CSS. */
export function Svg({ name, cls }: { name: string; cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls || ''} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON[name] || '' }} />
  );
}

/* ------------------------------- formatting ------------------------------- */
export const DAY = 86400000;
const nf = new Intl.NumberFormat('en-IN');
export const num = (n: number) => nf.format(n);
export const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
export const pctS = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + '%' : '—');
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d: Date) => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
export const fmtTime = (d: Date) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
export const fmtDateTime = (d: Date) => fmtDate(d) + ' · ' + fmtTime(d);
/** relative time against the moment the data was generated (the clock the old page used) */
export const clock = { now: new Date() };
export function rel(d: Date): string {
  const s = Math.max(1, Math.round((clock.now.getTime() - d.getTime()) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago';
  const dd = Math.round(h / 24);
  if (dd < 30) return dd + ' d ago';
  return fmtDate(d);
}
/** HTML escaping for the one place that still builds a string (the chart tooltip). */
export const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/* --------------------------- chart tooltip (one node) ---------------------- */
let chartTip: HTMLDivElement | null = null;
function tipEl() {
  if (!chartTip) { chartTip = document.createElement('div'); chartTip.className = 'chart-tip'; document.body.appendChild(chartTip); }
  return chartTip;
}
export function showTip(html: string, x: number, y: number) {
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
export function hideTip() { if (chartTip) chartTip.classList.remove('show'); }
