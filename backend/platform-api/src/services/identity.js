'use strict';

/**
 * The one registration, mounted on every portal.
 *
 * A citizen registers once, on whichever portal they happen to be on, and that
 * account then works on all of them - because every portal is this process
 * reading the same person table.
 *
 * The session cookie is set on 127.0.0.1 without a port, and browsers scope
 * cookies by host and NOT by port. So signing in on :4177 is already signed in
 * on :4173. That is a genuine property of the demo, not a trick: all five
 * portals really are one origin as far as the session is concerned.
 */

const express = require('express');
const store = require('../db');
const erp = require('./erp-client');

const COOKIE = 'gov_demo_session';

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Puts res.locals.currentUser on every request, or null. */
function sessionMiddleware(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  const person = store.personForToken(token);
  req.sessionToken = token || null;
  req.person = person;
  res.locals.currentUser = store.personPublic(person);
  next();
}

function setCookie(res, token, hours = 12) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${hours * 3600}`);
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateRegistration(body) {
  const errors = {};
  const fullName = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const mobile = String(body.mobile || '').trim();
  const password = String(body.password || '');

  if (!fullName) errors.full_name = 'Full name is required.';
  else if (fullName.length > 80) errors.full_name = 'Full name must be 80 characters or fewer.';

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That does not look like an email address.';

  if (mobile && !/^\d{10}$/.test(mobile)) errors.mobile = 'Mobile must be 10 digits, or left blank.';

  if (!password) errors.password = 'Choose a password.';
  else if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (password !== String(body.confirm_password || '')) {
    errors.confirm_password = 'The two passwords do not match.';
  }

  return { value: { fullName, email, mobile, password }, errors };
}

/**
 * Build the identity routes for one portal.
 *
 * Every portal gets the same routes against the same table. `site` only
 * decides which portal is recorded as the one the citizen registered through.
 */
function identityRouter(site) {
  const r = express.Router();

  const common = (req) => ({
    site,
    portals: store.q.sites.all(),
    erpTarget: erp.target(),
    next: typeof req.query.next === 'string' && req.query.next.startsWith('/')
      ? req.query.next : null,
  });

  r.get('/account/register', (req, res) => {
    res.render('platform/register', {
      title: `Register — ${site.name}`, pageTitle: 'Register once, use every portal',
      ...common(req), form: {}, errors: {}, fatal: null,
    });
  });

  r.post('/account/register', async (req, res) => {
    const { value, errors } = validateRegistration(req.body || {});
    if (store.findPersonByEmail(value.email)) {
      errors.email = 'That email is already registered. Sign in instead — one account covers every portal.';
    }
    if (Object.keys(errors).length) {
      return res.status(400).render('platform/register', {
        title: `Register — ${site.name}`, pageTitle: 'Register once, use every portal',
        ...common(req), form: req.body, errors, fatal: null,
      });
    }

    // Phase one: create locally.
    const person = store.createPerson(value, site.code);
    const pub = store.personPublic(person);

    // Phase two: mirror into the ERP. If the ERP will not take it, the local
    // row goes back out, so the two databases never disagree.
    const sync = await erp.sendRegistration(pub, site.code);
    if (!sync.ok) {
      store.removePerson(person.id);
      store.recordSyncAttempt('person', pub.personRef, 'failed', sync.status, null, sync.message);
      store.audit(site.code, 'person', person.id, 'ROLLBACK', 'portal:' + site.code, null,
        `registration ${pub.personRef} rolled back: the ERP did not accept it (${sync.message})`);
      return res.status(503).render('platform/register', {
        title: `Register — ${site.name}`, pageTitle: 'Register once, use every portal',
        ...common(req), form: req.body, errors: {},
        fatal: `Registration was not completed. The ERP backend did not accept it: ${sync.message}. ` +
          `Nothing was saved on either side. Start the ERP (cd backend/erp-api && npm start) and try again.`,
      });
    }

    store.confirmPersonErp(person.id, sync.citizenRef || pub.personRef);
    store.recordSyncAttempt('person', pub.personRef, 'synced', sync.status, sync.erpRef, null);
    store.audit(site.code, 'person', person.id, 'CREATE', 'portal:' + site.code, null,
      `registered as ${pub.personRef} on ${site.code}, mirrored to the ERP as ${sync.erpRef}`);

    setCookie(res, store.createSession(person.id, site.code));
    res.redirect(common(req).next || '/account?registered=1');
  });

  r.get('/account/login', (req, res) => {
    res.render('platform/login', {
      title: `Sign in — ${site.name}`, pageTitle: 'Sign in',
      ...common(req), form: {}, errors: {},
    });
  });

  r.post('/account/login', (req, res) => {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    const password = String((req.body || {}).password || '');
    const person = store.findPersonByEmail(email);
    if (!person || !store.verifyPassword(person, password)) {
      return res.status(401).render('platform/login', {
        title: `Sign in — ${site.name}`, pageTitle: 'Sign in',
        ...common(req), form: { email },
        errors: { email: 'No account matches that email and password.' },
      });
    }
    store.audit(site.code, 'session', person.id, 'LOGIN', 'portal:' + site.code, null,
      `${person.person_ref} signed in on ${site.code}`);
    setCookie(res, store.createSession(person.id, site.code));
    res.redirect(common(req).next || '/account');
  });

  r.post('/account/logout', (req, res) => {
    if (req.person) {
      store.audit(site.code, 'session', req.person.id, 'LOGOUT', 'portal:' + site.code, null,
        `${req.person.person_ref} signed out on ${site.code}`);
    }
    store.endSession(req.sessionToken);
    clearCookie(res);
    res.redirect('/');
  });

  r.get('/account', (req, res) => {
    if (!req.person) return res.redirect('/account/login?next=/account');
    res.render('platform/account', {
      title: `My account — ${site.name}`, pageTitle: 'My account',
      ...common(req),
      person: store.personPublic(req.person),
      submissions: store.submissionsForPerson(req.person.id),
      justRegistered: req.query.registered === '1',
    });
  });

  return r;
}

module.exports = { identityRouter, sessionMiddleware, COOKIE, parseCookies, validateRegistration };
