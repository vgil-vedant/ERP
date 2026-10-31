'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Targetable, so this portal can be served from the one shared platform
// database. Unset, it behaves exactly as it always did.
const DB_PATH = process.env.EPRISONS_DB
  || path.join(__dirname, '..', 'database', 'replica.sqlite');

if (!fs.existsSync(DB_PATH)) {
  throw new Error(
    `Local demonstration database not found at ${DB_PATH}.\n` +
    'Create it first:  npm run seed'
  );
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// --- reference data (cached: it never changes at runtime) -------------------
const ref = {
  states: db.prepare('SELECT id, name FROM state ORDER BY sort_order').all(),
  relationships: db.prepare(
    "SELECT id, name FROM relationship WHERE source_portal = 'NPIP' ORDER BY sort_order").all(),
  // The Citizen Services portal publishes a different, shorter list.
  csRelationships: db.prepare(
    "SELECT id, name FROM relationship WHERE source_portal = 'CITIZEN_SERVICE' ORDER BY sort_order").all(),
  idProofs: db.prepare('SELECT id, name, requires_number FROM id_proof_type ORDER BY sort_order').all(),
  genders: db.prepare('SELECT id, name FROM gender ORDER BY sort_order').all(),
};

const q = {
  jailsByState: db.prepare('SELECT id, name, jail_type FROM jail WHERE state_id = ? ORDER BY name'),
  jailById: db.prepare('SELECT j.id, j.name, j.jail_type, j.state_id, s.name AS state_name ' +
                       'FROM jail j JOIN state s ON s.id = j.state_id WHERE j.id = ?'),
  stateById: db.prepare('SELECT id, name FROM state WHERE id = ?'),

  insertVisit: db.prepare(`
    INSERT INTO visit_request (
      registration_no, visitor_name, visitor_father_name, visitor_address,
      visitor_gender_id, visitor_age, relationship_id, id_proof_type_id, id_number,
      is_international, email, mobile_no, state_id, jail_id, visit_date,
      additional_visitor_count, prisoner_name, prisoner_father_name, prisoner_age,
      prisoner_gender_id, physically_handicapped, visit_mode
    ) VALUES (
      @registration_no, @visitor_name, @visitor_father_name, @visitor_address,
      @visitor_gender_id, @visitor_age, @relationship_id, @id_proof_type_id, @id_number,
      @is_international, @email, @mobile_no, @state_id, @jail_id, @visit_date,
      @additional_visitor_count, @prisoner_name, @prisoner_father_name, @prisoner_age,
      @prisoner_gender_id, @physically_handicapped, @visit_mode
    )`),
  insertAdditionalVisitor: db.prepare(
    'INSERT INTO additional_visitor (visit_request_id, name) VALUES (?, ?)'),
  visitByRegNo: db.prepare(`
    SELECT v.*, s.name AS state_name, j.name AS jail_name,
           g.name AS visitor_gender, pg.name AS prisoner_gender,
           r.name AS relationship_name, ip.name AS id_proof_name
    FROM visit_request v
    JOIN state s ON s.id = v.state_id
    JOIN jail j ON j.id = v.jail_id
    LEFT JOIN gender g ON g.id = v.visitor_gender_id
    LEFT JOIN gender pg ON pg.id = v.prisoner_gender_id
    LEFT JOIN relationship r ON r.id = v.relationship_id
    LEFT JOIN id_proof_type ip ON ip.id = v.id_proof_type_id
    WHERE v.registration_no = ?`),
  additionalVisitors: db.prepare(
    'SELECT name FROM additional_visitor WHERE visit_request_id = ? ORDER BY id'),

  insertGrievance: db.prepare(`
    INSERT INTO grievance (
      reference_no, complainant_name, complainant_mobile, complainant_email,
      complainant_address, relationship_id, inmate_name, inmate_father_name,
      state_id, jail_id, category, subject, description, due_at
    ) VALUES (
      @reference_no, @complainant_name, @complainant_mobile, @complainant_email,
      @complainant_address, @relationship_id, @inmate_name, @inmate_father_name,
      @state_id, @jail_id, @category, @subject, @description, @due_at
    )`),
  insertGrievanceAction: db.prepare(
    'INSERT INTO grievance_action (grievance_id, action, remark, actor_role) VALUES (?, ?, ?, ?)'),
  grievanceByRef: db.prepare(`
    SELECT g.*, s.name AS state_name, j.name AS jail_name, r.name AS relationship_name
    FROM grievance g
    JOIN state s ON s.id = g.state_id
    JOIN jail j ON j.id = g.jail_id
    LEFT JOIN relationship r ON r.id = g.relationship_id
    WHERE g.reference_no = ?`),
  grievanceActions: db.prepare(
    'SELECT action, remark, actor_role, acted_at FROM grievance_action WHERE grievance_id = ? ORDER BY id'),

  insertAudit: db.prepare(`INSERT INTO audit_log (entity, entity_id, action, maker, approver, details)
                           VALUES (?, ?, ?, ?, ?, ?)`),
};

/** Append-only audit entry, as required by the ERP scope. */
function audit(entity, entityId, action, maker, approver, details) {
  q.insertAudit.run(entity, entityId, action, maker, approver || null, details || null);
}

function nextSequence(prefix, table, column) {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  return `${prefix}${String(Date.now()).slice(-6)}${String(row.n + 1).padStart(4, '0')}`;
}

// --- listings with filtering and pagination --------------------------------
function listAbsconders({ stateId, page = 1, pageSize = 20 }) {
  const where = stateId ? 'WHERE a.state_id = @stateId' : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM absconder a ${where}`).get({ stateId }).n;
  const rows = db.prepare(`
    SELECT a.id, a.name, a.father_name, a.absconded_on, a.remarks,
           s.name AS state_name, j.name AS jail_name
    FROM absconder a
    JOIN state s ON s.id = a.state_id
    LEFT JOIN jail j ON j.id = a.jail_id
    ${where}
    ORDER BY a.absconded_on DESC
    LIMIT @limit OFFSET @offset`)
    .all({ stateId, limit: pageSize, offset: (page - 1) * pageSize });
  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

function listParoleJumpers({ stateId, page = 1, pageSize = 20 }) {
  const where = stateId ? 'WHERE p.state_id = @stateId' : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM parole_jumper p ${where}`).get({ stateId }).n;
  const rows = db.prepare(`
    SELECT p.id, p.name, p.father_name, p.parole_from, p.due_back_on, p.remarks,
           s.name AS state_name, j.name AS jail_name
    FROM parole_jumper p
    JOIN state s ON s.id = p.state_id
    LEFT JOIN jail j ON j.id = p.jail_id
    ${where}
    ORDER BY p.due_back_on DESC
    LIMIT @limit OFFSET @offset`)
    .all({ stateId, limit: pageSize, offset: (page - 1) * pageSize });
  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

function lockupReport({ stateId, days = 7 }) {
  const where = stateId ? 'WHERE l.state_id = @stateId' : '';
  return db.prepare(`
    SELECT l.report_date, s.name AS state_name, j.name AS jail_name,
           l.male_count, l.female_count, l.trans_count,
           (l.male_count + l.female_count + l.trans_count) AS total_count
    FROM lockup_report l
    JOIN state s ON s.id = l.state_id
    JOIN jail j ON j.id = l.jail_id
    ${where}
    ORDER BY l.report_date DESC, s.name, j.name
    LIMIT @limit`).all({ stateId, limit: days * 40 });
}

function headlineStats() {
  const metric = (m) => db.prepare(
    'SELECT COALESCE(SUM(value),0) AS n FROM statistic_snapshot WHERE metric = ?').get(m).n;
  return {
    statesCovered: db.prepare('SELECT COUNT(*) AS n FROM state').get().n,
    prisonsOnBoard: db.prepare('SELECT COUNT(*) AS n FROM jail').get().n,
    inmatesInCustody: metric('inmates_in_custody'),
    sanctionedCapacity: metric('sanctioned_capacity'),
    visitsRegisteredToday: metric('visits_registered_today'),
    courtHearingsToday: metric('court_hearings_today'),
    foreignInmates: metric('foreign_inmates'),
    visitRequestsHeld: db.prepare('SELECT COUNT(*) AS n FROM visit_request').get().n,
    grievancesHeld: db.prepare('SELECT COUNT(*) AS n FROM grievance').get().n,
  };
}

function statsByState(metric) {
  return db.prepare(`
    SELECT s.name AS state_name, COALESCE(SUM(ss.value),0) AS value
    FROM state s
    LEFT JOIN statistic_snapshot ss ON ss.state_id = s.id AND ss.metric = ?
    GROUP BY s.id ORDER BY value DESC`).all(metric);
}

/**
 * The five cards at the top of the dashboard, for one state or for all of them.
 * Inmates, visits and court hearings come from the snapshot. The demonstration
 * database holds no daily admissions or releases, so those two are synthetic
 * figures scaled from the custody population (about 0.017% and 0.145% of it).
 */
function dashboardKpis(stateId) {
  const metric = (m) => (stateId
    ? db.prepare('SELECT COALESCE(SUM(value),0) AS n FROM statistic_snapshot WHERE metric = ? AND state_id = ?').get(m, stateId)
    : db.prepare('SELECT COALESCE(SUM(value),0) AS n FROM statistic_snapshot WHERE metric = ?').get(m)).n;
  const inside = metric('inmates_in_custody');
  return {
    inside,
    admissions: Math.round(inside * 0.00017),
    released: Math.round(inside * 0.00145),
    visits: metric('visits_registered_today'),
    hearings: metric('court_hearings_today'),
  };
}

/**
 * The two dashboard charts, each with the three series the original draws.
 *
 *   trend  the last seven days, newest first (as the original lists them):
 *          Admission, Release and Visitors, stacked.
 *   states the seven states holding the most people: Inside, Release, Admission.
 *
 * Today's figures are the same numbers as the cards. Earlier days and the
 * per-state Release / Admission values are synthetic, varied by a fixed function
 * of the date so a reload draws the same chart. Inside is the snapshot figure.
 */
function dashboardCharts(now) {
  const kpi = dashboardKpis(0);
  const dayNo = Math.floor(now.getTime() / 86400000);
  const wobble = (day, salt) => {
    const x = Math.sin((day + salt) * 12.9898) * 43758.5453;
    return 0.8 + 0.4 * (x - Math.floor(x));
  };
  const trend = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now.getTime() - i * 86400000);
    trend.push({
      date: d.toISOString().slice(0, 10),
      admission: i === 0 ? kpi.admissions : Math.round(kpi.admissions * wobble(dayNo - i, 1)),
      release: i === 0 ? kpi.released : Math.round(kpi.released * wobble(dayNo - i, 2)),
      visitors: i === 0 ? kpi.visits : Math.round(kpi.visits * wobble(dayNo - i, 3)),
    });
  }
  const states = statsByState('inmates_in_custody').slice(0, 7).map((r) => ({
    state: r.state_name,
    inside: r.value,
    release: Math.round(r.value * 0.00145),
    admission: Math.round(r.value * 0.00017),
  }));
  return { trend, states };
}

function visitStatusBreakdown() {
  return db.prepare(
    'SELECT status, COUNT(*) AS n FROM visit_request GROUP BY status ORDER BY n DESC').all();
}

function grievancePendency() {
  return db.prepare(`
    SELECT status, COUNT(*) AS n,
           SUM(CASE WHEN disposed_at IS NULL AND due_at < date('now') THEN 1 ELSE 0 END) AS overdue
    FROM grievance GROUP BY status ORDER BY n DESC`).all();
}

module.exports = {
  db, ref, q, audit, nextSequence,
  listAbsconders, listParoleJumpers, lockupReport,
  headlineStats, statsByState, dashboardKpis, dashboardCharts, visitStatusBreakdown, grievancePendency,
};
