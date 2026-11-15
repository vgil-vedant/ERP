/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Citizens({ ctx, rows }) {
  
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Citizens</h1>
{' '}
<p className="page-desc">One row per person in{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"12px","background":"var(--surface-3)","padding":"1px 5px","borderRadius":"5px"}}>citizen</code>
, keyed by{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>citizen_ref</code>
. Registered once on any portal, reusable on all five. The{' '}
<strong>Used on</strong>
{' '}column shows every portal that has since sent data for them.</p></div>
{' '}
<div className="page-actions"><button className="btn" type="button" onClick={() => ctx.exportTableCSV('erp-citizens.csv')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
{' '}Export CSV</button>
{' '}
<a href="/intake" className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10"></path></svg>
{' '}Received Records</a></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Registered citizens</div>
{' '}
<div className="card-sub">{rows.length}
{' '}citizen
{rows.length === 1 ? '' : 's'}
{' '}in erp.sqlite</div></div>
{' '}
<span className="pill pill-mint">GET /api/citizens</span></div>
<div className="tbl-toolbar"><div className="tbl-search-wrap" style={{"maxWidth":"300px","width":"100%"}}><div className="tbl-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"></circle>
<path d="m20 20-3.2-3.2"></path></svg>
{' '}
<input id="tableSearch" type="search" placeholder="Search name, email, ref…" autoComplete="off" aria-label="Search citizens" /></div></div></div>
{(!rows.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"></path>
<circle cx="9" cy="7.5" r="3.5"></circle>
<path d="M17 11a3 3 0 1 0 0-6"></path>
<path d="M22 20v-1.5a4 4 0 0 0-3-3.8"></path></svg></div>
{' '}
<div className="empty-title">No citizens registered yet</div>
{' '}
<div className="empty-hint">Register on any portal and the citizen record will appear here.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl" id="mainTable"><thead><tr><th data-sort="">Citizen Ref</th>
<th data-sort="">Name</th>
<th data-sort="">Email</th>
<th data-sort="">Mobile</th>
<th data-sort="">Registered on</th>
<th data-sort="">Used on</th>
<th data-sort="">Records</th></tr></thead>
<tbody>{(rows).map(function (c, __k) { var systemList = c.systems ? c.systems.split(',') : [];; return (<Fragment key={__k}><tr className="clickable" onClick={() => ctx.openDrawer(c.citizen_ref, <Drawer kind="citizens" row={c} />)}><td><code className="mono-chip">{c.citizen_ref}</code></td>
<td><strong>{c.full_name}</strong></td>
<td style={{"color":"var(--text-2)"}}>{c.email}</td>
<td style={{"fontFamily":"var(--mono)","fontSize":"12.5px","color":"var(--text-2)"}}>{c.mobile || '—'}</td>
<td><span className="sys-chip">{c.first_seen_in}</span>
{' '}
<br />
<span style={{"fontSize":"11px","color":"var(--text-3)"}}>{c.registered_on}</span></td>
<td>{(!systemList.length) ? (<><span style={{"color":"var(--text-4)"}}>—</span></>) : (<>{(systemList).map(function (s, __k) { return (<Fragment key={__k}><span className="sys-chip" style={{"margin":"1px"}}>{s}</span>
{' '}</Fragment>); })}</>)}</td>
<td><span style={{"fontSize":"15px","fontWeight":"700","fontVariantNumeric":"tabular-nums"}}>{c.intake_count}</span></td></tr></Fragment>); })}</tbody></table></div>
<div className="pager"><span className="pager-info" id="pagerInfo"></span>
{' '}
<button className="pager-btn" id="pagerPrev" type="button" onClick={() => ctx.goPage(-1)} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="pager-btn" id="pagerNext" type="button" onClick={() => ctx.goPage(1)} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6"></path></svg></button></div></>)}</div>
    </>
  );
}
