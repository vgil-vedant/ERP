'use strict';

/**
 * Office skins: a department whose office should look like its own portal,
 * not like the generic officer workspace. A skin is a stylesheet
 * (frontend/shared/department-office/office-<skin>.css, scoped to
 * body.of-skin-<skin>) plus the markup of the pages that need more than CSS.
 *
 * Only the sign-in page is built here; the workspace is drawn in the browser
 * by office.js, which reads `skin` from its boot data.
 */

const BANNER = '<div class="u-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong> '
  + '<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>';

function uidaiLogin({ dept, site, theme, error, username, esc, vars }) {
  const logo = `/original-assets/${esc(theme.logo)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in · ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<link rel="stylesheet" href="/office/assets/office-uidai.css">
<style>:root{${vars}}</style>
</head>
<body class="of-skin-uidai u-login-page">
<a class="u-skip" href="#main">Skip to main content</a>
${BANNER}
<div class="u-top"><div class="u-shell u-top-in">
  <span>Officer workspace</span>
  <div class="u-top-tools"><a href="/en">Back to the portal</a><a class="u-top-pill" href="/account/login">Citizen sign-in</a></div>
</div></div>
<div class="u-brand"><div class="u-shell u-brand-in">
  <a href="/en" aria-label="${esc(theme.tagline)}: home"><img src="${logo}" alt="${esc(site.name)}" width="525" height="64"></a>
</div></div>
<main id="main" class="u-shell u-login">
  <section class="u-login-intro">
    <p class="u-kicker">Officer workspace</p>
    <h2>${esc(dept.title)}</h2>
    <p class="u-lead">${esc(theme.tagline)}</p>
    <ul class="u-checks">
      <li>Record and update the department’s cases</li>
      <li>Every change reaches the ERP within seconds</li>
      <li>Separate sign-in, separate records, for this department only</li>
    </ul>
  </section>
  <section class="u-login-card" aria-labelledby="u-h">
    <h1 id="u-h">Sign in</h1>
    <p class="u-sub">${esc(site.name)} · department office</p>
    ${error ? `<div class="u-alert" role="alert">${esc(error)}</div>` : ''}
    <form method="post" action="/office/login" novalidate>
      <div class="u-field"><label for="u">User name</label>
        <input id="u" name="username" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}></div>
      <div class="u-field"><label for="p">Password</label>
        <input id="p" name="password" type="password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}></div>
      <button class="u-btn u-btn--primary u-btn--block" type="submit">Sign in</button>
    </form>
    <p class="u-foot">For officers of this department only. Citizens use the portal’s own <a href="/account/login">sign-in</a>.</p>
  </section>
</main>
<footer class="u-pagefoot"><div class="u-shell">Unofficial local demonstration of <code>uidai.gov.in</code> for development and testing. Placeholder details only — no real office is represented.</div></footer>
</body>
</html>`;
}

const ICON = {
  user: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};

function eforensicsLogin({ dept, site, theme, error, username, esc, vars }) {
  const logo = `/original-assets/${esc(theme.logo)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in \u00b7 ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<link rel="stylesheet" href="/office/assets/office-eforensics.css">
<style>:root{${vars}}</style>
</head>
<body class="of-skin-eforensics u-login-page">
<a class="u-skip" href="#main">Skip to main content</a>
${BANNER}
<header class="u-sitehead"><div class="u-shell u-sitehead-in">
  <a class="u-logo" href="/" aria-label="${esc(site.name)}: home"><img src="${logo}" alt="${esc(site.name)}"></a>
  <span class="u-demo">Local demo</span>
  <nav class="u-sitenav" aria-label="Portal"><a href="/">Home</a><a class="u-outline" href="/account/login">Citizen sign-in</a></nav>
</div></header>
<main id="main" class="u-stage">
  <section class="u-card" aria-labelledby="u-h">
    <h1 id="u-h">Officer sign-in</h1>
    <p class="u-sub">${esc(dept.title)} \u00b7 ${esc(theme.tagline)}</p>
    ${error ? `<div class="u-alert" role="alert">${esc(error)}</div>` : ''}
    <form method="post" action="/office/login" novalidate>
      <label class="u-sr" for="u">User name</label>
      <div class="u-row"><span class="u-row-icon">${ICON.user}</span>
        <input id="u" name="username" placeholder="User name" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}></div>
      <label class="u-sr" for="p">Password</label>
      <div class="u-row"><span class="u-row-icon">${ICON.lock}</span>
        <input id="p" name="password" type="password" placeholder="Password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}></div>
      <button class="u-submit" type="submit">Sign in</button>
    </form>
    <a class="u-link" href="/account/login">Citizen? Use the portal\u2019s own sign-in</a>
    <p class="u-note">For officers of this department only. Separate sign-in, separate records. Every change reaches the ERP within seconds.</p>
  </section>
</main>
<footer class="u-pagefoot"><div class="u-shell">Unofficial local demonstration of <code>eforensics.gov.in</code> for development and testing. Placeholder details only \u2014 no real laboratory is represented.</div></footer>
</body>
</html>`;
}

function ecourtsLogin({ dept, site, theme, error, username, esc, vars }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in \u00b7 ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<link rel="stylesheet" href="/office/assets/office-ecourts.css">
<style>:root{${vars}}</style>
</head>
<body class="of-skin-ecourts u-login-page">
<a class="u-skip" href="#main">Skip to main content</a>
${BANNER}
<div class="u-top"><div class="u-shell u-top-in">
  <span class="u-top-label">ecourts.gov.in \u00b7 officer workspace</span>
  <div class="u-top-tools"><a href="/">Back to the portal</a><a class="u-top-btn" href="/account/login">Citizen sign-in</a></div>
</div></div>
<header class="of-top"><div class="u-shell u-brand-in">
  <a class="of-top-logo" href="/" aria-label="${esc(site.name)}: home"><img src="${esc(theme.logoUrl)}" alt="${esc(site.name)}"></a>
  <div class="of-top-title"><b>${esc(dept.title)}</b><span>Officer workspace \u00b7 ${esc(theme.tagline)}</span></div>
</div></header>
<div class="u-navbar"><div class="u-shell"><nav class="of-nav" aria-label="Portal"><a href="/">Home</a><a href="/office/login" aria-current="page" class="is-active">Officer sign-in</a></nav></div></div>
<div class="u-hero"><div class="u-shell u-hero-in">
  <p class="u-crumbs"><a href="/">Home</a> / Officer sign-in</p>
  <h1 id="u-h">Officer sign-in</h1>
</div></div>
<main id="main" class="u-shell u-login">
  <section class="u-card" aria-labelledby="u-h">
    <h2 class="u-card-head">${esc(dept.title)} \u00b7 department office</h2>
    <div class="u-card-body">
      ${error ? `<div class="u-alert" role="alert">${esc(error)}</div>` : ''}
      <form method="post" action="/office/login" novalidate>
        <div class="u-field"><label for="u">User name</label>
          <input id="u" name="username" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}></div>
        <div class="u-field"><label for="p">Password</label>
          <input id="p" name="password" type="password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}></div>
        <button class="u-btn u-btn--primary u-btn--block" type="submit">Sign in</button>
      </form>
      <p class="u-foot">For officers of this department only. Separate sign-in, separate records; every change reaches the ERP within seconds. Citizens use the portal\u2019s own <a href="/account/login">sign-in</a>.</p>
    </div>
  </section>
</main>
<footer class="u-pagefoot"><div class="u-shell">Unofficial local demonstration of <code>ecourts.gov.in</code> for development and testing. Placeholder details only \u2014 no real court is represented.</div></footer>
</body>
</html>`;
}

function eprisonsLogin({ dept, site, theme, error, username, esc, vars }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in \u00b7 ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<link rel="stylesheet" href="/office/assets/office-eprisons.css">
<style>:root{${vars}}</style>
</head>
<body class="of-skin-eprisons u-login-page">
<a class="u-skip" href="#main">Skip to main content</a>
${BANNER}
<div class="u-top"><div class="u-shell u-top-in">
  <span class="u-top-label"></span>
  <div class="u-top-tools"><a class="u-pill" href="/"><i></i>Back to the portal</a><a class="u-pill" href="/account/login"><i></i>Citizen sign-in</a></div>
</div></div>
<header class="of-top"><div class="u-shell u-brand-in">
  <a class="of-top-logo" href="/" aria-label="${esc(site.name)}: home"><img src="${esc(theme.logoUrl)}" alt="${esc(site.name)}"></a>
  <div class="of-top-title"><b>${esc(dept.title)}</b><span>Officer workspace</span></div>
</div></header>
<main id="main" class="u-shell u-login">
  <h1 class="u-h1" id="u-h">Officer sign-in</h1>
  <section class="u-card" aria-labelledby="u-h">
    <h2 class="u-card-head">${esc(dept.title)}</h2>
    <div class="u-card-body">
      ${error ? `<div class="u-alert" role="alert">${esc(error)}</div>` : ''}
      <form method="post" action="/office/login" novalidate>
        <div class="u-field"><label for="u">User name</label>
          <input id="u" name="username" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}></div>
        <div class="u-field"><label for="p">Password</label>
          <input id="p" name="password" type="password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}></div>
        <div class="u-actions"><button class="u-btn u-btn--primary" type="submit">Sign in</button></div>
      </form>
      <p class="u-foot">For officers of this department only. Separate sign-in, separate records; every change reaches the ERP within seconds. Citizens use the portal\u2019s own <a href="/account/login">sign-in</a>.</p>
    </div>
  </section>
</main>
<footer class="u-pagefoot"><div class="u-shell">Unofficial local demonstration of <code>eprisons.nic.in</code> for development and testing. Placeholder details only \u2014 no real prison is represented.</div></footer>
</body>
</html>`;
}

function cctnsLogin({ dept, site, theme, error, username, esc, vars }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in \u00b7 ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<link rel="stylesheet" href="/office/assets/office-cctns.css">
<style>:root{${vars}}</style>
</head>
<body class="of-skin-cctns u-login-page">
<a class="u-skip" href="#main">Skip to main content</a>
${BANNER}
<main id="main" class="u-stage">
  <div class="u-wrap">
    <section class="u-brandpanel" aria-labelledby="u-title">
      <img class="u-mark" src="${esc(theme.logoUrl)}" alt="Demonstration mark, not an official emblem" width="104" height="121">
      <h1 id="u-title">\u0938\u0940\u0938\u0940\u091f\u0940\u090f\u0928\u090f\u0938 / CCTNS</h1>
      <p class="u-sub">${esc(theme.tagline)}</p>
      <h2>${esc(dept.title)}</h2>
      <ul class="u-points">
        <li>Record and update the department\u2019s cases</li>
        <li>Every change reaches the ERP within seconds</li>
        <li>Separate sign-in, separate records, for this department only</li>
      </ul>
    </section>
    <section class="u-panel" aria-labelledby="u-h">
      <p class="u-kicker">Officer workspace</p>
      <h2 id="u-h">Sign in</h2>
      <p class="u-panel-sub">${esc(site.name)} \u00b7 department office</p>
      ${error ? `<div class="u-alert" role="alert">${esc(error)}</div>` : ''}
      <form method="post" action="/office/login" novalidate>
        <div class="u-field"><label for="u">User name</label>
          <input id="u" name="username" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}></div>
        <div class="u-field"><label for="p">Password</label>
          <input id="p" name="password" type="password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}></div>
        <button class="u-btn u-btn--primary u-btn--block" type="submit">Sign in</button>
      </form>
      <p class="u-foot">For officers of this department only. Citizens use the portal\u2019s own <a href="/login.htm">citizen login</a> or <a href="/account/login">sign-in</a>. <a href="/">Back to the portal</a>.</p>
    </section>
  </div>
</main>
<footer class="u-pagefoot"><div class="u-shell">Unofficial local demonstration of <code>digitalpolicecitizenservices.gov.in</code> for development and testing. Placeholder details only \u2014 no real office is represented.</div></footer>
</body>
</html>`;
}

const LOGIN = { uidai: uidaiLogin, eforensics: eforensicsLogin, ecourts: ecourtsLogin, eprisons: eprisonsLogin, cctns: cctnsLogin };

function loginPage(skin, ctx) { return LOGIN[skin](ctx); }

module.exports = { loginPage };
