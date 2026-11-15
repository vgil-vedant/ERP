/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
// Every view of the cctns portal as a React function of the template locals (rendered on the server).
import { Fragment } from 'react';
import { S, A, rawHtml } from '../../shared/css';

// display names for the captured navigation entries (the capture's own labels were page titles)
const navLabel = (i) => i.href === '/' ? 'Home' : i.href === '/feedback.htm' ? 'Feedback' : i.href === '/login.htm' ? 'Citizen Login' : i.label;

// include(name, data): the old templates' partial-with-data call
const inc = (L, rel, data) => {
  const key = String(rel).replace(/^(?:\.\.\/|\.\/)*(?:partials\/)?/, '').replace(/\.ejs$/, '');
  const fn = PARTIALS[key];
  if (!fn) throw new Error('no partial ' + rel);
  return fn(Object.assign({}, L, data));
};

export function V_custom_login_htm(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<link rel="stylesheet" href="/static/css/custom.css" />
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main" className="cl"><div className="shell">{(() => { const ek = Object.keys(errors || {});; const f = (page.forms && page.forms[0]) ? page.forms[0] : null;; const LABEL = { username: 'Username', password: 'Password', firstname: 'First name', answercentercitizen: 'Answer' };; return (<>
<div className="cl-wrap"><section className="cl-brand" aria-labelledby="cl-title"><img className="cl-mark" src="/static/img/cctns-mark.svg" alt="Demonstration mark, not an official emblem" width="112" height="131" />
<h1 id="cl-title">सीसीटीएनएस / CCTNS</h1>
<p className="cl-sub">अपराध एवं अपराधी ट्रैकिंग नेटवर्क एवं सिस्टम<br />Crime and Criminal Tracking Network & Systems</p>
<h2>स्वागतम / Welcome</h2>
<p className="cl-lead">Citizen Services under the Crime and Criminal Tracking Network & Systems.</p>
<p className="cl-lead">This is a local demonstration. Nothing entered here is sent to any government system.</p></section>
{' '}
<section className="cl-panel" aria-labelledby="cl-login"><h2 id="cl-login">नागरिक लॉगिन / Citizen Login</h2>
<p className="cl-panel__sub">Sign in with the demonstration account.</p>
{(ek.length) ? (<><div className="notice notice--error" role="alert"><strong>{`Please correct ${(ek.length) ?? ''} field${(ek.length === 1 ? '' : 's') ?? ''}.`}</strong>
{' '}
<ul>{(ek).map(function (k, __k) { return (<Fragment key={__k}><li>{`${(errors[k]) ?? ''}`}</li></Fragment>); })}</ul></div></>) : null}
{(submitted) ? (<><div className="notice notice--ok" role="status"><strong>Recorded locally.</strong>
{' '}Reference{' '}
<span className="ref-no">{`${(submitted.reference) ?? ''}`}</span>
.</div></>) : null}
{(f) ? (<><form className="cl-form" method="post" action={page.route} noValidate><input type="hidden" name="__form" value={f.id} />
{' '}
<input type="hidden" name="challenge_expected" value={challenge.expected} />
{(f.fields).map(function (x, __k) { return (<Fragment key={__k}><div className="field"><label htmlFor={x.name}>{`${(LABEL[x.name] || x.label) ?? ''}`}</label>
{' '}
<input type={x.inputType === 'password' ? 'password' : 'text'} id={x.name} name={x.name} {...A(x.maxLength ? 'maxlength=' + x.maxLength : '')} value={form[x.name] || ''} autoComplete="off" {...A(errors[x.name] ? 'aria-invalid="true"' : '')} />
{(errors[x.name]) ? (<><span className="field__error">{`${(errors[x.name]) ?? ''}`}</span></>) : null}</div></Fragment>); })}
<div className="cl-challenge"><div className="field"><label htmlFor="challenge_answer">{`Verification: ${(challenge.question) ?? ''}`}</label>
{' '}
<input type="text" id="challenge_answer" name="challenge_answer" maxLength={6} autoComplete="off" /></div></div>
{' '}
<div className="cl-actions"><button type="submit" className="btn btn--primary">Login (local only)</button>
{' '}
<a className="btn btn--secondary" href="/">View Proclaimed Offenders</a></div>
{' '}
<p className="cl-hint">The original protects this form with a CAPTCHA. This demonstration asks an arithmetic question instead; no CAPTCHA was reproduced, solved or bypassed.</p></form></>) : null}</section></div>
{' '}
<div className="cl-notes"><section className="cl-note" aria-labelledby="cl-notice"><h3 id="cl-notice">सूचना / NOTICE</h3>
<p>This is an unofficial local demonstration of a citizen-services portal, built for development and testing. It is not operated by, or affiliated with, any government body.</p>
<p>Do not send payments, postal orders, documents or personal data to any address because of this page. Everything shown here is synthetic.</p></section>
{' '}
<section className="cl-contact" aria-labelledby="cl-contact"><h3 id="cl-contact">Feedback &amp; Contact</h3>
<p>Use the feedback form to send a note to this local demonstration. No office, postal address or telephone number is published here, because none is represented.</p>
<div className="cl-links"><a href="/feedback.htm">Feedback</a>
<a href="/">Contact Us</a></div></section></div></>); })()}</div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_about(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">About this replica</h1>
{' '}
<div className="prose"><div className="panel"><p style={{"margin":"0"}}><strong>Unofficial local demonstration.</strong>
{' '}This is an independent reimplementation of the public pages of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
, for authorized development, testing and educational use. It is not affiliated with, endorsed by, or operated by any government body, and it holds no real data.</p></div>
{' '}
<h3>What was analysed</h3>
{' '}
<ul><li>Target:{' '}
<code>{`${(site.finalUrl) ?? ''}`}</code></li>
{' '}
<li>Category:{' '}
<code>{`${(site.category) ?? ''}`}</code>
{` (${(site.categoryStatus) ?? ''}, ${(site.categoryConfidence) ?? ''} confidence)`}</li>
{' '}
<li>{`${(site.pagesCaptured) ?? ''} page(s) captured on ${(site.analysedOn) ?? ''}`}</li>
{' '}
<li>{`${(site.formCount) ?? ''} form(s), ${(site.fieldCount) ?? ''} functional field(s)`}</li>
{' '}
<li>{`${(site.assetCount) ?? ''} asset(s) downloaded`}</li></ul>
{' '}
<h3>How it was built</h3>
{' '}
<ul><li>Only publicly accessible pages were retrieved, by following the site's own links.</li>
{' '}
<li><strong>No form was submitted to the original.</strong>
{' '}No account was created, no CAPTCHA was solved or bypassed, no authentication was attempted.</li>
{' '}
<li>No endpoint was enumerated, fuzzed or probed. No credential, session token or cookie was recorded.</li>
{' '}
<li>Requests were made one at a time with a delay, so the original was never loaded.</li>
{' '}
<li>TLS certificate verification was enabled for every request.</li></ul>
{' '}
<h3>What it does not reproduce</h3>
{' '}
<p>See{' '}
<a href="/__gaps">what is not reproduced</a>
{' '}for the full, deliberate record.</p>
{' '}
<h3>Data handling</h3>
{' '}
<p>Anything typed into these forms is written to a local SQLite file and nowhere else. There is no access control and no encryption at rest.{' '}
<strong>Do not enter anyone's real personal data.</strong></p></div></section></div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_error(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">Something went wrong</h1>
{' '}
<div className="prose"><p>The local demonstration hit an error while rendering this page.</p>
{' '}
<div className="panel"><p style={{"margin":"0"}}><code>{`${(message) ?? ''}`}</code></p></div>
{' '}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_gaps(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">What this replica does not reproduce</h1>
{' '}
<div className="prose"><p>This page is generated from{' '}
<code>analysis/replication_gaps.json</code>
. It is the deliberate record of what was not accessible or not reproduced — nothing here is papered over elsewhere in the project.</p></div>
{' '}
<div className="table-wrap"><table className="data"><caption>{`${(gapTotal) ?? ''} item(s) across ${(Object.keys(gapCounts).length) ?? ''} categories.`}</caption>
<thead><tr><th scope="col">Kind</th>
<th scope="col" className="num">Count</th>
<th scope="col">What it means</th></tr></thead>
<tbody>{(Object.keys(gapCounts)).map(function (k, __k) { return (<Fragment key={__k}><tr><th scope="row"><code>{`${(k) ?? ''}`}</code></th>
<td className="num">{`${(gapCounts[k]) ?? ''}`}</td>
<td>{`${(gapMeanings[k] || '—') ?? ''}`}</td></tr></Fragment>); })}</tbody></table></div>
{' '}
<div className="prose"><h3>Always out of scope</h3>
{' '}
<ul><li>Anything behind a login. Authenticated areas were never accessed.</li>
{' '}
<li>Anything behind a CAPTCHA. None was reproduced, solved or bypassed; this demonstration asks a simple arithmetic question instead.</li>
{' '}
<li>The original's database, source code and server behaviour, none of which a public frontend exposes.</li>
{' '}
<li>The original's success, validation and error states: no form was ever submitted to it, so those were never observed and are not guessed at.</li></ul></div></section></div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_generic(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main" className={page.centred ? 'centred-stage' : ''}><div className={page.centred ? '' : 'shell'}><section className={page.centred ? '' : 'section'}>{(() => { const ek = Object.keys(errors || {});; return (<>{(!pageTitle) ? (<><h1 className="section__title">{`${(page.heading || title) ?? ''}`}</h1></>) : null}
{(submitted) ? (<><div className="notice notice--ok" role="status"><strong>Recorded in the local demonstration.</strong>
{' '}Your demonstration reference is{' '}
<span className="ref-no">{`${(submitted.reference) ?? ''}`}</span>
. Nothing was sent to{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}or any government system.</div></>) : null}
{(ek.length) ? (<><div className="notice notice--error" role="alert"><strong>{`Please correct ${(ek.length) ?? ''} field${(ek.length === 1 ? '' : 's') ?? ''}.`}</strong>
{' '}
<ul>{(ek).map(function (k, __k) { return (<Fragment key={__k}><li>{`${(errors[k]) ?? ''}`}</li></Fragment>); })}</ul></div></>) : null}
{(page.structureNote) ? (<><div className="panel"><p style={{"margin":"0"}} dangerouslySetInnerHTML={{ __html: page.structureNote }} /></div></>) : null}
{((page.forms || [])).map(function (f, fi) { return (<Fragment key={fi}><form method="post" action={page.route} noValidate className="card"><input type="hidden" name="__form" value={f.id} />
{' '}
<input type="hidden" name="challenge_expected" value={challenge.expected} />
{' '}
<h2 className="card__head">{`${(f.heading) ?? ''}`}</h2>
{' '}
<div className="card__body"><div className="field-grid">{(f.fields).map(function (x, __k) { return (<Fragment key={__k}><div className={`field ${x.wide ? 'field--wide' : ''} ${x.type === 'checkbox' ? 'field--check' : ''}`}>{(x.type === 'checkbox') ? (<><input type="checkbox" id={x.name} name={x.name} value="1" {...A(form[x.name] ? 'checked' : '')} />
{' '}
<label htmlFor={x.name}>{`${(x.label) ?? ''}`}</label></>) : (<><label htmlFor={x.name}>{`${(x.label) ?? ''}`}
{(x.required) ? (<>{' '}
<span className="req">*</span></>) : null}</label>
{(x.type === 'select') ? (<><select id={x.name} name={x.name} {...A(x.required ? 'required' : '')} {...A(x.cascadeTarget ? 'data-cascade-source data-cascade-target="' + x.cascadeTarget + '" data-cascade-endpoint="' + x.cascadeEndpoint + '"' : '')} {...A(x.cascadeChild ? 'data-selected="' + (form[x.name] || '') + '" disabled' : '')} {...A(errors[x.name] ? 'aria-invalid="true"' : '')}><option value="">SELECT</option>
{((x.options || [])).map(function (o, __k) { return (<Fragment key={__k}><option value={o.value} {...A(String(form[x.name]) === String(o.value) ? 'selected' : '')}>{`${(o.label) ?? ''}`}</option></Fragment>); })}</select></>) : (x.type === 'textarea') ? (<><textarea id={x.name} name={x.name} {...A(x.maxLength ? 'maxlength=' + x.maxLength + ' data-counter' : '')} {...A(x.required ? 'required' : '')} {...A(errors[x.name] ? 'aria-invalid="true"' : '')} defaultValue={form[x.name] || ''} /></>) : (<><input type={x.inputType} id={x.name} name={x.name} {...A(x.maxLength ? 'maxlength=' + x.maxLength + ' data-counter' : '')} {...A(x.pattern ? 'pattern="' + x.pattern + '"' : '')} {...A(x.required ? 'required' : '')} value={form[x.name] || ''} {...A(errors[x.name] ? 'aria-invalid="true"' : '')} /></>)}
{(x.maxLength) ? (<><span className="field__hint" id={`${x.name}_count`}></span></>) : null}
{(x.hint) ? (<><span className="field__hint">{`${(x.hint) ?? ''}`}</span></>) : null}</>)}
{(errors[x.name]) ? (<><span className="field__error">{`${(errors[x.name]) ?? ''}`}</span></>) : null}</div></Fragment>); })}
<div className="field"><label htmlFor={`challenge_answer_${fi}`}>{`${(challenge.question) ?? ''} `}
<span className="req">*</span></label>
{' '}
<input type="text" id={`challenge_answer_${fi}`} name="challenge_answer" maxLength={6} required autoComplete="off" {...A(errors.challenge_answer ? 'aria-invalid="true"' : '')} />
{(errors.challenge_answer) ? (<><span className="field__error">{`${(errors.challenge_answer) ?? ''}`}</span></>) : null}</div></div>
{' '}
<div className="actions"><button type="submit" className="btn btn--primary">{`${(f.submitLabel) ?? ''} (local only)`}</button>
{' '}
<a className="btn btn--secondary" href={page.route}>Reset</a></div>
{(f.captchaNote) ? (<><p className="field__hint" style={{"marginTop":"10px"}}>{`${(f.captchaNote) ?? ''}`}</p></>) : null}</div></form></Fragment>); })}
{((tables || [])).map(function (t, __k) { return (<Fragment key={__k}><h2 className="section__title" style={{"fontSize":"18px"}}>{`${(t.heading) ?? ''}`}</h2>
{' '}
<div className="table-wrap"><table className="data"><caption>{`${(t.caption) ?? ''}`}</caption>
<thead><tr>{(t.columns).map(function (c, __k) { return (<Fragment key={__k}><th scope="col">{`${(c) ?? ''}`}</th></Fragment>); })}</tr></thead>
<tbody>{(!t.rows.length) ? (<><tr><td colSpan={t.columns.length}>No records.</td></tr></>) : null}
{(t.rows).map(function (r, __k) { return (<Fragment key={__k}><tr>{(r).map(function (c, __k) { return (<Fragment key={__k}><td>{`${(c) ?? ''}`}</td></Fragment>); })}</tr></Fragment>); })}</tbody></table></div></Fragment>); })}
{(page.sections && page.sections.length) ? (<><p className="field__hint">The original's section and heading structure, reproduced so the layout matches. Its body text is not copied: this replica does not republish government prose.</p>
{(page.sections).map(function (sec, __k) { return (<Fragment key={__k}><section className="outline-section">{(sec.heading) ? (<><h2 className="section__title">{`${(sec.heading) ?? ''}`}</h2></>) : null}
{(sec.cards.length) ? (<><div className={`card-grid card-grid--${Math.min(sec.cards.length, 4)}`}>{(sec.cards).map(function (c, __k) { return (<Fragment key={__k}><div className="mini-card"><span className="mini-card__mark" aria-hidden="true"></span>
{' '}
<h3 className="mini-card__title">{`${(c.title) ?? ''}`}</h3>
{(c.detail) ? (<><p className="mini-card__detail">{`${(c.detail) ?? ''}`}</p></>) : null}</div></Fragment>); })}</div></>) : null}</section></Fragment>); })}</>) : null}
{(page.noContentNote) ? (<><div className="panel"><p style={{"margin":"0"}} dangerouslySetInnerHTML={{ __html: page.noContentNote }} /></div></>) : null}</>); })()}</section></div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_not_found(L) {
  const { __boot, challenge, currentPath, errors, form, gapCounts, gapMeanings, gapTotal, isCustomView, message, nav, note, officeButton, page, pageTitle, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head>{(() => { const _v = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; return (<><meta charSet="utf-8" />
{' '}
<meta name="viewport" content="width=device-width, initial-scale=1" />
{' '}
<title>{`${title} | Local Demo Replica`}</title>
{' '}
<meta name="robots" content="noindex, nofollow" />
{' '}
<meta name="description" content="Unofficial local demonstration replica. Not an official government service." />
{' '}
<link rel="icon" href="/static/img/demo-mark.svg" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" />
{' '}
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/gov.css" />
{(_v && _v.pageBg) ? (<><style dangerouslySetInnerHTML={{ __html: `
    /* Measured from this page on the original: the colour covering the most
       area (${_v.pageBgShare} of measured background area). */
    :root { --page-bg: ${_v.pageBg};
            ${(_v.onDark) ? `--body-text:#f2f5f7; --muted:#aebac1;
            --rule:rgba(255,255,255,.22); --panel-bg:rgba(255,255,255,.08);
            --surface:rgba(255,255,255,.10);` : ''}
            ${(_v.headerBg) ? `--header-bg: ${_v.headerBg};` : ''} }
  ` }} /></>) : null}</>); })()}</head>
{' '}
<body>{(() => { const _hv = (typeof page !== 'undefined' && page && page.visual) ? page.visual : null;; const _custom = (typeof isCustomView !== 'undefined') && isCustomView;; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
{' '}
<header className="gh"><div className="gh-util"><div className="shell gh-util__in"><span className="gh-util__tag">Crime and Criminal Tracking Network & Systems · Citizen Services</span>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="office-login" href="/office/login">Office login</a></>) : <span></span>}</div></div>
{' '}
<div className="gh-brand"><div className="shell gh-brand__in"><a className="gh-logo" href="/"><img src="/static/img/cctns-mark.svg" alt="" width="45" height="52" />
<span className="gh-logo__t"><b>सीसीटीएनएस / CCTNS</b>
<small>Citizen Services · Local demonstration</small></span></a>
{' '}
<button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span className="nav-toggle__bar" aria-hidden="true"></span>
<span className="sr-only">Menu</span></button></div></div>
{' '}
<div className="gh-nav"><div className="shell"><nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(nav).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></nav></div></div></header>
{(typeof pageTitle !== 'undefined' && pageTitle) ? (<><div className="page-title-bar"><div className="page-title-bar__inner">{`${(pageTitle === ':::CCTNS:::' ? 'CCTNS Citizen Services' : pageTitle) ?? ''}`}</div></div></>) : null}
{(!_custom && _hv && _hv.heroBg && _hv.heroHeight >= 140) ? (<><section className={`hero-band ${_hv.onDark ? 'hero-band--dark' : 'hero-band--light'}`} style={S(`background: ${_hv.heroBg}; min-height: ${_hv.heroHeight}px`)}><div className="hero-band__inner"><p className="hero-band__lede">{`${((page.outline && page.outline[0]) ? page.outline[0].text : page.heading) ?? ''}`}</p>
{' '}
<p className="hero-band__sub">The original shows an illustrated hero here. Its artwork is government material and is not redistributed, so the replica reproduces the band and its measured height only.</p></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">404 — Not found</h1>
{' '}
<div className="prose"><p>No page in this local demonstration matches that address.</p>
{(typeof note !== 'undefined' && note) ? (<><div className="panel"><p style={{"margin":"0"}}>{`${(note) ?? ''}`}</p></div></>) : null}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
{' '}
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">IN THIS DEMONSTRATION</h2>
{' '}
<ul className="footer-links">{(nav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${navLabel(item)}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">ABOUT THIS REPLICA</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><p style={{"fontSize":"12px","margin":"0"}}><strong>Served from:</strong>
<br />
127.0.0.1 (local demo)</p></div></div>
{' '}
<div className="site-footer__bar"><div className="shell site-footer__bar-inner"><p>Unofficial local demonstration for development and testing.</p>
{' '}
<ul className="footer-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li></ul>
{' '}
<p className="footer-note">Replica of a public portal. Not affiliated with, endorsed by, or operated by any government agency.</p></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

const PARTIALS = {
};

export const localNames = ['__boot', 'challenge', 'currentPath', 'errors', 'form', 'gapCounts', 'gapMeanings', 'gapTotal', 'isCustomView', 'message', 'nav', 'note', 'officeButton', 'page', 'pageTitle', 'site', 'submitted', 'tables', 'title'];

// plain scripts a view needs in the browser (ePrisons); loaded after the page is hydrated
export const scripts = {};

export const views = {
  'custom/login_htm': V_custom_login_htm,
  'pages/about': V_pages_about,
  'pages/error': V_pages_error,
  'pages/gaps': V_pages_gaps,
  'pages/generic': V_pages_generic,
  'pages/not-found': V_pages_not_found,
};
