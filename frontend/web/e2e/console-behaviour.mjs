// Same interaction script on the EJS and React ERP console; results must match.  env: OLD NEW (base URLs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const B = { old: process.env.OLD, new: process.env.NEW };
const browser = await chromium.launch();
const norm = (t) => String(t).replace(/\s+/g, ' ').trim();
async function run(label) {
  const r = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
  const p = await ctx.newPage();
  const st = () => p.evaluate(() => {
    const t = document.querySelector('table.tbl');
    const vis = t ? [...t.querySelectorAll('tbody tr')].filter((tr) => tr.style.display !== 'none') : [];
    const n = (x) => x.replace(/\s+/g, '');   // text only: spacing between cells is not compared
    return {
      rows: vis.length, first: vis.slice(0, 3).map((tr) => n(tr.textContent)), pager: document.getElementById('pagerInfo') ? document.getElementById('pagerInfo').textContent : null,
      prev: document.getElementById('pagerPrev') ? document.getElementById('pagerPrev').disabled : null, next: document.getElementById('pagerNext') ? document.getElementById('pagerNext').disabled : null,
      sorted: [...document.querySelectorAll('th.sort-asc,th.sort-desc')].map((x) => x.textContent.trim() + ':' + x.className),
      drawer: document.getElementById('detailDrawer').classList.contains('is-open') ? { t: document.getElementById('drawerTitle').textContent, b: n(document.getElementById('drawerBody').textContent) } : null,
      backdrop: document.getElementById('drawerBackdrop').classList.contains('is-open'), noscroll: document.body.classList.contains('no-scroll'),
      collapsed: document.getElementById('app').classList.contains('is-collapsed'), navOpen: document.getElementById('app').classList.contains('nav-open'),
      groups: [...document.querySelectorAll('.nav-group.is-closed')].length, toasts: [...document.querySelectorAll('.toast')].map((x) => n(x.textContent)),
      active: [...document.querySelectorAll('.nav-item.is-active')].map((x) => x.dataset.label), crumb: n(document.querySelector('.crumbs .now').textContent),
      focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
      title: document.title, h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
    };
  });
  const open = async (u) => { await p.goto(B[label] + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(150); };
  for (const u of ['/', '/intake', '/intake?system=uidai', '/citizens', '/audit', '/portals', '/portals?system=eprisons', '/sync', '/sync?system=uidai', '/integration']) {
    await open(u); r['load ' + u] = await st();
  }
  await open('/intake');
  await p.fill('#globalSearch', 'uidai'); r.topSearch = await st();
  await p.fill('#globalSearch', ''); r.topSearchClear = await st();
  // (not compared: the old pager only advanced after a page search and its sort reordered just the rows on screen; both are fixed in the React page)
  await p.click('tbody tr:visible >> nth=1'); r.rowDrawer = await st(); await p.keyboard.press('Escape'); r.drawerEsc = await st();
  await p.click('tbody tr:visible >> nth=0'); await p.click('#drawerClose'); r.drawerClose = await st();
  await p.click('tbody tr:visible >> nth=2'); await p.click('#drawerBackdrop', { position: { x: 300, y: 500 } }); r.drawerBackdrop = await st();
  const dl = p.waitForEvent('download'); await p.click('button:has-text("Export CSV")'); const d = await dl;
  r.csv = norm(fs.readFileSync(await d.path(), 'utf8')); r.csvName = d.suggestedFilename(); r.afterCsv = await st();
  await p.keyboard.press('/'); r.slash = await st();
  await p.click('.nav-group-head >> nth=1'); r.groupToggle = await st(); await p.click('.nav-group-head >> nth=1');
  await p.click('#collapseBtn'); r.collapse = await st(); await open('/citizens'); r.collapsePersist = await st(); await p.click('#collapseBtn');
  await p.click('tbody tr:visible >> nth=0'); r.citizenDrawer = await st(); await p.keyboard.press('Escape');
  await open('/portals?system=eprisons'); await p.click('th[data-sort]:has-text("Form")'); r.portalSort1 = await st(); await p.click('th[data-sort]:has-text("Form")'); r.portalSort2 = await st(); await p.click('th[data-sort]:has-text("Fields")'); r.portalSort3 = await st();
  await open('/integration'); await p.click('th[data-sort]:has-text("Attempts")'); r.integSort = await st(); await p.click('th[data-sort]:has-text("Attempts")'); r.integSort2 = await st();
  await open('/audit'); await p.fill('#globalSearch', 'citizen'); r.auditSearch = await st(); await p.fill('#globalSearch', '');
  await open('/portals?system=eprisons'); await p.click('tbody tr:visible >> nth=0'); r.portalDrawer = await st(); await p.keyboard.press('Escape');
  await open('/sync'); await p.fill('#globalSearch >> nth=0', 'T-0'); r.syncTopSearch = await st(); await p.fill('#globalSearch >> nth=0', '');
  await p.click('tbody tr:visible >> nth=0'); r.syncDrawer = await st(); await p.keyboard.press('Escape');
  const dl2 = p.waitForEvent('download'); await p.click('button:has-text("Export") >> nth=0'); const d2 = await dl2; r.syncCsv = norm(fs.readFileSync(await d2.path(), 'utf8')).slice(0, 600);
  await open('/'); await p.click('tbody tr:visible >> nth=0'); r.dashDrawer = await st(); await p.keyboard.press('Escape');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
  await p.click('#menuBtn'); r.mobileOpen = await st(); await p.keyboard.press('Escape');
  await p.click('#menuBtn'); await p.keyboard.press('Escape'); r.mobileEsc = await st();
  await p.click('#menuBtn'); await p.click('#navScrim', { position: { x: 370, y: 400 } }); r.mobileScrim = await st();
  r.links = await p.$$eval('a.nav-item', (a) => a.map((x) => x.getAttribute('href')));
  await ctx.close(); return r;
}
const o = await run('old'), n = await run('new');
let bad = 0;
for (const k of Object.keys(o)) { const same = JSON.stringify(o[k]) === JSON.stringify(n[k]); if (!same) bad++; console.log(same ? 'SAME' : 'DIFF', k); if (!same) { const a = JSON.stringify(o[k]), b = JSON.stringify(n[k]); let i = 0; while (a[i] === b[i]) i++; console.log('  old …' + a.slice(Math.max(0, i - 80), i + 160) + '\n  new …' + b.slice(Math.max(0, i - 80), i + 160)); } }
console.log(bad ? `${bad} differing` : 'ALL SAME'); await browser.close(); process.exit(bad ? 1 : 0);
