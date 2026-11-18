/**
 * The illustration at the right of a page heading. One small flat SVG per page, all drawn in the same
 * white-and-mint language (soft circle, white cards with a hairline edge, one green accent, navy only for tiny details).
 * They are static, trusted strings: nothing here comes from data.
 */
export type ArtKind = 'apply' | 'dashboard' | 'approvals' | 'records' | 'lookup' | 'citizens'
  | 'departments' | 'intake' | 'audit' | 'dept' | 'queue' | 'failures' | 'ledger' | 'recon' | 'officers' | 'lookupaudit' | 'activity' | 'health' | 'databases' | 'docs';

const G = '#159D78', MINT = '#CFE9DD', MINT2 = '#BFE5D3', SOFT = '#EAF7F1', EDGE = '#DCEBE4', LINE = '#E6F0EC', NAVY = '#24374D';
const base = `<circle cx="112" cy="68" r="60" fill="${SOFT}"/><ellipse cx="112" cy="137" rx="82" ry="7" fill="${MINT}" opacity=".55"/>`;
const card = (x: number, y: number, w: number, h: number, r = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" stroke="${EDGE}" stroke-width="2"/>`;
const bar = (x: number, y: number, w: number, h = 6, fill = LINE) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>`;
const tick = (cx: number, cy: number, r: number, sw = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${G}"/><path d="m${cx - r * 0.45} ${cy + r * 0.02} ${r * 0.33} ${r * 0.36} ${r * 0.62} ${-r * 0.7}" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const leaf = (d: string, fill = MINT2) => `<path d="${d}" fill="${fill}"/>`;
const AMBER = '#E9A23B';
const cyl = (cx: number, top: number, rx: number, h: number, fill = '#fff') => `<path d="M${cx - rx} ${top}v${h}a${rx} ${rx / 3} 0 0 0 ${rx * 2} 0v${-h}" fill="${fill}" stroke="${EDGE}" stroke-width="2"/><path d="M${cx - rx} ${top + h / 2}a${rx} ${rx / 3} 0 0 0 ${rx * 2} 0" fill="none" stroke="${MINT2}" stroke-width="2"/><ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${rx / 3}" fill="${MINT}" stroke="${EDGE}" stroke-width="2"/>`;
const person = (cx: number, cy: number, r: number, fill = MINT) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><path d="M${cx - r * 1.6} ${cy + r * 2.5}a${r * 1.6} ${r * 1.4} 0 0 1 ${r * 3.2} 0Z" fill="${fill}"/>`;

const BODY: Record<ArtKind, string> = {
  // a new document being created
  apply: `${base}${leaf('M40 92c-14-4-22-18-18-34 14 2 24 10 28 24-2 5-5 8-10 10Z')}${leaf('M182 44c10 4 16 14 14 26-11-1-18-7-21-17 1-4 3-7 7-9Z', '#CBEADC')}${leaf('M186 104c12-2 20 4 24 14-10 4-19 2-26-6 0-4 1-6 2-8Z')}`
    + `${card(62, 14, 98, 116, 14)}${bar(78, 34, 52, 7, MINT)}${bar(78, 52, 66)}${bar(78, 66, 60)}${bar(78, 80, 40)}`
    + `<circle cx="146" cy="108" r="22" fill="${G}"/><path d="M146 98v20M136 108h20" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`,
  // department cards: a bar chart, a ring and a trend line
  dashboard: `${base}${card(34, 24, 104, 88)}${bar(48, 38, 36, 6, MINT)}`
    + `<rect x="48" y="78" width="11" height="20" rx="3" fill="${MINT}"/><rect x="65" y="66" width="11" height="32" rx="3" fill="${MINT2}"/><rect x="82" y="72" width="11" height="26" rx="3" fill="${MINT}"/><rect x="99" y="52" width="11" height="46" rx="3" fill="${G}"/><rect x="116" y="62" width="11" height="36" rx="3" fill="${MINT2}"/>`
    + `${card(124, 12, 70, 44, 11)}<circle cx="146" cy="34" r="11" fill="none" stroke="${LINE}" stroke-width="6"/><circle cx="146" cy="34" r="11" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round" stroke-dasharray="46 70" transform="rotate(-90 146 34)"/>${bar(164, 27, 20, 5, NAVY)}${bar(164, 38, 14, 5, MINT)}`
    + `${card(146, 68, 56, 48, 11)}<path d="M156 104 166 93l8 6 18-18" stroke="${G}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="192" cy="81" r="3.6" fill="${G}"/>${bar(156, 108, 22, 4, MINT)}`,
  // an application sheet with a checklist and a big tick
  approvals: `${base}${leaf('M34 96c-12-4-18-16-14-30 12 2 21 9 24 21-2 5-5 8-10 9Z')}`
    + `${card(52, 14, 100, 116, 14)}${bar(68, 32, 40, 7, MINT)}`
    + [52, 72, 92].map((y, i) => `<circle cx="76" cy="${y + 3}" r="6" ${i < 2 ? `fill="${SOFT}" stroke="${G}"` : `fill="#fff" stroke="${MINT}"`} stroke-width="2"/>${i < 2 ? `<path d="m73 ${y + 3} 2.2 2.4 4.2-4.6" stroke="${G}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : ''}${bar(90, y, 46)}`).join('')
    + `<circle cx="150" cy="104" r="27" fill="${G}"/><path d="m137 105 9 9 17-20" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    + `<circle cx="176" cy="40" r="13" fill="#fff" stroke="${MINT2}" stroke-width="3" stroke-dasharray="4 4"/><path d="m170 40 4 4 7-8" stroke="${G}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // a stack of documents beside a database
  records: `${base}<rect x="34" y="34" width="74" height="92" rx="11" fill="${LINE}" stroke="${EDGE}" stroke-width="2" transform="rotate(-7 71 80)"/><rect x="42" y="26" width="74" height="92" rx="11" fill="#F6FBF9" stroke="${EDGE}" stroke-width="2" transform="rotate(-2 79 72)"/>`
    + `${card(52, 20, 74, 94, 11)}${bar(66, 36, 38, 7, MINT)}${bar(66, 54, 46)}${bar(66, 68, 40)}${bar(66, 82, 30)}<rect x="66" y="96" width="22" height="9" rx="4.5" fill="${G}"/>`
    + `<path d="M138 56v48a30 10 0 0 0 60 0V56" fill="#fff" stroke="${EDGE}" stroke-width="2"/><path d="M138 78a30 10 0 0 0 60 0M138 100a30 10 0 0 0 60 0" fill="none" stroke="${MINT2}" stroke-width="2"/><ellipse cx="168" cy="56" rx="30" ry="10" fill="${MINT}" stroke="${EDGE}" stroke-width="2"/>`
    + `<circle cx="150" cy="68" r="3" fill="${G}"/><circle cx="150" cy="90" r="3" fill="${G}"/><circle cx="150" cy="112" r="3" fill="${MINT2}"/>${bar(158, 66, 24, 4, MINT)}${bar(158, 88, 18, 4, MINT)}`,
  // an identity card, a magnifier and a verified tick
  lookup: `${base}${card(30, 36, 114, 78)}<circle cx="58" cy="64" r="12" fill="${MINT}"/><path d="M38 108a20 17 0 0 1 40 0Z" fill="${MINT}"/>${bar(88, 54, 44, 6, NAVY)}${bar(88, 68, 32)}${bar(88, 82, 38)}${bar(88, 96, 24)}`
    + `<circle cx="152" cy="76" r="28" fill="#fff" fill-opacity=".85" stroke="${G}" stroke-width="7"/><circle cx="152" cy="70" r="8" fill="${MINT}"/><path d="M138 94a14 12 0 0 1 28 0Z" fill="${MINT}"/><path d="m172 97 22 22" stroke="${G}" stroke-width="9" stroke-linecap="round"/>`
    + `${tick(40, 36, 11, 3)}`,
  // citizen profile cards with a verification badge and a database mark
  citizens: `${base}${card(20, 52, 90, 66)}<circle cx="44" cy="76" r="11" fill="${MINT}"/><path d="M28 112a16 14 0 0 1 32 0Z" fill="${MINT}"/>${bar(64, 70, 34, 6, NAVY)}${bar(64, 82, 26)}${bar(30, 98, 70, 5)}`
    + `${card(74, 22, 112, 88)}<circle cx="104" cy="52" r="15" fill="${MINT2}"/><path d="M84 100a20 17 0 0 1 40 0Z" fill="${MINT2}"/>${bar(132, 44, 44, 7, NAVY)}${bar(132, 58, 32)}${bar(88, 84, 84, 5)}${bar(130, 96, 36, 5, MINT)}`
    + `${tick(180, 26, 11, 3)}<ellipse cx="186" cy="104" rx="13" ry="5" fill="${G}"/><path d="M173 104v13a13 5 0 0 0 26 0v-13" fill="${MINT2}"/><ellipse cx="186" cy="104" rx="13" ry="5" fill="${G}"/>`,

  // the five offices side by side: one row each, in their own colours, with a small tally
  departments: `${base}${card(30, 18, 112, 100)}`
    + ['#9560E8', '#2674F5', '#9050E8', '#E76C27', '#138C98'].map((c, i) => `<circle cx="50" cy="${38 + i * 17}" r="6" fill="${c}" opacity=".85"/>${bar(64, 35 + i * 17, 54 - (i % 3) * 8, 6, LINE)}${bar(124, 35 + i * 17, 10, 6, MINT2)}`).join('')
    + `${card(132, 40, 60, 70, 11)}<rect x="144" y="82" width="9" height="16" rx="3" fill="${MINT}"/><rect x="158" y="68" width="9" height="30" rx="3" fill="${G}"/><rect x="172" y="76" width="9" height="22" rx="3" fill="${MINT2}"/>${bar(144, 52, 30, 5, NAVY)}`,
  // submissions arriving in an inbox
  intake: `${base}${card(64, 14, 70, 56, 10)}${bar(76, 28, 38, 6, MINT)}${bar(76, 42, 46)}<path d="M99 74v14m0 0-7-7m7 7 7-7" stroke="${G}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    + `<path d="M34 96l16-22h98l16 22v22a10 10 0 0 1-10 10H44a10 10 0 0 1-10-10Z" fill="#fff" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/><path d="M34 96h46a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8h46" fill="none" stroke="${MINT2}" stroke-width="2.5"/>${tick(172, 40, 13, 3.4)}`,
  // a shield over an append-only log
  audit: `${base}${card(30, 34, 96, 84)}${bar(44, 50, 30, 6, MINT)}${[66, 80, 94, 108].map((y) => `<circle cx="48" cy="${y + 3}" r="2.6" fill="${MINT2}"/>${bar(58, y, 52 - ((y / 7) % 3) * 6, 5)}`).join('')}`
    + `<path d="M150 22l36 12v30c0 24-16 40-36 48-20-8-36-24-36-48V34Z" fill="#fff" stroke="${EDGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M150 32l27 9v23c0 18-12 31-27 37-15-6-27-19-27-37V41Z" fill="${SOFT}"/><path d="m137 66 9 9 17-19" stroke="${G}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // one department office
  dept: `${base}${leaf('M26 98c-10-3-16-13-13-25 10 2 17 8 19 18-1 4-3 6-6 7Z')}${leaf('M196 96c10-3 17 3 20 11-8 4-16 2-21-5 0-3 0-5 1-6Z', '#CBEADC')}`
    + `<path d="M110 14 52 40h116Z" fill="${MINT}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/><rect x="56" y="40" width="108" height="8" rx="2" fill="#fff" stroke="${EDGE}" stroke-width="2"/>`
    + [66, 90, 114, 138].map((x) => `<rect x="${x - 6}" y="52" width="12" height="52" rx="3" fill="#fff" stroke="${EDGE}" stroke-width="2"/>`).join('') + `<rect x="48" y="104" width="124" height="12" rx="3" fill="#fff" stroke="${EDGE}" stroke-width="2"/><rect x="40" y="116" width="140" height="10" rx="3" fill="${MINT}" stroke="${EDGE}" stroke-width="2"/>${tick(172, 36, 13, 3.4)}`,
  // events waiting in a line, moving to the ERP
  queue: `${base}` + [30, 64, 98].map((x, i) => `<rect x="${x}" y="50" width="28" height="36" rx="8" fill="#fff" stroke="${EDGE}" stroke-width="2"/>${bar(x + 6, 60, 16, 4, i === 0 ? G : MINT)}${bar(x + 6, 70, 12, 4)}`).join('')
    + `<path d="M130 68h26m0 0-8-8m8 8-8 8" stroke="${G}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${card(160, 36, 36, 64, 9)}<rect x="168" y="46" width="20" height="8" rx="3" fill="${MINT}"/><rect x="168" y="60" width="20" height="8" rx="3" fill="${MINT}"/><circle cx="178" cy="86" r="4" fill="${G}"/>`
    + `<circle cx="56" cy="30" r="13" fill="#fff" stroke="${EDGE}" stroke-width="2"/><path d="M56 23v8l5 3" stroke="${NAVY}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // an event that did not go through, with a retry
  failures: `${base}${card(34, 30, 92, 78)}${bar(48, 46, 40, 6, MINT)}${bar(48, 62, 62)}${bar(48, 76, 50)}${bar(48, 90, 34)}`
    + `<path d="M150 28l28 48h-56Z" fill="#fff" stroke="${AMBER}" stroke-width="4" stroke-linejoin="round"/><path d="M150 46v14" stroke="${AMBER}" stroke-width="4.5" stroke-linecap="round"/><circle cx="150" cy="68" r="2.8" fill="${AMBER}"/>`
    + `<circle cx="150" cy="106" r="19" fill="${G}"/><path d="M142 106a8 8 0 0 1 14-5.5M158 106a8 8 0 0 1-14 5.5" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="m156 96 1 6.5-6.5-1" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // the write-through ledger: an open book with ticked lines
  ledger: `${base}<path d="M110 30c-14-8-40-8-62 0v82c22-8 48-8 62 0Z" fill="#fff" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/><path d="M110 30c14-8 40-8 62 0v82c-22-8-48-8-62 0Z" fill="#F6FBF9" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>`
    + [48, 64, 80, 96].map((y, i) => `<path d="m58 ${y + 3} 4 4 7-8" stroke="${i === 3 ? MINT2 : G}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${bar(76, y, 24 - (i % 2) * 6, 5)}${bar(122, y, 30, 5)}`).join('')
    + `<path d="M174 40l14 14-34 34-18 4 4-18Z" fill="${G}"/><path d="m170 44 14 14" stroke="#fff" stroke-width="2.4"/>`,
  // the office on one side, the ERP on the other, and they agree
  recon: `${base}${card(24, 32, 66, 84, 11)}${bar(36, 46, 26, 6, MINT)}${bar(36, 62, 42)}${bar(36, 76, 34)}${bar(36, 90, 40)}${card(130, 32, 66, 84, 11)}${bar(142, 46, 26, 6, MINT)}${bar(142, 62, 42)}${bar(142, 76, 34)}${bar(142, 90, 40)}`
    + `<circle cx="110" cy="74" r="20" fill="${G}"/><path d="M100 70h20M100 79h20" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/><path d="M90 74h-2M132 74h-2" stroke="${G}" stroke-width="3" stroke-linecap="round"/>`,
  // officer accounts: a badge and a key
  officers: `${base}${card(30, 30, 100, 78)}${person(58, 62, 11)}${bar(82, 52, 38, 6, NAVY)}${bar(82, 66, 30)}${bar(82, 80, 36)}<rect x="40" y="94" width="40" height="6" rx="3" fill="${MINT2}"/>`
    + `<circle cx="164" cy="64" r="17" fill="#fff" stroke="${G}" stroke-width="6"/><circle cx="164" cy="64" r="5" fill="${MINT}"/><path d="M176 74l18 18m-8-8 8-8m-14 14 7-7" stroke="${G}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // a magnifier over the list of lookups
  lookupaudit: `${base}${card(28, 24, 104, 96)}${bar(42, 40, 36, 6, MINT)}${[56, 72, 88, 104].map((y) => `<circle cx="46" cy="${y + 3}" r="3" fill="${MINT2}"/>${bar(56, y, 54)}`).join('')}`
    + `<circle cx="150" cy="82" r="26" fill="#fff" fill-opacity=".85" stroke="${G}" stroke-width="7"/>${bar(138, 74, 24, 5, MINT2)}${bar(138, 86, 16, 5, MINT2)}<path d="m170 102 20 20" stroke="${G}" stroke-width="9" stroke-linecap="round"/>${tick(172, 30, 11, 3)}`,
  // officer actions along a timeline
  activity: `${base}<path d="M64 20v108" stroke="${MINT}" stroke-width="3" stroke-linecap="round"/>` + [32, 66, 100].map((y, i) => `<circle cx="64" cy="${y}" r="9" fill="${i === 0 ? G : '#fff'}" stroke="${i === 0 ? G : MINT2}" stroke-width="3"/>${card(84, y - 17, 100, 34, 9)}${bar(96, y - 8, 46, 5, i === 0 ? NAVY : MINT)}${bar(96, y + 4, 62, 4)}`).join('')
    + `<circle cx="36" cy="32" r="13" fill="#fff" stroke="${EDGE}" stroke-width="2"/><path d="M36 25v8l5 3" stroke="${NAVY}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // a monitor with a heartbeat line
  health: `${base}${card(30, 22, 124, 84, 13)}<path d="M44 66h22l8-22 14 44 10-30 8 8h22" stroke="${G}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="76" y="106" width="20" height="10" fill="${MINT}"/><rect x="60" y="114" width="52" height="8" rx="4" fill="${MINT2}"/>`
    + `${card(160, 44, 38, 58, 10)}<circle cx="179" cy="62" r="6" fill="${G}"/><circle cx="179" cy="82" r="6" fill="${MINT2}"/>${bar(168, 92, 22, 4, MINT)}${tick(160, 30, 11, 3)}`,
  // two databases and the link between them
  databases: `${base}${cyl(66, 44, 34, 56)}${cyl(158, 60, 30, 44)}<path d="M100 76h26" stroke="${G}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/><path d="m122 70 8 6-8 6" stroke="${G}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="52" cy="64" r="3" fill="${G}"/><circle cx="52" cy="86" r="3" fill="${MINT2}"/><circle cx="146" cy="78" r="3" fill="${G}"/>`,
  // project documents: a document and an open book
  docs: `${base}${card(34, 26, 80, 98)}${bar(48, 42, 34, 7, MINT)}${[58, 72, 86, 100].map((y) => bar(48, y, 52 - ((y / 7) % 3) * 8)).join('')}`
    + `<path d="M126 44c10-5 26-5 40 0v62c-14-5-30-5-40 0Z" fill="#fff" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/><path d="M166 44c8-4 18-4 26 0v62c-8-4-18-4-26 0Z" fill="#F6FBF9" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/><path d="M180 44v24l6-5 6 5V44" fill="${G}"/>${bar(134, 58, 24, 4, MINT)}${bar(134, 70, 20, 4)}${bar(134, 82, 26, 4)}`,
};

const svgFor = (kind: ArtKind) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" fill="none">${BODY[kind]}</svg>`;

/** For headings that other code renders (Person Lookup): the same art as a CSS background. */
export const artUri = (kind: ArtKind) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svgFor(kind))}")`;

/** The illustration at the right of a page heading; hidden on very narrow screens. */
export function PageArt({ kind }: { kind: ArtKind }) {
  return <span className="page-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgFor(kind) }} />;
}
