// The console's page script, ported from layout-foot.ejs: sidebar, mobile menu, nav groups, "/" shortcut,
// row search, column sort, 25-row pager and CSV export. It works on the rendered table, as before.
export interface Hooks { closeDrawer: () => void; toast: (msg: string) => void }

export function installBehaviours(h: Hooks) {
  const off: (() => void)[] = [];
  const on = (t: EventTarget | null, ev: string, fn: EventListener) => { if (!t) return; t.addEventListener(ev, fn); off.push(() => t.removeEventListener(ev, fn)); };
  const $ = (id: string) => document.getElementById(id);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  $('todayChip')!.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  const addr = ':' + (window.location.port || (window.location.protocol === 'https:' ? '443' : '80'));
  $('serviceAddr')!.textContent = addr;
  const erpAddr = $('erpAddress'); if (erpAddr) erpAddr.textContent = window.location.hostname + addr;

  const app = $('app')!, collapseBtn = $('collapseBtn');
  if (collapseBtn) {
    if (localStorage.getItem('erp-sidebar-collapsed') === '1') { app.classList.add('is-collapsed'); collapseBtn.setAttribute('aria-expanded', 'false'); }
    on(collapseBtn, 'click', () => {
      const now = app.classList.toggle('is-collapsed');
      localStorage.setItem('erp-sidebar-collapsed', now ? '1' : '0');
      collapseBtn.setAttribute('aria-expanded', now ? 'false' : 'true');
    });
  }

  const scrim = $('navScrim') as HTMLElement | null;
  const openNav = () => { app.classList.add('nav-open'); if (scrim) scrim.hidden = false; document.body.classList.add('no-scroll'); };
  const closeNav = () => { app.classList.remove('nav-open'); if (scrim) scrim.hidden = true; document.body.classList.remove('no-scroll'); };
  on($('menuBtn'), 'click', openNav); on($('navClose'), 'click', closeNav); on(scrim, 'click', closeNav);

  document.querySelectorAll('.nav-group-head').forEach((btn) => on(btn, 'click', () => {
    const grp = btn.closest('.nav-group')!;
    const open = !grp.classList.contains('is-closed');
    grp.classList.toggle('is-closed', open);
    btn.setAttribute('aria-expanded', String(!open));
  }));

  const searchInput = $('globalSearch') as HTMLInputElement | null;
  on(document, 'keydown', ((e: KeyboardEvent) => {
    const t = (document.activeElement as HTMLElement).tagName;
    if (e.key === '/' && document.activeElement !== searchInput && t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); searchInput?.focus(); }
    if (e.key === 'Escape') { h.closeDrawer(); closeNav(); }
  }) as EventListener);

  /* Row search, sort and the 25-row pager work together: a row is shown when it matches the search AND falls on the
     current page. (The old page hid rows by search or by page in two places that did not know about each other.) */
  let currentPage = 1;
  const PAGE_SIZE = 25;
  const tableRows = () => Array.from(document.querySelectorAll<HTMLTableRowElement>('table.tbl tbody tr'));
  const updatePager = () => {
    const info = $('pagerInfo'), prev = $('pagerPrev') as HTMLButtonElement | null, next = $('pagerNext') as HTMLButtonElement | null;
    const rows = tableRows();
    const matching = rows.filter((r) => r.dataset.nomatch !== '1');
    rows.forEach((r) => { if (r.dataset.nomatch === '1') r.style.display = 'none'; });
    const total = matching.length;
    const pages = info ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
    currentPage = Math.min(currentPage, pages);
    const start = info ? (currentPage - 1) * PAGE_SIZE : 0, end = info ? Math.min(start + PAGE_SIZE, total) : total;
    matching.forEach((r, i) => { r.style.display = i >= start && i < end ? '' : 'none'; });
    if (!info) return;
    info.textContent = total === 0 ? 'No records' : 'Showing ' + (start + 1) + '–' + end + ' of ' + total;
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= pages;
  };
  const attachRowSearch = (input: HTMLInputElement | null) => {
    if (!input) return;
    on(input, 'input', () => {
      const q = input.value.toLowerCase().trim();
      tableRows().forEach((tr) => {
        const text = Array.from(tr.cells).map((c) => c.textContent || '').join(' ').toLowerCase();   // cells are separated, as in the old markup
        tr.dataset.nomatch = !q || text.includes(q) ? '0' : '1'; });
      currentPage = 1;
      updatePager();
    });
  };
  attachRowSearch(searchInput);
  const own = $('tableSearch') as HTMLInputElement | null;
  if (own && own !== searchInput) attachRowSearch(own);

  document.querySelectorAll<HTMLElement>('th[data-sort]').forEach((th) => on(th, 'click', () => {
    const table = th.closest('table')!, tbody = table.querySelector('tbody')!;
    const col = Array.from(th.parentElement!.children).indexOf(th);
    const asc = !th.classList.contains('sort-asc');
    table.querySelectorAll('th').forEach((t) => t.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(asc ? 'sort-asc' : 'sort-desc');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
      const av = (a.cells[col] || { textContent: '' }).textContent || '', bv = (b.cells[col] || { textContent: '' }).textContent || '';
      const n = parseFloat(av) - parseFloat(bv);
      if (!isNaN(n)) return asc ? n : -n;
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    rows.forEach((r) => tbody.appendChild(r));
    updatePager();
  }));
  setTimeout(updatePager, 0);

  return {
    goPage: (delta: number) => { currentPage += delta; updatePager(); },
    exportTableCSV: (filename?: string) => {
      const tbl = document.querySelector('table.tbl');
      if (!tbl) return;
      const rows: string[] = [];
      tbl.querySelectorAll('tr').forEach((tr) => {
        rows.push(Array.from(tr.querySelectorAll('th,td')).map((c) => {
          const copy = c.cloneNode(true) as HTMLElement;
          copy.querySelectorAll('br').forEach((br) => br.replaceWith(' '));   // a line break reads as a space, as in the old markup
          return '"' + (copy.textContent || '').replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"';
        }).join(','));
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename || 'erp-export.csv'; a.click();
      h.toast('CSV downloaded');
    },
    dispose: () => off.forEach((f) => f()),
  };
}
