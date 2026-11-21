/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import { Fragment } from 'react';
import { S } from '../../shared/css';
import { Drawer } from './drawers';

export function Portals({ ctx, filter, bySystem, recent, systems, FORM_LABEL }) {
  /* ── Portal metadata map ─────────────────────────────────────────────── */
  var META = {
    eprisons:   { icon: '<path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M8 8v13M12 8v13M16 8v13M3 21h18"/>', color: '#F16F3F' },
    cctns:      { icon: '<path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9.5 4.6-1.3 8-5.1 8-9.5V6l-8-3Z"/><path d="M12 8v8M8.5 11h7"/>', color: '#F8A66B' },
    eforensics: { icon: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>', color: '#292832' },
    uidai:      { icon: '<path d="M12 4a8 8 0 0 1 8 8v2"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"/><path d="M7 20a13 13 0 0 1-.6-4v-4"/><path d="M11 12v5a7 7 0 0 0 .5 2.5"/>', color: '#F58A50' },
    ecourts:    { icon: '<path d="M12 3v3M5 20h14M6 20V10m12 10V10M3 10h18"/><path d="M12 6 3 10h18L12 6Z"/><path d="M9 20v-5m6 5v-5"/>', color: '#77716F' },
  };

  /* ── Enrich systems list ─────────────────────────────────────────────── */
  var enriched = systems.map(function(s) {
    var m   = META[s.code] || { icon: '<circle cx="12" cy="12" r="9"/>', color: '#F16F3F' };
    var cnt = (bySystem || []).find(function(b){ return b.code === s.code; });
    /* extract :PORT from hostname e.g. "127.0.0.1:4173" → ":4173" */
    var portMatch = (s.hostname || '').match(/:(\d+)$/);
    var portLabel = portMatch ? ':' + portMatch[1] : '';
    var formLabel = (typeof FORM_LABEL !== 'undefined' && FORM_LABEL[s.code]) || '—';
    return {
      code:      s.code,
      name:      s.name,
      category:  s.category,
      hostname:  s.hostname || s.code,
      portLabel: portLabel,
      formLabel: formLabel,
      n:         cnt ? (cnt.n || 0) : 0,
      icon:      m.icon,
      color:     m.color,
    };
  });

  var activePortal = filter ? enriched.find(function(p){ return p.code === filter; }) : null;
  var totalRecords = enriched.reduce(function(a, b){ return a + b.n; }, 0);;
  return (
    <>
<div className="page-head"><div><h1 className="page-title">{activePortal ? activePortal.name : 'Government Portals'}</h1>
{' '}
<p className="page-desc">{(activePortal) ? (<>Local demonstration replica —{' '}
<strong>{activePortal.category}</strong>
. Records below were received by the ERP.</>) : (<>Five local replica portals push records into the ERP through a single write-through API. Each card shows the portal's source-system code, documented form type and live record count.</>)}</p></div>
{' '}
<div className="page-actions">{(filter) ? (<><a href="/portals" className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"></path></svg>
{' '}All portals</a>
{' '}
<a href={`/intake?system=${filter}`} className="btn btn-primary">View all records →</a></>) : null}</div></div>
<div style={{"background":"var(--warning-bg)","border":"1px solid #E8D5A0","borderRadius":"var(--r-sm)","padding":"9px 14px","marginBottom":"20px","display":"flex","alignItems":"center","gap":"9px","fontSize":"12.5px","color":"#7A5A1A"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{"width":"14px","height":"14px","flexShrink":"0","color":"#B67C24"}}><path d="M12 9v4M12 17h.01"></path>
<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path></svg>
{' '}
<span><strong>Unofficial local demonstration.</strong>
{' '}These are local replicas only — not official government services. All data is synthetic.</span></div>
{(activePortal) ? (<><div className="card" style={{"marginBottom":"16px"}}><div style={{"display":"flex","alignItems":"center","gap":"18px","flexWrap":"wrap","padding":"20px 22px"}}><div style={{"width":"56px","height":"56px","borderRadius":"16px","background":"linear-gradient(135deg,var(--mint-100),var(--mint-200))","display":"grid","placeItems":"center","flexShrink":"0","boxShadow":"var(--sh-sm)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={S(`width:28px;height:28px;color:${activePortal.color}`)} dangerouslySetInnerHTML={{ __html: activePortal.icon }} /></div>
{' '}
<div style={{"flex":"1","minWidth":"0"}}><div style={{"fontSize":"21px","fontWeight":"800","letterSpacing":"-.03em","color":"var(--ink)"}}>{activePortal.name}</div>
{' '}
<div style={{"fontSize":"13px","color":"var(--text-2)","marginTop":"2px"}}>{activePortal.category}</div>
{' '}
<div style={{"display":"flex","alignItems":"center","gap":"8px","marginTop":"5px","flexWrap":"wrap"}}><code style={{"fontFamily":"var(--mono)","fontSize":"11px","background":"var(--surface-3)","border":"1px solid var(--border)","padding":"2px 7px","borderRadius":"6px"}}>{activePortal.portLabel}</code>
{' '}
<span style={{"fontSize":"12px","color":"var(--text-3)"}}>{activePortal.formLabel}</span>
{' '}
<span style={{"fontSize":"12px","color":"var(--text-3)"}}>·</span>
{' '}
<span style={{"fontFamily":"var(--mono)","fontSize":"11px","color":"var(--text-3)"}}>{activePortal.hostname}</span></div></div>
{' '}
<div style={{"textAlign":"right","flexShrink":"0"}}><div style={{"fontSize":"44px","fontWeight":"800","letterSpacing":"-.05em","color":"var(--ink)","fontVariantNumeric":"tabular-nums","lineHeight":"1"}}>{activePortal.n}</div>
{' '}
<div style={{"fontSize":"12px","color":"var(--text-3)","marginTop":"2px"}}>records</div></div></div>
{' '}
<div style={{"borderTop":"1px solid var(--border)","padding":"10px 22px","display":"flex","alignItems":"center","gap":"10px","flexWrap":"wrap"}}><span className="pill pill-ok" style={{"fontSize":"11px"}}>active replica</span>
{' '}
<code style={{"fontFamily":"var(--mono)","fontSize":"11px","color":"var(--text-3)"}}>{activePortal.code}</code>
{' '}
<div style={{"marginLeft":"auto","display":"flex","gap":"8px"}}><a href={`/sync?system=${activePortal.code}`} className="btn btn-sm">Sync log</a>
{' '}
<a href={`/intake?system=${activePortal.code}`} className="btn btn-sm">Records</a>
{' '}
<a href={`http://${activePortal.hostname}`} target="_blank" rel="noopener" className="btn btn-sm btn-primary">Open replica{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{"width":"12px","height":"12px"}}><path d="M14 4h6v6M20 4l-9 9"></path>
<path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"></path></svg></a></div></div></div>
<div className="card"><div className="card-head"><div><div className="card-title">Recent records —{' '}
{activePortal.name}</div>
{' '}
<div className="card-sub">Last 25 records received from this portal. Click a row for field details.</div></div>
{' '}
<a href={`/intake?system=${activePortal.code}`} className="btn btn-sm">View all →</a></div>
{(!recent || !recent.length) ? (<><div className="empty-state"><div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 13h4l2 3h4l2-3h4"></path>
<path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"></path></svg></div>
{' '}
<div className="empty-title">No records from{' '}
{activePortal.name}
{' '}yet</div>
{' '}
<div className="empty-hint">Records appear once the portal submits through the intake API.</div></div></>) : (<><div className="tbl-wrap"><table className="tbl"><thead><tr><th data-sort="">ERP Ref</th>
<th data-sort="">Form</th>
<th data-sort="">Portal Ref</th>
<th data-sort="">Citizen</th>
<th data-sort="">Fields</th>
<th data-sort="">Received</th></tr></thead>
<tbody>{(recent).map(function (r, __k) { var fields = r.fields || [];; return (<Fragment key={__k}><tr className="clickable" onClick={() => ctx.openDrawer(r.intake_ref, <Drawer kind="portals" row={r} />)}><td><code className="mono-chip">{r.intake_ref}</code></td>
<td>{r.subject || r.source_form}</td>
<td><code className="mono-chip">{r.source_reference}</code></td>
<td>{r.full_name || '—'}
{(r.email) ? (<><br />
<span style={{"fontSize":"11.5px","color":"var(--text-3)"}}>{r.email}</span></>) : null}</td>
<td>{(fields.length) ? (<><span className="pill pill-neutral" style={{"fontSize":"11px"}}>{fields.length}</span></>) : (<><span style={{"color":"var(--text-4)"}}>—</span></>)}</td>
<td style={{"fontSize":"12.5px","color":"var(--text-3)","whiteSpace":"nowrap"}}>{r.received_at}</td></tr></Fragment>); })}</tbody></table></div></>)}</div></>) : ((() => { var maxN = Math.max.apply(null, enriched.map(function(p){ return p.n; })) || 1;; return <><div className="portal-grid" style={{"marginBottom":"20px"}}>{(enriched).map(function (p, __k) { return (<Fragment key={__k}><div className="portal-card"><div className="portal-head"><div className="portal-icon" style={{"background":"linear-gradient(135deg,var(--mint-100),var(--mint-200))"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={S(`width:22px;height:22px;color:${p.color}`)} dangerouslySetInnerHTML={{ __html: p.icon }} /></div>
{' '}
<div><div className="portal-name">{p.name}</div>
{' '}
<div className="portal-category">{p.category}</div></div></div>
<div style={{"display":"flex","alignItems":"center","gap":"8px","margin":"10px 0 4px","flexWrap":"wrap"}}><code style={{"fontFamily":"var(--mono)","fontSize":"11px","background":"var(--surface-3)","border":"1px solid var(--border)","padding":"2px 7px","borderRadius":"6px","color":"var(--text-2)"}}>{p.portLabel}</code>
{' '}
<span style={{"fontSize":"12px","color":"var(--text-3)"}}>{p.formLabel}</span></div>
<div style={{"display":"flex","alignItems":"baseline","gap":"5px","margin":"6px 0 2px"}}><span style={{"fontSize":"28px","fontWeight":"800","letterSpacing":"-.04em","color":"var(--ink)","fontVariantNumeric":"tabular-nums","lineHeight":"1"}}>{p.n}</span>
{' '}
<span style={{"fontSize":"12px","color":"var(--text-3)"}}>records</span></div>
<div className="portal-host" style={{"marginBottom":"12px"}}>{p.hostname}</div>
<div style={{"display":"flex","gap":"7px","marginTop":"auto"}}><a href={`/portals?system=${p.code}`} className="btn btn-sm" style={{"flex":"1","justifyContent":"center"}}>View</a>
{' '}
<a href={`/intake?system=${p.code}`} className="btn btn-sm" style={{"flex":"1","justifyContent":"center"}}>Records</a>
{' '}
<a href={`http://${p.hostname}`} target="_blank" rel="noopener" className="btn btn-sm btn-primary" style={{"flex":"1","justifyContent":"center"}}>Open replica{' '}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{"width":"11px","height":"11px"}}><path d="M14 4h6v6M20 4l-9 9"></path>
<path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"></path></svg></a></div></div></Fragment>); })}</div>
<div className="card"><div className="card-head"><div><div className="card-title">Records by portal</div>
{' '}
<div className="card-sub">Total across all portals:{' '}
<strong>{totalRecords}</strong></div></div>
{' '}
<span className="pill pill-mint">{systems.length}
{' '}portals</span></div>
{' '}
<div className="card-body"><div className="bar-chart">{(enriched).map(function (p, __k) { return (<Fragment key={__k}><div className="bar-row"><div className="bar-label" title={p.name}>{p.name}</div>
{' '}
<div className="bar-track"><div className="bar-fill" style={S(`width:${Math.round((p.n/maxN)*100)}%;background:${p.color}`)}></div></div>
{' '}
<div className="bar-val">{p.n}</div></div></Fragment>); })}</div></div></div></>; })())}
    </>
  );
}
