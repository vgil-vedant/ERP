// ePrisons: the hydrated React pages must behave like the EJS pages.  env: OLD NEW (base URLs)
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const B = { old: process.env.OLD, new: process.env.NEW };
const browser = await chromium.launch();
async function run(label) {
  const r = {}, errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
  p.on('pageerror', (e) => errors.push('PE ' + e.message.slice(0, 140)));
  const open = async (u) => { await p.goto(B[label] + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(250); };
  // home: carousel and mobile navigation
  await open('/');
  const car = () => p.evaluate(() => [[...document.querySelectorAll('.carousel__slide')].findIndex((s) => s.classList.contains('is-active')), [...document.querySelectorAll('.carousel__dots button')].map((d) => d.getAttribute('aria-current')).join()]);
  await p.mouse.move(5, 5); r.car0 = await car(); await p.click('.carousel__ctrl--next'); r.car1 = await car(); await p.click('.carousel__ctrl--prev'); await p.click('.carousel__ctrl--prev'); r.car2 = await car();
  await p.click('.carousel__dots button >> nth=0'); r.car3 = await car();
  await open('/#slide-2'); r.carHash = await car();
  const menus = p.locator('.has-children > .primary-nav__link');
  if (await menus.count()) { await menus.first().click(); r.menuOpen = await p.evaluate(() => [...document.querySelectorAll('.has-children')].map((i) => i.classList.contains('open') + ':' + i.querySelector('.primary-nav__link').getAttribute('aria-expanded'))); await p.mouse.click(5, 300); r.menuClosed = await p.evaluate(() => document.querySelectorAll('.has-children.open').length); await menus.first().click(); await p.keyboard.press('Escape'); r.menuEsc = await p.evaluate(() => document.querySelectorAll('.has-children.open').length); }
  await p.setViewportSize({ width: 390, height: 844 }); await open('/');
  await p.click('.nav-toggle'); r.navOpen = await p.evaluate(() => [document.getElementById('primary-nav').classList.contains('is-open'), document.querySelector('.nav-toggle').getAttribute('aria-expanded')]);
  await p.setViewportSize({ width: 1440, height: 900 });
  // visit registration: cascade, id proof, additional visitors, counters, challenge refresh
  await open('/public/MyVisitRegistration');
  const sel = await p.$('[data-cascade-source]');
  if (sel) {
    const id = await sel.getAttribute('id'), tid = await sel.getAttribute('data-cascade-target');
    r.jail0 = await p.$eval('#' + tid, (s) => [s.disabled, s.options.length]);
    const v = await p.$eval('#' + id, (s) => [...s.options].find((o) => o.value && o.value !== '')?.value);
    await p.selectOption('#' + id, v); await p.waitForTimeout(500);
    r.jail1 = await p.$eval('#' + tid, (s) => [s.disabled, [...s.options].map((o) => o.textContent).slice(0, 5)]);
  }
  if (await p.$('[data-idproof]')) {
    r.idp0 = await p.evaluate(() => [document.getElementById('id_number').disabled, document.getElementById('id_number_hint') && document.getElementById('id_number_hint').textContent]);
    const opts = await p.$$eval('[data-idproof] option', (o) => o.map((x) => [x.value, x.getAttribute('data-requires-number')]));
    for (const [val, req] of opts.filter((o) => o[0]).slice(0, 3)) { await p.selectOption('[data-idproof]', val); r['idp_' + val + '_' + req] = await p.evaluate(() => [document.getElementById('id_number').disabled, document.getElementById('id_number').required, document.getElementById('id_number_hint') && document.getElementById('id_number_hint').textContent]); }
  }
  if (await p.$('#additional_visitor_count')) { r.add0 = await p.$eval('#additional_visitor_names', (e) => [e.disabled, e.placeholder]); await p.fill('#additional_visitor_count', '2'); r.add1 = await p.$eval('#additional_visitor_names', (e) => e.disabled); }
  const ctr = await p.$('[data-counter]');
  if (ctr) { const id = await ctr.getAttribute('id'); r.cnt0 = await p.$eval('#' + id + '_count', (e) => e.textContent); await p.fill('#' + id, 'hello'); r.cnt1 = await p.$eval('#' + id + '_count', (e) => e.textContent); }
  if (await p.$('#challenge_refresh')) { const q0 = await p.$eval('#challenge_q', (e) => e.textContent); await p.fill('#challenge_answer', 'zz'); await p.click('#challenge_refresh'); await p.waitForTimeout(500); r.chal = await p.evaluate(() => [document.getElementById('challenge_answer').value, document.getElementById('challenge_q').textContent === document.getElementById('challenge_expected').value ? 'x' : 'ok', !!document.getElementById('challenge_q').textContent]); r.chalChanged = typeof q0; }
  // dashboard: filter panel and charts
  await open('/public/DashBoard');
  r.dash0 = await p.evaluate(() => [document.querySelector('.dash').classList.contains('is-collapsed'), document.documentElement.classList.contains('charts-ready'), document.querySelectorAll('#chart-trend svg *').length, document.querySelectorAll('#chart-states svg rect').length, document.querySelectorAll('#legend-trend button').length]);
  await p.click('.dash__bar-mark'); r.dashPanel = await p.evaluate(() => [document.querySelector('.dash').classList.contains('is-collapsed'), document.querySelector('.dash__bar-mark').getAttribute('aria-label'), document.getElementById('dash-filter').getAttribute('aria-hidden')]);
  await p.click('.dash__bar-mark');
  await p.click('#legend-trend button >> nth=0'); r.legend = await p.evaluate(() => [document.querySelectorAll('#chart-trend svg *').length, [...document.querySelectorAll('#legend-trend button')].map((b) => b.getAttribute('aria-pressed')).join()]);
  const hit = p.locator('#chart-trend .chart__hit').first(); if (await hit.count()) { await hit.hover({ force: true }); r.tip = await p.evaluate(() => { const t = document.querySelector('.chart-tip'); return t && !t.hidden ? t.textContent : null; }); }
  await open('/public/DashBoard#hide=release'); r.hideHash = await p.evaluate(() => [...document.querySelectorAll('#legend-trend button')].map((b) => b.getAttribute('aria-pressed')).join());
  await open('/public/ePrisonsLiveStatus'); r.spa = await p.evaluate(() => document.body.textContent.replace(/\s+/g, '').length > 200);
  r.errors = errors.filter((e) => !/Failed to load resource/.test(e));
  const eng = await p.evaluate(() => ({ bundle: !!document.querySelector('script[src*="portal.js"]'), reactRoot: Object.keys(document).some((k) => k.startsWith('__reactContainer')) }));
  console.log(label.padEnd(4), 'engine:', JSON.stringify(eng));
  await ctx.close(); return r;
}
const o = await run('old'), n = await run('new');
let bad = 0;
for (const k of Object.keys({ ...o, ...n })) { const same = JSON.stringify(o[k]) === JSON.stringify(n[k]); if (!same) bad++; console.log(same ? 'SAME' : 'DIFF', k, same ? '' : '\n old ' + JSON.stringify(o[k]) + '\n new ' + JSON.stringify(n[k])); }
console.log(bad ? `${bad} differing` : 'ALL SAME'); await browser.close(); process.exit(bad ? 1 : 0);
