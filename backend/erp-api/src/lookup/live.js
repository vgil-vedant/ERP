'use strict';

/**
 * Live updates for open lookup pages: GET /api/lookup/stream (Server-Sent Events).
 *
 * Every record a department delivers is announced to every open page within
 * milliseconds, so an officer saving an FIR on the CCTNS portal and an ERP user
 * looking at the same person see it together. A heartbeat every 25 seconds keeps
 * proxies from closing an idle stream; the browser reconnects on its own.
 */

const clients = new Set();
const MAX_CLIENTS = 200;
let seq = 0;

function publish(event) {
  seq += 1;
  const frame = `id: ${seq}\nevent: record\ndata: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try { res.write(frame); } catch { clients.delete(res); }
  }
}

function stream(req, res) {
  if (clients.size >= MAX_CLIENTS) return res.status(503).json({ error: 'Too many open live streams.' });
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n: connected\n\n');
  clients.add(res);
  const beat = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch { /* closed */ } }, 25000);
  beat.unref();
  req.on('close', () => { clearInterval(beat); clients.delete(res); });
}

module.exports = { publish, stream, count: () => clients.size };
