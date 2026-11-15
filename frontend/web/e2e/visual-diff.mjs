// Compares the current EJS pages with the React pages, pixel by pixel.
//   node e2e/visual-diff.mjs <outDir>   (env: OLD_HUB, NEW_HUB, OLD_PORTAL, NEW_PORTAL = base URLs)
// Playwright, pixelmatch and pngjs come from backend/tools (already installed there).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');

const out = process.argv[2] || './vd-out';
fs.mkdirSync(out, { recursive: true });
const OLD = { hub: process.env.OLD_HUB, portal: process.env.OLD_PORTAL };
const NEW = { hub: process.env.NEW_HUB, portal: process.env.NEW_PORTAL };
const PAGES = [
  ['hub-login', 'hub', '/login'],
  ['login', 'portal', '/account/login'],
  ['register', 'portal', '/account/register'],
];
const SIZES = [[1440, 900], [1024, 768], [390, 844]];
const THEMES = ['light', 'dark'];
const TOLERANCE = Number(process.env.TOLERANCE || 0.002);   // share of differing pixels allowed (anti-aliasing)

const browser = await chromium.launch();
let failed = 0;
for (const [name, kind, route] of PAGES) {
  for (const [w, h] of SIZES) {
    for (const theme of THEMES) {
      const shots = {};
      for (const [label, base] of [['old', OLD], ['new', NEW]]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await page.goto(base[kind] + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        shots[label] = await page.screenshot();
        await ctx.close();
      }
      const a = PNG.sync.read(shots.old), b = PNG.sync.read(shots.new);
      const diff = new PNG({ width: a.width, height: a.height });
      const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
      const ratio = n / (a.width * a.height);
      const tag = `${name}-${w}-${theme}`;
      fs.writeFileSync(path.join(out, `${tag}.old.png`), shots.old);
      fs.writeFileSync(path.join(out, `${tag}.new.png`), shots.new);
      fs.writeFileSync(path.join(out, `${tag}.diff.png`), PNG.sync.write(diff));
      const ok = ratio <= TOLERANCE;
      if (!ok) failed++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(26)} ${(ratio * 100).toFixed(3)}% (${n} px)`);
    }
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
