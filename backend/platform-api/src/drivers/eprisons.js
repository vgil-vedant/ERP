'use strict';

/**
 * Routes for the hand-built ePrisons portal.
 *
 * Its 566-line route set, 22 views and real domain model (State -> Jail,
 * two relationship vocabularies, conditional ID-proof numbering) are worth
 * keeping as they are, so this driver mounts that app rather than reimplementing
 * it. Two things are injected:
 *
 *   EPRISONS_DB  points its store at the one shared platform database
 *   setMirror    gives it the ERP write-through it has no reason to know about
 *
 * The app keeps its own view directory, so its own look survives mounting.
 */

const path = require('path');
const express = require('express');
const store = require('../db');
const erp = require('../services/erp-client');

function eprisonsRouter(site) {
  // Must be set before its db.js is first required, since that opens the file
  // at require time.
  process.env.EPRISONS_DB = store.DB_PATH;

  const appPath = path.join(site.project, 'replica', 'backend', 'server.js');
  const app = require(appPath);

  const FORMS = {
    visit_registration: '/public/MyVisitRegistration',
    grievance: '/public/grievance',
    citizen_registration: '/CitiZenService/Visitor/Registration',
  };

  /**
   * Mirror one ePrisons record into the ERP.
   *
   * Unlike the generic driver, the local row is already written by the time
   * this runs - the handler inserted it into its own domain table. So on a
   * refusal this deletes that row again, which keeps the same invariant: the
   * record is in both databases or in neither.
   */
  app.setMirror(async (rec) => {
    const route = FORMS[rec.form] || rec.route;
    const formId = store.formKey(site.code, route, rec.form);
    const fields = Object.entries(rec.value || {})
      .filter(([k]) => !/pass|pwd|secret|otp|captcha|token|challenge/i.test(k))
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({
        name: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: Array.isArray(v) ? v.join(', ') : String(v),
      }));

    // Whoever is signed in (the shared session), or nobody: a signed-out visitor stays anonymous.
    const signedIn = rec.req && rec.req.person ? rec.req.person : null;

    const sync = await erp.sendSubmission({
      sourceSystem: site.code,
      sourceForm: rec.form,
      sourceRoute: route,
      sourceReference: rec.reference,
      subject: rec.subject,
      person: signedIn ? store.personPublic(signedIn) : null,
      fields,
      payload: Object.fromEntries(fields.map((f) => [f.name, f.value])),
    });

    if (!sync.ok) {
      // Undo the handler's own insert, then say so permanently in the trail.
      try {
        if (rec.table && rec.rowId) {
          store.db.prepare(`DELETE FROM ${rec.table} WHERE id = ?`).run(rec.rowId);
        }
      } catch (err) {
        process.stderr.write(`[eprisons] could not roll back ${rec.table}#${rec.rowId}: ${err.message}\n`);
      }
      store.recordSyncAttempt('submission', rec.reference, 'failed', sync.status, null, sync.message);
      store.audit(site.code, rec.table, rec.rowId, 'ROLLBACK', 'portal:' + site.code, null,
        `${rec.reference} was rolled back: the ERP did not accept it (${sync.message})`);
      return {
        ok: false,
        message: `Not saved. The ERP backend did not accept this record: ${sync.message}. ` +
          `Nothing was written on either side. Start the ERP ` +
          `(cd backend/erp-api && npm start) and submit again.`,
      };
    }

    // Also record it in the shared submission table, so one query answers
    // "everything every portal has collected" across all five.
    try {
      const reserved = store.reserveSubmission({
        siteCode: site.code, formId, prefix: rec.reference.split('-')[0] || 'EPR',
        personId: signedIn ? signedIn.id : null,
        value: Object.fromEntries(fields.map((f) => [f.name, f.value])),
        fields,
      });
      store.db.prepare('UPDATE submission SET reference_no = ? WHERE id = ?')
        .run(rec.reference, reserved.id);
      store.confirmSubmission({
        id: reserved.id, reference: rec.reference, siteCode: site.code,
        formId, erpRef: sync.erpRef, status: sync.status,
      });
    } catch (err) {
      // The ERP has it and the domain table has it; the cross-portal index is
      // a convenience, so a clash here must not fail the submission.
      process.stderr.write(`[eprisons] shared index skipped for ${rec.reference}: ${err.message}\n`);
      store.recordSyncAttempt('submission', rec.reference, 'synced', sync.status, sync.erpRef,
        'recorded in the ERP and the domain table; not indexed in submission');
    }

    return { ok: true, erpRef: sync.erpRef };
  });

  const r = express.Router();
  r.use(app);
  return r;
}

module.exports = { eprisonsRouter };
