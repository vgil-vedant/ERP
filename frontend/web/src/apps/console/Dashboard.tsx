/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';
import { AreaChart, Donut, DonutLegend } from './DashCharts';

export function Dashboard({ ctx, summary, systems, recent, recentAudit, dailyIntake }) {
  
  return (
    <>
<div className="page-head"><div><h1 className="page-title">Dashboard</h1>
{' '}
<p className="page-desc">A single view of what the ERP has received from the platform service. The console starts empty on purpose — if a row is here, a portal put it there.</p></div>
{' '}
<div className="page-actions"><button className="btn" type="button" onClick={() => ctx.exportTableCSV('erp-dashboard.csv')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
{' '}Export CSV</button>
{' '}
<a href="/intake" className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10"></path></svg>
{' '}Received Records</a></div></div>
<div className="g-kpi"><div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"></path>
<circle cx="9" cy="7.5" r="3.5"></circle>
<path d="M17 11a3 3 0 1 0 0-6"></path>
<path d="M22 20v-1.5a4 4 0 0 0-3-3.8"></path></svg></div>
{' '}
<span className="pill pill-neutral">all time</span></div>
{' '}
<div className="kpi-label">Registered Citizens</div>
{' '}
<div className="kpi-value">{summary.citizens}</div>
{' '}
<div className="kpi-note">unique citizen_ref records</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
<path d="M14 5v5h5M8 14h8M8 17h5"></path></svg></div>
{' '}
<span className="pill pill-ok">intake</span></div>
{' '}
<div className="kpi-label">Records Received</div>
{' '}
<div className="kpi-value">{summary.intake}</div>
{' '}
<div className="kpi-note">rows in erp.sqlite intake table</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h9l3 3v13H9z"></path>
<path d="M6 7H3v13h9"></path>
<path d="M13 9h5M13 13h5M13 17h3"></path></svg></div>
{' '}
<span className="pill pill-mint">field values</span></div>
{' '}
<div className="kpi-label">Field Values Stored</div>
{' '}
<div className="kpi-value">{summary.fields}</div>
{' '}
<div className="kpi-note">rows in intake_field table</div></div>
{' '}
<div className="card kpi"><div className="kpi-top"><div className="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle>
<path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"></path></svg></div>
{' '}
<span className="pill pill-info">registered</span></div>
{' '}
<div className="kpi-label">Source Portals</div>
{' '}
<div className="kpi-value">{systems.length}</div>
{' '}
<div className="kpi-note">active source_system entries</div></div></div>
<div className="grid g-ab" style={{"marginBottom":"16px"}}><div className="card"><div className="card-head"><div><div className="card-title">Records received over time</div>
{' '}
<div className="card-sub">Daily intake count — last 30 days.</div></div>
{' '}
<span className="pill pill-mint">30 d</span></div>
{' '}
<div className="card-body" style={{"padding":"0 4px 0 0"}}><div className="chart-box" id="chartActivity" style={{"minHeight":"160px"}}><AreaChart buckets={dailyIntake} /></div>
{' '}
<div className="chart-legend"><span className="lg-item"><span className="lg-dot" style={{"background":"var(--emerald)"}}></span>
Received into ERP</span>
{' '}
<span className="lg-item" style={{"color":"var(--text-3)","marginLeft":"auto"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"></circle>
<path d="M12 8h.01M11 12h1v4h1"></path></svg>
{' '}Timed from intake.received_at</span></div></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Records by source system</div>
{' '}
<div className="card-sub">Which portal produced the intake rows.</div></div></div>
{' '}
<div className="donut-wrap" style={{"padding":"4px 20px 12px"}}><div className="donut-svg" id="chartDonut"><Donut items={summary.bySystem} /></div>
{' '}
<div className="donut-legend" id="donutLegend"><DonutLegend items={summary.bySystem} /></div></div>
{' '}
<div className="card-foot"><span style={{"fontSize":"11.5px","color":"var(--text-3)"}}>{systems.length}
{' '}registered source systems</span>
{' '}
<a href="/portals" className="btn btn-sm" style={{"marginLeft":"auto"}}>Portals →</a></div></div></div>
<div className="grid g-ab" style={{"marginBottom":"16px"}}><div className="card"><div className="card-head tight"><div><div className="card-title">Intake by portal</div>
{' '}
<div className="card-sub">Records accepted per source system.</div></div></div>
{' '}
<div className="card-body">{(!summary.bySystem || !summary.bySystem.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"></circle>
<path d="M3 12h18M12 3a15 15 0 0 1 0 18"></path></svg></div>
{' '}
<div className="empty-title">No portal data yet</div>
{' '}
<div className="empty-hint">Records will appear once a portal submits data.</div></div></>) : ((() => { var maxN = Math.max.apply(null, summary.bySystem.map(function(s){ return s.n; })) || 1;
          var COLORS = ['#F16F3F','#F8A66B','#F58A50','#292832','#77716F'];; return <><div className="bars" id="chartBars">{(summary.bySystem).map(function (s, idx) { return (<Fragment key={idx}><div className="bar-row"><div className="bar-name"><span className="sys-dot" style={S(`background:${COLORS[idx % COLORS.length]}`)}></span>
{' '}
<span>{s.name || s.code}</span></div>
{' '}
<div className="bar-track" data-name={s.name || s.code} data-kept={s.n} data-rolled="0"><div className="bar-fill" style={S(`width:${Math.round((s.n / maxN) * 100)}%;background:${COLORS[idx % COLORS.length]}`)}></div></div>
{' '}
<div className="bar-val">{s.n}
<small>records</small></div></div></Fragment>); })}</div></>; })())}</div>
{' '}
<div className="card-foot"><span className="micro"><span className="lg-dot" style={{"background":"var(--emerald)"}}></span>
{' '}Kept intake</span>
{' '}
<a href="/intake" className="btn btn-sm" style={{"marginLeft":"auto"}}>All records →</a></div></div>
<div className="card"><div className="card-head tight"><div><div className="card-title">Recent audit activity</div>
{' '}
<div className="card-sub">Append-only · newest first. Triggers reject UPDATE / DELETE.</div></div>
{' '}
<span className="pill pill-neutral">read-only</span></div>
{' '}
<div className="feed">{(!recentAudit || !recentAudit.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="10" width="16" height="10" rx="2"></rect>
<path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg></div>
{' '}
<div className="empty-title">Audit trail is empty</div>
{' '}
<div className="empty-hint">Events are written as records arrive.</div></div></>) : (<>{(recentAudit.slice(0, 8)).map(function (r, __k) { return (<Fragment key={__k}><div className="feed-item"><div className={`feed-dot${r.action && r.action.toLowerCase().includes('fail') ? ' warn' : ''}`}></div>
{' '}
<div className="feed-body"><div className="feed-action">{r.action}
{' '}—{' '}
<span style={{"fontWeight":"400","color":"var(--text-2)"}}>{r.entity}
{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px"}}>{r.entity_id || ''}</code></span></div>
{' '}
<div className="feed-meta">by{' '}
<strong>{r.maker}</strong>
{(r.approver) ? (<>{' '}· approved by{' '}
{r.approver}</>) : null}</div></div>
{' '}
<div className="feed-time">{r.occurred_at}</div></div></Fragment>); })}</>)}</div>
{' '}
<div className="card-foot"><span className="pill pill-neutral" style={{"fontSize":"10.5px"}}>INSERT only · audit_log</span>
{' '}
<a href="/audit" className="btn btn-sm" style={{"marginLeft":"auto"}}>Full trail →</a></div></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Most recent records</div>
{' '}
<div className="card-sub">Latest intake rows. Click a row to view field-level detail.</div></div>
{' '}
<a href="/intake" className="btn btn-sm">View all →</a></div>
{(!recent.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
<path d="M14 5v5h5"></path></svg></div>
{' '}
<div className="empty-title">No records yet</div>
{' '}
<div className="empty-hint">Submit a form on any portal and it will appear here.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl"><thead><tr><th data-sort="">ERP Ref</th>
<th data-sort="">Source</th>
<th data-sort="">Form</th>
<th data-sort="">Portal Ref</th>
<th data-sort="">Citizen</th>
<th data-sort="">Received</th></tr></thead>
<tbody>{(recent).map(function (r, __k) { var fields = r.fields || [];; return (<Fragment key={__k}><tr className="clickable" onClick={() => ctx.openDrawer(r.intake_ref, <Drawer kind="dashboard" row={r} />)}><td><code className="mono-chip">{r.intake_ref}</code></td>
<td><span className="sys-chip">{r.source_system}</span></td>
<td>{r.subject || r.source_form}
{(r.source_route) ? (<><br />
<code style={{"fontFamily":"var(--mono)","fontSize":"10.5px","color":"var(--text-3)"}}>{r.source_route}</code></>) : null}</td>
<td><code className="mono-chip">{r.source_reference}</code></td>
<td>{r.full_name || '—'}</td>
<td style={{"color":"var(--text-3)","fontSize":"12.5px"}}>{r.received_at}</td></tr></Fragment>); })}</tbody></table></div></>)}</div>
    </>
  );
}
