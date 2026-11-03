'use strict';

/**
 * The figures behind the Overview of the "My account" page.
 *
 * Everything is counted from the signed-in person's own submissions, as the
 * platform database holds them. Nothing is estimated or filled in: a person with
 * no submissions gets zeros and empty lists, and the page says so.
 */

const DAY = 24 * 60 * 60 * 1000;

/** "2026-11-03 07:25:06" (SQLite, UTC) or an ISO string -> Date, or null. */
function parseWhen(value) {
  if (!value) return null;
  const s = String(value).trim();
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(date) { return date.toISOString().slice(0, 10); }

/**
 * @param submissions  this person's submissions, every portal, newest first
 * @param portals      [{ code, name, port }] in display order
 * @param siteCode     the portal being viewed
 * @param now          injectable for tests
 * @param weeks        how many weeks the heat map covers
 */
function summarize(submissions, portals, siteCode, now = new Date(), weeks = 12) {
  const subs = (submissions || []).map((s) => ({ ...s, when: parseWhen(s.createdAt) }));

  const byPortal = portals.map((p) => {
    const mine = subs.filter((s) => s.site === p.code);
    const dates = mine.map((s) => s.when).filter(Boolean).sort((a, b) => b - a);
    return {
      code: p.code, name: p.name, port: p.port,
      count: mine.length,
      confirmed: mine.filter((s) => s.erpRef).length,
      last: dates.length ? dates[0].toISOString() : null,
      current: p.code === siteCode,
    };
  });

  const here = subs.filter((s) => s.site === siteCode);
  const formCounts = new Map();
  here.forEach((s) => {
    const label = s.heading || s.route || 'Form';
    formCounts.set(label, (formCounts.get(label) || 0) + 1);
  });
  const byForm = [...formCounts.entries()].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  // Heat map: `weeks` columns of Monday..Sunday, the last column holds today.
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayOffset = (today.getUTCDay() + 6) % 7;                 // 0 = Monday
  const start = new Date(today.getTime() - (mondayOffset + (weeks - 1) * 7) * DAY);
  const perDay = new Map();
  subs.forEach((s) => { if (s.when) perDay.set(dayKey(s.when), (perDay.get(dayKey(s.when)) || 0) + 1); });
  const columns = [];
  let max = 0;
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY);
      const future = date > today;
      const count = future ? 0 : (perDay.get(dayKey(date)) || 0);
      if (count > max) max = count;
      col.push({ date: dayKey(date), count, future });
    }
    columns.push(col);
  }
  const level = (n) => (n === 0 ? 0 : max <= 1 ? 4 : Math.min(4, 1 + Math.floor(((n - 1) / max) * 4)));
  columns.forEach((col) => col.forEach((c) => { c.level = c.future ? -1 : level(c.count); }));
  const inWindow = columns.flat().filter((c) => !c.future).reduce((t, c) => t + c.count, 0);

  const allDates = subs.map((s) => s.when).filter(Boolean).sort((a, b) => b - a);
  return {
    total: subs.length,
    confirmed: subs.filter((s) => s.erpRef).length,
    portalsUsed: byPortal.filter((p) => p.count > 0).length,
    portalsTotal: portals.length,
    last: allDates.length ? allDates[0].toISOString() : null,
    here: { code: siteCode, count: here.length, byForm },
    byPortal,
    heat: { weeks, columns, max, inWindow, from: dayKey(start), to: dayKey(today) },
  };
}

module.exports = { summarize, parseWhen };
