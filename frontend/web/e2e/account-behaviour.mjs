// Same interaction script on the EJS and React My account pages; the observable results must match.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const B = { old: process.env.OLD_PORTAL, new: process.env.NEW_PORTAL };
const browser = await chromium.launch();
async function run(label) {
  const r = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addCookies([{ name: 'gov_demo_session', value: process.env.TOKEN, url: B[label] }]);
  const p = await ctx.newPage();
  const st = () => p.evaluate(() => ({
    h1: document.querySelector('#acHeading').textContent, sub: document.querySelector('#acSub').textContent, hash: location.hash,
    current: [...document.querySelectorAll('[aria-current="page"]')].map((e) => e.textContent.trim().replace(/\s+/g, ' ')),
    visible: ['overview', 'info', 'submissions'].filter((v) => { const e = document.getElementById('view-' + v); return e && !e.hidden && getComputedStyle(e).display !== 'none'; }),
    theme: document.documentElement.dataset.theme, stored: localStorage.getItem('erp_auth_theme'),
    pressed: document.getElementById('lgTheme').getAttribute('aria-pressed'),
    sw: document.getElementById('acSwitch').getAttribute('aria-expanded'),
    menuOpen: !!document.querySelector('.menu-open'), focus: document.activeElement && (document.activeElement.id || document.activeElement.textContent.trim().slice(0, 20)),
  }));
  await p.goto(B[label] + '/account', { waitUntil: 'networkidle' }); r.initial = await st();
  await p.click('a[href="#submissions"].ac-item, a.ac-item[data-view=submissions]').catch(async () => p.click('text=My submissions')); r.submissions = await st();
  await p.click('.ac-profile'); r.info = await st();
  await p.click('text=Overview >> nth=0'); r.overview = await st();
  await p.click('#acLgNoop').catch(() => {});
  await p.click('.ac-site.is-current .ac-site-link').catch(async () => p.click('article:has-text("this site") a')); r.openLink = await st();
  await p.click('#acSwitch'); r.swOpen = await st();
  r.swItems = await p.$$eval('[data-port-link]', (a) => a.map((x) => x.getAttribute('href') + '|' + x.textContent.trim().replace(/\s+/g, ' ') + '|' + (x.getAttribute('aria-current') || '')));
  await p.keyboard.press('ArrowDown'); r.swArrow = await st();
  await p.keyboard.press('Escape'); r.swEsc = await st();
  await p.click('#lgTheme'); r.themeDark = await st();
  await p.click('#lgTheme'); r.themeLight = await st();
  await p.setViewportSize({ width: 390, height: 800 });
  await p.click('#acMenu'); r.drawerOpen = await st();
  await p.keyboard.press('Escape'); r.drawerEsc = await st();
  await p.click('#acMenu'); await p.click('#acClose'); r.drawerClose = await st();
  await p.click('#acMenu'); await p.click('a[href="#info"].ac-profile, .ac-profile'); r.drawerNav = await st();
  await p.setViewportSize({ width: 1440, height: 900 });
  const [nav] = await Promise.all([p.waitForNavigation(), p.click('.ac-signout button, form[action="/account/logout"] button')]);
  r.signout = { url: new URL(p.url()).pathname, status: nav ? nav.status() : null };
  await ctx.close(); return r;
}
const o = await run('old'), n = await run('new');
let bad = 0;
for (const k of Object.keys(o)) { const same = JSON.stringify(o[k]) === JSON.stringify(n[k]); if (!same) bad++; console.log(same ? 'SAME' : 'DIFF', k, same ? '' : '\n old ' + JSON.stringify(o[k]) + '\n new ' + JSON.stringify(n[k])); }
await browser.close(); process.exit(bad ? 1 : 0);
