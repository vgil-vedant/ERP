/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Sync({ ctx, rows, summary, total, siteFilter, pgAvailable }) {
  /* result pill colour */
  function resultClass(s) {
    if (s === 'kept')        return 'pill-ok';
    if (s === 'duplicate')   return 'pill-warn';
    if (s === 'rolled_back') return 'pill-danger';
    return 'pill-neutral';
  }
  function httpClass(code) {
    if (!code) return 'pill-neutral';
    if (code < 300) return 'pill-ok';
    if (code < 400) return 'pill-warn';
    return 'pill-danger';
  }
  var SITE_LABELS = {
    eprisons: 'ePrisons', cctns: 'CCTNS', eforensics: 'e-Forensics',
    uidai: 'UIDAI', ecourts: 'eCourts'
  };;
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Sync Activity</h1>
{' '}
<p className="page-desc">One row per write-through attempt. A rolled-back attempt has no matching intake row — the portal undid its own insert when the ERP refused the write.</p></div>
{' '}
<div className="page-actions">{(siteFilter) ? (<><a href="/sync" className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"></path></svg>
{' '}All portals</a></>) : null}
<button className="btn" onClick={() => ctx.exportTableCSV('erp-sync.csv')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
{' '}Export</button></div></div>
{(!pgAvailable && total === 0) ? (<><div style={{"background":"var(--warning-bg)","border":"1px solid #E8D5A0","borderRadius":"var(--r-sm)","padding":"12px 16px","marginBottom":"18px","display":"flex","alignItems":"flex-start","gap":"10px"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{"width":"15px","height":"15px","flexShrink":"0","marginTop":"1px","color":"#B67C24"}}><path d="M12 9v4M12 17h.01"></path>
<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path></svg>
{' '}
<div><strong style={{"fontSize":"13px"}}>PostgreSQL unavailable</strong>
<br />
{' '}
<span style={{"fontSize":"12.5px","color":"var(--text-2)"}}>Run{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>npm install</code>
{' '}in the project root, then restart the ERP server. The sync ledger lives in{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>demo_replica</code>
{' '}(Docker: ERP_postgres, port 7432).</span></div></div></>) : null}
{(summary && summary.length) ? ((() => { var grandTotal    = summary.reduce(function(a,b){ return a+(b.total||0); }, 0);
  var grandKept     = summary.reduce(function(a,b){ return a+(b.kept||0); }, 0);
  var grandDup      = summary.reduce(function(a,b){ return a+(b.duplicate||0); }, 0);
  var grandRolled   = summary.reduce(function(a,b){ return a+(b.rolled_back||0); }, 0);; return <><div className="g-kpi" style={{"marginBottom":"18px"}}><div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4v6h6M20 20v-6h-6"></path>
<path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"></path></svg></div>
{' '}
<span className="pill pill-neutral">ledger</span></div>
{' '}
<div className="kpi-label">Total Attempts</div>
{' '}
<div className="kpi-value">{grandTotal}</div>
{' '}
<div className="kpi-note">erp_sync ledger · all portals</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 6 9 17l-5-5"></path></svg></div>
{' '}
<span className="pill pill-ok">HTTP 201</span></div>
{' '}
<div className="kpi-label">Kept</div>
{' '}
<div className="kpi-value">{grandKept}</div>
{' '}
<div className="kpi-note">successfully written to ERP</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"></path></svg></div>
{' '}
<span className="pill pill-warn">HTTP 200</span></div>
{' '}
<div className="kpi-label">Duplicate</div>
{' '}
<div className="kpi-value">{grandDup}</div>
{' '}
<div className="kpi-note">idempotent — already in ERP</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></div>
{' '}
<span className="pill pill-danger">4xx / 5xx</span></div>
{' '}
<div className="kpi-label">Rolled Back</div>
{' '}
<div className="kpi-value">{grandRolled}</div>
{' '}
<div className="kpi-note">portal undid insert on refusal</div></div></div></>; })()) : null}
<div style={{"display":"flex","alignItems":"center","gap":"10px","flexWrap":"wrap","marginBottom":"14px"}}><div className="search-field" style={{"maxWidth":"340px","flex":"1"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle>
<path d="m20 20-3.2-3.2"></path></svg>
{' '}
<input id="globalSearch" type="search" placeholder="Search submission ref, intake ref or portal…" autoComplete="off" />
{' '}
<span className="kbd">/</span></div>
<div style={{"display":"flex","gap":"6px","flexWrap":"wrap"}}><a href="/sync" className={`chip-filter${!siteFilter ? ' is-active' : ''}`}>All portals</a>
{(['eprisons','cctns','eforensics','uidai','ecourts']).map(function (code, __k) { return (<Fragment key={__k}><a href={`/sync?system=${code}`} className={`chip-filter${siteFilter === code ? ' is-active' : ''}`}>{SITE_LABELS[code] || code}</a></Fragment>); })}</div></div>
<div className="card"><div className="card-head"><div><div className="card-title">{(siteFilter) ? (<>{SITE_LABELS[siteFilter] || siteFilter}
{' '}sync log</>) : (<>Write-through attempts</>)}</div>
{' '}
<div className="card-sub">{(total) ? (<>{total}
{' '}attempts · erp_sync ledger · synchronous write-through · hub /api/sync</>) : (<>No sync data yet</>)}</div></div>
{' '}
<button className="btn btn-sm" onClick={() => ctx.exportTableCSV('erp-sync.csv')}>Export CSV</button></div>
{(!rows || !rows.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4v6h6M20 20v-6h-6"></path>
<path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"></path></svg></div>
{' '}
<div className="empty-title">No sync records found</div>
{' '}
<div className="empty-hint">Sync data is read from{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>demo_replica</code>
{' '}(PostgreSQL). Ensure the Docker container is running and{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>npm install</code>
{' '}has been run.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl"><thead><tr><th data-sort="">Attempted at</th>
<th data-sort="">Portal</th>
<th data-sort="">Submission ref</th>
<th data-sort="">ERP intake ref</th>
<th data-sort="">HTTP</th>
<th data-sort="">Result</th>
<th>Message</th></tr></thead>
<tbody>{(rows).map(function (r, __k) { return (<Fragment key={__k}><tr className="clickable" onClick={() => ctx.openDrawer(r.local_ref || r.erp_ref || 'Sync record', <Drawer kind="sync" row={r} />)}><td style={{"whiteSpace":"nowrap","fontSize":"12.5px","color":"var(--text-2)"}}>{r.attempted_at ? r.attempted_at.replace('T',' ').slice(0,16) : '—'}</td>
<td><span className="sys-chip" style={{"fontSize":"11.5px"}}>{r.site_label || r.site_code}</span></td>
<td><code className="mono-chip">{r.local_ref || '—'}</code></td>
<td>{(r.erp_ref) ? (<><a href="/intake" style={{"color":"var(--emerald)","textDecoration":"underline","fontFamily":"var(--mono)","fontSize":"11.5px"}}>{r.erp_ref}</a></>) : (<><span style={{"color":"var(--text-4)"}}>—</span></>)}</td>
<td><span className={`pill ${httpClass(r.http_status)}`} style={{"fontSize":"11px","fontVariantNumeric":"tabular-nums"}}>{r.http_status || '—'}</span></td>
<td><span className={`pill ${resultClass(r.status)}`} style={{"fontSize":"11px"}}>{r.status || '—'}</span></td>
<td style={{"fontSize":"12px","color":"var(--text-3)","maxWidth":"200px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}}>{r.message || ''}</td></tr></Fragment>); })}</tbody></table></div>
<div className="tbl-foot"><span id="pagerInfo"></span>
{' '}
<div className="pager-btns"><button className="btn btn-sm" id="pagerPrev" onClick={() => ctx.goPage(-1)} disabled>←</button>
{' '}
<button className="btn btn-sm" id="pagerNext" onClick={() => ctx.goPage(1)}>→</button></div></div></>)}
<div style={{"padding":"10px 20px","borderTop":"1px solid var(--border)","fontSize":"11.5px","color":"var(--text-3)","display":"flex","alignItems":"center","gap":"6px"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"></circle>
<path d="M12 8h.01M11 12h1v4h1"></path></svg>
{' '}Latency is bounded by{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px"}}>ERP_TIMEOUT_MS</code>
{' '}(default 5000 ms) inside the portal's open transaction. There is no retry queue — the idempotent intake API is what makes a manual retry safe.</div></div>
    </>
  );
}
