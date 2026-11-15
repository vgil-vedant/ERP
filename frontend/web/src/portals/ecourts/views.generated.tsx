/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
// Every view of the ecourts portal as a React function of the template locals (rendered on the server).
import { Fragment } from 'react';
import { S, A, rawHtml } from '../../shared/css';

// include(name, data): the old templates' partial-with-data call
const inc = (L, rel, data) => {
  const key = String(rel).replace(/^(?:\.\.\/|\.\/)*(?:partials\/)?/, '').replace(/\.ejs$/, '');
  const fn = PARTIALS[key];
  if (!fn) throw new Error('no partial ' + rel);
  return fn(Object.assign({}, L, data));
};

export function P_home_sections(L) {
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, scales, site, submitted, tables, title } = L;
  /* The home page's Services, Statistics and References sections. Titles, destinations, labels and file sizes come from
   page.home (captured from the original home page); the statistic values come from this page's own outline. */
var ICONS = {
  scales: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0Z"/><path d="m19 7-3 7a3 3 0 0 0 6 0Z"/><path d="M8 21h8"/>',
  court: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/>',
  rupee: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-5"/><path d="M13 17V8"/><path d="M18 17v-9"/>',
  filepen: '<path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/>',
  filesearch: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="m13.3 16.3 2.2 2.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  hourglass: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>'
};
var _svg = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; };
var _home = page.home;
// statistic values, in order, from the outline entries under the "Statistics" heading
var _vals = [], _inStats = false;
(page.outline || []).forEach(function (o) {
  if (o.level === 2) { _inStats = /^Statistics$/i.test(o.text); return; }
  if (_inStats) _vals.push(o.text);
});;
  return (
    <>
<div className="home-sections"><section className="hs hs--stats" aria-labelledby="hs-stats-h"><div className="hs__wrap"><h2 className="hs__title" id="hs-stats-h">Statistics</h2>
{' '}
<div className="stats">{(_home.login) ? (<><div className="stats__login"><p className="stats__login-label">{`${(_home.login.label) ?? ''}`}</p>
{' '}
<span className="stats__login-btn" aria-disabled="true" title="Signing in with JanParichay is not available in this local demonstration"><img src={_home.login.logo} alt="Jan Parichay logo" width="150" height="40" /></span></div></>) : null}
<ul className="stats__grid">{(_home.statisticsLabels).map(function (s, i) { return (<Fragment key={i}><li className="stat"><span className="stat__icon" dangerouslySetInnerHTML={{ __html: _svg(s.icon) }} />
{' '}
<span className="stat__body"><strong className="stat__value">{`${(_vals[i] != null ? _vals[i] : '—') ?? ''}`}</strong>
{' '}
<span className="stat__label">{`${(s.label) ?? ''}`}</span></span></li></Fragment>); })}</ul></div></div></section>
{' '}
<section className="hs hs--services" aria-labelledby="hs-services-h"><div className="hs__wrap"><h2 className="hs__title" id="hs-services-h">Services</h2>
{' '}
<ul className="svc-grid">{(_home.services).map(function (s, i) { var tone = ((i % 4) + Math.floor(i / 4)) % 2 === 0 ? 'a' : 'b';; return (<Fragment key={i}><li className={`svc svc--${tone}`}>{(s.route) ? (<><a className="svc__link" href={s.route} title={s.text}><span className="svc__icon" dangerouslySetInnerHTML={{ __html: _svg(s.icon) }} />
{' '}
<span className="svc__name">{`${(s.title) ?? ''}`}</span>
{' '}
<span className="sr-only">{`${(s.text) ?? ''}`}</span></a></>) : (<><div className="svc__link is-off" title={`${s.text} (no page for this service in the demonstration)`}><span className="svc__icon" dangerouslySetInnerHTML={{ __html: _svg(s.icon) }} />
{' '}
<span className="svc__name">{`${(s.title) ?? ''}`}</span>
{' '}
<span className="sr-only">{`${(s.text) ?? ''}. No page for this service in the demonstration.`}</span></div></>)}</li></Fragment>); })}</ul></div></section>
{' '}
<section className="hs hs--refs" aria-labelledby="hs-refs-h"><div className="hs__wrap"><h2 className="hs__title" id="hs-refs-h">References</h2>
{' '}
<ul className="ref-grid">{(_home.references).map(function (r, __k) { return (<Fragment key={__k}><li className="ref"><div className="ref__head"><span className="ref__badge"><img src="/static/img/pdf-icon.png" alt="" width="40" height="40" /></span></div>
{' '}
<div className="ref__body"><h3 className="ref__title">{`${(r.title) ?? ''}`}</h3>
{' '}
<p className="ref__size">{`${(r.size) ?? ''}`}</p></div>
{(r.file) ? (<><a className="ref__download" href={r.file} download aria-label={`Download ${r.title} (PDF, ${r.size})`}>{rawHtml(_svg('download'))}
<span>Download</span></a></>) : (<><span className="ref__download is-off" aria-disabled="true" title="This document is not included in the local demonstration">{rawHtml(_svg('download'))}
<span>Not included</span></span></>)}</li></Fragment>); })}</ul></div></section></div>
    </>
  );
}

export function V_pages_about(L) {
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, s, scales, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head><meta charSet="utf-8" />
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
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" /></head>
{' '}
<body>{(() => { /* Navigation labels: the captured page titles are long ("Case Status - eCourt India Services"), so the bar shows
   the part before " - eCourt India ...". The routes are unchanged. */
var _used = {};
var _navItems = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _used[label] = (_used[label] || 0) + 1;
  if (_used[label] > 1) label += ' (' + _used[label] + ')';
  return { href: item.href, label: label };
});
var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _isHero = !!(_pg && (_pg.route === '/' || _pg.route === '/ecourtindia_v6'));
var _clean = function (t) {
  return String(t || '').replace(/^Homepage\s*\|\s*/i, '').replace(/^Home\s*-\s*/i, '').replace(/\s*[-:|]\s*eCourts?\b.*$/i, '').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _lv1 ? _lv1.text : (_clean(_pg.heading || title) || (_pg.heading || title));
}
var _quick = _navItems.filter(function (n) { return ['/ecourtindia_v6/v12', '/ecourtindia_v6/v13', '/ecourtindia_v6/v14'].indexOf(n.href) >= 0; });; var _fu = {};
var _fnav = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _fu[label] = (_fu[label] || 0) + 1;
  if (_fu[label] > 1) label += ' (' + _fu[label] + ')';
  return { href: item.href, label: label };
});; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="utility-bar"><div className="shell utility-bar__inner"><div className="utility-bar__id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 12 4l9 6"></path>
<path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"></path></svg>
{' '}
<span>{`${(site.hostname) ?? ''} · local demonstration replica`}</span></div>
{' '}
<ul className="utility-bar__links"><li><a href="#main">Skip to main content</a></li>
{' '}
<li><a href="/ecourtindia_v6/v28">Screen Reader Access</a></li>
{' '}
<li><a href="/ecourtindia_v6/v23">Sitemap</a></li>
{' '}
<li><a href="/ecourtindia_v6/v11">Contact Us</a></li>
{' '}
<li className="text-size" role="group" aria-label="Text size"><button type="button" data-text-size="small" aria-label="Smaller text">A-</button>
{' '}
<button type="button" data-text-size="normal" aria-label="Normal text" aria-pressed="true">A</button>
{' '}
<button type="button" data-text-size="large" aria-label="Larger text">A+</button></li>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><li>{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="btn btn--primary office-login" href="/office/login">Office login</a></>) : null}</li></>) : null}</ul></div></div>
{' '}
<div className="branding"><div className="shell branding__inner"><a className="brand" href="/" aria-label="eCourts Single Sign-On, High Courts of India, District and Taluka Courts of India: home"><img src="/static/img/ecourts-sso-logo.png" alt="Emblem of India. eCourts Single Sign-On. High Courts of India. District and Taluka Courts of India." width="369" height="115" /></a>
{' '}
<div className="branding__logos"><img className="branding__seal" src="/static/img/ecourts-seal.png" alt="eCourts India seal" width="240" height="240" />
{' '}
<img className="branding__digital" src="/static/img/digital-india.png" alt="Digital India: Power To Empower" width="127" height="86" /></div></div></div>
{' '}
<div className="primary-nav-bar"><div className="shell primary-nav-bar__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(() => { var _more = _navItems.slice(7);; return (<>{(_navItems.slice(0, 7)).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}
{(_more.length) ? ((() => { var _moreActive = _more.some(function (m) { return m.href === currentPath; });; return <><li className="primary-nav__more"><button className="primary-nav__link primary-nav__toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more" {...A(_moreActive ? 'aria-current="page"' : '')}>More{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<ul className="primary-nav__sub" id="nav-more" hidden>{(_more).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__sublink" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></li></>; })()) : null}</>); })()}</ul></nav></div></div></header>
{(_isHero) ? (<><section className="hero" aria-roledescription="carousel" aria-label="Highlights"><div className="hero__viewport" id="heroViewport">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><div className={`hero__slide${i === 0 ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`Slide ${n} of 5`}><img src={`/static/img/hero-${n}.webp`} alt="" width="1600" height="500" {...A(i === 0 ? '' : 'loading="lazy"')} /></div></Fragment>); })}
<div className="hero__scrim"></div>
{' '}
<div className="hero__content"><div className="shell"><div className="hero__text"><h1 className="hero__title">{`${(_pg.route === '/' ? 'eCourts Single Sign-On' : (_clean(_pg.heading || title) || title)) ?? ''}`}</h1>
{' '}
<p className="hero__lede">{`${(_pg.route === '/' ? 'High Courts of India and District and Taluka Courts of India' : (((_pg.outline || [])[0] || {}).text || '')) ?? ''}`}</p>
{(_quick.length) ? (<><div className="hero__actions">{(_quick).map(function (q, qi) { return (<Fragment key={qi}><a className={`btn ${qi === 0 ? 'btn--primary' : 'btn--secondary'}`} href={q.href}>{`${(q.label) ?? ''}`}</a></Fragment>); })}</div></>) : null}</div></div></div>
{' '}
<button className="hero__arrow hero__arrow--prev" type="button" data-hero="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="hero__arrow hero__arrow--next" type="button" data-hero="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
{' '}
<div className="hero__bar"><button className="hero__pause" type="button" data-hero="pause" aria-pressed="false" aria-label="Pause slideshow"><svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect>
<rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
{' '}
<svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
{' '}
<div className="hero__dots" role="group" aria-label="Choose a slide">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><button type="button" data-hero-dot={i} aria-label={`Slide ${n}`} {...A(i === 0 ? 'aria-current="true"' : '')}></button></Fragment>); })}</div></div></div></section></>) : (typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="page-hero"><div className="shell page-hero__inner"><p className="page-hero__crumbs"><a href="/">Home</a>
{' '}›{' '}
<span>{`${(_h1) ?? ''}`}</span></p>
{' '}
<h1 className="page-hero__title">{`${(_h1) ?? ''}`}</h1></div></section></>) : null}
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
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">Useful links</h2>
{' '}
<ul className="footer-links">{(_fnav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">About this replica</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">Served from</h2>
{' '}
<address>{`${(typeof linkHost !== 'undefined' && linkHost ? linkHost : 'this local server') ?? ''}`}
<br />
(local demonstration)</address></div></div>
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
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, s, scales, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head><meta charSet="utf-8" />
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
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" /></head>
{' '}
<body>{(() => { /* Navigation labels: the captured page titles are long ("Case Status - eCourt India Services"), so the bar shows
   the part before " - eCourt India ...". The routes are unchanged. */
var _used = {};
var _navItems = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _used[label] = (_used[label] || 0) + 1;
  if (_used[label] > 1) label += ' (' + _used[label] + ')';
  return { href: item.href, label: label };
});
var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _isHero = !!(_pg && (_pg.route === '/' || _pg.route === '/ecourtindia_v6'));
var _clean = function (t) {
  return String(t || '').replace(/^Homepage\s*\|\s*/i, '').replace(/^Home\s*-\s*/i, '').replace(/\s*[-:|]\s*eCourts?\b.*$/i, '').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _lv1 ? _lv1.text : (_clean(_pg.heading || title) || (_pg.heading || title));
}
var _quick = _navItems.filter(function (n) { return ['/ecourtindia_v6/v12', '/ecourtindia_v6/v13', '/ecourtindia_v6/v14'].indexOf(n.href) >= 0; });; var _fu = {};
var _fnav = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _fu[label] = (_fu[label] || 0) + 1;
  if (_fu[label] > 1) label += ' (' + _fu[label] + ')';
  return { href: item.href, label: label };
});; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="utility-bar"><div className="shell utility-bar__inner"><div className="utility-bar__id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 12 4l9 6"></path>
<path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"></path></svg>
{' '}
<span>{`${(site.hostname) ?? ''} · local demonstration replica`}</span></div>
{' '}
<ul className="utility-bar__links"><li><a href="#main">Skip to main content</a></li>
{' '}
<li><a href="/ecourtindia_v6/v28">Screen Reader Access</a></li>
{' '}
<li><a href="/ecourtindia_v6/v23">Sitemap</a></li>
{' '}
<li><a href="/ecourtindia_v6/v11">Contact Us</a></li>
{' '}
<li className="text-size" role="group" aria-label="Text size"><button type="button" data-text-size="small" aria-label="Smaller text">A-</button>
{' '}
<button type="button" data-text-size="normal" aria-label="Normal text" aria-pressed="true">A</button>
{' '}
<button type="button" data-text-size="large" aria-label="Larger text">A+</button></li>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><li>{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="btn btn--primary office-login" href="/office/login">Office login</a></>) : null}</li></>) : null}</ul></div></div>
{' '}
<div className="branding"><div className="shell branding__inner"><a className="brand" href="/" aria-label="eCourts Single Sign-On, High Courts of India, District and Taluka Courts of India: home"><img src="/static/img/ecourts-sso-logo.png" alt="Emblem of India. eCourts Single Sign-On. High Courts of India. District and Taluka Courts of India." width="369" height="115" /></a>
{' '}
<div className="branding__logos"><img className="branding__seal" src="/static/img/ecourts-seal.png" alt="eCourts India seal" width="240" height="240" />
{' '}
<img className="branding__digital" src="/static/img/digital-india.png" alt="Digital India: Power To Empower" width="127" height="86" /></div></div></div>
{' '}
<div className="primary-nav-bar"><div className="shell primary-nav-bar__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(() => { var _more = _navItems.slice(7);; return (<>{(_navItems.slice(0, 7)).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}
{(_more.length) ? ((() => { var _moreActive = _more.some(function (m) { return m.href === currentPath; });; return <><li className="primary-nav__more"><button className="primary-nav__link primary-nav__toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more" {...A(_moreActive ? 'aria-current="page"' : '')}>More{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<ul className="primary-nav__sub" id="nav-more" hidden>{(_more).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__sublink" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></li></>; })()) : null}</>); })()}</ul></nav></div></div></header>
{(_isHero) ? (<><section className="hero" aria-roledescription="carousel" aria-label="Highlights"><div className="hero__viewport" id="heroViewport">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><div className={`hero__slide${i === 0 ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`Slide ${n} of 5`}><img src={`/static/img/hero-${n}.webp`} alt="" width="1600" height="500" {...A(i === 0 ? '' : 'loading="lazy"')} /></div></Fragment>); })}
<div className="hero__scrim"></div>
{' '}
<div className="hero__content"><div className="shell"><div className="hero__text"><h1 className="hero__title">{`${(_pg.route === '/' ? 'eCourts Single Sign-On' : (_clean(_pg.heading || title) || title)) ?? ''}`}</h1>
{' '}
<p className="hero__lede">{`${(_pg.route === '/' ? 'High Courts of India and District and Taluka Courts of India' : (((_pg.outline || [])[0] || {}).text || '')) ?? ''}`}</p>
{(_quick.length) ? (<><div className="hero__actions">{(_quick).map(function (q, qi) { return (<Fragment key={qi}><a className={`btn ${qi === 0 ? 'btn--primary' : 'btn--secondary'}`} href={q.href}>{`${(q.label) ?? ''}`}</a></Fragment>); })}</div></>) : null}</div></div></div>
{' '}
<button className="hero__arrow hero__arrow--prev" type="button" data-hero="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="hero__arrow hero__arrow--next" type="button" data-hero="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
{' '}
<div className="hero__bar"><button className="hero__pause" type="button" data-hero="pause" aria-pressed="false" aria-label="Pause slideshow"><svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect>
<rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
{' '}
<svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
{' '}
<div className="hero__dots" role="group" aria-label="Choose a slide">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><button type="button" data-hero-dot={i} aria-label={`Slide ${n}`} {...A(i === 0 ? 'aria-current="true"' : '')}></button></Fragment>); })}</div></div></div></section></>) : (typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="page-hero"><div className="shell page-hero__inner"><p className="page-hero__crumbs"><a href="/">Home</a>
{' '}›{' '}
<span>{`${(_h1) ?? ''}`}</span></p>
{' '}
<h1 className="page-hero__title">{`${(_h1) ?? ''}`}</h1></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">Something went wrong</h1>
{' '}
<div className="prose"><p>The local demonstration hit an error while rendering this page.</p>
{' '}
<div className="panel"><p style={{"margin":"0"}}><code>{`${(message) ?? ''}`}</code></p></div>
{' '}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">Useful links</h2>
{' '}
<ul className="footer-links">{(_fnav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">About this replica</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">Served from</h2>
{' '}
<address>{`${(typeof linkHost !== 'undefined' && linkHost ? linkHost : 'this local server') ?? ''}`}
<br />
(local demonstration)</address></div></div>
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
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, s, scales, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head><meta charSet="utf-8" />
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
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" /></head>
{' '}
<body>{(() => { /* Navigation labels: the captured page titles are long ("Case Status - eCourt India Services"), so the bar shows
   the part before " - eCourt India ...". The routes are unchanged. */
var _used = {};
var _navItems = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _used[label] = (_used[label] || 0) + 1;
  if (_used[label] > 1) label += ' (' + _used[label] + ')';
  return { href: item.href, label: label };
});
var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _isHero = !!(_pg && (_pg.route === '/' || _pg.route === '/ecourtindia_v6'));
var _clean = function (t) {
  return String(t || '').replace(/^Homepage\s*\|\s*/i, '').replace(/^Home\s*-\s*/i, '').replace(/\s*[-:|]\s*eCourts?\b.*$/i, '').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _lv1 ? _lv1.text : (_clean(_pg.heading || title) || (_pg.heading || title));
}
var _quick = _navItems.filter(function (n) { return ['/ecourtindia_v6/v12', '/ecourtindia_v6/v13', '/ecourtindia_v6/v14'].indexOf(n.href) >= 0; });; var _fu = {};
var _fnav = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _fu[label] = (_fu[label] || 0) + 1;
  if (_fu[label] > 1) label += ' (' + _fu[label] + ')';
  return { href: item.href, label: label };
});; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="utility-bar"><div className="shell utility-bar__inner"><div className="utility-bar__id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 12 4l9 6"></path>
<path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"></path></svg>
{' '}
<span>{`${(site.hostname) ?? ''} · local demonstration replica`}</span></div>
{' '}
<ul className="utility-bar__links"><li><a href="#main">Skip to main content</a></li>
{' '}
<li><a href="/ecourtindia_v6/v28">Screen Reader Access</a></li>
{' '}
<li><a href="/ecourtindia_v6/v23">Sitemap</a></li>
{' '}
<li><a href="/ecourtindia_v6/v11">Contact Us</a></li>
{' '}
<li className="text-size" role="group" aria-label="Text size"><button type="button" data-text-size="small" aria-label="Smaller text">A-</button>
{' '}
<button type="button" data-text-size="normal" aria-label="Normal text" aria-pressed="true">A</button>
{' '}
<button type="button" data-text-size="large" aria-label="Larger text">A+</button></li>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><li>{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="btn btn--primary office-login" href="/office/login">Office login</a></>) : null}</li></>) : null}</ul></div></div>
{' '}
<div className="branding"><div className="shell branding__inner"><a className="brand" href="/" aria-label="eCourts Single Sign-On, High Courts of India, District and Taluka Courts of India: home"><img src="/static/img/ecourts-sso-logo.png" alt="Emblem of India. eCourts Single Sign-On. High Courts of India. District and Taluka Courts of India." width="369" height="115" /></a>
{' '}
<div className="branding__logos"><img className="branding__seal" src="/static/img/ecourts-seal.png" alt="eCourts India seal" width="240" height="240" />
{' '}
<img className="branding__digital" src="/static/img/digital-india.png" alt="Digital India: Power To Empower" width="127" height="86" /></div></div></div>
{' '}
<div className="primary-nav-bar"><div className="shell primary-nav-bar__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(() => { var _more = _navItems.slice(7);; return (<>{(_navItems.slice(0, 7)).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}
{(_more.length) ? ((() => { var _moreActive = _more.some(function (m) { return m.href === currentPath; });; return <><li className="primary-nav__more"><button className="primary-nav__link primary-nav__toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more" {...A(_moreActive ? 'aria-current="page"' : '')}>More{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<ul className="primary-nav__sub" id="nav-more" hidden>{(_more).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__sublink" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></li></>; })()) : null}</>); })()}</ul></nav></div></div></header>
{(_isHero) ? (<><section className="hero" aria-roledescription="carousel" aria-label="Highlights"><div className="hero__viewport" id="heroViewport">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><div className={`hero__slide${i === 0 ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`Slide ${n} of 5`}><img src={`/static/img/hero-${n}.webp`} alt="" width="1600" height="500" {...A(i === 0 ? '' : 'loading="lazy"')} /></div></Fragment>); })}
<div className="hero__scrim"></div>
{' '}
<div className="hero__content"><div className="shell"><div className="hero__text"><h1 className="hero__title">{`${(_pg.route === '/' ? 'eCourts Single Sign-On' : (_clean(_pg.heading || title) || title)) ?? ''}`}</h1>
{' '}
<p className="hero__lede">{`${(_pg.route === '/' ? 'High Courts of India and District and Taluka Courts of India' : (((_pg.outline || [])[0] || {}).text || '')) ?? ''}`}</p>
{(_quick.length) ? (<><div className="hero__actions">{(_quick).map(function (q, qi) { return (<Fragment key={qi}><a className={`btn ${qi === 0 ? 'btn--primary' : 'btn--secondary'}`} href={q.href}>{`${(q.label) ?? ''}`}</a></Fragment>); })}</div></>) : null}</div></div></div>
{' '}
<button className="hero__arrow hero__arrow--prev" type="button" data-hero="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="hero__arrow hero__arrow--next" type="button" data-hero="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
{' '}
<div className="hero__bar"><button className="hero__pause" type="button" data-hero="pause" aria-pressed="false" aria-label="Pause slideshow"><svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect>
<rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
{' '}
<svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
{' '}
<div className="hero__dots" role="group" aria-label="Choose a slide">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><button type="button" data-hero-dot={i} aria-label={`Slide ${n}`} {...A(i === 0 ? 'aria-current="true"' : '')}></button></Fragment>); })}</div></div></div></section></>) : (typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="page-hero"><div className="shell page-hero__inner"><p className="page-hero__crumbs"><a href="/">Home</a>
{' '}›{' '}
<span>{`${(_h1) ?? ''}`}</span></p>
{' '}
<h1 className="page-hero__title">{`${(_h1) ?? ''}`}</h1></div></section></>) : null}
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
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">Useful links</h2>
{' '}
<ul className="footer-links">{(_fnav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">About this replica</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">Served from</h2>
{' '}
<address>{`${(typeof linkHost !== 'undefined' && linkHost ? linkHost : 'this local server') ?? ''}`}
<br />
(local demonstration)</address></div></div>
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
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, s, scales, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head><meta charSet="utf-8" />
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
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" /></head>
{' '}
<body>{(() => { /* Navigation labels: the captured page titles are long ("Case Status - eCourt India Services"), so the bar shows
   the part before " - eCourt India ...". The routes are unchanged. */
var _used = {};
var _navItems = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _used[label] = (_used[label] || 0) + 1;
  if (_used[label] > 1) label += ' (' + _used[label] + ')';
  return { href: item.href, label: label };
});
var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _isHero = !!(_pg && (_pg.route === '/' || _pg.route === '/ecourtindia_v6'));
var _clean = function (t) {
  return String(t || '').replace(/^Homepage\s*\|\s*/i, '').replace(/^Home\s*-\s*/i, '').replace(/\s*[-:|]\s*eCourts?\b.*$/i, '').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _lv1 ? _lv1.text : (_clean(_pg.heading || title) || (_pg.heading || title));
}
var _quick = _navItems.filter(function (n) { return ['/ecourtindia_v6/v12', '/ecourtindia_v6/v13', '/ecourtindia_v6/v14'].indexOf(n.href) >= 0; });; var _fu = {};
var _fnav = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _fu[label] = (_fu[label] || 0) + 1;
  if (_fu[label] > 1) label += ' (' + _fu[label] + ')';
  return { href: item.href, label: label };
});; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="utility-bar"><div className="shell utility-bar__inner"><div className="utility-bar__id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 12 4l9 6"></path>
<path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"></path></svg>
{' '}
<span>{`${(site.hostname) ?? ''} · local demonstration replica`}</span></div>
{' '}
<ul className="utility-bar__links"><li><a href="#main">Skip to main content</a></li>
{' '}
<li><a href="/ecourtindia_v6/v28">Screen Reader Access</a></li>
{' '}
<li><a href="/ecourtindia_v6/v23">Sitemap</a></li>
{' '}
<li><a href="/ecourtindia_v6/v11">Contact Us</a></li>
{' '}
<li className="text-size" role="group" aria-label="Text size"><button type="button" data-text-size="small" aria-label="Smaller text">A-</button>
{' '}
<button type="button" data-text-size="normal" aria-label="Normal text" aria-pressed="true">A</button>
{' '}
<button type="button" data-text-size="large" aria-label="Larger text">A+</button></li>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><li>{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="btn btn--primary office-login" href="/office/login">Office login</a></>) : null}</li></>) : null}</ul></div></div>
{' '}
<div className="branding"><div className="shell branding__inner"><a className="brand" href="/" aria-label="eCourts Single Sign-On, High Courts of India, District and Taluka Courts of India: home"><img src="/static/img/ecourts-sso-logo.png" alt="Emblem of India. eCourts Single Sign-On. High Courts of India. District and Taluka Courts of India." width="369" height="115" /></a>
{' '}
<div className="branding__logos"><img className="branding__seal" src="/static/img/ecourts-seal.png" alt="eCourts India seal" width="240" height="240" />
{' '}
<img className="branding__digital" src="/static/img/digital-india.png" alt="Digital India: Power To Empower" width="127" height="86" /></div></div></div>
{' '}
<div className="primary-nav-bar"><div className="shell primary-nav-bar__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(() => { var _more = _navItems.slice(7);; return (<>{(_navItems.slice(0, 7)).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}
{(_more.length) ? ((() => { var _moreActive = _more.some(function (m) { return m.href === currentPath; });; return <><li className="primary-nav__more"><button className="primary-nav__link primary-nav__toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more" {...A(_moreActive ? 'aria-current="page"' : '')}>More{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<ul className="primary-nav__sub" id="nav-more" hidden>{(_more).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__sublink" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></li></>; })()) : null}</>); })()}</ul></nav></div></div></header>
{(_isHero) ? (<><section className="hero" aria-roledescription="carousel" aria-label="Highlights"><div className="hero__viewport" id="heroViewport">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><div className={`hero__slide${i === 0 ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`Slide ${n} of 5`}><img src={`/static/img/hero-${n}.webp`} alt="" width="1600" height="500" {...A(i === 0 ? '' : 'loading="lazy"')} /></div></Fragment>); })}
<div className="hero__scrim"></div>
{' '}
<div className="hero__content"><div className="shell"><div className="hero__text"><h1 className="hero__title">{`${(_pg.route === '/' ? 'eCourts Single Sign-On' : (_clean(_pg.heading || title) || title)) ?? ''}`}</h1>
{' '}
<p className="hero__lede">{`${(_pg.route === '/' ? 'High Courts of India and District and Taluka Courts of India' : (((_pg.outline || [])[0] || {}).text || '')) ?? ''}`}</p>
{(_quick.length) ? (<><div className="hero__actions">{(_quick).map(function (q, qi) { return (<Fragment key={qi}><a className={`btn ${qi === 0 ? 'btn--primary' : 'btn--secondary'}`} href={q.href}>{`${(q.label) ?? ''}`}</a></Fragment>); })}</div></>) : null}</div></div></div>
{' '}
<button className="hero__arrow hero__arrow--prev" type="button" data-hero="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="hero__arrow hero__arrow--next" type="button" data-hero="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
{' '}
<div className="hero__bar"><button className="hero__pause" type="button" data-hero="pause" aria-pressed="false" aria-label="Pause slideshow"><svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect>
<rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
{' '}
<svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
{' '}
<div className="hero__dots" role="group" aria-label="Choose a slide">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><button type="button" data-hero-dot={i} aria-label={`Slide ${n}`} {...A(i === 0 ? 'aria-current="true"' : '')}></button></Fragment>); })}</div></div></div></section></>) : (typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="page-hero"><div className="shell page-hero__inner"><p className="page-hero__crumbs"><a href="/">Home</a>
{' '}›{' '}
<span>{`${(_h1) ?? ''}`}</span></p>
{' '}
<h1 className="page-hero__title">{`${(_h1) ?? ''}`}</h1></div></section></>) : null}
<main id="main" className={page.centred ? 'centred-stage' : ''}>{(page.home) ? (<>{inc(L, '../partials/home-sections', { page: page })}</>) : null}
<div className="shell"><section className={page.centred ? '' : 'section'}>{(() => { const ek = Object.keys(errors || {});; return (<>{(!pageTitle) ? (<><h1 className="section__title">{`${(page.heading || title) ?? ''}`}</h1></>) : null}
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
{(page.outline && page.outline.length) ? ((() => { var _skip = { 'Useful Links': 1, 'Follow Us': 1 };
       var _title1 = (page.outline.filter(function (o) { return o.level === 1; })[0] || {}).text;
       var _groups = [], _cur = null, _doc = false;
       page.outline.forEach(function (h) {
         if (h.level === 1) return;
         if (h.level === 2) { _cur = { title: h.text, items: [], doc: /^References$/i.test(h.text) }; if (!_skip[h.text]) _groups.push(_cur); else _cur = null; return; }
         if (_cur) _cur.items.push(h.text);
       });
       _groups = _groups.filter(function (g) { return g.title || g.items.length; });
       var _isFig = function (t) { return /^[\d.,]+\s*[KMB]?$/i.test(String(t).trim()); };; return <>{(_groups.length && !page.home) ? (<><div className="outline">{(_groups).map(function (g, gi) { var figs = g.items.length > 0 && g.items.every(_isFig); var media = page.route === '/ecourtindia_v6' && gi === 0;; return (<Fragment key={gi}><section className={`outline__group${media ? ' outline__group--media' : ''}`}>{(media) ? (<><img className="outline__media" src="/static/img/app-phone.png" alt="" width="160" height="165" /></>) : null}
<h2 className="outline__title">{`${(g.title) ?? ''}`}</h2>
{(g.items.length && figs) ? (<><ul className="outline__figures">{(g.items).map(function (t, __k) { return (<Fragment key={__k}><li><strong>{`${(t) ?? ''}`}</strong></li></Fragment>); })}</ul></>) : (g.items.length) ? (<><ul className={`outline__list ${g.doc ? 'outline__list--doc' : ''}`}>{(g.items).map(function (t, __k) { return (<Fragment key={__k}><li>{(g.doc) ? (<><img src="/static/img/pdf-icon.png" alt="PDF document" width="22" height="22" /></>) : null}
<span>{`${(t) ?? ''}`}</span></li></Fragment>); })}</ul></>) : null}</section></Fragment>); })}</div></>) : null}
<details className="outline-note"><summary>{`Page outline as captured (${(page.outline.length) ?? ''} headings)`}</summary>
{' '}
<p>The original's heading structure, kept here so nothing captured is lost. Its body text is not copied: this replica does not republish government prose.</p>
{' '}
<ul>{(page.outline).map(function (h, __k) { return (<Fragment key={__k}><li style={S(`margin-left:${(h.level - 1) * 14}px`)}>{`${(h.text) ?? ''}`}</li></Fragment>); })}</ul></details></>; })()) : null}
{(page.noContentNote) ? (<><div className="panel"><p style={{"margin":"0"}} dangerouslySetInnerHTML={{ __html: page.noContentNote }} /></div></>) : null}</>); })()}</section></div></main>
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">Useful links</h2>
{' '}
<ul className="footer-links">{(_fnav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">About this replica</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">Served from</h2>
{' '}
<address>{`${(typeof linkHost !== 'undefined' && linkHost ? linkHost : 'this local server') ?? ''}`}
<br />
(local demonstration)</address></div></div>
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
  const { $, Court, Home, Homepage, KMB, References$, Statistics$, __boot, b, book, calendar, challenge, chart, check, clock, court, currentPath, d, doc, download, e, eCourts, errors, filepen, filesearch, form, gapCounts, gapMeanings, gapTotal, home$, hourglass, href, items, label, linkHost, message, nav, note, officeButton, page, pageTitle, rupee, s, scales, site, submitted, tables, title } = L;
  
  return (
    <>
<html lang="en"><head><meta charSet="utf-8" />
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
<link rel="stylesheet" href="/static/css/tokens.css" />
{' '}
<link rel="stylesheet" href="/static/css/base.css" /></head>
{' '}
<body>{(() => { /* Navigation labels: the captured page titles are long ("Case Status - eCourt India Services"), so the bar shows
   the part before " - eCourt India ...". The routes are unchanged. */
var _used = {};
var _navItems = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _used[label] = (_used[label] || 0) + 1;
  if (_used[label] > 1) label += ' (' + _used[label] + ')';
  return { href: item.href, label: label };
});
var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _isHero = !!(_pg && (_pg.route === '/' || _pg.route === '/ecourtindia_v6'));
var _clean = function (t) {
  return String(t || '').replace(/^Homepage\s*\|\s*/i, '').replace(/^Home\s*-\s*/i, '').replace(/\s*[-:|]\s*eCourts?\b.*$/i, '').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _lv1 ? _lv1.text : (_clean(_pg.heading || title) || (_pg.heading || title));
}
var _quick = _navItems.filter(function (n) { return ['/ecourtindia_v6/v12', '/ecourtindia_v6/v13', '/ecourtindia_v6/v14'].indexOf(n.href) >= 0; });; var _fu = {};
var _fnav = nav.map(function (item) {
  var label = String(item.label || '');
  if (item.href === '/') label = 'Home';
  else if (item.href === '/ecourtindia_v6') label = 'Services Home';
  else {
    label = label.replace(/\s*[-:|]\s*e-?Court.*$/i, '').trim() || label;
    if (/^home$/i.test(label)) label = 'Search by CNR';
  }
  _fu[label] = (_fu[label] || 0) + 1;
  if (_fu[label] > 1) label += ' (' + _fu[label] + ')';
  return { href: item.href, label: label };
});; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="utility-bar"><div className="shell utility-bar__inner"><div className="utility-bar__id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 12 4l9 6"></path>
<path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"></path></svg>
{' '}
<span>{`${(site.hostname) ?? ''} · local demonstration replica`}</span></div>
{' '}
<ul className="utility-bar__links"><li><a href="#main">Skip to main content</a></li>
{' '}
<li><a href="/ecourtindia_v6/v28">Screen Reader Access</a></li>
{' '}
<li><a href="/ecourtindia_v6/v23">Sitemap</a></li>
{' '}
<li><a href="/ecourtindia_v6/v11">Contact Us</a></li>
{' '}
<li className="text-size" role="group" aria-label="Text size"><button type="button" data-text-size="small" aria-label="Smaller text">A-</button>
{' '}
<button type="button" data-text-size="normal" aria-label="Normal text" aria-pressed="true">A</button>
{' '}
<button type="button" data-text-size="large" aria-label="Larger text">A+</button></li>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><li>{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="btn btn--primary office-login" href="/office/login">Office login</a></>) : null}</li></>) : null}</ul></div></div>
{' '}
<div className="branding"><div className="shell branding__inner"><a className="brand" href="/" aria-label="eCourts Single Sign-On, High Courts of India, District and Taluka Courts of India: home"><img src="/static/img/ecourts-sso-logo.png" alt="Emblem of India. eCourts Single Sign-On. High Courts of India. District and Taluka Courts of India." width="369" height="115" /></a>
{' '}
<div className="branding__logos"><img className="branding__seal" src="/static/img/ecourts-seal.png" alt="eCourts India seal" width="240" height="240" />
{' '}
<img className="branding__digital" src="/static/img/digital-india.png" alt="Digital India: Power To Empower" width="127" height="86" /></div></div></div>
{' '}
<div className="primary-nav-bar"><div className="shell primary-nav-bar__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(() => { var _more = _navItems.slice(7);; return (<>{(_navItems.slice(0, 7)).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}
{(_more.length) ? ((() => { var _moreActive = _more.some(function (m) { return m.href === currentPath; });; return <><li className="primary-nav__more"><button className="primary-nav__link primary-nav__toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more" {...A(_moreActive ? 'aria-current="page"' : '')}>More{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<ul className="primary-nav__sub" id="nav-more" hidden>{(_more).map(function (item, __k) { return (<Fragment key={__k}><li><a className="primary-nav__sublink" href={item.href} {...A(currentPath === item.href ? 'aria-current="page"' : '')}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></li></>; })()) : null}</>); })()}</ul></nav></div></div></header>
{(_isHero) ? (<><section className="hero" aria-roledescription="carousel" aria-label="Highlights"><div className="hero__viewport" id="heroViewport">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><div className={`hero__slide${i === 0 ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`Slide ${n} of 5`}><img src={`/static/img/hero-${n}.webp`} alt="" width="1600" height="500" {...A(i === 0 ? '' : 'loading="lazy"')} /></div></Fragment>); })}
<div className="hero__scrim"></div>
{' '}
<div className="hero__content"><div className="shell"><div className="hero__text"><h1 className="hero__title">{`${(_pg.route === '/' ? 'eCourts Single Sign-On' : (_clean(_pg.heading || title) || title)) ?? ''}`}</h1>
{' '}
<p className="hero__lede">{`${(_pg.route === '/' ? 'High Courts of India and District and Taluka Courts of India' : (((_pg.outline || [])[0] || {}).text || '')) ?? ''}`}</p>
{(_quick.length) ? (<><div className="hero__actions">{(_quick).map(function (q, qi) { return (<Fragment key={qi}><a className={`btn ${qi === 0 ? 'btn--primary' : 'btn--secondary'}`} href={q.href}>{`${(q.label) ?? ''}`}</a></Fragment>); })}</div></>) : null}</div></div></div>
{' '}
<button className="hero__arrow hero__arrow--prev" type="button" data-hero="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="hero__arrow hero__arrow--next" type="button" data-hero="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
{' '}
<div className="hero__bar"><button className="hero__pause" type="button" data-hero="pause" aria-pressed="false" aria-label="Pause slideshow"><svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect>
<rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
{' '}
<svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
{' '}
<div className="hero__dots" role="group" aria-label="Choose a slide">{([1, 2, 3, 4, 5]).map(function (n, i) { return (<Fragment key={i}><button type="button" data-hero-dot={i} aria-label={`Slide ${n}`} {...A(i === 0 ? 'aria-current="true"' : '')}></button></Fragment>); })}</div></div></div></section></>) : (typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="page-hero"><div className="shell page-hero__inner"><p className="page-hero__crumbs"><a href="/">Home</a>
{' '}›{' '}
<span>{`${(_h1) ?? ''}`}</span></p>
{' '}
<h1 className="page-hero__title">{`${(_h1) ?? ''}`}</h1></div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">404 — Not found</h1>
{' '}
<div className="prose"><p>No page in this local demonstration matches that address.</p>
{(typeof note !== 'undefined' && note) ? (<><div className="panel"><p style={{"margin":"0"}}>{`${(note) ?? ''}`}</p></div></>) : null}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
<footer className="site-footer"><div className="shell site-footer__cols"><div className="site-footer__col"><h2 className="site-footer__h">Useful links</h2>
{' '}
<ul className="footer-links">{(_fnav.slice(0, 8)).map(function (item, __k) { return (<Fragment key={__k}><li><a href={item.href}>{`${(item.label) ?? ''}`}</a></li></Fragment>); })}</ul></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">About this replica</h2>
{' '}
<address>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
.
<br />
{' '}Placeholder details only — no real office is represented.
<br />
{' '}Not operated by any government body.</address></div>
{' '}
<div className="site-footer__col"><h2 className="site-footer__h">Served from</h2>
{' '}
<address>{`${(typeof linkHost !== 'undefined' && linkHost ? linkHost : 'this local server') ?? ''}`}
<br />
(local demonstration)</address></div></div>
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
  'home-sections': P_home_sections,
};

export const localNames = ['$', 'Court', 'Home', 'Homepage', 'KMB', 'References$', 'Statistics$', '__boot', 'b', 'book', 'calendar', 'challenge', 'chart', 'check', 'clock', 'court', 'currentPath', 'd', 'doc', 'download', 'e', 'eCourts', 'errors', 'filepen', 'filesearch', 'form', 'gapCounts', 'gapMeanings', 'gapTotal', 'home$', 'hourglass', 'href', 'i', 'items', 'label', 'linkHost', 'message', 'nav', 'note', 'officeButton', 'page', 'pageTitle', 'rupee', 's', 'scales', 'site', 'submitted', 'tables', 'title'];

// plain scripts a view needs in the browser (ePrisons); loaded after the page is hydrated
export const scripts = {};

export const views = {
  'pages/about': V_pages_about,
  'pages/error': V_pages_error,
  'pages/gaps': V_pages_gaps,
  'pages/generic': V_pages_generic,
  'pages/not-found': V_pages_not_found,
};
