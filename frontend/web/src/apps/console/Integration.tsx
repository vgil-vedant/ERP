/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Integration({ ctx, summary, pgUp, erpSummary }) {
  var grandTotal  = (summary||[]).reduce(function(a,b){ return a+(b.total||0); }, 0);
  var grandKept   = (summary||[]).reduce(function(a,b){ return a+(b.kept||0); }, 0);
  var grandDup    = (summary||[]).reduce(function(a,b){ return a+(b.duplicate||0); }, 0);
  var grandRolled = (summary||[]).reduce(function(a,b){ return a+(b.rolled_back||0); }, 0);
  var successRate = grandTotal ? Math.round((grandKept+grandDup)/grandTotal*100) : 0;;
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Integration Status</h1>
{' '}
<p className="page-desc">Write-through health across all five portal replicas. Each portal holds its own transaction open during the ERP call — a refusal rolls back both sides atomically.</p></div>
{' '}
<div className="page-actions">{(pgUp) ? (<><span className="pill pill-ok" style={{"height":"30px","padding":"0 12px"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{"width":"12px","height":"12px"}}><path d="M20 6 9 17l-5-5"></path></svg>
{' '}demo_replica online</span></>) : (<><span className="pill pill-danger" style={{"height":"30px","padding":"0 12px"}}>demo_replica offline</span></>)}
<a href="/sync" className="btn">View full sync log →</a></div></div>
<div className="g-kpi" style={{"marginBottom":"18px"}}><div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4v6h6M20 20v-6h-6"></path>
<path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"></path></svg></div>
{' '}
<span className="pill pill-neutral">all portals</span></div>
{' '}
<div className="kpi-label">Total Attempts</div>
{' '}
<div className="kpi-value">{grandTotal}</div>
{' '}
<div className="kpi-note">across all 5 portal tables</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 6 9 17l-5-5"></path></svg></div>
{' '}
<span className="pill pill-ok">success</span></div>
{' '}
<div className="kpi-label">Success Rate</div>
{' '}
<div className="kpi-value">{successRate}
%</div>
{' '}
<div className="kpi-note">kept + duplicate</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 13h4l2 3h4l2-3h4"></path>
<path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"></path></svg></div>
{' '}
<span className="pill pill-ok">ERP</span></div>
{' '}
<div className="kpi-label">Records in ERP</div>
{' '}
<div className="kpi-value">{erpSummary ? erpSummary.intake : '—'}</div>
{' '}
<div className="kpi-note">rows in erp.sqlite · intake table</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></div>
{' '}
<span className="pill pill-danger">refused</span></div>
{' '}
<div className="kpi-label">Rolled Back</div>
{' '}
<div className="kpi-value">{grandRolled}</div>
{' '}
<div className="kpi-note">portal undid insert on refusal</div></div></div>
{' '}
<div className="g-2"><div className="card"><div className="card-head"><div><div className="card-title">Per-portal sync breakdown</div>
{' '}
<div className="card-sub">From{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>platform_erp_sync</code>
{' '}rows in{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>demo_replica</code></div></div></div>
{(!summary || !summary.length) ? (<><div className="empty-state"><div className="empty-title">No sync data</div>
{' '}
<div className="empty-hint">Ensure Docker container{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>ERP_postgres</code>
{' '}is running and{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>npm install</code>
{' '}has been run.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Portal</th>
<th data-sort="">Attempts</th>
<th data-sort="">Kept</th>
<th data-sort="">Duplicate</th>
<th data-sort="">Rolled back</th>
<th>Rate</th></tr></thead>
<tbody>{((summary||[])).map(function (s, __k) { var rate = s.total ? Math.round((s.kept+s.duplicate)/s.total*100) : 0;; return (<Fragment key={__k}><tr><td><div style={{"display":"flex","alignItems":"center","gap":"8px"}}><span className="sys-chip">{s.site_label || s.site_code}</span></div></td>
<td style={{"fontVariantNumeric":"tabular-nums","fontWeight":"600"}}>{s.total}</td>
<td><span className="pill pill-ok" style={{"fontSize":"11px"}}>{s.kept}</span></td>
<td><span className="pill pill-warn" style={{"fontSize":"11px"}}>{s.duplicate}</span></td>
<td><span className={`pill ${s.rolled_back > 0 ? 'pill-danger' : 'pill-neutral'}`} style={{"fontSize":"11px"}}>{s.rolled_back}</span></td>
<td><div style={{"display":"flex","alignItems":"center","gap":"6px"}}><div style={{"width":"60px","height":"6px","background":"var(--surface-3)","borderRadius":"3px","overflow":"hidden"}}><div style={S(`width:${rate}%;height:100%;background:var(--emerald);border-radius:3px`)}></div></div>
{' '}
<span style={{"fontSize":"11.5px","fontWeight":"600","fontVariantNumeric":"tabular-nums"}}>{rate}
%</span></div></td></tr></Fragment>); })}</tbody></table></div></>)}
<div style={{"padding":"10px 20px","borderTop":"1px solid var(--border)"}}><a href="/sync" className="btn btn-sm">Full sync log →</a></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Runtime configuration</div>
{' '}
<div className="card-sub">Variables the ERP backend reads at startup.</div></div></div>
{' '}
<div className="def-list"><div className="def-row"><div className="def-key">ERP_PORT</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>4200</code>
{' '}default</div></div>
{' '}
<div className="def-row"><div className="def-key">ERP_DB</div>
<div className="def-val">Path to{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>erp.sqlite</code></div></div>
{' '}
<div className="def-row"><div className="def-key">ERP_HOST / HOST</div>
<div className="def-val">Bind address — defaults to{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>127.0.0.1</code></div></div>
{' '}
<div className="def-row"><div className="def-key">ERP_TIMEOUT_MS</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>5000</code>
{' '}— write-through timeout</div></div>
{' '}
<div className="def-row"><div className="def-key">PGHOST / PGPORT</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>127.0.0.1:7432</code>
{' '}— Docker ERP_postgres</div></div>
{' '}
<div className="def-row"><div className="def-key">PGDATABASE</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>demo_replica</code>
{' '}— sync ledger source</div></div>
{' '}
<div className="def-row"><div className="def-key">PLATFORM_PORT</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>4100</code>
{' '}— platform hub</div></div>
{' '}
<div className="def-row"><div className="def-key">PORT_OFFSET</div>
<div className="def-val">Shifts all portal ports for a parallel instance</div></div></div>
{' '}
<div className="card-head" style={{"marginTop":"0","borderTop":"1px solid var(--border)"}}><div><div className="card-title" style={{"fontSize":"13.5px"}}>Write-through design</div></div></div>
{' '}
<div className="def-list"><div className="def-row"><div className="def-key">Method</div>
<div className="def-val">Synchronous — portal holds transaction open during ERP call</div></div>
{' '}
<div className="def-row"><div className="def-key">Idempotency</div>
<div className="def-val">Same{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>(source_system, source_reference)</code>
{' '}→ HTTP 200{' '}
<em>duplicate:true</em></div></div>
{' '}
<div className="def-row"><div className="def-key">Rollback</div>
<div className="def-val">ERP 4xx/5xx → portal rolls back; neither DB has the row</div></div>
{' '}
<div className="def-row"><div className="def-key">No retry queue</div>
<div className="def-val">Manual retry is safe because the API is idempotent</div></div>
{' '}
<div className="def-row"><div className="def-key">Ledger</div>
<div className="def-val"><code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>erp_sync</code>
{' '}in platform.sqlite · mirrored to Postgres as{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>platform_erp_sync</code></div></div></div></div></div>
    </>
  );
}
