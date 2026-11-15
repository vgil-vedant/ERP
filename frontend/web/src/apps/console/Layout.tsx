/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Layout({ currentPath, locals, children }) {
  
  return (
    <>
<div className="demo-notice">Unofficial Local Demonstration — Not an Official Government Service</div>
{' '}
<div className="app" id="app"><aside className="sidebar" id="sidebar" aria-label="ERP workspace navigation"><div className="brand"><div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
{' '}
<rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
{' '}
<rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
{' '}
<path d="M14 17.5h7M17.5 14v7"></path></svg></div>
{' '}
<div className="brand-text"><div className="brand-name">ERP Hub</div>
{' '}
<div className="brand-sub">Maharashtra Prisons</div></div>
{' '}
<button className="brand-close" id="navClose" type="button" aria-label="Close navigation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button></div>
{' '}
<div className="workspace-cta"><span className="ws-dot" aria-hidden="true"></span>
{' '}
<div className="ws-main"><div className="ws-title">ERP service · intake console</div>
{' '}
<div className="ws-sub" id="erpAddress">127.0.0.1:4200</div></div></div>
{' '}
<nav className="nav" id="mainNav" aria-label="Main navigation"><div className="nav-group"><button className="nav-group-head" type="button" aria-expanded="true"><span className="grp-index">01</span>
{' '}
<span>Overview</span>
{' '}
<svg className="grp-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<div className="nav-items"><a href="/" className={`nav-item${currentPath === '/' ? ' is-active' : ''}`} data-label="Dashboard"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"></path></svg>
{' '}
<span className="nav-label">Dashboard</span></a></div></div>
{' '}
<div className="nav-group"><button className="nav-group-head" type="button" aria-expanded="true"><span className="grp-index">02</span>
{' '}
<span>ERP Management</span>
{' '}
<svg className="grp-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<div className="nav-items"><a href="/intake" className={`nav-item${currentPath === '/intake' ? ' is-active' : ''}`} data-label="Received Records"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13h4l2 3h4l2-3h4"></path>
<path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"></path></svg>
{' '}
<span className="nav-label">Received Records</span></a>
{' '}
<a href="/lookup" className={`nav-item${currentPath === '/lookup' ? ' is-active' : ''}`} data-label="Person Lookup"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"></rect><circle cx="9" cy="11" r="2.2"></circle><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14.5 10h4M14.5 13.5h3"></path></svg>
<span className="nav-label">Person Lookup</span></a>
<a href="/citizens" className={`nav-item${currentPath === '/citizens' ? ' is-active' : ''}`} data-label="Citizens"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"></path>
<circle cx="9" cy="7.5" r="3.5"></circle>
<path d="M17 11a3 3 0 1 0 0-6"></path>
<path d="M22 20v-1.5a4 4 0 0 0-3-3.8"></path></svg>
{' '}
<span className="nav-label">Citizens</span></a>
{' '}
<a href="/audit" className={`nav-item${currentPath === '/audit' ? ' is-active' : ''}`} data-label="Audit Trail"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"></path>
<path d="m9 12 2 2 4-4"></path></svg>
{' '}
<span className="nav-label">Audit Trail</span></a></div></div>
{' '}
<div className="nav-group"><button className="nav-group-head" type="button" aria-expanded="true"><span className="grp-index">03</span>
{' '}
<span>Government Portals</span>
{' '}
<svg className="grp-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<div className="nav-items"><a href="/portals?system=eprisons" className={`nav-item${currentPath === '/portals' && locals.filter === 'eprisons' ? ' is-active' : ''}`} data-label="ePrisons"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"></path>
<path d="M8 8v13M12 8v13M16 8v13M3 21h18"></path></svg>
{' '}
<span className="nav-label">ePrisons</span></a>
{' '}
<a href="/portals?system=cctns" className={`nav-item${currentPath === '/portals' && locals.filter === 'cctns' ? ' is-active' : ''}`} data-label="CCTNS"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9.5 4.6-1.3 8-5.1 8-9.5V6l-8-3Z"></path>
<path d="M12 8v8M8.5 11h7"></path></svg>
{' '}
<span className="nav-label">CCTNS</span></a>
{' '}
<a href="/portals?system=eforensics" className={`nav-item${currentPath === '/portals' && locals.filter === 'eforensics' ? ' is-active' : ''}`} data-label="e-Forensics"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"></path>
<path d="M7.5 15h9"></path></svg>
{' '}
<span className="nav-label">e-Forensics</span></a>
{' '}
<a href="/portals?system=uidai" className={`nav-item${currentPath === '/portals' && locals.filter === 'uidai' ? ' is-active' : ''}`} data-label="UIDAI / Aadhaar"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4a8 8 0 0 1 8 8v2"></path>
<path d="M4 12a8 8 0 0 1 8-8"></path>
<path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"></path>
<path d="M7 20a13 13 0 0 1-.6-4v-4"></path>
<path d="M11 12v5a7 7 0 0 0 .5 2.5"></path></svg>
{' '}
<span className="nav-label">UIDAI / Aadhaar</span></a>
{' '}
<a href="/portals?system=ecourts" className={`nav-item${currentPath === '/portals' && locals.filter === 'ecourts' ? ' is-active' : ''}`} data-label="eCourts"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M5 20h14M6 20V10m12 10V10M3 10h18"></path>
<path d="M12 6 3 10h18L12 6Z"></path>
<path d="M9 20v-5m6 5v-5"></path></svg>
{' '}
<span className="nav-label">eCourts</span></a>
{' '}
<a href="/portals" className={`nav-item${currentPath === '/portals' && !locals.filter ? ' is-active' : ''}`} data-label="All Portals"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
<rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
<rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
<rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>
{' '}
<span className="nav-label">All Portals</span></a></div></div>
<div className="nav-group"><button className="nav-group-head" type="button" aria-expanded="true"><span className="grp-index">04</span>
{' '}
<span>Integration</span>
{' '}
<svg className="grp-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6"></path></svg></button>
{' '}
<div className="nav-items"><a href="/sync" className={`nav-item${currentPath === '/sync' ? ' is-active' : ''}`} data-label="Sync Activity"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v6h6M20 20v-6h-6"></path>
<path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"></path></svg>
{' '}
<span className="nav-label">Sync Activity</span></a>
{' '}
<a href="/integration" className={`nav-item${currentPath === '/integration' ? ' is-active' : ''}`} data-label="Integration Status"><svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"></path></svg>
{' '}
<span className="nav-label">Integration Status</span></a></div></div></nav>
{' '}
<div className="sidebar-foot"><div className="sf-note"><b>Unofficial local demonstration.</b>
{' '}This console reads{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10px"}}>erp.sqlite</code>
{' '}only — no live government data.</div>
{' '}
<div className="sf-row"><span className="sf-version">v1.0.0</span>
{' '}
<button className="collapse-btn" id="collapseBtn" type="button" aria-label="Collapse navigation" aria-expanded="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg></button></div></div></aside>
{' '}
<div className="scrim" id="navScrim" hidden></div>
<div className="shell"><header className="topbar"><button className="menu-btn" id="menuBtn" type="button" aria-label="Open navigation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
{' '}
<nav className="crumbs" aria-label="Breadcrumb"><span className="root">ERP Hub</span>
{' '}
<span className="sep">/</span>
{' '}
<span className="now">{(currentPath === '/') ? (<>Dashboard</>) : (currentPath === '/intake') ? (<>Received Records</>) : (currentPath === '/lookup') ? (<>Person Lookup</>) : (currentPath === '/citizens') ? (<>Citizens</>) : (currentPath === '/audit') ? (<>Audit Trail</>) : (currentPath === '/portals') ? (<>Government Portals</>) : (currentPath === '/sync') ? (<>Sync Activity</>) : (currentPath === '/integration') ? (<>Integration Status</>) : (<>Console</>)}</span></nav>
{' '}
<div className="topbar-search"><div className="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"></circle>
<path d="m20 20-3.2-3.2"></path></svg>
{' '}
<input id="globalSearch" type="search" placeholder="Search refs, citizens…" autoComplete="off" aria-label="Search table rows" />
{' '}
<span className="kbd">/</span></div></div>
{' '}
<div className="topbar-right"><button className="chip-service" type="button" title="ERP service address"><span className="dot"></span>
{' '}
<span>ERP service</span>
{' '}
<code id="serviceAddr">:4200</code></button>
{' '}
<span className="chip-date" id="dateChip" title="Today"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"></rect>
<path d="M8 3v4M16 3v4M3 10h18"></path></svg>
{' '}
<span id="todayChip"></span></span></div></header>
{' '}
<main className="main">{children}
{' '}</main>
{' '}
<footer className="app-foot"><b>ERP Hub · Maharashtra Prisons</b>
{' '}— Unofficial Local Demonstration · Not an Official Government Service · Read-only console for{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>erp.sqlite</code></footer></div></div>
    </>
  );
}
