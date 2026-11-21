/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Intake({ ctx, system, rows, systems }) {
  
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Received Records
{(system) ? (<>{' '}
<span style={{"fontWeight":"500","color":"var(--text-3)","fontSize":"18px"}}>—{' '}
{system}</span></>) : null}</h1>
{' '}
<p className="page-desc">Every row the ERP accepted, newest first. Idempotent: a retry with the same{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>source_system + source_reference</code>
{' '}returns 200 and adds no row.</p></div>
{' '}
<div className="page-actions"><button className="btn" type="button" onClick={() => ctx.exportTableCSV('erp-records.csv')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
{' '}Export CSV</button></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Intake rows</div>
{' '}
<div className="card-sub">{rows.length}
{' '}record
{rows.length === 1 ? '' : 's'}
{(system) ? (<>{' '}from{' '}
<strong>{system}</strong></>) : null}</div></div>
{' '}
</div>
<div className="tbl-toolbar"><div className="filter-chips"><a href="/intake" className={`filter-chip${!system ? ' is-active' : ''}`}>All</a>
{(systems).map(function (s, __k) { return (<Fragment key={__k}><a href={`/intake?system=${s.code}`} className={`filter-chip${system === s.code ? ' is-active' : ''}`}>{s.code}</a></Fragment>); })}</div>
{' '}
<div className="tbl-search-wrap"><div className="tbl-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"></circle>
<path d="m20 20-3.2-3.2"></path></svg>
{' '}
<input id="tableSearch" type="search" placeholder="Search…" autoComplete="off" aria-label="Search records" /></div></div></div>
{(!rows.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
<path d="M14 5v5h5M8 14h8M8 17h5"></path></svg></div>
{' '}
<div className="empty-title">No records
{(system) ? (<>{' '}from{' '}
{system}</>) : null}
{' '}yet</div>
{' '}
<div className="empty-hint">{(system) ? (<>Try a different portal filter or wait for a submission.</>) : (<>Submit a form on any portal and it will appear here.</>)}</div></div></>) : (<><div className="tbl-wrap"><table className="tbl" id="mainTable"><thead><tr><th data-sort="">ERP Ref</th>
<th data-sort="">Source</th>
<th data-sort="">Form</th>
<th data-sort="">Portal Ref</th>
<th data-sort="">Citizen</th>
<th data-sort="">Fields</th>
<th data-sort="">Received</th></tr></thead>
<tbody>{(rows).map(function (r, __k) { var fields = r.fields || [];; return (<Fragment key={__k}><tr className="clickable" onClick={() => ctx.openDrawer(r.intake_ref, <Drawer kind="intake" row={r} />)}><td><code className="mono-chip">{r.intake_ref}</code>
<br />
<span style={{"fontSize":"11px","color":"var(--text-3)","fontFamily":"var(--mono)"}}>{r.received_at}</span></td>
<td><span className="sys-chip">{r.source_system}</span></td>
<td><span style={{"fontWeight":"500"}}>{r.subject || r.source_form}</span>
{(r.source_route) ? (<><br />
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px","color":"var(--text-3)"}}>{r.source_route}</code></>) : null}</td>
<td><code className="mono-chip">{r.source_reference}</code></td>
<td>{(r.full_name) ? (<><strong>{r.full_name}</strong></>) : (<><span style={{"color":"var(--text-4)"}}>—</span></>)}
{(r.email) ? (<><br />
<span style={{"fontSize":"11.5px","color":"var(--text-3)"}}>{r.email}</span></>) : null}</td>
<td>{(!fields.length) ? (<><span style={{"color":"var(--text-4)"}}>—</span></>) : (<><span className="pill pill-neutral" style={{"fontSize":"11px"}}>{fields.length}</span></>)}</td>
<td style={{"color":"var(--text-3)","fontSize":"12.5px","whiteSpace":"nowrap"}}>{r.received_at}</td></tr></Fragment>); })}</tbody></table></div>
<div className="pager"><span className="pager-info" id="pagerInfo"></span>
{' '}
<button className="pager-btn" id="pagerPrev" type="button" onClick={() => ctx.goPage(-1)} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="pager-btn" id="pagerNext" type="button" onClick={() => ctx.goPage(1)} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6"></path></svg></button></div></>)}
<div style={{"padding":"10px 20px","borderTop":"1px solid var(--border)","fontSize":"11.5px","lineHeight":"1.7","color":"var(--text-3)","overflowWrap":"anywhere"}}><svg style={{"verticalAlign":"-2px","marginRight":"6px"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"></circle>
<path d="M12 8h.01M11 12h1v4h1"></path></svg>
{' '}Only{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>source_system</code>
{' '}+{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>source_reference</code>
{' '}pairs documented in the project appear; others are logged as illustrative.</div></div>
    </>
  );
}
