// Same interaction script on the old and the React hub; the observable results must match.
//   env: OLD_HUB NEW_HUB HUB_USER HUB_PASS SNAPSHOT
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const snapshot = fs.readFileSync(process.env.SNAPSHOT, 'utf8');
const B = { old: process.env.OLD_HUB, new: process.env.NEW_HUB };
const browser = await chromium.launch();
async function run(label) {
  const r = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true,
    extraHTTPHeaders: { Authorization: 'Basic ' + Buffer.from(process.env.HUB_USER + ':' + process.env.HUB_PASS).toString('base64') } });
  const opened = []; ctx.on('page', (p) => opened.push(p.url()));
  const p = await ctx.newPage();
  await p.route('**/api/dashboard', (x) => x.fulfill({ status: 200, contentType: 'application/json', body: snapshot }));
  const txt = (sel) => p.$$eval(sel, (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  const st = (o = {}) => p.evaluate((o) => {
    const w = (t) => t.replace(/\s+/g, '');
    const vis = (e) => e && getComputedStyle(e).display !== 'none';
    const view = [...document.querySelectorAll('.view')].find((v) => v.classList.contains('is-active'));
    const t = view && view.querySelector('.tbl');
    return {
      hash: location.hash, crumb: document.getElementById('crumbSection').textContent + '>' + document.getElementById('crumbNow').textContent, view: view && view.id,
      nav: [...document.querySelectorAll('.nav-item.is-active')].map((e) => e.dataset.view), collapsed: document.getElementById('app').classList.contains('is-collapsed'),
      navOpen: document.getElementById('app').classList.contains('nav-open'), groupsClosed: [...document.querySelectorAll('.nav-group.is-closed')].map((e) => e.dataset.group),
      kpi: ['kpiReceived', 'kpiReceivedNote', 'kpiSuccess', 'kpiRollback', 'kpiAudit', 'kpiDupes'].map((i) => document.getElementById(i).textContent),
      toasts: o.toasts ? [...document.querySelectorAll('.toast')].map((e) => w(e.textContent)) : undefined,
      drawer: document.getElementById('drawer').classList.contains('show') ? { k: document.getElementById('drawerKicker').textContent, t: document.getElementById('drawerTitle').textContent, b: w(document.getElementById('drawerBody').textContent), f: w(document.getElementById('drawerFoot').textContent) } : null,
      rows: t ? [...t.querySelectorAll('tbody tr')].slice(0, 12).map((tr) => w(tr.textContent)) : null,
      sorted: t ? [...t.querySelectorAll('th.is-sorted')].map((e) => e.textContent.trim() + ':' + e.getAttribute('aria-sort')) : null,
      pager: view ? [...view.querySelectorAll('.pager-info')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()) : null,
      pg: view ? [...view.querySelectorAll('.pg')].map((e) => e.textContent + (e.disabled ? '!' : '') + (e.classList.contains('is-active') ? '*' : '')) : null,
      sub: ['intakeCountSub', 'citizenCountSub', 'auditCountSub', 'syncCountSub', 'subCountSub'].map((i) => document.getElementById(i).textContent),
      range: [...document.querySelectorAll('#activityRange button')].map((b) => b.className.includes('is-active')),
      pop: document.getElementById('searchPop').classList.contains('open') ? [...document.querySelectorAll('#searchPop .sp-item, #searchPop .sp-head, #searchPop .sp-empty')].map((e) => w(e.textContent)) : null,
      focus: o.focus ? document.activeElement && (document.activeElement.id || document.activeElement.tagName) : undefined, noscroll: document.body.classList.contains('no-scroll'),
      selects: [...document.querySelectorAll('#periodSelect, #periodSelectIntegration')].map((s) => s.value), search: document.getElementById('globalSearch').value,
    };
  }, o);
  const go = async (v) => { await p.click(`.nav-item[data-view="${v}"]`); await p.waitForTimeout(80); };
  await p.goto(B[label] + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(300); r.initial = await st();
  for (const v of ['overview', 'intake', 'citizens', 'audit', 'sync', 'integration', 'submissions', 'database', 'health', 'docs', 'portals', 'dashboard']) { await go(v); r['nav_' + v] = await st(); }
  await p.click('.nav-group[data-group="g2"] .nav-group-head'); r.groupToggle = await st(); await p.click('.nav-group[data-group="g2"] .nav-group-head');
  await p.click('#collapseBtn'); r.collapse = await st(); await p.click('#collapseBtn');
  await p.selectOption('#periodSelect', '7'); r.period7 = await st({ toasts: true });
  await p.selectOption('#periodSelect', 'all'); r.periodAll = await st();
  await go('integration'); await p.selectOption('#periodSelectIntegration', '90'); r.periodInt90 = await st(); await p.selectOption('#periodSelectIntegration', '30');
  await go('dashboard'); await p.click('#activityRange button[data-days="90"], #activityRange button:nth-child(3)'); r.range90 = await st();
  await go('intake');
  await p.fill('[data-table="intake"] .tbl-search input', 'uidai'); r.intakeSearch = await st();
  await p.fill('[data-table="intake"] .tbl-search input', 'zzzz-none'); r.intakeEmpty = await st();
  await p.click('[data-table="intake"] [class*="btn-ghost"]'); r.intakeCleared = await st();
  await p.selectOption('[data-table="intake"] select >> nth=0', 'ecourts'); r.intakeFilter = await st();
  await p.selectOption('[data-table="intake"] select >> nth=0', '');
  await p.click('[data-table="intake"] th:has-text("Source system")'); r.sortSystem = await st();
  await p.click('[data-table="intake"] th:has-text("Source system")'); r.sortSystem2 = await st();
  await p.click('[data-table="intake"] .pg:has-text("3")'); r.page3 = await st();
  await p.click('[data-table="intake"] .pg[aria-label="Next page"]'); r.pageNext = await st();
  const dl = p.waitForEvent('download'); await p.click('[data-table="intake"] [class*="btn-sm"]:has-text("Export")'); const d1 = await dl;
  r.csvIntake = fs.readFileSync(await d1.path(), 'utf8').slice(0, 1200); r.csvName = d1.suggestedFilename(); r.afterExport = await st({ toasts: true });
  await p.click('[data-table="intake"] tbody tr >> nth=0'); r.drawerRecord = await st();
  await p.keyboard.press('Escape'); r.drawerEsc = await st();
  await go('citizens'); await p.click('[data-table="citizens"] tbody tr >> nth=0'); r.drawerCitizen = await st(); await p.click('#drawerClose'); r.drawerClosed = await st();
  await go('sync'); await p.click('[data-table="sync"] tbody tr >> nth=0'); r.drawerSync = await st(); await p.click('#scrim', { position: { x: 4, y: 4 } }); 
  await p.click('[data-table="sync"] tbody tr >> nth=5'); r.drawerSync5 = await st(); await p.keyboard.press('Escape');
  await go('audit'); await p.click('[data-table="audit"] th:has-text("Maker")'); r.auditSort = await st();
  await p.selectOption('[data-table="audit"] select >> nth=0', 'citizen'); r.auditFilter = await st();
  await go('submissions'); await p.selectOption('[data-table="submissions"] select >> nth=0', 'rolled_back'); r.subFilter = await st();
  await p.keyboard.press('/'); r.slash = await st({ focus: true });
  await p.keyboard.type('ERP-00000'); await p.waitForTimeout(80); r.search1 = await st();
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); r.searchArrow = await st();
  await p.keyboard.press('Enter'); r.searchEnter = await st(); await p.keyboard.press('Escape');
  await p.fill('#globalSearch', 'Sanjay'); r.search2 = await st();
  await p.fill('#globalSearch', 'nothing-matches-this'); r.searchNone = await st();
  await p.keyboard.press('Escape'); r.searchEsc = await st({ focus: true }); await p.fill('#globalSearch', '');
  await p.click('.nav-item[data-view="portal:uidai"]'); await p.waitForTimeout(250); r.portalOpen = await st({ toasts: true }); r.portalPages = opened.length;
  await go('dashboard'); await p.click('.port-open >> nth=1'); await p.waitForTimeout(200); r.quickPortal = await st({ toasts: true });
  const dl2 = p.waitForEvent('download'); await p.click('#exportSummaryBtn'); const d2 = await dl2; r.csvSummary = fs.readFileSync(await d2.path(), 'utf8'); r.afterSummary = await st({ toasts: true });
  await p.click('#openRecordsBtn'); r.openRecords = await st();
  await go('docs'); await p.click('.doc-row .btn >> nth=0'); await p.waitForTimeout(150); r.copy = await st({ toasts: true });
  await go('portals'); await p.click('[data-open-hub], button:has-text("About the hub")'); r.aboutHub = await st({ toasts: true });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  await p.click('#menuBtn'); await p.waitForTimeout(300); r.mobileNavOpen = await st();
  await p.click('#navScrim', { position: { x: 380, y: 400 } }); await p.waitForTimeout(400); r.mobileNavScrimClose = await st();
  await p.click('#menuBtn'); await p.click('.nav-item[data-view="citizens"]'); await p.waitForTimeout(400); r.mobileNavPick = await st();
  await p.click('#searchToggle'); await p.waitForTimeout(100); r.searchBar = await st(); await p.keyboard.press('Escape'); r.searchBarEsc = await st();
  await ctx.close();
  // signed-out session: the API answers 401 -> the page goes to /login
  const c2 = await browser.newContext({ extraHTTPHeaders: { Authorization: 'Basic ' + Buffer.from(process.env.HUB_USER + ':' + process.env.HUB_PASS).toString('base64') } });
  const p2 = await c2.newPage(); await p2.route('**/api/dashboard', (x) => x.fulfill({ status: 401, body: '{}' }));
  await p2.goto(B[label] + '/', { waitUntil: 'load' }); await p2.waitForTimeout(800); r.expired = new URL(p2.url()).pathname; await c2.close();
  return r;
}
const o = await run('old'), n = await run('new');
let bad = 0;
for (const k of Object.keys(o)) { const same = JSON.stringify(o[k]) === JSON.stringify(n[k]); if (!same) bad++; console.log(same ? 'SAME' : 'DIFF', k); if (!same) { const a = JSON.stringify(o[k]), b = JSON.stringify(n[k]); let i = 0; while (a[i] === b[i]) i++; console.log('  old …' + a.slice(Math.max(0, i - 60), i + 140) + '\n  new …' + b.slice(Math.max(0, i - 60), i + 140)); } }
console.log(bad ? `${bad} differing` : 'ALL SAME'); await browser.close(); process.exit(bad ? 1 : 0);
