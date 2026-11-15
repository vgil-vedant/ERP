// A portal replica: EJS-rendered page vs React-rendered page for every route in its site.json, plus error states.
//   env: OLD NEW (base URLs)  SITE (path to site.json)  SIZES  ONLY (comma list of route prefixes)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(path.resolve('../../backend/tools/package.json'));
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');
const out = process.argv[2] || './vd-out'; fs.mkdirSync(out, { recursive: true });
const B = { old: process.env.OLD, new: process.env.NEW };
const site = JSON.parse(fs.readFileSync(process.env.SITE, 'utf8'));
const SIZES = (process.env.SIZES || '1440x900,390x844').split(',').map((s) => s.split('x').map(Number));
const TOL = Number(process.env.TOLERANCE || 0.003);
const LIMIT = Number(process.env.LIMIT || 0);
let routes = site.pages.map((p) => p.route).concat(['/__about', '/__gaps', '/no/such/page'], (site.errorRoutes || []).map((e) => e.route));
if (process.env.ONLY) routes = routes.filter((r) => process.env.ONLY.split(',').some((x) => r.startsWith(x)));
if (LIMIT) routes = routes.filter((_, i) => i % Math.ceil(routes.length / LIMIT) === 0);
const norm = (h) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/> </g, '><').replace(/ \/>/g, '>').trim();
const browser = await chromium.launch();
let failed = 0, n = 0;
async function shot(label, url, w, h, post) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  if (post) {
    const resp = await ctx.request.post(B[label] + url, { form: post });
    await page.setContent(await resp.text(), { waitUntil: 'load' });   // the error page as the server returned it
  } else await page.goto(B[label] + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  const buf = await page.screenshot({ fullPage: true });
  await ctx.close(); return buf;
}
for (const url of routes) {
  for (const [w, h] of SIZES) {
    n++;
    const a = await shot('old', url, w, h), b = await shot('new', url, w, h);
    const A = PNG.sync.read(a), Bp = PNG.sync.read(b), tag = (url.replace(/[^a-z0-9]+/gi, '_') || 'root') + '-' + w;
    if (A.width !== Bp.width || A.height !== Bp.height) { failed++; fs.writeFileSync(path.join(out, tag + '.old.png'), a); fs.writeFileSync(path.join(out, tag + '.new.png'), b); console.log(`FAIL ${tag.padEnd(46)} size old ${A.width}x${A.height} new ${Bp.width}x${Bp.height}`); continue; }
    const diff = new PNG({ width: A.width, height: A.height });
    const px = pixelmatch(A.data, Bp.data, diff.data, A.width, A.height, { threshold: 0.1 });
    const ratio = px / (A.width * A.height), ok = ratio <= TOL;
    if (!ok) { failed++; fs.writeFileSync(path.join(out, tag + '.old.png'), a); fs.writeFileSync(path.join(out, tag + '.new.png'), b); fs.writeFileSync(path.join(out, tag + '.diff.png'), PNG.sync.write(diff)); }
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(46)} ${(ratio * 100).toFixed(3)}% (${px} px)`);
  }
}
console.log(`${n - failed}/${n} identical`); await browser.close(); process.exit(failed ? 1 : 0);
