'use strict';
/**
 * Lets the portal replicas draw their pages with React (server-side) instead of EJS.
 *
 * It is the default. UI_ENGINE=ejs turns it off; so does a missing bundle (frontend/web/dist-ssr), and a view that has not been
 * converted falls back too: the original EJS template then renders exactly as before. The replicas call app.render() as always: this only
 * replaces the engine behind it, so no route changes.
 */
const path = require('path');

const BUNDLE = path.join(__dirname, '..', '..', 'frontend', 'web', 'dist-ssr', 'portals.cjs');
let mod; // undefined = not tried yet, false = unavailable

function ssr() {
  if (process.env.UI_ENGINE === 'ejs') return null;
  if (mod === undefined) { try { mod = require(BUNDLE); } catch (_) { mod = false; } }
  return mod || null;
}

/** @param app an Express app whose views are frontend/portals/<portal>/views  @param ejs that app's ejs module  @param express that app's express module */
function install(app, ejs, express) {
  // the browser bundle that hydrates the pages (unused when UI_ENGINE=ejs)
  if (express && express.static) app.use('/account/ui/app', express.static(path.join(__dirname, '..', '..', 'frontend', 'web', 'dist'), { maxAge: '5m', index: false }));
  app.engine('ejs', (file, options, cb) => {
    const m = file.replace(/\\/g, '/').match(/\/frontend\/portals\/([^/]+)\/views\/(.+)\.ejs$/);
    const s = m && ssr();
    if (s && s.has(m[1], m[2])) {
      let html;
      try { html = s.render(m[1], m[2], options); } catch (err) { return cb(err); }
      return cb(null, html);
    }
    return ejs.__express(file, options, cb);
  });
}

module.exports = { install, enabled: () => !!ssr() };
