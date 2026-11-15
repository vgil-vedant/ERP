/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
// Every view of the aadhaar portal as a React function of the template locals (rendered on the server).
import { Fragment } from 'react';
import { S, A, rawHtml } from '../../shared/css';

// include(name, data): the old templates' partial-with-data call
const inc = (L, rel, data) => {
  const key = String(rel).replace(/^(?:\.\.\/|\.\/)*(?:partials\/)?/, '').replace(/\.ejs$/, '');
  const fn = PARTIALS[key];
  if (!fn) throw new Error('no partial ' + rel);
  return fn(Object.assign({}, L, data));
};

export function P_my_aadhaar(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, n, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  /* Services of the My Aadhaar page. Everything shown comes from page.myAadhaar (captured from the original page);
   a card is a link only where this demonstration has a page for that service. */
var _ma = page.myAadhaar;
var _card = function (c) {
  var out = '';
  return out;
};;
  return (
    <>
<div className="shell"><div className="ma"><div className="ma__main">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><section className="ma__sec" id={s.id} aria-labelledby={`${s.id}-h`}><h2 className="ma__h" id={`${s.id}-h`}>{`${(s.title) ?? ''}`}</h2>
{' '}
<div className={`panel-box panel-box--${s.tone}`}><ul className="svc-cards">{(s.cards).map(function (c, __k) { return (<Fragment key={__k}><li className="svc">{(c.route) ? (<><a className="svc__link" href={c.route}><span className="svc__icon">{inc(L, 'svg', {n:c.icon, cls:''})}</span>
{' '}
<h3 className="svc__title">{`${(c.title) ?? ''}`}</h3>
{' '}
<p className="svc__text">{`${(c.text) ?? ''}`}</p>
{(c.otp) ? (<><p className="svc__otp">Mobile OTP is required</p></>) : null}
<span className="svc__foot"><span className="svc__go">{inc(L, 'svg', {n:'arrow', cls:''})}</span>
{(c.fee) ? (<><span className="svc__fee">{`${(c.fee) ?? ''}`}</span></>) : null}</span></a></>) : (<><div className="svc__box is-off" title="No page for this service in the demonstration"><span className="svc__icon">{inc(L, 'svg', {n:c.icon, cls:''})}</span>
{' '}
<h3 className="svc__title">{`${(c.title) ?? ''}`}</h3>
{' '}
<p className="svc__text">{`${(c.text) ?? ''}`}</p>
{(c.otp) ? (<><p className="svc__otp">Mobile OTP is required</p></>) : null}
<span className="svc__foot"><span className="svc__go">{inc(L, 'svg', {n:'arrow', cls:''})}</span>
{(c.fee) ? (<><span className="svc__fee">{`${(c.fee) ?? ''}`}</span></>) : null}</span></div></>)}</li></Fragment>); })}</ul>
{(s.status) ? (<><div className="svc-row"><a className="svc-status" href={s.status.route}><span><small>{`${(s.status.label) ?? ''}`}</small>
<strong>{`${(s.status.title) ?? ''}`}</strong></span>
{inc(L, 'svg', {n:'arrow', cls:''})}</a>
{' '}
<a className="svc-more" href={s.more}>{inc(L, 'svg', {n:'grid', cls:''})}
More</a></div></>) : null}
{(s.promo) ? (<><div className="promo-row"><p>{`${(s.promo.text) ?? ''}`}</p>
{' '}
<a className="btn-pill" href={s.promo.route}>{`${(s.promo.label) ?? ''}`}
{inc(L, 'svg', {n:'arrow', cls:''})}</a></div></>) : null}</div></section></Fragment>); })}
<section className="ma__sec"><h2 className="ma__h">{`${(_ma.enrolmentUpdates.title) ?? ''}`}</h2>
{' '}
<p className="ma__lead">{`${(_ma.enrolmentUpdates.text) ?? ''}`}</p>
{' '}
<p><a className="btn-pill" href={_ma.enrolmentUpdates.route}>{`${(_ma.enrolmentUpdates.title) ?? ''}`}
{inc(L, 'svg', {n:'arrow', cls:''})}</a></p>
{(_ma.enrolmentUpdates.docs).map(function (d, __k) { return (<Fragment key={__k}><div className="doc"><div className="doc__main"><svg className="doc__icon" viewBox="0 0 30 36" aria-hidden="true"><path d="M3 1h17l7 7v27H3z" fill="#fff" stroke="#C9C7D8"></path>
<path d="M20 1v7h7" fill="#EEE" stroke="#C9C7D8"></path>
<rect x="2" y="17" width="26" height="10" rx="1" fill="#C94B4B"></rect>
<text x="15" y="25" fontFamily="Arial,sans-serif" fontSize="8" fontWeight="700" fill="#fff" textAnchor="middle">PDF</text></svg>
{' '}
<div><h3 className="doc__title">{`${(d.title) ?? ''}`}</h3>
{' '}
<p className="doc__kind">{`${(d.kind) ?? ''}`}</p>
{' '}
<p className="doc__meta">{`Doc Type: ${(d.type) ?? ''} • Size: ${(d.size) ?? ''} • Uploaded On: ${(d.uploaded) ?? ''}`}</p>
{(d.others) ? (<><span className="doc__other">{`${(d.others) ?? ''}`}</span></>) : null}</div></div>
{(d.file) ? (<><a className="btn-dl" href={d.file} download aria-label={`Download ${d.title} (${d.type}, ${d.size})`}>Download{' '}
{inc(L, 'svg', {n:'download', cls:''})}</a></>) : (<><span className="btn-dl is-off" aria-disabled="true" title="This document is not included in the demonstration">Not included</span></>)}</div></Fragment>); })}</section>
{' '}
<section className="ma__sec" id="understand"><article className="und"><div className="und__body"><h3>{`${(_ma.understand.title) ?? ''}`}</h3>
{(_ma.understand.text.split('\n')).map(function (line, __k) { return (<Fragment key={__k}><p>{`${(line) ?? ''}`}</p></Fragment>); })}
<a href={_ma.understand.route}>Read More{' '}
{inc(L, 'svg', {n:'arrow', cls:''})}</a></div></article>
{' '}
<div className="cinfo"><h3>{inc(L, 'svg', {n:'info', cls:''})}
Content Information</h3>
{' '}
<p><span>{`Published on: ${(_ma.contentInfo.published) ?? ''}`}</span>
<span>{`Last Updated: ${(_ma.contentInfo.updated) ?? ''}`}</span></p></div></section></div>
{' '}
<aside className="faq" aria-labelledby="faq-h"><h2 className="faq__title" id="faq-h">{`${(_ma.faq.title) ?? ''}`}</h2>
{(_ma.faq.items).map(function (f, __k) { return (<Fragment key={__k}><details><summary><span>{`${(f.q) ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:''})}</summary>
<div>{`${(f.a) ?? ''}`}</div></details></Fragment>); })}
<a className="faq__more" href={_ma.faq.more}>View more F.A.Qs{' '}
{inc(L, 'svg', {n:'arrow', cls:''})}</a></aside></div></div>
    </>
  );
}

export function P_svg(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, n, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  var P = {
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  idcard:'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2"/><path d="M14 9.5h5M14 12.5h5M14 15.5h3"/>',
  building:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M8 8h2M8 12h2M8 16h2M17 14h.01M17 18h.01M3 21h18"/>',
  handshake:'<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.5.5a1 1 0 0 1-3-3l2.8-2.8a5 5 0 0 1 4.4-1.2L16 5"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="m10.5 7.5 4 2.5-4 2.5Z"/>',
  document:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  help:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  arrow:'<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  download:'<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
  reader:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  language:'<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  access:'<circle cx="12" cy="4.5" r="2"/><path d="M5 8h14"/><path d="M12 8v7"/><path d="m9 22 3-7 3 7"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  'home-refresh':'<path d="m3 11 9-8 9 8"/><path d="M5 10v9a1 1 0 0 0 1 1h5"/><path d="M19 15a4 4 0 1 0-1.2 2.9"/><path d="M19 12v3h-3"/>',
  photo:'<path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="12.5" r="2.2"/><path d="M8.5 18c.6-1.5 1.8-2.3 3.5-2.3s2.9.8 3.5 2.3"/>',
  card:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  'shield-user':'<path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.6 15.5c.6-1.6 1.9-2.4 3.4-2.4s2.8.8 3.4 2.4"/>',
  'id-card':'<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8" cy="10" r="1.8"/><path d="M5 15c.5-1.3 1.6-2 3-2s2.5.7 3 2"/><path d="M13.5 9h5M13.5 12h5M6 17h.01M9 17h.01M12 17h.01M15 17h.01"/>',
  fingerprint:'<path d="M12 4a8 8 0 0 1 8 8v2"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"/><path d="M7 20a13 13 0 0 1-.6-4v-4"/><path d="M11 12v5a7 7 0 0 0 .5 2.5"/>',
  'id-lock':'<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8" cy="10" r="1.8"/><path d="M5 15c.5-1.3 1.6-2 3-2s2.5.7 3 2"/><path d="M13.5 9h5M13.5 12h3"/><rect x="15.5" y="14" width="5" height="4" rx="1"/>',
  calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  'clipboard-check':'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h4"/><path d="m11 16 2 2 4-4"/>',
  info:'<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M12 11v5M12 8h.01" stroke="#fff"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>'
};;
  return (
    <>
<svg className={typeof cls === 'undefined' ? '' : cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: P[n] || '' }} />
    </>
  );
}

export function V_pages_about(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  
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
<body>{(() => { var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _cp = typeof currentPath === 'string' ? currentPath : '/';
var _lang = /^\/hi(\/|$)/.test(_cp) ? 'hi' : 'en';
// pages that exist in one language only
var _NO_TWIN = ['/en/qr-code-reader', '/en/aadhaar-dashboard/ekyc', '/en/v2'];
var _twin = null;
if (/^\/(en|hi)(\/|$)/.test(_cp) && _NO_TWIN.indexOf(_cp) < 0) _twin = (_lang === 'en' ? '/hi' : '/en') + _cp.slice(3);
var _NAV = [
  ['Home', '/en', 'home'], ['My Aadhaar', '/en/my-aadhaar', 'idcard'], ['About UIDAI', '/en/about-uidai', 'building'],
  ['Build with Us', '/en/developer-section', 'handshake'], ['Media', '/en/announcements', 'monitor'],
  ['Documents', '/en/documents', 'document'], ['Help', '/en/help', 'help']
];
var _isHome = function (p) { return _cp === p || (p === '/en' && _cp === '/'); };
var _clean = function (t) {
  return String(t || '').replace(/\s*[-|]\s*Unique Identification Authority of India.*$/i, '').replace(/^myAadhaar\s*$/i, 'myAadhaar').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _clean(_pg.heading || title) || (_lv1 ? _lv1.text : title);
  if (_lv1 && /^(Home|myAadhaar)?$/i.test(_h1)) _h1 = _lv1.text;
}
var _ma = _pg && _pg.myAadhaar;; var _COLS = [
  ['About UIDAI', [['Vision & Mission', '/en/vision-and-mission'], ['Aadhaar Dashboard', '/en/aadhaar-dashboard'], ['Annual Reports', '/en/annual-reports']]],
  ['Aadhaar Services', [['Download Aadhaar', '/genricDownloadAadhaar'], ['Update Aadhaar', '/en/updating-data-on-aadhaar'], ['Check Aadhaar Status', '/check-aadhaar-validity/en'],
                        ['Order PVC Card', '/pvc/en'], ['Generate VID', '/genericGenerateOrRetrieveVID/en'], ['Retrieve Lost UID', '/retrieve-eid-uid/en']]],
  ['Documents', [['Enrolment & Update Forms', '/en/enrolment-and-updates'], ['Handbooks', '/en/handbooks'], ['Annual Reports', '/en/annual-reports'], ['Circulars', '/en/circulars'], ['Policies', '/en/policies']]],
  ['Quick Links', [['My Aadhaar Portal', '/'], ['Developer Sandbox', '/en/developer-section'], ['Become an OVSE', '/en/ovse']]],
  ['Other Links', [['Site Map', '/en/site-map'], ['Website Policies', '/en/website-policies'], ['Website Help', '/en/website-help']]]
];; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="topbar"><div className="shell topbar__inner"><a href="#main"><span>Skip to Main Content</span></a>
{' '}
<div className="topbar__tools"><a href="/en/website-help">{inc(L, 'svg', {n:'reader', cls:''})}
<span className="label-hide">Screen Reader</span></a>
{(_twin) ? (<><details className="tb-item"><summary aria-label={`Select language, currently ${_lang === 'en' ? 'English' : 'Hindi'}`}>{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:'chev'})}</summary>
{' '}
<div className="tb-menu"><a href={_lang === 'en' ? _cp : _twin} lang="en" {...A(_lang === 'en' ? 'aria-current="true"' : '')}>English</a>
{' '}
<a href={_lang === 'hi' ? _cp : _twin} lang="hi" {...A(_lang === 'hi' ? 'aria-current="true"' : '')}>हिन्दी</a></div></details></>) : (<><span className="tb-item">{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span></span></>)}
<details className="tb-item"><summary aria-label="Accessibility options">{inc(L, 'svg', {n:'access', cls:''})}
<span className="label-hide">More</span></summary>
{' '}
<div className="tb-menu" role="group" aria-label="Text size"><div className="tb-menu__label">Text size</div>
{' '}
<button type="button" data-text-size="small" aria-pressed="false">Smaller</button>
{' '}
<button type="button" data-text-size="normal" aria-pressed="true">Normal</button>
{' '}
<button type="button" data-text-size="large" aria-pressed="false">Larger</button></div></details>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="tb-item office-login" href="/office/login">Office login</a></>) : null}</div></div></div>
{' '}
<div className="brandbar"><div className="shell brandbar__inner"><a className="brandbar__logo" href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div></div>
{' '}
<div className="mainnav"><div className="shell mainnav__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">{inc(L, 'svg', {n:'menu', cls:''})}
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(_NAV).map(function (n, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={n[1]} {...A(_isHome(n[1]) ? 'aria-current="page"' : '')}>{inc(L, 'svg', {n:n[2], cls:''})}
<span>{`${(n[0]) ?? ''}`}</span></a></li></Fragment>); })}</ul></nav></div></div></header>
{(_pg && typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="pagehead"><div className="shell"><nav className="crumbs" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li>
{' '}
<li><span aria-current="page">{`${(_h1) ?? ''}`}</span></li></ol></nav>
{' '}
<h1 className={`pagehead__title${_ma ? '' : ' pagehead__title--plain'}`}>{`${(_h1) ?? ''}`}</h1>
{(_ma) ? (<><p className="pagehead__lede">{`${(_ma.intro) ?? ''}`}</p>
{' '}
<div className="insec"><h2 className="insec__title">In this section</h2>
{' '}
<ul className="chips">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><li><a href={`#${s.id}`}>{`${(s.title) ?? ''}`}</a></li></Fragment>); })}
<li><a href="#understand">Understand your Aadhaar</a></li></ul></div></>) : null}</div></section></>) : null}
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
<footer className="site-footer"><div className="shell"><div className="site-footer__card"><div className="shell" style={{"padding":"0 32px"}}><div className="f-top"><a href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div>
{' '}
<div className="f-cols">{(_COLS).map(function (c, __k) { return (<Fragment key={__k}><div className="f-col"><h2>{`${(c[0]) ?? ''}`}</h2>
{' '}
<ul>{(c[1]).map(function (l, __k) { return (<Fragment key={__k}><li><a href={l[1]}>{`${(l[0]) ?? ''}`}</a></li></Fragment>); })}</ul></div></Fragment>); })}</div>
{' '}
<div className="f-office"><div><h2 className="is-serif">UIDAI Head Office</h2>
{' '}
<p className="lead">Unique Identification Authority of India</p>
{' '}
<address><p>Bangla Sahib Road, Behind Kali Mandir,
<br />
Gole Market, New Delhi - 110001</p></address></div>
{' '}
<div><h2>Regional and State Offices</h2>
{' '}
<p><strong>Assam</strong></p>
{' '}
<p><strong>UIDAI Regional Office, Guwahati</strong></p>
{' '}
<address><p>Block-V, First Floor, HOUSEFED Complex, Beltola-Basistha Road, Dispur, Guwahati - 781 006</p></address></div>
{' '}
<div className="contact"><h2>Contact details</h2>
{' '}
<dl><dt>Toll-free Number</dt>
<dd>1947</dd>
{' '}
<dt>Email</dt>
<dd>help[at]uidai[dot]gov[dot]in</dd></dl></div></div>
{' '}
<div className="f-copy">Content structure follows uidai.gov.in. © Unique Identification Authority of India. This is an unofficial local demonstration.</div>
{' '}
<div className="f-notes"><p>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}for development and testing. Placeholder details only — no real office is represented.</p>
{' '}
<ul className="f-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li>
{' '}
<li>Not affiliated with, endorsed by, or operated by any government agency.</li></ul></div></div></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_error(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  
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
<body>{(() => { var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _cp = typeof currentPath === 'string' ? currentPath : '/';
var _lang = /^\/hi(\/|$)/.test(_cp) ? 'hi' : 'en';
// pages that exist in one language only
var _NO_TWIN = ['/en/qr-code-reader', '/en/aadhaar-dashboard/ekyc', '/en/v2'];
var _twin = null;
if (/^\/(en|hi)(\/|$)/.test(_cp) && _NO_TWIN.indexOf(_cp) < 0) _twin = (_lang === 'en' ? '/hi' : '/en') + _cp.slice(3);
var _NAV = [
  ['Home', '/en', 'home'], ['My Aadhaar', '/en/my-aadhaar', 'idcard'], ['About UIDAI', '/en/about-uidai', 'building'],
  ['Build with Us', '/en/developer-section', 'handshake'], ['Media', '/en/announcements', 'monitor'],
  ['Documents', '/en/documents', 'document'], ['Help', '/en/help', 'help']
];
var _isHome = function (p) { return _cp === p || (p === '/en' && _cp === '/'); };
var _clean = function (t) {
  return String(t || '').replace(/\s*[-|]\s*Unique Identification Authority of India.*$/i, '').replace(/^myAadhaar\s*$/i, 'myAadhaar').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _clean(_pg.heading || title) || (_lv1 ? _lv1.text : title);
  if (_lv1 && /^(Home|myAadhaar)?$/i.test(_h1)) _h1 = _lv1.text;
}
var _ma = _pg && _pg.myAadhaar;; var _COLS = [
  ['About UIDAI', [['Vision & Mission', '/en/vision-and-mission'], ['Aadhaar Dashboard', '/en/aadhaar-dashboard'], ['Annual Reports', '/en/annual-reports']]],
  ['Aadhaar Services', [['Download Aadhaar', '/genricDownloadAadhaar'], ['Update Aadhaar', '/en/updating-data-on-aadhaar'], ['Check Aadhaar Status', '/check-aadhaar-validity/en'],
                        ['Order PVC Card', '/pvc/en'], ['Generate VID', '/genericGenerateOrRetrieveVID/en'], ['Retrieve Lost UID', '/retrieve-eid-uid/en']]],
  ['Documents', [['Enrolment & Update Forms', '/en/enrolment-and-updates'], ['Handbooks', '/en/handbooks'], ['Annual Reports', '/en/annual-reports'], ['Circulars', '/en/circulars'], ['Policies', '/en/policies']]],
  ['Quick Links', [['My Aadhaar Portal', '/'], ['Developer Sandbox', '/en/developer-section'], ['Become an OVSE', '/en/ovse']]],
  ['Other Links', [['Site Map', '/en/site-map'], ['Website Policies', '/en/website-policies'], ['Website Help', '/en/website-help']]]
];; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="topbar"><div className="shell topbar__inner"><a href="#main"><span>Skip to Main Content</span></a>
{' '}
<div className="topbar__tools"><a href="/en/website-help">{inc(L, 'svg', {n:'reader', cls:''})}
<span className="label-hide">Screen Reader</span></a>
{(_twin) ? (<><details className="tb-item"><summary aria-label={`Select language, currently ${_lang === 'en' ? 'English' : 'Hindi'}`}>{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:'chev'})}</summary>
{' '}
<div className="tb-menu"><a href={_lang === 'en' ? _cp : _twin} lang="en" {...A(_lang === 'en' ? 'aria-current="true"' : '')}>English</a>
{' '}
<a href={_lang === 'hi' ? _cp : _twin} lang="hi" {...A(_lang === 'hi' ? 'aria-current="true"' : '')}>हिन्दी</a></div></details></>) : (<><span className="tb-item">{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span></span></>)}
<details className="tb-item"><summary aria-label="Accessibility options">{inc(L, 'svg', {n:'access', cls:''})}
<span className="label-hide">More</span></summary>
{' '}
<div className="tb-menu" role="group" aria-label="Text size"><div className="tb-menu__label">Text size</div>
{' '}
<button type="button" data-text-size="small" aria-pressed="false">Smaller</button>
{' '}
<button type="button" data-text-size="normal" aria-pressed="true">Normal</button>
{' '}
<button type="button" data-text-size="large" aria-pressed="false">Larger</button></div></details>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="tb-item office-login" href="/office/login">Office login</a></>) : null}</div></div></div>
{' '}
<div className="brandbar"><div className="shell brandbar__inner"><a className="brandbar__logo" href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div></div>
{' '}
<div className="mainnav"><div className="shell mainnav__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">{inc(L, 'svg', {n:'menu', cls:''})}
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(_NAV).map(function (n, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={n[1]} {...A(_isHome(n[1]) ? 'aria-current="page"' : '')}>{inc(L, 'svg', {n:n[2], cls:''})}
<span>{`${(n[0]) ?? ''}`}</span></a></li></Fragment>); })}</ul></nav></div></div></header>
{(_pg && typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="pagehead"><div className="shell"><nav className="crumbs" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li>
{' '}
<li><span aria-current="page">{`${(_h1) ?? ''}`}</span></li></ol></nav>
{' '}
<h1 className={`pagehead__title${_ma ? '' : ' pagehead__title--plain'}`}>{`${(_h1) ?? ''}`}</h1>
{(_ma) ? (<><p className="pagehead__lede">{`${(_ma.intro) ?? ''}`}</p>
{' '}
<div className="insec"><h2 className="insec__title">In this section</h2>
{' '}
<ul className="chips">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><li><a href={`#${s.id}`}>{`${(s.title) ?? ''}`}</a></li></Fragment>); })}
<li><a href="#understand">Understand your Aadhaar</a></li></ul></div></>) : null}</div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">Something went wrong</h1>
{' '}
<div className="prose"><p>The local demonstration hit an error while rendering this page.</p>
{' '}
<div className="panel"><p style={{"margin":"0"}}><code>{`${(message) ?? ''}`}</code></p></div>
{' '}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
<footer className="site-footer"><div className="shell"><div className="site-footer__card"><div className="shell" style={{"padding":"0 32px"}}><div className="f-top"><a href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div>
{' '}
<div className="f-cols">{(_COLS).map(function (c, __k) { return (<Fragment key={__k}><div className="f-col"><h2>{`${(c[0]) ?? ''}`}</h2>
{' '}
<ul>{(c[1]).map(function (l, __k) { return (<Fragment key={__k}><li><a href={l[1]}>{`${(l[0]) ?? ''}`}</a></li></Fragment>); })}</ul></div></Fragment>); })}</div>
{' '}
<div className="f-office"><div><h2 className="is-serif">UIDAI Head Office</h2>
{' '}
<p className="lead">Unique Identification Authority of India</p>
{' '}
<address><p>Bangla Sahib Road, Behind Kali Mandir,
<br />
Gole Market, New Delhi - 110001</p></address></div>
{' '}
<div><h2>Regional and State Offices</h2>
{' '}
<p><strong>Assam</strong></p>
{' '}
<p><strong>UIDAI Regional Office, Guwahati</strong></p>
{' '}
<address><p>Block-V, First Floor, HOUSEFED Complex, Beltola-Basistha Road, Dispur, Guwahati - 781 006</p></address></div>
{' '}
<div className="contact"><h2>Contact details</h2>
{' '}
<dl><dt>Toll-free Number</dt>
<dd>1947</dd>
{' '}
<dt>Email</dt>
<dd>help[at]uidai[dot]gov[dot]in</dd></dl></div></div>
{' '}
<div className="f-copy">Content structure follows uidai.gov.in. © Unique Identification Authority of India. This is an unofficial local demonstration.</div>
{' '}
<div className="f-notes"><p>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}for development and testing. Placeholder details only — no real office is represented.</p>
{' '}
<ul className="f-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li>
{' '}
<li>Not affiliated with, endorsed by, or operated by any government agency.</li></ul></div></div></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_gaps(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  
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
<body>{(() => { var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _cp = typeof currentPath === 'string' ? currentPath : '/';
var _lang = /^\/hi(\/|$)/.test(_cp) ? 'hi' : 'en';
// pages that exist in one language only
var _NO_TWIN = ['/en/qr-code-reader', '/en/aadhaar-dashboard/ekyc', '/en/v2'];
var _twin = null;
if (/^\/(en|hi)(\/|$)/.test(_cp) && _NO_TWIN.indexOf(_cp) < 0) _twin = (_lang === 'en' ? '/hi' : '/en') + _cp.slice(3);
var _NAV = [
  ['Home', '/en', 'home'], ['My Aadhaar', '/en/my-aadhaar', 'idcard'], ['About UIDAI', '/en/about-uidai', 'building'],
  ['Build with Us', '/en/developer-section', 'handshake'], ['Media', '/en/announcements', 'monitor'],
  ['Documents', '/en/documents', 'document'], ['Help', '/en/help', 'help']
];
var _isHome = function (p) { return _cp === p || (p === '/en' && _cp === '/'); };
var _clean = function (t) {
  return String(t || '').replace(/\s*[-|]\s*Unique Identification Authority of India.*$/i, '').replace(/^myAadhaar\s*$/i, 'myAadhaar').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _clean(_pg.heading || title) || (_lv1 ? _lv1.text : title);
  if (_lv1 && /^(Home|myAadhaar)?$/i.test(_h1)) _h1 = _lv1.text;
}
var _ma = _pg && _pg.myAadhaar;; var _COLS = [
  ['About UIDAI', [['Vision & Mission', '/en/vision-and-mission'], ['Aadhaar Dashboard', '/en/aadhaar-dashboard'], ['Annual Reports', '/en/annual-reports']]],
  ['Aadhaar Services', [['Download Aadhaar', '/genricDownloadAadhaar'], ['Update Aadhaar', '/en/updating-data-on-aadhaar'], ['Check Aadhaar Status', '/check-aadhaar-validity/en'],
                        ['Order PVC Card', '/pvc/en'], ['Generate VID', '/genericGenerateOrRetrieveVID/en'], ['Retrieve Lost UID', '/retrieve-eid-uid/en']]],
  ['Documents', [['Enrolment & Update Forms', '/en/enrolment-and-updates'], ['Handbooks', '/en/handbooks'], ['Annual Reports', '/en/annual-reports'], ['Circulars', '/en/circulars'], ['Policies', '/en/policies']]],
  ['Quick Links', [['My Aadhaar Portal', '/'], ['Developer Sandbox', '/en/developer-section'], ['Become an OVSE', '/en/ovse']]],
  ['Other Links', [['Site Map', '/en/site-map'], ['Website Policies', '/en/website-policies'], ['Website Help', '/en/website-help']]]
];; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="topbar"><div className="shell topbar__inner"><a href="#main"><span>Skip to Main Content</span></a>
{' '}
<div className="topbar__tools"><a href="/en/website-help">{inc(L, 'svg', {n:'reader', cls:''})}
<span className="label-hide">Screen Reader</span></a>
{(_twin) ? (<><details className="tb-item"><summary aria-label={`Select language, currently ${_lang === 'en' ? 'English' : 'Hindi'}`}>{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:'chev'})}</summary>
{' '}
<div className="tb-menu"><a href={_lang === 'en' ? _cp : _twin} lang="en" {...A(_lang === 'en' ? 'aria-current="true"' : '')}>English</a>
{' '}
<a href={_lang === 'hi' ? _cp : _twin} lang="hi" {...A(_lang === 'hi' ? 'aria-current="true"' : '')}>हिन्दी</a></div></details></>) : (<><span className="tb-item">{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span></span></>)}
<details className="tb-item"><summary aria-label="Accessibility options">{inc(L, 'svg', {n:'access', cls:''})}
<span className="label-hide">More</span></summary>
{' '}
<div className="tb-menu" role="group" aria-label="Text size"><div className="tb-menu__label">Text size</div>
{' '}
<button type="button" data-text-size="small" aria-pressed="false">Smaller</button>
{' '}
<button type="button" data-text-size="normal" aria-pressed="true">Normal</button>
{' '}
<button type="button" data-text-size="large" aria-pressed="false">Larger</button></div></details>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="tb-item office-login" href="/office/login">Office login</a></>) : null}</div></div></div>
{' '}
<div className="brandbar"><div className="shell brandbar__inner"><a className="brandbar__logo" href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div></div>
{' '}
<div className="mainnav"><div className="shell mainnav__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">{inc(L, 'svg', {n:'menu', cls:''})}
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(_NAV).map(function (n, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={n[1]} {...A(_isHome(n[1]) ? 'aria-current="page"' : '')}>{inc(L, 'svg', {n:n[2], cls:''})}
<span>{`${(n[0]) ?? ''}`}</span></a></li></Fragment>); })}</ul></nav></div></div></header>
{(_pg && typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="pagehead"><div className="shell"><nav className="crumbs" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li>
{' '}
<li><span aria-current="page">{`${(_h1) ?? ''}`}</span></li></ol></nav>
{' '}
<h1 className={`pagehead__title${_ma ? '' : ' pagehead__title--plain'}`}>{`${(_h1) ?? ''}`}</h1>
{(_ma) ? (<><p className="pagehead__lede">{`${(_ma.intro) ?? ''}`}</p>
{' '}
<div className="insec"><h2 className="insec__title">In this section</h2>
{' '}
<ul className="chips">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><li><a href={`#${s.id}`}>{`${(s.title) ?? ''}`}</a></li></Fragment>); })}
<li><a href="#understand">Understand your Aadhaar</a></li></ul></div></>) : null}</div></section></>) : null}
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
<footer className="site-footer"><div className="shell"><div className="site-footer__card"><div className="shell" style={{"padding":"0 32px"}}><div className="f-top"><a href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div>
{' '}
<div className="f-cols">{(_COLS).map(function (c, __k) { return (<Fragment key={__k}><div className="f-col"><h2>{`${(c[0]) ?? ''}`}</h2>
{' '}
<ul>{(c[1]).map(function (l, __k) { return (<Fragment key={__k}><li><a href={l[1]}>{`${(l[0]) ?? ''}`}</a></li></Fragment>); })}</ul></div></Fragment>); })}</div>
{' '}
<div className="f-office"><div><h2 className="is-serif">UIDAI Head Office</h2>
{' '}
<p className="lead">Unique Identification Authority of India</p>
{' '}
<address><p>Bangla Sahib Road, Behind Kali Mandir,
<br />
Gole Market, New Delhi - 110001</p></address></div>
{' '}
<div><h2>Regional and State Offices</h2>
{' '}
<p><strong>Assam</strong></p>
{' '}
<p><strong>UIDAI Regional Office, Guwahati</strong></p>
{' '}
<address><p>Block-V, First Floor, HOUSEFED Complex, Beltola-Basistha Road, Dispur, Guwahati - 781 006</p></address></div>
{' '}
<div className="contact"><h2>Contact details</h2>
{' '}
<dl><dt>Toll-free Number</dt>
<dd>1947</dd>
{' '}
<dt>Email</dt>
<dd>help[at]uidai[dot]gov[dot]in</dd></dl></div></div>
{' '}
<div className="f-copy">Content structure follows uidai.gov.in. © Unique Identification Authority of India. This is an unofficial local demonstration.</div>
{' '}
<div className="f-notes"><p>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}for development and testing. Placeholder details only — no real office is represented.</p>
{' '}
<ul className="f-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li>
{' '}
<li>Not affiliated with, endorsed by, or operated by any government agency.</li></ul></div></div></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_generic(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  
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
<body>{(() => { var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _cp = typeof currentPath === 'string' ? currentPath : '/';
var _lang = /^\/hi(\/|$)/.test(_cp) ? 'hi' : 'en';
// pages that exist in one language only
var _NO_TWIN = ['/en/qr-code-reader', '/en/aadhaar-dashboard/ekyc', '/en/v2'];
var _twin = null;
if (/^\/(en|hi)(\/|$)/.test(_cp) && _NO_TWIN.indexOf(_cp) < 0) _twin = (_lang === 'en' ? '/hi' : '/en') + _cp.slice(3);
var _NAV = [
  ['Home', '/en', 'home'], ['My Aadhaar', '/en/my-aadhaar', 'idcard'], ['About UIDAI', '/en/about-uidai', 'building'],
  ['Build with Us', '/en/developer-section', 'handshake'], ['Media', '/en/announcements', 'monitor'],
  ['Documents', '/en/documents', 'document'], ['Help', '/en/help', 'help']
];
var _isHome = function (p) { return _cp === p || (p === '/en' && _cp === '/'); };
var _clean = function (t) {
  return String(t || '').replace(/\s*[-|]\s*Unique Identification Authority of India.*$/i, '').replace(/^myAadhaar\s*$/i, 'myAadhaar').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _clean(_pg.heading || title) || (_lv1 ? _lv1.text : title);
  if (_lv1 && /^(Home|myAadhaar)?$/i.test(_h1)) _h1 = _lv1.text;
}
var _ma = _pg && _pg.myAadhaar;; var _COLS = [
  ['About UIDAI', [['Vision & Mission', '/en/vision-and-mission'], ['Aadhaar Dashboard', '/en/aadhaar-dashboard'], ['Annual Reports', '/en/annual-reports']]],
  ['Aadhaar Services', [['Download Aadhaar', '/genricDownloadAadhaar'], ['Update Aadhaar', '/en/updating-data-on-aadhaar'], ['Check Aadhaar Status', '/check-aadhaar-validity/en'],
                        ['Order PVC Card', '/pvc/en'], ['Generate VID', '/genericGenerateOrRetrieveVID/en'], ['Retrieve Lost UID', '/retrieve-eid-uid/en']]],
  ['Documents', [['Enrolment & Update Forms', '/en/enrolment-and-updates'], ['Handbooks', '/en/handbooks'], ['Annual Reports', '/en/annual-reports'], ['Circulars', '/en/circulars'], ['Policies', '/en/policies']]],
  ['Quick Links', [['My Aadhaar Portal', '/'], ['Developer Sandbox', '/en/developer-section'], ['Become an OVSE', '/en/ovse']]],
  ['Other Links', [['Site Map', '/en/site-map'], ['Website Policies', '/en/website-policies'], ['Website Help', '/en/website-help']]]
];; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="topbar"><div className="shell topbar__inner"><a href="#main"><span>Skip to Main Content</span></a>
{' '}
<div className="topbar__tools"><a href="/en/website-help">{inc(L, 'svg', {n:'reader', cls:''})}
<span className="label-hide">Screen Reader</span></a>
{(_twin) ? (<><details className="tb-item"><summary aria-label={`Select language, currently ${_lang === 'en' ? 'English' : 'Hindi'}`}>{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:'chev'})}</summary>
{' '}
<div className="tb-menu"><a href={_lang === 'en' ? _cp : _twin} lang="en" {...A(_lang === 'en' ? 'aria-current="true"' : '')}>English</a>
{' '}
<a href={_lang === 'hi' ? _cp : _twin} lang="hi" {...A(_lang === 'hi' ? 'aria-current="true"' : '')}>हिन्दी</a></div></details></>) : (<><span className="tb-item">{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span></span></>)}
<details className="tb-item"><summary aria-label="Accessibility options">{inc(L, 'svg', {n:'access', cls:''})}
<span className="label-hide">More</span></summary>
{' '}
<div className="tb-menu" role="group" aria-label="Text size"><div className="tb-menu__label">Text size</div>
{' '}
<button type="button" data-text-size="small" aria-pressed="false">Smaller</button>
{' '}
<button type="button" data-text-size="normal" aria-pressed="true">Normal</button>
{' '}
<button type="button" data-text-size="large" aria-pressed="false">Larger</button></div></details>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="tb-item office-login" href="/office/login">Office login</a></>) : null}</div></div></div>
{' '}
<div className="brandbar"><div className="shell brandbar__inner"><a className="brandbar__logo" href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div></div>
{' '}
<div className="mainnav"><div className="shell mainnav__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">{inc(L, 'svg', {n:'menu', cls:''})}
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(_NAV).map(function (n, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={n[1]} {...A(_isHome(n[1]) ? 'aria-current="page"' : '')}>{inc(L, 'svg', {n:n[2], cls:''})}
<span>{`${(n[0]) ?? ''}`}</span></a></li></Fragment>); })}</ul></nav></div></div></header>
{(_pg && typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="pagehead"><div className="shell"><nav className="crumbs" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li>
{' '}
<li><span aria-current="page">{`${(_h1) ?? ''}`}</span></li></ol></nav>
{' '}
<h1 className={`pagehead__title${_ma ? '' : ' pagehead__title--plain'}`}>{`${(_h1) ?? ''}`}</h1>
{(_ma) ? (<><p className="pagehead__lede">{`${(_ma.intro) ?? ''}`}</p>
{' '}
<div className="insec"><h2 className="insec__title">In this section</h2>
{' '}
<ul className="chips">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><li><a href={`#${s.id}`}>{`${(s.title) ?? ''}`}</a></li></Fragment>); })}
<li><a href="#understand">Understand your Aadhaar</a></li></ul></div></>) : null}</div></section></>) : null}
<main id="main" className={page.centred ? 'centred-stage' : ''}>{(page.myAadhaar) ? (<>{inc(L, '../partials/my-aadhaar', { page: page })}</>) : null}
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
       var _groups = [], _cur = null;
       page.outline.forEach(function (h) {
         if (h.level === 1) return;
         if (h.level === 2) { _cur = { title: h.text, items: [] }; if (!_skip[h.text]) _groups.push(_cur); else _cur = null; return; }
         if (_cur) _cur.items.push(h.text);
       });; return <>{(_groups.length && !page.myAadhaar) ? (<><div className="outline">{(_groups).map(function (g, __k) { return (<Fragment key={__k}><section className="outline__group"><h2 className="outline__title">{`${(g.title) ?? ''}`}</h2>
{(g.items.length) ? (<><ul className="outline__list">{(g.items).map(function (t, __k) { return (<Fragment key={__k}><li>{`${(t) ?? ''}`}</li></Fragment>); })}</ul></>) : null}</section></Fragment>); })}</div></>) : null}
<details className="outline-note"><summary>{`Page outline as captured (${(page.outline.length) ?? ''} headings)`}</summary>
{' '}
<p>The original's heading structure, kept here so nothing captured is lost. Its body text is not copied: this replica does not republish government prose.</p>
{' '}
<ul>{(page.outline).map(function (h, __k) { return (<Fragment key={__k}><li style={S(`margin-left:${(h.level - 1) * 14}px`)}>{`${(h.text) ?? ''}`}</li></Fragment>); })}</ul></details></>; })()) : null}
{(page.noContentNote) ? (<><div className="panel"><p style={{"margin":"0"}} dangerouslySetInnerHTML={{ __html: page.noContentNote }} /></div></>) : null}</>); })()}</section></div></main>
<footer className="site-footer"><div className="shell"><div className="site-footer__card"><div className="shell" style={{"padding":"0 32px"}}><div className="f-top"><a href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div>
{' '}
<div className="f-cols">{(_COLS).map(function (c, __k) { return (<Fragment key={__k}><div className="f-col"><h2>{`${(c[0]) ?? ''}`}</h2>
{' '}
<ul>{(c[1]).map(function (l, __k) { return (<Fragment key={__k}><li><a href={l[1]}>{`${(l[0]) ?? ''}`}</a></li></Fragment>); })}</ul></div></Fragment>); })}</div>
{' '}
<div className="f-office"><div><h2 className="is-serif">UIDAI Head Office</h2>
{' '}
<p className="lead">Unique Identification Authority of India</p>
{' '}
<address><p>Bangla Sahib Road, Behind Kali Mandir,
<br />
Gole Market, New Delhi - 110001</p></address></div>
{' '}
<div><h2>Regional and State Offices</h2>
{' '}
<p><strong>Assam</strong></p>
{' '}
<p><strong>UIDAI Regional Office, Guwahati</strong></p>
{' '}
<address><p>Block-V, First Floor, HOUSEFED Complex, Beltola-Basistha Road, Dispur, Guwahati - 781 006</p></address></div>
{' '}
<div className="contact"><h2>Contact details</h2>
{' '}
<dl><dt>Toll-free Number</dt>
<dd>1947</dd>
{' '}
<dt>Email</dt>
<dd>help[at]uidai[dot]gov[dot]in</dd></dl></div></div>
{' '}
<div className="f-copy">Content structure follows uidai.gov.in. © Unique Identification Authority of India. This is an unofficial local demonstration.</div>
{' '}
<div className="f-notes"><p>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}for development and testing. Placeholder details only — no real office is represented.</p>
{' '}
<ul className="f-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li>
{' '}
<li>Not affiliated with, endorsed by, or operated by any government agency.</li></ul></div></div></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

export function V_pages_not_found(L) {
  const { $, Authority, Home, Identification, India, Unique, __boot, access, arrow, building, calendar, card, challenge, chev, cls, currentPath, document, download, en, errors, fingerprint, form, gapCounts, gapMeanings, gapTotal, grid, handshake, help, hi, home, i, idcard, info, items, language, menu, message, monitor, myAadhaar, note, officeButton, out, page, pageTitle, photo, reader, site, submitted, tables, title } = L;
  
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
<body>{(() => { var _pg = (typeof page !== 'undefined' && page) ? page : null;
var _cp = typeof currentPath === 'string' ? currentPath : '/';
var _lang = /^\/hi(\/|$)/.test(_cp) ? 'hi' : 'en';
// pages that exist in one language only
var _NO_TWIN = ['/en/qr-code-reader', '/en/aadhaar-dashboard/ekyc', '/en/v2'];
var _twin = null;
if (/^\/(en|hi)(\/|$)/.test(_cp) && _NO_TWIN.indexOf(_cp) < 0) _twin = (_lang === 'en' ? '/hi' : '/en') + _cp.slice(3);
var _NAV = [
  ['Home', '/en', 'home'], ['My Aadhaar', '/en/my-aadhaar', 'idcard'], ['About UIDAI', '/en/about-uidai', 'building'],
  ['Build with Us', '/en/developer-section', 'handshake'], ['Media', '/en/announcements', 'monitor'],
  ['Documents', '/en/documents', 'document'], ['Help', '/en/help', 'help']
];
var _isHome = function (p) { return _cp === p || (p === '/en' && _cp === '/'); };
var _clean = function (t) {
  return String(t || '').replace(/\s*[-|]\s*Unique Identification Authority of India.*$/i, '').replace(/^myAadhaar\s*$/i, 'myAadhaar').trim();
};
var _h1 = '';
if (_pg) {
  var _lv1 = (_pg.outline || []).filter(function (o) { return o.level === 1; })[0];
  _h1 = _clean(_pg.heading || title) || (_lv1 ? _lv1.text : title);
  if (_lv1 && /^(Home|myAadhaar)?$/i.test(_h1)) _h1 = _lv1.text;
}
var _ma = _pg && _pg.myAadhaar;; var _COLS = [
  ['About UIDAI', [['Vision & Mission', '/en/vision-and-mission'], ['Aadhaar Dashboard', '/en/aadhaar-dashboard'], ['Annual Reports', '/en/annual-reports']]],
  ['Aadhaar Services', [['Download Aadhaar', '/genricDownloadAadhaar'], ['Update Aadhaar', '/en/updating-data-on-aadhaar'], ['Check Aadhaar Status', '/check-aadhaar-validity/en'],
                        ['Order PVC Card', '/pvc/en'], ['Generate VID', '/genericGenerateOrRetrieveVID/en'], ['Retrieve Lost UID', '/retrieve-eid-uid/en']]],
  ['Documents', [['Enrolment & Update Forms', '/en/enrolment-and-updates'], ['Handbooks', '/en/handbooks'], ['Annual Reports', '/en/annual-reports'], ['Circulars', '/en/circulars'], ['Policies', '/en/policies']]],
  ['Quick Links', [['My Aadhaar Portal', '/'], ['Developer Sandbox', '/en/developer-section'], ['Become an OVSE', '/en/ovse']]],
  ['Other Links', [['Site Map', '/en/site-map'], ['Website Policies', '/en/website-policies'], ['Website Help', '/en/website-help']]]
];; return (<><a className="skip-link" href="#main">Skip to main content</a>
{' '}
<div className="demo-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong>
{' '}
<span>Synthetic data only. Nothing here is submitted to any government system.</span></div>
<header className="site-header"><div className="topbar"><div className="shell topbar__inner"><a href="#main"><span>Skip to Main Content</span></a>
{' '}
<div className="topbar__tools"><a href="/en/website-help">{inc(L, 'svg', {n:'reader', cls:''})}
<span className="label-hide">Screen Reader</span></a>
{(_twin) ? (<><details className="tb-item"><summary aria-label={`Select language, currently ${_lang === 'en' ? 'English' : 'Hindi'}`}>{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span>
{inc(L, 'svg', {n:'chev', cls:'chev'})}</summary>
{' '}
<div className="tb-menu"><a href={_lang === 'en' ? _cp : _twin} lang="en" {...A(_lang === 'en' ? 'aria-current="true"' : '')}>English</a>
{' '}
<a href={_lang === 'hi' ? _cp : _twin} lang="hi" {...A(_lang === 'hi' ? 'aria-current="true"' : '')}>हिन्दी</a></div></details></>) : (<><span className="tb-item">{inc(L, 'svg', {n:'language', cls:''})}
<span>{`${(_lang === 'en' ? 'English' : 'हिन्दी') ?? ''}`}</span></span></>)}
<details className="tb-item"><summary aria-label="Accessibility options">{inc(L, 'svg', {n:'access', cls:''})}
<span className="label-hide">More</span></summary>
{' '}
<div className="tb-menu" role="group" aria-label="Text size"><div className="tb-menu__label">Text size</div>
{' '}
<button type="button" data-text-size="small" aria-pressed="false">Smaller</button>
{' '}
<button type="button" data-text-size="normal" aria-pressed="true">Normal</button>
{' '}
<button type="button" data-text-size="large" aria-pressed="false">Larger</button></div></details>
{(typeof officeButton !== 'undefined' && officeButton) ? (<><a className="tb-item office-login" href="/office/login">Office login</a></>) : null}</div></div></div>
{' '}
<div className="brandbar"><div className="shell brandbar__inner"><a className="brandbar__logo" href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div></div>
{' '}
<div className="mainnav"><div className="shell mainnav__inner"><button className="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">{inc(L, 'svg', {n:'menu', cls:''})}
Menu</button>
{' '}
<nav id="primary-nav" className="primary-nav" aria-label="Primary"><ul className="primary-nav__list">{(_NAV).map(function (n, __k) { return (<Fragment key={__k}><li><a className="primary-nav__link" href={n[1]} {...A(_isHome(n[1]) ? 'aria-current="page"' : '')}>{inc(L, 'svg', {n:n[2], cls:''})}
<span>{`${(n[0]) ?? ''}`}</span></a></li></Fragment>); })}</ul></nav></div></div></header>
{(_pg && typeof pageTitle !== 'undefined' && pageTitle) ? (<><section className="pagehead"><div className="shell"><nav className="crumbs" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li>
{' '}
<li><span aria-current="page">{`${(_h1) ?? ''}`}</span></li></ol></nav>
{' '}
<h1 className={`pagehead__title${_ma ? '' : ' pagehead__title--plain'}`}>{`${(_h1) ?? ''}`}</h1>
{(_ma) ? (<><p className="pagehead__lede">{`${(_ma.intro) ?? ''}`}</p>
{' '}
<div className="insec"><h2 className="insec__title">In this section</h2>
{' '}
<ul className="chips">{(_ma.sections).map(function (s, __k) { return (<Fragment key={__k}><li><a href={`#${s.id}`}>{`${(s.title) ?? ''}`}</a></li></Fragment>); })}
<li><a href="#understand">Understand your Aadhaar</a></li></ul></div></>) : null}</div></section></>) : null}
<main id="main"><div className="shell"><section className="section"><h1 className="section__title">404 — Not found</h1>
{' '}
<div className="prose"><p>No page in this local demonstration matches that address.</p>
{(typeof note !== 'undefined' && note) ? (<><div className="panel"><p style={{"margin":"0"}}>{`${(note) ?? ''}`}</p></div></>) : null}
<p><a href="/">Return to the home page</a>
.</p></div></section></div></main>
<footer className="site-footer"><div className="shell"><div className="site-footer__card"><div className="shell" style={{"padding":"0 32px"}}><div className="f-top"><a href="/en" aria-label="Unique Identification Authority of India: home"><img src="/original-assets/icons/logoWithTitle.svg" alt="Aadhaar. Unique Identification Authority of India" width="525" height="64" /></a></div>
{' '}
<div className="f-cols">{(_COLS).map(function (c, __k) { return (<Fragment key={__k}><div className="f-col"><h2>{`${(c[0]) ?? ''}`}</h2>
{' '}
<ul>{(c[1]).map(function (l, __k) { return (<Fragment key={__k}><li><a href={l[1]}>{`${(l[0]) ?? ''}`}</a></li></Fragment>); })}</ul></div></Fragment>); })}</div>
{' '}
<div className="f-office"><div><h2 className="is-serif">UIDAI Head Office</h2>
{' '}
<p className="lead">Unique Identification Authority of India</p>
{' '}
<address><p>Bangla Sahib Road, Behind Kali Mandir,
<br />
Gole Market, New Delhi - 110001</p></address></div>
{' '}
<div><h2>Regional and State Offices</h2>
{' '}
<p><strong>Assam</strong></p>
{' '}
<p><strong>UIDAI Regional Office, Guwahati</strong></p>
{' '}
<address><p>Block-V, First Floor, HOUSEFED Complex, Beltola-Basistha Road, Dispur, Guwahati - 781 006</p></address></div>
{' '}
<div className="contact"><h2>Contact details</h2>
{' '}
<dl><dt>Toll-free Number</dt>
<dd>1947</dd>
{' '}
<dt>Email</dt>
<dd>help[at]uidai[dot]gov[dot]in</dd></dl></div></div>
{' '}
<div className="f-copy">Content structure follows uidai.gov.in. © Unique Identification Authority of India. This is an unofficial local demonstration.</div>
{' '}
<div className="f-notes"><p>Unofficial local demonstration of{' '}
<code>{`${(site.hostname) ?? ''}`}</code>
{' '}for development and testing. Placeholder details only — no real office is represented.</p>
{' '}
<ul className="f-legal"><li><a href="/__about">About this replica</a></li>
{' '}
<li><a href="/__gaps">What is not reproduced</a></li>
{' '}
<li>Not affiliated with, endorsed by, or operated by any government agency.</li></ul></div></div></div></div></footer>
{' '}
<script id="boot" type="application/json" dangerouslySetInnerHTML={{ __html: __boot }} />
<script type="module" src="/account/ui/app/portal.js"></script></>); })()}</body></html>
    </>
  );
}

const PARTIALS = {
  'my-aadhaar': P_my_aadhaar,
  'svg': P_svg,
};

export const localNames = ['$', 'Authority', 'Home', 'Identification', 'India', 'Unique', '__boot', 'access', 'arrow', 'building', 'calendar', 'card', 'challenge', 'chev', 'cls', 'currentPath', 'document', 'download', 'en', 'errors', 'fingerprint', 'form', 'gapCounts', 'gapMeanings', 'gapTotal', 'grid', 'handshake', 'help', 'hi', 'home', 'i', 'idcard', 'info', 'items', 'language', 'menu', 'message', 'monitor', 'myAadhaar', 'n', 'note', 'officeButton', 'out', 'page', 'pageTitle', 'photo', 'reader', 'site', 'submitted', 'tables', 'title'];

// plain scripts a view needs in the browser (ePrisons); loaded after the page is hydrated
export const scripts = {};

export const views = {
  'pages/about': V_pages_about,
  'pages/error': V_pages_error,
  'pages/gaps': V_pages_gaps,
  'pages/generic': V_pages_generic,
  'pages/not-found': V_pages_not_found,
};
