// ERP console (port 4200 pages): EJS page vs React page, full-page screenshots.  env: OLD NEW (base URLs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');
const out = process.argv[2] || './vd-out'; fs.mkdirSync(out, { recursive: true });
const B = { old: process.env.OLD, new: process.env.NEW };
const PAGES = (process.env.PAGES || '/,/intake,/intake?system=uidai,/citizens,/audit,/portals,/portals?system=eprisons,/sync,/sync?system=uidai,/integration').split(',');
const SIZES = (process.env.SIZES || '1440x900,1024x768,390x844').split(',').map((s) => s.split('x').map(Number));
const TOL = Number(process.env.TOLERANCE || 0.003);
const browser = await chromium.launch();
let failed = 0;
for (const url of PAGES) {
  for (const [w, h] of SIZES) {
    const shots = {};
    for (const label of ['old', 'new']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(B[label] + url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      shots[label] = await page.screenshot({ fullPage: true });
      await ctx.close();
    }
    const a = PNG.sync.read(shots.old), b = PNG.sync.read(shots.new);
    const tag = (url.replace(/[^a-z0-9]+/gi, '_') || 'root') + '-' + w;
    for (const k of ['old', 'new']) fs.writeFileSync(path.join(out, `${tag}.${k}.png`), shots[k]);
    if (a.width !== b.width || a.height !== b.height) { failed++; console.log(`FAIL ${tag.padEnd(34)} size old ${a.width}x${a.height} new ${b.width}x${b.height}`); continue; }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    fs.writeFileSync(path.join(out, `${tag}.diff.png`), PNG.sync.write(diff));
    const ratio = n / (a.width * a.height), ok = ratio <= TOL; if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(34)} ${(ratio * 100).toFixed(3)}% (${n} px)`);
  }
}
await browser.close(); process.exit(failed ? 1 : 0);
