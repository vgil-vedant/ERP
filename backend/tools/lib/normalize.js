'use strict';

const dns = require('dns').promises;
const { limits, caBundle, userAgent } = require('./config');
const { execFile } = require('child_process');

/**
 * Stage: validate and normalize the single user input (spec section 2).
 * The only required input is a domain or URL.
 */

class InputError extends Error {
  constructor(message, correction) {
    super(message);
    this.name = 'InputError';
    this.correction = correction;
  }
}

/** Turn whatever the user typed into a candidate URL list, https first. */
function candidateUrls(raw) {
  if (typeof raw !== 'string') {
    throw new InputError('No domain supplied.', 'Pass a domain, e.g. eprisons.nic.in');
  }
  let s = raw.trim();
  if (!s) {
    throw new InputError('Empty domain supplied.', 'Pass a domain, e.g. eprisons.nic.in');
  }
  // Strip wrapping quotes and a trailing comma a user may paste in.
  s = s.replace(/^['"<]+/, '').replace(/['">,]+$/, '');

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    let u;
    try {
      u = new URL(s);
    } catch {
      throw new InputError(`Not a parseable URL: ${raw}`, 'Check for typos in the scheme or host.');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new InputError(
        `Unsupported scheme "${u.protocol}".`,
        'Use http:// or https://, or pass the bare hostname.'
      );
    }
    return [u.href];
  }

  // Bare hostname (possibly with a path). https first, http only as fallback.
  if (!/^[a-z0-9]/i.test(s)) {
    throw new InputError(`Not a valid hostname: ${raw}`, 'A hostname must start with a letter or digit.');
  }
  return [`https://${s}`, `http://${s}`];
}

function validateHostname(host) {
  if (!host) throw new InputError('The input has no hostname.', 'Pass a domain, e.g. eprisons.nic.in');
  if (host.length > 253) throw new InputError('Hostname is longer than 253 characters.');
  // Reject anything that is clearly not a public DNS name.
  if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.)/i.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    throw new InputError(
      `"${host}" is a local or private address.`,
      'This pipeline targets public websites only.'
    );
  }
  const labels = host.split('.');
  if (labels.length < 2) {
    throw new InputError(
      `"${host}" is not a fully qualified domain name.`,
      'Include the full domain, e.g. eprisons.nic.in'
    );
  }
  for (const l of labels) {
    if (!l || l.length > 63 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(l)) {
      throw new InputError(`"${host}" contains an invalid DNS label ("${l}").`);
    }
  }
  return host.toLowerCase();
}

/** Filesystem-safe directory name for a hostname (spec section 4). */
function normalizedHostname(host) {
  return host.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function curl(args) {
  return new Promise((resolve) => {
    execFile('curl', args, { timeout: limits.navTimeoutMs + 5000, maxBuffer: 1 << 24 },
      (err, stdout, stderr) => resolve({ err, stdout: stdout || '', stderr: stderr || '' }));
  });
}

/** Fetch one hop without following it, so each Location can be inspected. */
async function fetchHop(url) {
  const res = await curl([
    '-sS', '-o', '/dev/null',
    '--cacert', caBundle,
    '-A', userAgent,
    '--max-time', String(Math.round(limits.navTimeoutMs / 1000)),
    '--max-redirs', '0',
    '-w', '%{http_code}\n',
    '-D', '-',
    url,
  ]);
  if (res.err && !res.stdout) {
    return { ok: false, error: (res.stderr || res.err.message).trim().split('\n')[0] };
  }
  let location = null;
  for (const line of res.stdout.split(/\r?\n/)) {
    const m = /^location:\s*(.+)$/i.exec(line.trim());
    if (m) location = m[1].trim();
  }
  const statusLine = res.stdout.trim().split(/\r?\n/).pop() || '';
  const status = Number((/(\d{3})/.exec(statusLine) || [])[1]);
  return { ok: true, status, location };
}

/**
 * Resolve the redirect chain one hop at a time, with full certificate
 * verification, using the project CA bundle (see certs/README.md).
 *
 * Following hops by hand rather than with `curl -L` buys two things. A
 * misconfigured server can emit a Location that resolves to a hostname which
 * does not exist -- `digitalpolicecitizenservices.gov.in` has an HTTPS-upgrade
 * rewrite that drops a slash, yielding `...gov.incentercitizen/`. With `-L`
 * that surfaces only as "could not resolve host", naming a host nobody wrote
 * and giving no clue which hop produced it. Stepping manually lets us name the
 * exact hop, keep the defect in the report, and still carry on from the last
 * URL that did respond.
 */
async function resolveChain(startUrl) {
  const chain = [];
  const problems = [];
  let current = startUrl;
  let lastGood = null;
  let lastStatus = null;

  for (let hop = 0; hop < 10; hop++) {
    const res = await fetchHop(current);
    if (!res.ok) {
      // This hop's URL could not be fetched at all.
      if (lastGood) {
        problems.push({
          hop, url: current, error: res.error,
          note: 'This URL came from the previous hop\'s Location header and could not be fetched.',
        });
        return {
          ok: true, status: lastStatus, finalUrl: lastGood, redirects: chain,
          problems, recovered: true,
        };
      }
      return { ok: false, error: res.error, problems };
    }

    lastStatus = res.status;

    if (res.status >= 300 && res.status < 400 && res.location) {
      let next;
      try {
        next = new URL(res.location, current).href;
      } catch {
        problems.push({ hop, url: current, location: res.location, error: 'Location is not a valid URL' });
        return { ok: true, status: res.status, finalUrl: current, redirects: chain, problems, recovered: true };
      }
      // Refuse an https -> http downgrade on the same host. Sending a request
      // back over plaintext is worse than the redirect is worth, and on this
      // target it is also what walks into the broken rewrite: the plain-HTTP
      // vhost is the one that emits the malformed upgrade. Re-requesting the
      // same path over https skips the bad hop entirely.
      let downgradeBlocked = null;
      try {
        const cur = new URL(current);
        const nxt = new URL(next);
        if (cur.protocol === 'https:' && nxt.protocol === 'http:' &&
            nxt.hostname.toLowerCase() === cur.hostname.toLowerCase()) {
          nxt.protocol = 'https:';
          downgradeBlocked = { from: next, to: nxt.href };
          next = nxt.href;
        }
      } catch { /* keep next as it is */ }
      if (downgradeBlocked) {
        problems.push({
          hop, url: current, location: res.location,
          error: 'the server redirected from https to plain http on the same host',
          note: `Downgrade refused: the request continued over https (${downgradeBlocked.to}).`,
          kind: 'protocol-downgrade',
        });
      }

      chain.push(next);

      // Does the host in that Location actually exist?
      const nextHost = new URL(next).hostname;
      try {
        await dns.lookup(nextHost);
      } catch (e) {
        problems.push({
          hop,
          url: current,
          location: res.location,
          resolvedTo: next,
          error: `the host "${nextHost}" does not resolve (${e.code || e.message})`,
          note:
            'The server sent a redirect to a hostname that does not exist. This is a ' +
            'misconfiguration on the target, not a problem with the input. The last URL ' +
            'that did respond is used instead.',
        });
        return {
          ok: true, status: lastStatus, finalUrl: current, redirects: chain,
          problems, recovered: true, brokenRedirect: true,
        };
      }

      lastGood = current;
      current = next;
      continue;
    }

    // Not a redirect: this is the end of the chain.
    return { ok: true, status: res.status, finalUrl: current, redirects: chain, problems };
  }

  return {
    ok: true, status: lastStatus, finalUrl: current, redirects: chain,
    problems: problems.concat([{ error: 'more than 10 redirects; stopped following' }]),
    recovered: true,
  };
}

/**
 * Full stage: normalize -> validate -> DNS -> redirect resolution.
 */
async function normalizeInput(raw) {
  const candidates = candidateUrls(raw);
  const attempts = [];

  for (const candidate of candidates) {
    const u = new URL(candidate);
    const host = validateHostname(u.hostname);

    try {
      await dns.lookup(host);
    } catch (e) {
      attempts.push({ url: candidate, stage: 'dns', error: e.code || e.message });
      // DNS failure is host-level: no point trying the http:// variant.
      throw new InputError(
        `Cannot resolve hostname "${host}" (${e.code || e.message}).`,
        'Check the spelling of the domain and that this machine has DNS access.'
      );
    }

    const chain = await resolveChain(candidate);
    if (!chain.ok) {
      attempts.push({ url: candidate, stage: 'http', error: chain.error });
      continue; // try the next candidate (https -> http)
    }

    const finalUrl = new URL(chain.finalUrl);
    const effectiveHost = validateHostname(finalUrl.hostname);

    return {
      input: raw,
      initialUrl: candidate,
      finalUrl: chain.finalUrl,
      status: chain.status,
      redirects: chain.redirects,
      hostname: effectiveHost,
      initialHostname: host,
      normalizedHostname: normalizedHostname(effectiveHost),
      scheme: finalUrl.protocol.replace(':', ''),
      attempts,
      redirectProblems: chain.problems || [],
      recoveredFromBrokenRedirect: !!chain.recovered,
      brokenRedirect: !!chain.brokenRedirect,
    };
  }

  throw new InputError(
    `Could not reach "${raw}" over https or http. Last errors: ` +
      attempts.map((a) => `${a.url} -> ${a.error}`).join('; '),
    'Confirm the site is online and reachable from this machine.'
  );
}

module.exports = { normalizeInput, normalizedHostname, validateHostname, candidateUrls, InputError };
