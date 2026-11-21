'use strict';

/**
 * Who may call the ERP.
 *
 * The ERP used to answer anyone who could reach its port. Now every request needs one of:
 *
 *   - the service token       X-ERP-Service-Token: <ERP_API_TOKEN>        the hub and the portals (server to server)
 *   - the administrator       HTTP Basic, the same account as the hub     a person at the ERP console
 *
 * Two doors stay open on purpose:
 *
 *   - POST /api/ingest/events   the departments' deliveries; each one is signed (HMAC, lookup/ingest.js)
 *   - GET  /api/summary         from this machine only (127.0.0.1): the container's own health check
 *
 * Failed attempts are counted per address; eight in ten minutes and that address waits.
 * The actor written to the audit trail is the signed-in administrator, or - only for a service-token call -
 * the name the hub says it is acting for. A browser or script cannot choose it.
 */

const sec = require('../../shared/security');
const admin = require('../../shared/admin-account');

const TOKEN = sec.requireOrExit(() => sec.secret('ERP_API_TOKEN'));
const guesses = sec.limiter({ max: 8, windowMs: 10 * 60 * 1000 });
const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

const cleanActor = (v) => String(v || '').replace(/[^\w:@.-]/g, '').slice(0, 60);

function middleware(req, res, next) {
  if (req.method === 'POST' && req.path === '/api/ingest/events') return next();
  if (req.method === 'GET' && req.path === '/api/summary' && isLoopback(req)) return next();

  const ip = req.ip;
  if (guesses.blocked(ip)) return deny(req, res, 429, 'Too many failed attempts. Wait ten minutes and try again.');

  const presented = req.get('X-ERP-Service-Token');
  if (presented) {
    if (sec.safeEqual(presented, TOKEN)) {
      req.erpActor = cleanActor(req.get('X-ERP-Actor')) || 'service';
      return next();
    }
    guesses.hit(ip);
    return deny(req, res, 401, 'The service token is not valid.');
  }

  const b = admin.basicCredentials(req);
  if (b) {
    if (admin.verify(b.user.slice(0, 200), b.pass.slice(0, 1024))) {
      req.erpActor = `console:${cleanActor(b.user) || 'admin'}`;
      return next();
    }
    guesses.hit(ip);
  }
  return deny(req, res, 401, 'Sign in required.');
}

function deny(req, res, status, message) {
  res.set('Cache-Control', 'no-store');
  if (status === 401 && !req.path.startsWith('/api/')) {
    // a person opening the console: let the browser ask for the administrator's credentials
    res.set('WWW-Authenticate', 'Basic realm="ERP console", charset="UTF-8"');
  }
  return res.status(status).json({ error: message });
}

module.exports = { middleware, headerName: 'X-ERP-Service-Token' };
