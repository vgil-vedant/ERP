// My account page: EJS vs React, every section, 3 widths, 2 themes, plus the open drawer and website switcher.
//   env: OLD_PORTAL NEW_PORTAL (base URLs), TOKEN (a session token on that portal)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');
const out = process.argv[2] || './vd-out'; fs.mkdirSync(out, { recursive: true });
const BASES = { old: process.env.OLD_PORTAL, new: process.env.NEW_PORTAL };
const TOL = Number(process.env.TOLERANCE || 0.002);
const SIZES = [[1440, 1900], [1024, 1500], [390, 1700]];
const SCENES = [
  ['overview', '#overview', null], ['info', '#info', null], ['submissions', '#submissions', null],
  ['switcher', '#overview', '#acSwitch'], ['drawer', '#overview', '#acMenu'],
];
const browser = await chromium.launch();
let failed = 0;
for (const [name, hash, click] of SCENES) {
  for (const [w, h] of SIZES) {
    if (name === 'drawer' && w > 900) continue;
    for (const theme of ['light', 'dark']) {
      const shots = {};
      for (const label of ['old', 'new']) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
        await ctx.addCookies([{ name: 'gov_demo_session', value: process.env.TOKEN, url: BASES[label] }]);
        const page = await ctx.newPage();
        await page.goto(BASES[label] + '/account' + hash, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        if (click === '#acSwitch' && w <= 900) await page.click('#acMenu');   // the switcher lives in the drawer on small screens
        if (click) await page.click(click);
        await page.waitForTimeout(400);
        shots[label] = await page.screenshot();
        await ctx.close();
      }
      const a = PNG.sync.read(shots.old), b = PNG.sync.read(shots.new);
      const diff = new PNG({ width: a.width, height: a.height });
      const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
      const ratio = n / (a.width * a.height), tag = `${name}-${w}-${theme}`;
      for (const k of ['old', 'new']) fs.writeFileSync(path.join(out, `${tag}.${k}.png`), shots[k]);
      fs.writeFileSync(path.join(out, `${tag}.diff.png`), PNG.sync.write(diff));
      const ok = ratio <= TOL; if (!ok) failed++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(26)} ${(ratio * 100).toFixed(3)}% (${n} px)`);
    }
  }
}
await browser.close(); process.exit(failed ? 1 : 0);
