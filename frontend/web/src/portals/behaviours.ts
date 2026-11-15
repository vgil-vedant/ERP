// The portals' page scripts (frontend/portals/*/public/js/replica.js), ported to TypeScript. They run once the page has been
// hydrated, on the markup React rendered; nothing here fetches from outside the local server.
type Opt = { value: unknown; label: unknown };
const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

/** Menu button of the primary navigation. */
export function navToggle() {
  const toggle = document.querySelector<HTMLElement>('.nav-toggle'), nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); });
}

/** Dependent dropdowns: a select marked data-cascade-source reloads its child list when it changes. `chain`: a child that is itself a parent resets its own child. */
export function cascades(chain: boolean) {
  $$<HTMLSelectElement>('[data-cascade-source]').forEach((src) => {
    const target = document.getElementById(src.getAttribute('data-cascade-target') || '') as HTMLSelectElement | null;
    if (!target) return;
    const endpoint = src.getAttribute('data-cascade-endpoint') || '';
    const keep = target.getAttribute('data-selected') || '';
    const load = (value: string, preselect: string | null) => {
      if (!value) { target.innerHTML = '<option value="">SELECT</option>'; target.disabled = true; return; }
      target.disabled = true;
      target.innerHTML = '<option value="">Loading…</option>';
      fetch(endpoint + encodeURIComponent(value), { headers: { Accept: 'application/json' } })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((data: { options?: Opt[] }) => {
          let html = '<option value="">SELECT</option>';
          (data.options || []).forEach((o) => {
            const sel = preselect && String(preselect) === String(o.value) ? ' selected' : '';
            html += '<option value="' + o.value + '"' + sel + '>' + String(o.label).replace(/[<>&]/g, '') + '</option>';
          });
          target.innerHTML = html;
          target.disabled = false;
          // State -> District -> Court Complex: tell a child that is also a parent, so the rest of the chain resets
          if (chain && target.hasAttribute('data-cascade-source')) target.dispatchEvent(new Event('change', { bubbles: true }));
        })
        .catch(() => { target.innerHTML = '<option value="">Could not load the list</option>'; target.disabled = false; });
    };
    src.addEventListener('change', () => load(src.value, null));
    if (src.value) load(src.value, keep); else target.disabled = true;
  });
}

/** Live character counters on length-limited fields. */
export function counters() {
  $$<HTMLInputElement>('[data-counter]').forEach((input) => {
    const max = Number(input.getAttribute('maxlength')), out = document.getElementById(input.id + '_count');
    if (!max || !out) return;
    const upd = () => { out.textContent = input.value.length + ' / ' + max; };
    input.addEventListener('input', upd); upd();
  });
}

/** Text size controls: scale the whole page, remembered in this browser only. */
export function textSize(key: string) {
  const buttons = $$('[data-text-size]');
  if (!buttons.length) return;
  const apply = (size: string) => {
    if (size === 'normal') document.documentElement.removeAttribute('data-text'); else document.documentElement.setAttribute('data-text', size);
    buttons.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-text-size') === size ? 'true' : 'false'));
  };
  let saved: string | null = null;
  try { saved = localStorage.getItem(key); } catch { /* storage blocked */ }
  if (saved === 'small' || saved === 'large') apply(saved);
  buttons.forEach((b) => b.addEventListener('click', () => {
    const size = b.getAttribute('data-text-size') || 'normal';
    apply(size);
    try { localStorage.setItem(key, size); } catch { /* ignore */ }
  }));
}

/** Header <details> menus (language, More): close on Esc or on a click elsewhere. */
export function detailsMenus() {
  const menus = $$<HTMLDetailsElement>('details.tb-item');
  if (!menus.length) return;
  document.addEventListener('click', (e) => menus.forEach((d) => { if (d.open && !d.contains(e.target as Node)) d.open = false; }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    menus.forEach((d) => { if (d.open) { d.open = false; d.querySelector('summary')?.focus(); } });
  });
}

/** eCourts "More" menu in the primary navigation: a disclosure that closes on Esc or on a click elsewhere. */
export function moreMenu() {
  const btn = document.querySelector<HTMLElement>('.primary-nav__toggle'), list = document.getElementById('nav-more');
  if (!btn || !list) return;
  const set = (open: boolean) => { list.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  btn.addEventListener('click', () => set(list.hidden));
  document.addEventListener('click', (e) => { if (!list.hidden && !list.contains(e.target as Node) && !btn.contains(e.target as Node)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !list.hidden) { set(false); btn.focus(); } });
}

/** eCourts hero carousel: previous / next, dots, pause; pauses on hover or focus and does not start by itself under reduced motion. */
export function heroCarousel() {
  const hero = document.getElementById('heroViewport');
  if (!hero) return;
  const slides = Array.from(hero.querySelectorAll<HTMLElement>('.hero__slide')), dots = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-dot]'));
  const pauseBtn = hero.querySelector<HTMLElement>('[data-hero="pause"]');
  let index = 0, timer: number | null = null, userPaused = false, hovering = false;
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const show = (n: number) => {
    index = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
    dots.forEach((d, k) => { if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  };
  const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
  const start = () => { if (timer || userPaused || hovering || reduce) return; timer = window.setInterval(() => show(index + 1), 6000); };
  const setPaused = (p: boolean) => {
    userPaused = p;
    if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseBtn.setAttribute('aria-label', p ? 'Resume slideshow' : 'Pause slideshow'); }
    if (p) stop(); else start();
  };
  hero.querySelector('[data-hero="prev"]')?.addEventListener('click', () => show(index - 1));
  hero.querySelector('[data-hero="next"]')?.addEventListener('click', () => show(index + 1));
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  pauseBtn?.addEventListener('click', () => setPaused(!userPaused));
  hero.addEventListener('mouseenter', () => { hovering = true; stop(); });
  hero.addEventListener('mouseleave', () => { hovering = false; start(); });
  hero.addEventListener('focusin', stop);
  hero.addEventListener('focusout', start);
  hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(index - 1); else if (e.key === 'ArrowRight') show(index + 1); });
  if (reduce) setPaused(true); else start();
}

/** What each portal's old replica.js did, in the order it did it. */
export function install(portal: string) {
  if (portal === 'ecourts') { navToggle(); moreMenu(); textSize('ecourts_text_size'); heroCarousel(); cascades(true); counters(); }
  else if (portal === 'aadhaar') { navToggle(); textSize('uidai_text_size'); detailsMenus(); cascades(false); counters(); }
  else { navToggle(); cascades(true); counters(); }   // cctns, e-forensics
}
