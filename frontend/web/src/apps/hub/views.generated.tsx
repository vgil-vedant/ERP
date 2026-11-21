/* eslint-disable */
// The twelve views of the ERP Hub, as JSX. Converted from the markup of erp-hub.html; places the old script used to fill in
// are now {H.name} (content) and {...P.name} (props), supplied by Hub.tsx.
import type { ReactNode } from 'react';
import { Svg } from './lib';
import { Select } from './controls';
import { PageArt } from './illustrations';

export interface ViewsProps {
  view: string;
  H: Record<string, ReactNode>;
  P: Record<string, Record<string, unknown>>;
  goto: (v: string) => void;
  openHub: () => void;
}

export function Views({ view, H, P, goto, openHub }: ViewsProps) {
  return (
    <>
      <section className={"view" + (view === "dashboard" ? " is-active" : "")} id="view-dashboard" data-title="Dashboard" data-section="Overview" data-desc="The five department offices — the records each holds, and whether their events are reaching the ERP.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Dashboard
            </h1>
            {' '}
            <p className="page-desc">
              One card per department office: what it holds, what is still open, and whether its events have reached the ERP over the integration bus.
            </p>
          </div>
          {' '}
          <PageArt kind="dashboard" />
        </div>
        {' '}
        <div className="notice" id="protoNotice" style={{"display":"none"}} {...P.protoNotice}>
          <span className="n-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01"></path>
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>
            </svg>
          </span>
          {' '}
          <div className="n-body">
            <div className="n-title" id="noticeTitle">{H.noticeTitle}</div>
            {' '}
            <div className="n-text" id="noticeText">{H.noticeText}</div>
          </div>
          {' '}
          <button className="n-close" id="noticeClose" type="button" aria-label="Dismiss notice" {...P.noticeClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        {' '}
        {' '}
        <div className="grid g-kpi kpi-dept-grid" id="kpiGrid">{H.kpiDepts}</div>
        
<div className="grid g-2" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="pulse" /></span>Office activity</div>
                {' '}
                <div className="card-sub">
                  Created vs not delivered.
                </div>
              </div>
              {' '}
              <div id="activityRange">{H.activityRange}</div>
            </div>
            {' '}
            <div className="chart-box" id="chartActivity">{H.chartActivity}</div>
            {' '}
            <div className="chart-legend">
              <span className="lg-item">
                <span className="lg-dot" style={{"background":"var(--emerald)"}}></span>
                Records created
              </span>
              {' '}
              <span className="lg-item">
                <span className="lg-dot" style={{"background":"var(--warning)"}}></span>
                Events not delivered
              </span>
            </div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head card-head--rule">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="grid" /></span>Records by department</div>
                {' '}
                <div className="card-sub">
                  Share of the records each office holds.
                </div>
              </div>
              {' '}
              <div id="recordsRange">{H.recordsRange}</div>
            </div>
            {' '}
            <div className="donut-wrap">
              <div className="donut-svg donut-svg--pro" id="chartDonut">{H.chartDonut}</div>
            </div>
            {' '}
            <div className="card-foot">
              <span className="micro" id="sourceCount">{H.sourceCount}</span>
              {' '}
              <button className="btn btn-sm" onClick={() => goto("records")} type="button">
                Department records{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {' '}
        {' '}
        <div className="grid g-2" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head tight">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Events by department</div>
                {' '}
                <div className="card-sub">
                  Events sent to the ERP, and the last delivery.
                </div>
              </div>
            </div>
            {' '}
            <div className="bars" id="chartBars">{H.chartBars}</div>
            {' '}
            <div className="card-foot">
              <span className="micro">
                <span className="lg-dot" style={{"background":"var(--success)"}}></span>
                {' '}Delivered
              </span>
              {' '}
              <span className="micro">
                <span className="lg-dot" style={{"background":"#D8A64E"}}></span>
                {' '}Waiting
              </span>
              {' '}
              <span className="micro">
                <span className="lg-dot" style={{"background":"#D6584F"}}></span>
                {' '}Rejected
              </span>
            </div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="grid" /></span>Portal replicas</div>
                {' '}
                <div className="card-sub">
                  Local demonstration environments only.
                </div>
              </div>
            </div>
            {' '}
            <div id="portalQuick" style={{"display":"flex","flexDirection":"column","gap":"8px"}}>{H.portalQuick}</div>
          </div>
        </div>
        {' '}
        <div className="grid g-2" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head tight">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="clock" /></span>Open work by department</div>
                {' '}
                <div className="card-sub">Records not yet in a final state, out of everything each office holds.</div>
              </div>
            </div>
            {' '}
            <div className="bars" id="chartOpen">{H.chartOpen}</div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head tight">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="users" /></span>People on file</div>
                {' '}
                <div className="card-sub">People named in each office's records.</div>
              </div>
              {' '}
              <div id="peopleRange">{H.peopleRange}</div>
            </div>
            {' '}
            <div className="heat" id="chartPeople">{H.chartPeople}</div>
          </div>
        </div>
        {' '}
        <div className="grid" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head tight">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="pulse" /></span>Recent office activity</div>
                {' '}
                <div className="card-sub">
                  What officers did, newest first.
                </div>
              </div>
            </div>
            {' '}
            <div className="feed" id="auditFeed">{H.auditFeed}</div>
            {' '}
            <div className="card-foot card-foot--end">
              <button className="btn btn-sm" onClick={() => goto("activity")} type="button">
                Activity log{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {' '}
        {' '}
        <div className="card" style={{"marginTop":"16px"}}>
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="file" /></span>Recent department records</div>
              {' '}
              <div className="card-sub">
                Newest records across the five offices. Open a row for its details.
              </div>
            </div>
            {' '}
            <button className="btn btn-sm" onClick={() => goto("records")} type="button">
              View all records{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>
          {' '}
          <div className="table-host" data-table="recent">{H.t_recent}</div>
        </div>
        {' '}
        {' '}
        <div className="grid g-c" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="inbox" /></span>Latest bus events</div>
                {' '}
                <div className="card-sub">
                  Each change an office made, and whether the ERP has it.
                </div>
              </div>
            </div>
            {' '}
            <div className="table-host" data-table="syncMini">{H.t_syncMini}</div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head tight">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Integration bus</div>
                {' '}
                <div className="card-sub">
                  Where every event the offices sent has got to.
                </div>
              </div>
            </div>
            {' '}
            <div className="meter" id="healthMeter" aria-hidden="true">{H.healthMeter}</div>
            {' '}
            <div className="health-rows" id="healthRows">{H.healthRows}</div>
            {' '}
            <div className="card-foot card-foot--end">
              <button className="btn btn-sm" onClick={() => goto("queue")} type="button">
                Details{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "overview" ? " is-active" : "")} id="view-overview" data-title="System Overview" data-section="Overview" data-desc="How the ERP, the platform service, the five department offices and the integration bus fit together.">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              System Overview
            </h1>
            {' '}
            <p className="page-desc">
              Two Node.js services that share only HTTP: the ERP (record of truth) and the platform service (five portals, five department offices, the hub and the integration bus).
            </p>
          </div>
          {' '}
          <div className="page-actions">
            <button className="btn" type="button" onClick={() => goto("health")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h4l3 8 4-16 3 8h4"></path>
              </svg>
              {' '}Service health
            </button>
          </div>
        </div>
        {' '}
        {H.overviewBody}
      </section>
      <section className={"view" + (view === "intake" ? " is-active" : "")} id="view-intake" data-title="Received Records" data-section="ERP Management" data-desc="Every row the ERP accepted, with the source system, form and reference it arrived with.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Citizen submissions
            </h1>
            {' '}
            <p className="page-desc">
              The ERP's intake table, newest first. Idempotent: a retry carrying the same{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                source_system + source_reference
              </code>
              {' '}returns 200 with{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                duplicate: true
              </code>
              {' '}and adds no row.
            </p>
          </div>
          {' '}
          <PageArt kind="intake" />
        </div>
        {' '}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="inbox" /></span>Citizen submissions in the ERP</div>
              <div className="card-sub" id="intakeCountSub">{H.intakeCountSub}</div>
            </div>
            {' '}
            <button className="btn btn-sm" type="button" onClick={() => goto("sync")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4v6h6M20 20v-6h-6"></path>
                <path d="M20 9A8 8 0 0 0 6 6L4 10m16 4-2 4a8 8 0 0 1-14-3"></path>
              </svg>
              {' '}Sync ledger
            </button>
          </div>
          {' '}
          <div className="table-host" data-table="intake">{H.t_intake}</div>
        </div>
      </section>
      <section className={"view" + (view === "citizens" ? " is-active" : "")} id="view-citizens" data-title="Citizens" data-section="ERP Management" data-desc="People the ERP knows about. A citizen is registered once on any portal and reused across all five.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Citizens
            </h1>
            {' '}
            <p className="page-desc">
              Rows in{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                citizen
              </code>
              , keyed by{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                citizen_ref
              </code>
              . The platform keeps its own{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                erp_citizen_ref
              </code>
              {' '}pointer — this console never reads the platform database.
            </p>
          </div>
          {' '}
          <PageArt kind="citizens" />
        </div>
        {' '}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="users" /></span>Registered citizens</div>
              <div className="card-sub" id="citizenCountSub">{H.citizenCountSub}</div>
            </div>
            {' '}
            <button className="btn btn-sm" type="button" onClick={() => goto("intake")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 5h16M4 12h16M4 19h10"></path>
              </svg>
              {' '}Citizen submissions
            </button>
          </div>
          {' '}
          <div className="table-host" data-table="citizens">{H.t_citizens}</div>
        </div>
      </section>
      <section className={"view" + (view === "audit" ? " is-active" : "")} id="view-audit" data-title="Audit Trail" data-section="ERP Management" data-desc="An append-only record of what entered the ERP. No UPDATE, no DELETE, no editing in this console.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Audit trail
            </h1>
            {' '}
            <p className="page-desc">
              Written by the intake API as each record lands. Database triggers reject every UPDATE and DELETE on{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                audit_log
              </code>
              , so this console offers no editing controls at all.
            </p>
          </div>
          <PageArt kind="audit" />
        </div>
        {' '}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="shield" /></span>Audit events</div>
              <div className="card-sub" id="auditCountSub">{H.auditCountSub}</div>
            </div>
          </div>
          {' '}
          <div className="table-host" data-table="audit">{H.t_audit}</div>
          {' '}
          <div className="table-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 8h.01M11 12h1v4h1"></path>
            </svg>
            {' '}
            <span>
              <code>
                maker
              </code>
              {' '}records the caller that caused the write —{' '}
              <code>
                platform-api
              </code>
              {' '}for write-through traffic,{' '}
              <code>
                seed
              </code>
              {' '}for the source-system registry.
            </span>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "portals" ? " is-active" : "")} id="view-portals" data-title="All portals" data-section="Government Portals" data-desc="The five local demonstration replicas the ERP exchanges data with. Each keeps its documented port.">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              Government portals
            </h1>
            {' '}
            <p className="page-desc">
              Local replicas, not the real services. Each one posts to the shared platform API, which performs a synchronous write-through into this ERP. Opening one leaves this console and visits a demo site on your machine.
            </p>
          </div>
        </div>
        {' '}
        <div className="notice" style={{"marginBottom":"16px"}}>
          <span className="n-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 9v4M12 17h.01"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </span>
          {' '}
          <div className="n-body">
            <div className="n-title">
              Demonstration environments
            </div>
            {' '}
            <div className="n-text">
              Each replica is a local capture made for integration work, carries a visible replica notice and an{' '}
              <code>
                X-Replica-Notice
              </code>
              {' '}header, and never contacts the site it replicates. None of them is an official government service.
            </div>
          </div>
        </div>
        {' '}
        <div className="portal-grid" id="portalGrid">{H.portalGrid}</div>
        {' '}
        <div className="grid g-2" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="monitor" /></span>Platform hub</div>
                <div className="card-sub">
                  The shared platform service that fronts all five replicas.
                </div>
              </div>
            </div>
            {' '}
            <div className="def-list">
              <div className="def-row">
                <div className="def-key">
                  Address
                </div>
                <div className="def-val">
                  <code id="hubAddress">{H.hubAddress}</code>
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Shared identity
                </div>
                <div className="def-val">
                  Register once on any portal; the session works on all five.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Write-through
                </div>
                <div className="def-val">
                  Every submission is mirrored into the ERP or rolled back on both sides.
                </div>
              </div>
            </div>
            {' '}
            <button className="btn btn-soft" style={{"marginTop":"12px","alignSelf":"flex-start"}} type="button" onClick={openHub}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4l-9 9"></path>
                <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"></path>
              </svg>
              {' '}About the hub
            </button>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="layers" /></span>How the pieces fit</div>
                <div className="card-sub">
                  Three surfaces, three jobs.
                </div>
              </div>
            </div>
            {' '}
            <div className="def-list">
              <div className="def-row">
                <div className="def-key">
                  Platform hub
                </div>
                <div className="def-val">
                  Serves this dashboard. It reads{' '}
                  <code>
                    platform.sqlite
                  </code>
                  {' '}itself and the ERP over HTTP.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Portal replicas
                </div>
                <div className="def-val">
                  Where a citizen fills a form. They hold no ERP data and cannot read{' '}
                  <code>
                    erp.sqlite
                  </code>
                  .
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  ERP service
                </div>
                <div className="def-val">
                  Owns{' '}
                  <code>
                    erp.sqlite
                  </code>
                  {' '}and exposes read-only JSON that this dashboard uses. It never reads the platform database.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "sync" ? " is-active" : "")} id="view-sync" data-title="Sync Activity" data-section="Integration Monitoring" data-desc="The erp_sync write-through ledger: every attempt to mirror a platform submission into the ERP, successful or not.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Write-through ledger
            </h1>
            {' '}
            <p className="page-desc">
              One row per attempt. A rolled-back attempt has no matching intake row — the portal undid its own insert when the ERP refused the write.
            </p>
          </div>
          {' '}
          <PageArt kind="ledger" />
        </div>
        {' '}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Write-through attempts</div>
              <div className="card-sub" id="syncCountSub">{H.syncCountSub}</div>
            </div>
            {' '}
            <button className="btn btn-sm" type="button" onClick={() => goto("integration")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h4l3 8 4-16 3 8h4"></path>
              </svg>
              {' '}Integration status
            </button>
          </div>
          {' '}
          <div className="table-host" data-table="sync">{H.t_sync}</div>
          {' '}
          <div className="table-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 8h.01M11 12h1v4h1"></path>
            </svg>
            {' '}
            <span>
              Latency is bounded by{' '}
              <code>
                ERP_TIMEOUT_MS
              </code>
              {' '}(default 5000 ms) inside the portal's open transaction. There is no retry queue — the idempotent intake API is what makes a manual retry safe.
            </span>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "integration" ? " is-active" : "")} id="view-integration" data-title="Integration Status" data-section="Integration Monitoring" data-desc="Health of the platform-to-ERP handshake, by outcome and by source system.">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              Integration status
            </h1>
            {' '}
            <p className="page-desc">
              Where the write-through succeeds, where it is refused, and which replicas generate the retries. All of it comes from the{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                erp_sync
              </code>
              {' '}ledger, not from an invented monitoring feed.
            </p>
          </div>
          {' '}
          <div className="page-actions">
            <Select id="periodSelectIntegration" ariaLabel="Date range" value={(P.periodSelectIntegration as { value: string }).value} onChange={(v) => (P.periodSelectIntegration as { onChange: (e: unknown) => void }).onChange({ target: { value: v } })} options={[{ value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }, { value: "all", label: "All recorded activity" }]} />
          </div>
        </div>
        {' '}
        <div className="grid g-a">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Attempts by source system</div>
                <div className="card-sub">
                  Kept versus rolled back, per replica.
                </div>
              </div>
            </div>
            {' '}
            <div className="bars" id="chartBarsFull">{H.chartBarsFull}</div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="check" /></span>Outcome split</div>
                <div className="card-sub">
                  Every ledger row, grouped by result.
                </div>
              </div>
            </div>
            {' '}
            <div className="health-rows" id="healthRowsFull">{H.healthRowsFull}</div>
            {' '}
            <div className="card-foot">
              <span className="micro">
                total attempts{' '}
                <b id="attemptsTotal" style={{"color":"var(--ink)"}}>{H.attemptsTotal}</b>
              </span>
            </div>
          </div>
        </div>
        {' '}
        <div className="grid g-2" style={{"marginTop":"16px"}}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="shield" /></span>Handshake contract</div>
                <div className="card-sub">
                  What the platform expects from the ERP on every call.
                </div>
              </div>
            </div>
            {' '}
            <div className="def-list">
              <div className="def-row">
                <div className="def-key">
                  201 Created
                </div>
                <div className="def-val">
                  New intake row written; returns{' '}
                  <code>
                    intakeRef
                  </code>
                  {' '}and{' '}
                  <code>
                    citizenRef
                  </code>
                  . Portal commits.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  200 OK
                </div>
                <div className="def-val">
                  Retry of a known{' '}
                  <code>
                    sourceSystem + sourceReference
                  </code>
                  ;{' '}
                  <code>
                    duplicate: true
                  </code>
                  , no new row. Portal commits.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  400
                </div>
                <div className="def-val">
                  Missing field or unknown source system. Portal rolls back its own row.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  500 / timeout
                </div>
                <div className="def-val">
                  ERP error or no answer within{' '}
                  <code>
                    ERP_TIMEOUT_MS
                  </code>
                  . Portal rolls back; nothing is kept on either side.
                </div>
              </div>
            </div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="clock" /></span>Response time budget</div>
                <div className="card-sub">
                  Synchronous by design — every millisecond lands inside the citizen's request.
                </div>
              </div>
            </div>
            {' '}
            <div className="def-list">
              <div className="def-row">
                <div className="def-key">
                  ERP_TIMEOUT_MS
                </div>
                <div className="def-val">
                  <code>
                    5000
                  </code>
                  {' '}— the ceiling the platform waits for the ERP.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Bottleneck
                </div>
                <div className="def-val">
                  The write-through runs inside the portal's open transaction; SQLite allows one writer per database.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Scaling note
                </div>
                <div className="def-val">
                  A retry queue (Redis/BullMQ, RabbitMQ) is listed as a future option, not current behaviour.
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Observability
                </div>
                <div className="def-val">
                  Stdout logs plus this ledger; Prometheus and Grafana are recommended additions, not shipped features.
                </div>
              </div>
            </div>
            {' '}
            <div className="table-note" style={{"marginTop":"10px"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8h.01M11 12h1v4h1"></path>
              </svg>
              {' '}
              <span>
                No response-time chart is shown here because the project does not record per-attempt latency — adding one would mean inventing telemetry.
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "submissions" ? " is-active" : "")} id="view-submissions" data-title="Submission Monitoring" data-section="Integration Monitoring" data-desc="Platform-side submissions and the ERP intake reference each one produced.">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              Submission monitoring
            </h1>
            {' '}
            <p className="page-desc">
              The platform's own{' '}
              <code style={{"fontFamily":"var(--mono)","fontSize":"12px"}}>
                submission
              </code>
              {' '}table, as exposed by the hub. Shown here read-only so the two sides can be compared without opening the platform database.
            </p>
          </div>
          {' '}
          <div className="page-actions">
            <span className="pill pill-ok" style={{"height":"30px","padding":"0 11px","fontSize":"10.5px"}}>
              live
            </span>
          </div>
        </div>
        {' '}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="inbox" /></span>Platform submissions</div>
              <div className="card-sub" id="subCountSub">{H.subCountSub}</div>
            </div>
          </div>
          {' '}
          <div className="table-host" data-table="submissions">{H.t_submissions}</div>
          {' '}
          <div className="table-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 8h.01M11 12h1v4h1"></path>
            </svg>
            {' '}
            <span>
              This view shows the hub's own data (
              <code>
                platform.sqlite
              </code>
              ), read by the hub itself. The ERP never opens the platform database.
            </span>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "database" ? " is-active" : "")} id="view-database" data-title="Database Overview" data-section="System" data-desc="Two SQLite files and the read-only PostgreSQL migration target. No schema changes are proposed here.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Databases
            </h1>
            {' '}
            <p className="page-desc">
              The ERP holds what it received; the platform holds what the portals collected. They are never joined at runtime.
            </p>
          </div>
          <PageArt kind="databases" />
        </div>
        {' '}
        <div className="grid g-2">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="database" /></span>erp.sqlite</div>
                <div className="card-sub">
                  The ERP service's own database.
                </div>
              </div>
              <span className="pill pill-mint">
                this console
              </span>
            </div>
            {' '}
            <div className="tbl-wrap">
              <table className="tbl" style={{"minWidth":"0"}}>
                <thead>
                  <tr>
                    <th>
                      Table
                    </th>
                    <th>
                      Role
                    </th>
                    <th className="col-right">
                      Rows
                    </th>
                  </tr>
                </thead>
                <tbody id="erpTables">{H.erpTables}</tbody>
              </table>
            </div>
            {' '}
            <div className="table-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8h.01M11 12h1v4h1"></path>
              </svg>
              <span>
                Row counts are read from{' '}
                <code>
                  erp.sqlite
                </code>
                {' '}when the page loads.{' '}
                <code>
                  audit_log
                </code>
                {' '}is append-only;{' '}
                <code>
                  intake_field
                </code>
                {' '}stores the field-level values alongside the raw payload.
              </span>
            </div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="database" /></span>platform.sqlite</div>
                <div className="card-sub">
                  Shared by the five replicas and the hub.
                </div>
              </div>
              <span className="pill pill-mint">
                live
              </span>
            </div>
            {' '}
            <div className="tbl-wrap">
              <table className="tbl" style={{"minWidth":"0"}}>
                <thead>
                  <tr>
                    <th>
                      Table
                    </th>
                    <th className="col-right">
                      Rows
                    </th>
                  </tr>
                </thead>
                <tbody id="platformTables">{H.platformTables}</tbody>
              </table>
            </div>
          </div>
        </div>
        {' '}
        <div className="card" style={{"marginTop":"16px"}}>
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="database" /></span>PostgreSQL migration</div>
              <div className="card-sub">
                A read-only copy of the SQLite data into{' '}
                <code>
                  demo_replica
                </code>
                {' '}— five tables, no session tokens, no password hashes.
              </div>
            </div>
          </div>
          {' '}
          <div className="def-list">
            <div className="def-row">
              <div className="def-key">
                Direction
              </div>
              <div className="def-val">
                SQLite → PostgreSQL, read-only on the source. The live services keep writing to SQLite.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Excluded
              </div>
              <div className="def-val">
                Session tokens, password hashes and salts never leave the platform database.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Connection
              </div>
              <div className="def-val" id="pgStatus">{H.pgStatus}</div>
            </div>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "health" ? " is-active" : "")} id="view-health" data-title="System Health" data-section="System" data-desc="Service reachability and the documented configuration this console depends on.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Service health
            </h1>
            {' '}
            <p className="page-desc">
              Each row is probed when the page loads and every 30 seconds. A service is only shown as healthy when it answered; anything that cannot be checked from here says so.
            </p>
          </div>
          <PageArt kind="health" />
        </div>
        {' '}
        <div className="grid g-2">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="heart" /></span>Services</div>
                <div className="card-sub">
                  Probed from the hub process.
                </div>
              </div>
            </div>
            {' '}
            <div className="status-list" id="healthServices">{H.healthServices}</div>
            {' '}
            <div className="table-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8h.01M11 12h1v4h1"></path>
              </svg>
              {' '}
              <span>
                Ports and databases are probed by the hub. Docker container health is only visible from the Docker host (
                <code>
                  docker compose ps
                </code>
                ), so it is shown as unavailable here.
              </span>
            </div>
          </div>
          {' '}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="monitor" /></span>Runtime configuration</div>
                <div className="card-sub">
                  Variables the services actually read.
                </div>
              </div>
            </div>
            {' '}
            <div className="def-list">
              <div className="def-row">
                <div className="def-key">
                  ERP_PORT
                </div>
                <div className="def-val">
                  <code>
                    4200
                  </code>
                  {' '}default
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  ERP_DB
                </div>
                <div className="def-val">
                  Path to{' '}
                  <code>
                    erp.sqlite
                  </code>
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  ERP_HOST / HOST
                </div>
                <div className="def-val">
                  Where each service binds — the ERP defaults to{' '}
                  <code>
                    127.0.0.1
                  </code>
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  ERP_TIMEOUT_MS
                </div>
                <div className="def-val">
                  <code>
                    5000
                  </code>
                  {' '}— write-through timeout
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  PLATFORM_PORT / PLATFORM_DB
                </div>
                <div className="def-val">
                  Platform service and its database
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  PORT_OFFSET
                </div>
                <div className="def-val">
                  Shifts all portal ports for a parallel instance
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Containers
                </div>
                <div className="def-val">
                  Read-only root filesystem, all capabilities dropped,{' '}
                  <code>
                    no-new-privileges
                  </code>
                  , non-root
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Healthchecks
                </div>
                <div className="def-val">
                  Every compose service declares one;{' '}
                  <code>
                    docker compose ps
                  </code>
                  {' '}should read{' '}
                  <em>
                    healthy
                  </em>
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Logs
                </div>
                <div className="def-val">
                  Stdout and stderr to Docker{' '}
                  <code>
                    json-file
                  </code>
                  {' '}· 10 MB · 3 files
                </div>
              </div>
              {' '}
              <div className="def-row">
                <div className="def-key">
                  Database
                </div>
                <div className="def-val">
                  Two SQLite files; one writer per file at a time
                </div>
              </div>
            </div>
          </div>
        </div>
        {' '}
        <div className="card" style={{"marginTop":"16px"}}>
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="lock" /></span>Console access</div>
              <div className="card-sub">
                What is implemented, and what is not.
              </div>
            </div>
          </div>
          {' '}
          <div className="def-list">
            <div className="def-row">
              <div className="def-key">
                Authentication
              </div>
              <div className="def-val">
                None on the ERP console or intake API. Adding it is a roadmap item. This console therefore shows no profile menu, sign-in or role switcher.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Network exposure
              </div>
              <div className="def-val">
                Binds to{' '}
                <code>
                  127.0.0.1
                </code>
                {' '}by default. Put an authenticating reverse proxy in front before exposing it.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Containers
              </div>
              <div className="def-val">
                Read-only root filesystem, all capabilities dropped,{' '}
                <code>
                  no-new-privileges
                </code>
                , non-root user.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Tests
              </div>
              <div className="def-val">
                77 end-to-end checks across both databases, plus a rollback test that stops the ERP and proves nothing is kept.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={"view" + (view === "docs" ? " is-active" : "")} id="view-docs" data-title="Documentation" data-section="System" data-desc="Project documents that define this console's behaviour.">
        <div className="page-head has-art">
          <div>
            <h1 className="page-title">
              Documentation
            </h1>
            {' '}
            <p className="page-desc">
              Documents that define this console's behaviour. Paths are repository-relative; copy one to open it locally.
            </p>
          </div>
          <PageArt kind="docs" />
        </div>
        {' '}
        <div className="grid" style={{"gridTemplateColumns":"minmax(0,1fr)"}}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="book" /></span>Project documents</div>
                <div className="card-sub">
                  Click copy to put the path on your clipboard.
                </div>
              </div>
            </div>
            {' '}
            <div className="stack" id="docList" style={{"gap":"9px"}}>{H.docList}</div>
          </div>
          {' '}
                  </div>
        {' '}
        <div className="card" style={{"marginTop":"16px"}}>
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="lock" /></span>What this console deliberately does not do</div>
              <div className="card-sub">
                Scope discipline.
              </div>
            </div>
          </div>
          {' '}
          <div className="def-list">
            <div className="def-row">
              <div className="def-key">
                No writes
              </div>
              <div className="def-val">
                No form here posts to the ERP. Intake is the platform's job and every write path stays where it is.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                Read only
              </div>
              <div className="def-val">
                The dashboard only reads. The audit trail stays append-only, and nothing here changes a portal, a database or an intake record.
              </div>
            </div>
            {' '}
            <div className="def-row">
              <div className="def-key">
                No invented modules
              </div>
              <div className="def-val">
                Finance, HR, inventory, messaging and other generic ERP modules are absent on purpose — the project has no such tables or endpoints.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
