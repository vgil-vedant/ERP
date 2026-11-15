'use strict';

/**
 * The public edge: the Caddy reverse proxy in deploy/edge that publishes the hub
 * and the five portals on the server's public address (5011, 5012, ...).
 *
 * Behind it, two things differ from a direct visit:
 *
 *   - the socket peer is the proxy, so the visitor's own address is the one in
 *     X-Forwarded-For (it matters for the sign-in rate limits, keyed by req.ip);
 *   - the visitor uses the PUBLIC ports. A link to another portal built from the
 *     internal port (:4173) points at a port that is closed from outside, so it
 *     has to use the public one instead. The proxy sends the mapping in
 *     X-ERP-Public-Ports ("4100=5011,4177=5012,...").
 *
 * Both are believed only when the request really came from the edge container,
 * found by its name on the Docker network (ERP_EDGE_HOST, default "erp_edge").
 * Anyone reaching a port directly cannot set them: their links and their req.ip
 * stay exactly as before. Outside Docker the name does not resolve and nothing
 * changes at all. ERP_EDGE_HOST=off turns the whole thing off.
 */

const dns = require('dns');

const EDGE_HOST = (process.env.ERP_EDGE_HOST || 'erp_edge').trim();
const DISABLED = !EDGE_HOST || EDGE_HOST === 'off';
const REFRESH_MS = 15000;
const MIN_RETRY_MS = 2000;
const HEADER = 'x-erp-public-ports';

let edgeAddrs = new Set();
let lastLookup = 0;

/** Re-resolves the edge container's address (it changes when the container is recreated). */
function refresh() {
  if (DISABLED) return;
  lastLookup = Date.now();
  dns.lookup(EDGE_HOST, { all: true }, (err, addrs) => {
    if (err) { edgeAddrs = new Set(); return; }
    const next = new Set();
    for (const a of addrs) {
      next.add(a.address);
      if (a.family === 4) next.add(`::ffff:${a.address}`);
    }
    edgeAddrs = next;
  });
}

if (!DISABLED) {
  refresh();
  setInterval(refresh, REFRESH_MS).unref();
}

/** True when this socket address is the edge proxy. */
function isEdgeAddr(addr) {
  if (DISABLED || !addr) return false;
  if (edgeAddrs.has(addr)) return true;
  // An unknown peer may be a freshly recreated edge: look again soon, never on every request.
  if (Date.now() - lastLookup > MIN_RETRY_MS) refresh();
  return false;
}

const isEdge = (req) => isEdgeAddr(req.socket && req.socket.remoteAddress);

/** For app.set('trust proxy', ...): X-Forwarded-* is believed from the edge only. */
const trustProxy = (addr) => isEdgeAddr(addr);

const validPort = (n) => Number.isInteger(n) && n > 0 && n < 65536;

/**
 * The internal -> public port map the edge sent, or null (not via the edge, or a
 * malformed header - in which case every link keeps its internal port).
 */
function portMap(req) {
  if (!isEdge(req)) return null;
  const raw = String(req.headers[HEADER] || '');
  if (!raw || raw.length > 512) return null;
  const map = new Map();
  for (const pair of raw.split(',')) {
    const m = /^\s*(\d{1,5})\s*=\s*(\d{1,5})\s*$/.exec(pair);
    if (!m) return null;
    const from = Number(m[1]), to = Number(m[2]);
    if (!validPort(from) || !validPort(to)) return null;
    map.set(from, to);
  }
  return map.size ? map : null;
}

/** The map as a plain object for the browser ({ "4177": 5012, ... }), or null. */
function publicPorts(req) {
  const map = portMap(req);
  return map ? Object.fromEntries(map) : null;
}

/**
 * Returns port -> "http://<host the visitor used>:<port the visitor can reach>".
 * Through the edge the port is the public one and the scheme is the visitor's;
 * a direct visit gets exactly what it got before (http, internal port).
 */
function originFor(req) {
  const map = portMap(req);
  const fwdProto = map ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() : '';
  const proto = fwdProto === 'https' ? 'https' : 'http';
  const host = req.hostname || '127.0.0.1';
  return (port) => `${proto}://${host}:${(map && map.get(Number(port))) || port}`;
}

module.exports = { isEdge, trustProxy, portMap, publicPorts, originFor, HEADER };
