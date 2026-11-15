// Portal replicas: the hydrated React page must behave like the EJS page.  env: OLD NEW (base URLs), SITE (site.json), PORTAL
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const B = { old: process.env.OLD, new: process.env.NEW };
const site = JSON.parse(fs.readFileSync(process.env.SITE, 'utf8'));
const forms = site.pages.flatMap((p) => (p.forms || []).map((f) => ({ route: p.route, f })));
const casc = forms.find((x) => x.f.fields.some((f) => f.cascadeTarget));
const counter = forms.find((x) => x.f.fields.some((f) => f.maxLength && f.type !== 'select'));
const browser = await chromium.launch();
async function run(label) {
  const r = {}, errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 160)));
  const open = async (u) => { await p.goto(B[label] + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(250); };
  // mobile navigation
  await p.setViewportSize({ width: 390, height: 844 }); await open('/');
  if (await p.$('.nav-toggle')) { await p.click('.nav-toggle'); r.navOpen = await p.evaluate(() => [document.getElementById('primary-nav').classList.contains('is-open'), document.querySelector('.nav-toggle').getAttribute('aria-expanded')]); await p.click('.nav-toggle'); r.navClosed = await p.evaluate(() => document.getElementById('primary-nav').classList.contains('is-open')); }
  await p.setViewportSize({ width: 1440, height: 900 });
  // text size, "More" menu, language menu
  const openMore = async () => { if (!(await p.isVisible('[data-text-size="large"]'))) await p.click('summary[aria-label="Accessibility options"]').catch(() => {}); };
  if (await p.$('[data-text-size="large"]')) { await openMore(); await p.click('[data-text-size="large"]'); r.textLarge = await p.evaluate(() => [document.documentElement.getAttribute('data-text'), [...document.querySelectorAll('[data-text-size]')].map((b) => b.getAttribute('aria-pressed')).join()]); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(200); r.textPersist = await p.evaluate(() => document.documentElement.getAttribute('data-text')); await openMore(); await p.click('[data-text-size="normal"]'); }
  if (await p.$('.primary-nav__toggle')) { await p.click('.primary-nav__toggle'); r.more = await p.evaluate(() => [document.getElementById('nav-more').hidden, document.querySelector('.primary-nav__toggle').getAttribute('aria-expanded')]); await p.keyboard.press('Escape'); r.moreEsc = await p.evaluate(() => document.getElementById('nav-more').hidden); }
  if (await p.$('details.tb-item summary:visible')) { await p.click('details.tb-item summary:visible >> nth=0'); r.det = await p.evaluate(() => [...document.querySelectorAll('details.tb-item')].map((d) => d.open)); await p.mouse.click(5, 400); r.detClosed = await p.evaluate(() => [...document.querySelectorAll('details.tb-item')].map((d) => d.open)); }
  // hero carousel
  if (await p.$('#heroViewport')) {
    const st = () => p.evaluate(() => [[...document.querySelectorAll('.hero__slide')].findIndex((s) => s.classList.contains('is-active')), [...document.querySelectorAll('[data-hero-dot]')].findIndex((d) => d.hasAttribute('aria-current')), document.querySelector('[data-hero="pause"]') && document.querySelector('[data-hero="pause"]').getAttribute('aria-label')]);
    await p.mouse.move(5, 5); r.hero0 = await st(); await p.click('[data-hero="next"]'); r.hero1 = await st(); await p.click('[data-hero="prev"]'); await p.click('[data-hero="prev"]'); r.hero2 = await st();
    await p.click('[data-hero-dot="3"]'); r.hero3 = await st(); await p.click('[data-hero="pause"]'); r.heroPause = await st();
  }
  // dependent dropdowns
  if (casc) {
    await open(casc.route);
    const src = casc.f.fields.find((f) => f.cascadeTarget);
    const opt = await p.$eval(`#${src.name}`, (s) => [...s.options].find((o) => o.value)?.value);
    const before = await p.$eval(`#${src.cascadeTarget}`, (s) => [s.disabled, s.options.length]);
    await p.selectOption(`#${src.name}`, opt); await p.waitForTimeout(500);
    r.cascade = { before, after: await p.$eval(`#${src.cascadeTarget}`, (s) => [s.disabled, [...s.options].map((o) => o.textContent).slice(0, 6)]) };
    await p.selectOption(`#${src.name}`, ''); r.cascadeReset = await p.$eval(`#${src.cascadeTarget}`, (s) => [s.disabled, s.options.length]);
  }
  // character counters
  if (counter) {
    await open(counter.route);
    const fld = counter.f.fields.find((f) => f.maxLength && f.type !== 'select');
    r.counter0 = await p.$eval(`#${fld.name}_count`, (e) => e.textContent).catch(() => null);
    await p.fill(`#${fld.name}`, 'abc'); r.counter1 = await p.$eval(`#${fld.name}_count`, (e) => e.textContent).catch(() => null);
  }
  const eng = await p.evaluate(() => ({ bundle: !!document.querySelector('script[src*="portal.js"]'), oldScript: !!document.querySelector('script[src*="replica.js"]'), reactRoot: Object.keys(document).some((k) => k.startsWith('__reactContainer')) }));
  console.log(label.padEnd(4), 'engine:', JSON.stringify(eng));
  r.errors = errors.filter((e) => !/favicon|Failed to load resource/.test(e));
  await ctx.close(); return r;
}
const o = await run('old'), n = await run('new');
let bad = 0;
for (const k of Object.keys({ ...o, ...n })) { const same = JSON.stringify(o[k]) === JSON.stringify(n[k]); if (!same) bad++; console.log(same ? 'SAME' : 'DIFF', k, same ? '' : '\n old ' + JSON.stringify(o[k]) + '\n new ' + JSON.stringify(n[k])); }
console.log(bad ? `${bad} differing` : 'ALL SAME'); await browser.close(); process.exit(bad ? 1 : 0);
