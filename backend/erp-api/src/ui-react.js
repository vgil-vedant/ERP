'use strict';
/**
 * Draws the console pages with the React build (frontend/web/dist); UI_ENGINE=ejs draws them with EJS as before.
 * If the build is missing the EJS page is used, so switching the variable on can never leave a page blank.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');

const DIST = path.join(__dirname, '..', '..', '..', 'frontend', 'web', 'dist');
const BASE = '/account/ui/app';
const enabled = () => process.env.UI_ENGINE !== 'ejs' && fs.existsSync(path.join(DIST, 'console.js'));

function mountAssets(app) { app.use(BASE, express.static(DIST, { maxAge: '5m', index: false })); }

// JSON in a <script> block: "<" is escaped so the data can never close the tag.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Drop-in for res.render(view, locals) on the console pages. */
function render(res, view, locals) {
  if (!enabled()) return res.render(view, locals);
  const boot = { ...locals, page: view, currentPath: res.locals.currentPath, systems: res.locals.systems };
  return res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(locals.title)}</title>
<link rel="stylesheet" href="${BASE}/console.css">
<script type="module" src="${BASE}/console.js"></script>
</head>
<body>
<div id="root"></div>
<script type="application/json" id="boot">${json(boot)}</script>
</body>
</html>`);
}

module.exports = { enabled, mountAssets, render };
