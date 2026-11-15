/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Audit({ ctx, rows }) {
  
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Audit Trail</h1>
{' '}
<p className="page-desc">Append-only, enforced by database triggers:{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"12px","background":"var(--surface-3)","padding":"1px 5px","borderRadius":"5px"}}>audit_log</code>
{' '}rejects every UPDATE and DELETE, so no role can alter it. Required by{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>erp-scope.pdf</code>
{' '}section 4.</p></div>
{' '}
<div className="page-actions"><span className="pill pill-neutral" style={{"height":"34px","padding":"0 12px","display":"inline-flex","alignItems":"center","gap":"5px","fontSize":"11.5px"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><rect x="4" y="10" width="16" height="10" rx="2"></rect>
<path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
{' '}read-only · append-only</span>
{' '}
<button className="btn" type="button" onClick={() => ctx.exportTableCSV('erp-audit.csv')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
{' '}Export CSV</button></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Audit events</div>
{' '}
<div className="card-sub">{rows.length}
{' '}event
{rows.length === 1 ? '' : 's'}
{' '}recorded</div></div>
{' '}
<span className="pill pill-mint">audit_log</span></div>
<div className="tbl-toolbar"><div className="tbl-search-wrap" style={{"maxWidth":"300px","width":"100%"}}><div className="tbl-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"></circle>
<path d="m20 20-3.2-3.2"></path></svg>
{' '}
<input id="tableSearch" type="search" placeholder="Search events…" autoComplete="off" aria-label="Search audit events" /></div></div></div>
{(!rows.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h9l3 3v13H9z"></path>
<path d="M6 7H3v13h9"></path>
<path d="M13 9h5M13 13h5M13 17h3"></path></svg></div>
{' '}
<div className="empty-title">The audit trail is empty</div>
{' '}
<div className="empty-hint">Events are written automatically as records arrive through the intake API.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl" id="mainTable"><thead><tr><th data-sort="">#</th>
<th data-sort="">When</th>
<th data-sort="">Entity</th>
<th data-sort="">Action</th>
<th data-sort="">Maker</th>
<th data-sort="">Approver</th>
<th>Details</th></tr></thead>
<tbody>{(rows).map(function (r, __k) { return (<Fragment key={__k}><tr><td style={{"fontFamily":"var(--mono)","fontSize":"12px","color":"var(--text-3)","fontVariantNumeric":"tabular-nums"}}>{r.id}</td>
<td style={{"fontSize":"12.5px","color":"var(--text-2)","whiteSpace":"nowrap"}}>{r.occurred_at}</td>
<td><span style={{"fontWeight":"600"}}>{r.entity}</span>
{' '}
<code className="mono-chip" style={{"marginLeft":"4px"}}>{r.entity_id}</code></td>
<td>{(() => { var actionLower = (r.action || '').toLowerCase();
                  var pillClass = 'pill-ok';
                  if (actionLower.includes('delete') || actionLower.includes('fail') || actionLower.includes('reject'))
                    pillClass = 'pill-danger';
                  else if (actionLower.includes('update') || actionLower.includes('change'))
                    pillClass = 'pill-warn';
                  else if (actionLower.includes('create') || actionLower.includes('insert'))
                    pillClass = 'pill-ok';
                  else
                    pillClass = 'pill-info';; return (<><span className={`pill ${pillClass}`}>{r.action}</span></>); })()}</td>
<td style={{"fontWeight":"600","fontSize":"13px"}}>{r.maker}</td>
<td style={{"color":"var(--text-3)"}}>{r.approver || '—'}</td>
<td style={{"fontSize":"12.5px","color":"var(--text-2)","maxWidth":"280px","overflow":"hidden","textOverflow":"ellipsis"}} title={r.details || ''}>{r.details || '—'}</td></tr></Fragment>); })}</tbody></table></div>
<div className="pager"><span className="pager-info" id="pagerInfo"></span>
{' '}
<button className="pager-btn" id="pagerPrev" type="button" onClick={() => ctx.goPage(-1)} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6"></path></svg></button>
{' '}
<button className="pager-btn" id="pagerNext" type="button" onClick={() => ctx.goPage(1)} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6"></path></svg></button></div></>)}
<div style={{"padding":"10px 20px","borderTop":"1px solid var(--border)","fontSize":"11.5px","lineHeight":"1.7","color":"var(--text-3)","overflowWrap":"anywhere"}}><svg style={{"verticalAlign":"-2px","marginRight":"6px"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="10" width="16" height="10" rx="2"></rect>
<path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
{' '}Database triggers prevent any UPDATE or DELETE on{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>audit_log</code>
. This console provides no editing controls.{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px","marginLeft":"2px"}}>maker</code>
{' '}records the caller —{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>platform-api</code>
{' '}for write-through,{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>seed</code>
{' '}for the registry.</div></div>
    </>
  );
}
