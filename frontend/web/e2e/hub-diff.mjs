// ERP Hub dashboard: EJS-era page vs React page. /api/dashboard is replayed from one snapshot so both draw identical data.
//   env: OLD_HUB NEW_HUB (base URLs), HUB_USER, HUB_PASS (kept out of the repo), SNAPSHOT (path to a captured /api/dashboard JSON)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');
const out = process.argv[2] || './vd-out'; fs.mkdirSync(out, { recursive: true });
const BASES = { old: process.env.OLD_HUB, new: process.env.NEW_HUB };
const snapshot = fs.readFileSync(process.env.SNAPSHOT, 'utf8');
const TOL = Number(process.env.TOLERANCE || 0.003);
const VIEWS = ['dashboard', 'overview', 'intake', 'citizens', 'audit', 'portals', 'sync', 'integration', 'submissions', 'database', 'health', 'docs'];
const SIZES = (process.env.SIZES || '1440x900,1024x768,390x844').split(',').map((s) => s.split('x').map(Number));
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const browser = await chromium.launch();
let failed = 0;
for (const view of VIEWS) {
  if (ONLY && !ONLY.includes(view)) continue;
  for (const [w, h] of SIZES) {
    const shots = {};
    for (const label of ['old', 'new']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', extraHTTPHeaders: { Authorization: 'Basic ' + Buffer.from(process.env.HUB_USER + ':' + process.env.HUB_PASS).toString('base64') } });   // the hub redirects pages to /login, so credentials must be sent up front
      const page = await ctx.newPage();
      await page.route('**/api/dashboard', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: snapshot }));
      await page.goto(BASES[label] + '/#' + view, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      shots[label] = await page.screenshot({ fullPage: true });
      await ctx.close();
    }
    const a = PNG.sync.read(shots.old), b = PNG.sync.read(shots.new);
    const tag = `${view}-${w}`;
    for (const k of ['old', 'new']) fs.writeFileSync(path.join(out, `${tag}.${k}.png`), shots[k]);
    if (a.width !== b.width || a.height !== b.height) { failed++; console.log(`FAIL ${tag.padEnd(22)} size old ${a.width}x${a.height} new ${b.width}x${b.height}`); continue; }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    fs.writeFileSync(path.join(out, `${tag}.diff.png`), PNG.sync.write(diff));
    const ratio = n / (a.width * a.height), ok = ratio <= TOL; if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(22)} ${(ratio * 100).toFixed(3)}% (${n} px)`);
  }
}
await browser.close(); process.exit(failed ? 1 : 0);
