'use strict';

const { categories, govHostSuffixes } = require('./config');

/**
 * Stage: government category detection (spec section 3).
 *
 * Classification is driven by observed content. The key idea is that *where* a
 * word appears says more than how often: a term in the title, a heading or a
 * nav label describes what the site is for, while the same term in body text
 * is often incidental.
 *
 * eforensics.gov.in is the case that forced this. Its footer carries NCRB's
 * postal address and an `@ncrb.nic.in` contact address, so a flat word count
 * scored it as a CCTNS site; its headings say "Digitizing Forensic Labs" and
 * "automate forensic lab operations". Weighting by zone puts it where it
 * belongs, and the per-zone evidence makes the reasoning auditable.
 *
 * The hostname contributes only a small bonus and is always reported
 * separately, so a reader can see whether a verdict holds without it.
 */

const ZONES = [
  { key: 'title', weight: 30, label: 'page title' },
  { key: 'headings', weight: 12, label: 'headings' },
  { key: 'navLabels', weight: 10, label: 'navigation labels' },
  { key: 'meta', weight: 8, label: 'meta description/keywords' },
  { key: 'body', weight: 1, label: 'body text' },
];

const STRONG = 1.0;
const WEAK = 0.18;
const HOST_WEIGHT = 10;
const CONFIDENT_SCORE = 40;
const CONFIDENT_MARGIN = 1.35;

function countOccurrences(haystack, needle) {
  if (!needle || !haystack) return 0;
  let n = 0;
  let i = 0;
  for (;;) {
    const found = haystack.indexOf(needle, i);
    if (found === -1) break;
    n++;
    i = found + needle.length;
  }
  return n;
}

/** Build one zoned document from the sampled pages, de-duplicated by URL. */
function buildZones(pages) {
  const seen = new Set();
  const zones = { title: [], headings: [], navLabels: [], meta: [], body: [] };

  for (const p of pages || []) {
    const key = (p.url || '').replace(/\/+$/, '').toLowerCase();
    if (key && seen.has(key)) continue;   // the same page sampled twice must not vote twice
    if (key) seen.add(key);

    if (p.title) zones.title.push(String(p.title).toLowerCase());
    for (const h of p.headings || []) zones.headings.push(String(h).toLowerCase());
    for (const n of p.navLabels || []) zones.navLabels.push(String(n).toLowerCase());
    if (p.description) zones.meta.push(String(p.description).toLowerCase());
    if (p.keywords) zones.meta.push(String(p.keywords).toLowerCase());
    if (p.text) zones.body.push(String(p.text).toLowerCase());
  }

  const joined = {};
  for (const z of ZONES) joined[z.key] = zones[z.key].join(' \n ');
  return { joined, pagesUsed: seen.size };
}

function scoreTerm(term, strength, joined) {
  let total = 0;
  const where = [];
  for (const z of ZONES) {
    const n = countOccurrences(joined[z.key], term);
    if (!n) continue;
    // Damp repetition: breadth of evidence should beat one repeated phrase.
    const damped = 1 + Math.log10(n);
    const add = z.weight * strength * damped;
    total += add;
    where.push({ zone: z.key, occurrences: n, weight: Number(add.toFixed(2)) });
  }
  return { total, where };
}

function classify({ hostname, pages }) {
  const { joined, pagesUsed } = buildZones(pages);
  const host = (hostname || '').toLowerCase();

  const scored = categories.map((cat) => {
    const hits = { strong: [], weak: [], host: [] };
    let contentScore = 0;

    for (const term of cat.strong) {
      const { total, where } = scoreTerm(term, STRONG, joined);
      if (total > 0) {
        contentScore += total;
        hits.strong.push({ term, weight: Number(total.toFixed(2)), where });
      }
    }
    for (const term of cat.weak) {
      const { total, where } = scoreTerm(term, WEAK, joined);
      if (total > 0) {
        contentScore += total;
        hits.weak.push({ term, weight: Number(total.toFixed(2)), where });
      }
    }

    let hostScore = 0;
    for (const hint of cat.hostHints) {
      if (host.includes(hint)) {
        hostScore += HOST_WEIGHT;
        hits.host.push({ hint, weight: HOST_WEIGHT });
      }
    }

    // Does any strong term appear somewhere that states purpose, rather than
    // only in body text? A footer address should not define a site.
    const prominent = hits.strong.some((h) =>
      h.where.some((w) => w.zone !== 'body'));

    return {
      dir: cat.dir,
      label: cat.label,
      contentScore: Number(contentScore.toFixed(2)),
      hostScore,
      score: Number((contentScore + hostScore).toFixed(2)),
      hasProminentStrongTerm: prominent,
      hits,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const [best, runnerUp] = scored;
  const runnerScore = runnerUp ? runnerUp.score : 0;

  // A verdict must stand on content alone; the hostname may only reinforce it.
  const byContent = scored.slice().sort((a, b) => b.contentScore - a.contentScore);
  const contentWinnerAgrees = byContent[0] && byContent[0].dir === best.dir && byContent[0].contentScore > 0;

  const beatsMargin = runnerScore === 0 ? best.score > 0 : best.score >= runnerScore * CONFIDENT_MARGIN;
  const meetsScore = best.score >= CONFIDENT_SCORE;
  const hasStrong = best.hits.strong.length > 0;

  let category;
  let confidence;
  let status;

  if (meetsScore && hasStrong && best.hasProminentStrongTerm && beatsMargin && contentWinnerAgrees) {
    category = best.dir;
    confidence = (best.score >= CONFIDENT_SCORE * 2 && best.hits.strong.length >= 2) ? 'high' : 'medium';
    status = 'confirmed';
  } else if (best.score > 0 && hasStrong && contentWinnerAgrees && best.hasProminentStrongTerm) {
    category = best.dir;
    confidence = 'low';
    status = 'inferred';
  } else {
    category = 'Unclassified';
    confidence = 'low';
    status = 'unknown';
  }

  const why = status === 'unknown'
    ? (!contentWinnerAgrees
        ? `the hostname and the content disagree: content alone favours ${byContent[0] ? byContent[0].dir : 'nothing'}`
        : !hasStrong ? 'no defining term for any category was found'
        : !best.hasProminentStrongTerm
          ? 'defining terms appeared only in body text, never in a title, heading or nav label'
          : 'the evidence was too weak or too evenly split')
    : `page content, strongest in ${
        (best.hits.strong[0] && best.hits.strong[0].where[0] &&
         ZONES.find((z) => z.key === best.hits.strong[0].where[0].zone).label) || 'page content'}`;

  return {
    category,
    confidence,
    status,
    decidedBy: why,
    wouldHoldWithoutHostname: contentWinnerAgrees,
    governmentHost: govHostSuffixes.some((s) => host.endsWith(s)),
    method:
      'Terms are scored by the zone they appear in, not by raw frequency: ' +
      ZONES.map((z) => `${z.label} x${z.weight}`).join(', ') +
      '. Repetition is damped so breadth of evidence beats one repeated phrase, and a ' +
      'category must have at least one defining term outside body text to win -- a footer ' +
      'address must not decide what a site is for.',
    thresholds: { CONFIDENT_SCORE, CONFIDENT_MARGIN, STRONG, WEAK, HOST_WEIGHT },
    zoneWeights: Object.fromEntries(ZONES.map((z) => [z.key, z.weight])),
    ranking: scored,
    pagesConsidered: pagesUsed,
  };
}

module.exports = { classify };
