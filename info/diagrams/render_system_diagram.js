// Renders system-architecture.svg to a sharp PNG.  node info/diagrams/render_system_diagram.js
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'backend', 'tools', 'node_modules', 'playwright'));
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'system-architecture.svg'), 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2400, height: 1590 }, deviceScaleFactor: 1.5 });
  await p.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'system-architecture.png'), clip: { x: 0, y: 0, width: 2400, height: 1590 } });
  await b.close();
  console.log('wrote', path.join(__dirname, 'system-architecture.png'));
})();
