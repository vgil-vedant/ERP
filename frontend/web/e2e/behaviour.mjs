// Runs the same interaction script against the EJS pages and the React pages; the observable results must match.
//   OLD_HUB NEW_HUB OLD_PORTAL NEW_PORTAL = base URLs.  Prints one JSON line per scenario and a verdict.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');

const out = process.argv[2] || './vd-out'; fs.mkdirSync(out, { recursive: true });
const SETS = { old: { hub: process.env.OLD_HUB, portal: process.env.OLD_PORTAL }, new: { hub: process.env.NEW_HUB, portal: process.env.NEW_PORTAL } };
const browser = await chromium.launch();

async function scenario(label, base) {
  const res = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const state = () => page.evaluate(() => ({
    url: location.pathname + location.search,
    errs: [...document.querySelectorAll('.lg-err')].map((e) => e.textContent),
    bad: [...document.querySelectorAll('.lg-field.is-bad')].length,
    server: [...document.querySelectorAll('.lg-server-err')].map((e) => e.textContent),
    vals: [...document.querySelectorAll('form input')].map((i) => i.value),
    types: [...document.querySelectorAll('form input')].map((i) => i.type),
    focus: document.activeElement && document.activeElement.id,
    theme: document.documentElement.dataset.theme,
    busy: !!document.querySelector('.lg-btn.is-busy'),
    label: (document.querySelector('.lg-btn-primary .lg-lbl') || {}).textContent,
  }));
  const shot = async (name) => { const b = await page.screenshot(); fs.writeFileSync(path.join(out, `${label}-${name}.png`), b); return b; };
  const shots = {};

  // 1. login: empty submit -> client messages, focus first
  await page.goto(base.portal + '/account/login'); await page.waitForLoadState('networkidle');
  await page.click('.lg-btn-primary'); res.loginEmpty = await state(); shots.loginEmpty = await shot('login-empty');
  // 2. typing clears a message; reveal password; reset not on portal
  await page.fill('#email', 'x@y.z'); await page.fill('#password', 'secret1'); await page.click('.lg-eye');
  res.loginReveal = await state();
  await page.click('.lg-eye'); res.loginHide = await state();
  // 3. wrong credentials -> server message, email kept, 401
  const [resp] = await Promise.all([page.waitForNavigation(), page.click('.lg-btn-primary')]);
  res.loginWrong = { ...(await state()), status: resp.status() }; shots.loginWrong = await shot('login-wrong');
  // 4. register: server-side errors kept, values kept
  await page.goto(base.portal + '/account/register'); await page.waitForLoadState('networkidle');
  await page.fill('#full_name', 'Test User'); await page.fill('#email', 'bad'); await page.fill('#mobile', '12'); await page.fill('#password', 'short'); await page.fill('#confirm_password', 'different');
  const [r2] = await Promise.all([page.waitForNavigation(), page.click('.lg-btn-primary')]);
  res.registerErrors = { ...(await state()), status: r2.status() }; shots.registerErrors = await shot('register-errors');
  // 5. notice dismiss
  await page.click('.lg-notice-x'); res.noticeHidden = await page.evaluate(() => getComputedStyle(document.querySelector('.lg-notice')).display);
  // 6. carousel dots
  await page.goto(base.portal + '/account/login'); await page.waitForLoadState('networkidle');
  await page.click('.lg-dots button:nth-child(3)');
  res.carousel = await page.evaluate(() => ({ active: [...document.querySelectorAll('.lg-slide')].findIndex((s) => getComputedStyle(s).visibility === 'visible'),
    selected: [...document.querySelectorAll('.lg-dots button')].map((b) => b.getAttribute('aria-selected')) }));
  // 7. hub: wrong login, reset
  await page.goto(base.hub + '/login'); await page.waitForLoadState('networkidle');
  await page.fill('#username', 'nobody'); await page.fill('#password', 'nope');
  const [r3] = await Promise.all([page.waitForNavigation(), page.click('.lg-btn-primary')]);
  res.hubWrong = { ...(await state()), status: r3.status() }; shots.hubWrong = await shot('hub-wrong');
  await page.click('button[type=reset]'); await page.waitForTimeout(100); res.hubReset = await state(); shots.hubReset = await shot('hub-reset');
  await ctx.close();
  return { res, shots };
}

const o = await scenario('old', SETS.old), n = await scenario('new', SETS.new);
let bad = 0;
for (const k of Object.keys(o.res)) {
  const same = JSON.stringify(o.res[k]) === JSON.stringify(n.res[k]);
  if (!same) { bad++; console.log('DIFF', k, '\n  old', JSON.stringify(o.res[k]), '\n  new', JSON.stringify(n.res[k])); } else console.log('SAME', k);
}
for (const k of Object.keys(o.shots)) {
  const a = PNG.sync.read(o.shots[k]), b = PNG.sync.read(n.shots[k]);
  const px = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  if (px > a.width * a.height * 0.002) bad++;
  console.log(px > a.width * a.height * 0.002 ? 'PIXDIFF' : 'PIXSAME', k, px);
}
await browser.close(); process.exit(bad ? 1 : 0);
