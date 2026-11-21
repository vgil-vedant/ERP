import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { clearSuggestCache, fillCase, fillPerson, personBlocks, queryFor, triggerOf, validAadhaar } from './suggest';
import type { SgCase, SgPerson } from './suggest';
import { FormFields } from './workbench';
import type { Field } from './workbench';

/* the shapes of departments/forms/common.js: personFields(prefix) and the case block */
const GENDER = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'T', label: 'Third gender / Transgender' }];
const STATIONS = ['Kothrud Police Station, Pune', 'Swargate Police Station, Pune'].map((v) => ({ value: v, label: v }));
const OFFENCES = [{ value: 'murder', label: 'Murder' }, { value: 'other', label: 'Other offence' }];
const person = (p: string, extra: Partial<Record<string, Partial<Field>>> = {}): Field[] => [
  { name: `${p}name`, label: 'Full name', type: 'text', required: true, max: 100, pattern: "^[A-Za-z][A-Za-z .'-]*$", ...extra.name },
  { name: `${p}father`, label: 'Father / husband name', type: 'text', max: 100 },
  { name: `${p}gender`, label: 'Gender', type: 'select', required: true, options: GENDER },
  { name: `${p}age`, label: 'Age in years', type: 'number', min: 1, max: 120, ...extra.age },
  { name: `${p}mobile`, label: 'Mobile number', type: 'mobile' },
  { name: `${p}aadhaar`, label: 'Aadhaar number', type: 'aadhaar' },
  { name: `${p}address`, label: 'Address', type: 'textarea', max: 250 },
];
const FIR_FORM = [
  { title: 'Case', fields: [
    { name: 'police_station', label: 'Police station', type: 'select', required: true, options: STATIONS },
    { name: 'fir_no', label: 'FIR number / year', type: 'text', required: true, pattern: '^\\d{1,5}/\\d{4}$' },
    { name: 'fir_date', label: 'FIR date', type: 'date', required: true, notFuture: true },
    { name: 'offence', label: 'Offence', type: 'select', required: true, options: OFFENCES },
    { name: 'offence_other', label: 'Describe the offence', type: 'text', required: true, when: { field: 'offence', is: 'other' } },
    { name: 'cnr', label: 'CNR', type: 'text', max: 16, pattern: '^[A-Z]{4}\\d{12}$' },
  ] as Field[] },
  { title: 'Accused', fields: person('accused_') },
  { title: 'Complainant / informant', fields: person('complainant_') },
  { title: 'Investigating officer', fields: [{ name: 'io_name', label: 'Name', type: 'text' }, { name: 'io_rank', label: 'Rank', type: 'select', options: [{ value: 'PSI', label: 'PSI' }] }] as Field[] },
];
const UIDAI_ENROLMENT = [
  { title: 'Personal information', fields: [
    { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'gender', label: 'Gender', type: 'select', options: GENDER },
    { name: 'dob', label: 'Date of birth', type: 'date', notFuture: true }, { name: 'mobile', label: 'Mobile', type: 'mobile' },
  ] as Field[] },
  { title: 'Address', fields: [
    { name: 'house', label: 'House', type: 'text' }, { name: 'pin', label: 'PIN', type: 'pin' },
    { name: 'district', label: 'District', type: 'select', options: [{ value: 'Pune', label: 'Pune' }] },
    { name: 'state', label: 'State', type: 'select', options: [{ value: 'Maharashtra', label: 'Maharashtra' }] },
  ] as Field[] },
  { title: 'Head of Family', fields: [{ name: 'hof_name', label: 'HoF name', type: 'text' }, { name: 'hof_aadhaar', label: 'HoF Aadhaar', type: 'aadhaar' }] as Field[] },
];
const UIDAI_UPDATE = [{ title: 'Holder', fields: [
  { name: 'aadhaar', label: 'Aadhaar', type: 'aadhaar', required: true },
  { name: 'new_name', label: 'New name', type: 'text' }, { name: 'new_mobile', label: 'New mobile', type: 'mobile' },
] as Field[] }];

const RAHUL: SgPerson = {
  key: 'A:999964175739', name: 'Rahul Shinde', father: 'Yusuf Shinde', gender: 'M', dob: '1985-09-28', age: 41,
  mobile: '9243524307', aadhaar: '999964175739', aadhaarMasked: 'XXXX XXXX 5739', email: null,
  address: '33/5, Laxmi Chawl, Kothrud, Pune 411038', district: 'Pune',
  addressParts: { house: '33/5, Laxmi Chawl', pin: '411038', district: 'Pune', state: 'Maharashtra' },
  sources: [{ code: 'uidai', short: 'UIDAI', ref: 'UID-R-1', roles: ['resident'] }, { code: 'cctns', short: 'CCTNS', ref: 'CCT-P-1', roles: ['accused'] }],
};
const PRIYA: SgPerson = { ...RAHUL, key: 'A:2', name: 'Priya Deshpande', father: null, gender: 'F', age: 30, aadhaar: null, aadhaarMasked: null, mobile: '9876543210', addressParts: null, address: null, sources: [] };
const CASE: SgCase = {
  key: 'K|727/2022', firNo: '0727/2022', station: 'Kothrud Police Station, Pune', stationName: 'Kothrud Police Station', district: 'Pune',
  date: '2022-10-20', offence: 'murder', offenceOther: null, offenceTitle: 'Murder', cnr: 'MHPU010078272022', court: null,
  sources: [{ code: 'cctns', short: 'CCTNS', ref: 'FIR' }], parties: [{ roles: ['Accused'], person: RAHUL }, { roles: ['Complainant'], person: PRIYA }],
};
const names = (s: { fields: Field[] }[]) => new Set(s.flatMap((x) => x.fields.map((f) => f.name)));
const empty = (s: { fields: Field[] }[]) => Object.fromEntries(s.flatMap((x) => x.fields.map((f) => [f.name, ''])));

describe('which fields suggest', () => {
  it('offers suggestions on a person’s Aadhaar, mobile and name, and on the FIR number and CNR', () => {
    const n = names(FIR_FORM);
    const field = (name: string) => FIR_FORM.flatMap((s) => s.fields).find((f) => f.name === name)!;
    expect(triggerOf(field('accused_aadhaar'), n)).toEqual({ kind: 'person', prefix: 'accused_' });
    expect(triggerOf(field('complainant_mobile'), n)).toEqual({ kind: 'person', prefix: 'complainant_' });
    expect(triggerOf(field('accused_name'), n)).toEqual({ kind: 'person', prefix: 'accused_' });
    expect(triggerOf(field('fir_no'), n)).toEqual({ kind: 'case' });
    expect(triggerOf(field('cnr'), n)).toEqual({ kind: 'case' });
  });
  it('leaves other fields alone: an officer’s name, a father’s name, the new details of an update', () => {
    const n = names(FIR_FORM);
    const field = (name: string) => FIR_FORM.flatMap((s) => s.fields).find((f) => f.name === name)!;
    expect(triggerOf(field('io_name'), n)).toBeNull();
    expect(triggerOf(field('accused_father'), n)).toBeNull();
    expect(triggerOf(field('fir_date'), n)).toBeNull();
    const u = names(UIDAI_UPDATE);
    expect(triggerOf(UIDAI_UPDATE[0].fields[1], u)).toBeNull();
    expect(triggerOf(UIDAI_UPDATE[0].fields[2], u)).toBeNull();
    expect(triggerOf(UIDAI_UPDATE[0].fields[0], u)).toEqual({ kind: 'person', prefix: '' });
  });
  it('treats the head of family on an enrolment as a person', () => {
    const n = names(UIDAI_ENROLMENT);
    expect(triggerOf(UIDAI_ENROLMENT[2].fields[0], n)).toEqual({ kind: 'person', prefix: 'hof_' });
    expect(triggerOf(UIDAI_ENROLMENT[0].fields[0], n)).toEqual({ kind: 'person', prefix: '' });
  });
});

describe('the question asked', () => {
  const t = { kind: 'person' as const, prefix: 'accused_' };
  it('asks nothing until a value is complete enough', () => {
    expect(queryFor(t, { accused_name: 'Ra', accused_aadhaar: '9999 6417', accused_mobile: '92435' })).toBeNull();
    expect(queryFor({ kind: 'case' }, { fir_no: '72/20' })).toBeNull();
    expect(queryFor({ kind: 'case' }, { fir_no: '0/2022' })).toBeNull();
  });
  it('sends a valid Aadhaar number, never an invalid one', () => {
    expect(validAadhaar('9999 6417 5739')).toBe(true);
    expect(validAadhaar('999964175738')).toBe(false);
    expect(validAadhaar('123412341234')).toBe(false);
    expect(queryFor(t, { accused_aadhaar: '9999 6417 5739' })).toBe('aadhaar=999964175739');
    expect(queryFor(t, { accused_aadhaar: '999964175738', accused_name: 'Rahul' })).toBe('name=Rahul');
  });
  it('sends what the block holds, so the server can put the Aadhaar match first', () => {
    expect(queryFor(t, { accused_aadhaar: '999964175739', accused_mobile: '+91 92435 24307', accused_name: 'Rahul S' }))
      .toBe('aadhaar=999964175739&mobile=%2B919243524307&name=Rahul+S');
  });
  it('asks for a case by FIR number or CNR, with the police station chosen so far', () => {
    expect(queryFor({ kind: 'case' }, { fir_no: '727 / 2022', police_station: 'Kothrud Police Station, Pune' })).toBe('fir=727%2F2022&station=Kothrud+Police+Station%2C+Pune');
    expect(queryFor({ kind: 'case' }, { cnr: 'mhpu010078272022' })).toBe('cnr=MHPU010078272022');
  });
});

describe('filling a form', () => {
  it('fills one person’s block, and nothing else', () => {
    const r = fillPerson(FIR_FORM, empty(FIR_FORM), 'accused_', RAHUL);
    expect(r.values).toMatchObject({
      accused_name: 'Rahul Shinde', accused_father: 'Yusuf Shinde', accused_gender: 'M', accused_age: '41',
      accused_mobile: '9243524307', accused_aadhaar: '999964175739', accused_address: '33/5, Laxmi Chawl, Kothrud, Pune 411038',
    });
    expect(r.values.complainant_name).toBe('');
    expect(r.values.fir_no).toBe('');
    expect(r.filled).toHaveLength(7);
    expect(r.skipped).toEqual([]);
  });
  it('leaves out a value the form would refuse, and says so', () => {
    const odd: SgPerson = { ...RAHUL, gender: 'X', age: 140, name: 'R2D2 Unit' };
    const r = fillPerson(FIR_FORM, empty(FIR_FORM), 'accused_', odd);
    expect(r.values.accused_gender).toBe('');
    expect(r.values.accused_age).toBe('');
    expect(r.values.accused_name).toBe('');
    expect(r.skipped).toEqual(expect.arrayContaining(['Gender', 'Age in years', 'Full name']));
    expect(r.values.accused_aadhaar).toBe('999964175739');
  });
  it('respects a form’s own limits, such as a minimum age', () => {
    const form = [{ title: 'Visitor', fields: person('visitor_', { age: { min: 18 } }) }];
    const r = fillPerson(form, empty(form), 'visitor_', { ...RAHUL, age: 12 });
    expect(r.values.visitor_age).toBe('');
    expect(r.skipped).toContain('Age in years');
  });
  it('fills the address in parts on a UIDAI enrolment, but never the new details of an update', () => {
    const r = fillPerson(UIDAI_ENROLMENT, empty(UIDAI_ENROLMENT), '', RAHUL);
    expect(r.values).toMatchObject({ name: 'Rahul Shinde', gender: 'M', dob: '1985-09-28', mobile: '9243524307', house: '33/5, Laxmi Chawl', pin: '411038', district: 'Pune', state: 'Maharashtra' });
    expect(r.values.hof_name).toBe('');
    const u = fillPerson(UIDAI_UPDATE, empty(UIDAI_UPDATE), '', RAHUL);
    expect(u.values).toEqual({ aadhaar: '999964175739', new_name: '', new_mobile: '' });
  });
  it('fills the case block from an FIR', () => {
    const r = fillCase(FIR_FORM, empty(FIR_FORM), CASE);
    expect(r.values).toMatchObject({ fir_no: '0727/2022', police_station: 'Kothrud Police Station, Pune', fir_date: '2022-10-20', offence: 'murder', cnr: 'MHPU010078272022', offence_other: '' });
    expect(r.values.accused_name).toBe('');
  });
  it('describes an offence the form does not list as "other"', () => {
    const r = fillCase(FIR_FORM, empty(FIR_FORM), { ...CASE, offence: 'other', offenceOther: 'Cheating by personation', offenceTitle: 'Cheating by personation' });
    expect(r.values.offence).toBe('other');
    expect(r.values.offence_other).toBe('Cheating by personation');
  });
  it('does not fill a field that does not apply to the form as filled', () => {
    const r = fillCase(FIR_FORM, empty(FIR_FORM), { ...CASE, offenceOther: 'stray text' });
    expect(r.values.offence).toBe('murder');
    expect(r.values.offence_other).toBe('');
  });
  it('names the person blocks of a form, for filling a case’s people', () => {
    expect(personBlocks(FIR_FORM, empty(FIR_FORM))).toEqual([{ prefix: 'accused_', title: 'Accused' }, { prefix: 'complainant_', title: 'Complainant / informant' }]);
  });
});

/* ------------------------------------------------------------------ in the form */
function Harness({ sections }: { sections: { title?: string; fields: Field[] }[] }) {
  const [values, setValues] = useState<Record<string, unknown>>(empty(sections));
  return <form><FormFields sections={sections as never} values={values} setValues={setValues} errors={{}} scope="t" suggest /></form>;
}
const answer = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('suggestions in the application form', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { clearSuggestCache(); vi.useFakeTimers({ shouldAdvanceTime: true }); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const settle = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(300); }); await act(async () => { await Promise.resolve(); }); };
  const input = (label: string, i = 0) => screen.getAllByLabelText(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`))[i] as HTMLInputElement;

  it('finds the one person with an Aadhaar number and fills the block at once', async () => {
    fetchMock.mockImplementation(() => answer({ people: [RAHUL], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '9999 6417 5739' } });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/workbench/suggest?aadhaar=999964175739');
    expect(input('Full name', 0).value).toBe('Rahul Shinde');
    expect(input('Father / husband name', 0).value).toBe('Yusuf Shinde');
    expect(input('Gender', 0).textContent).toMatch(/^Male/);
    expect(input('Age in years', 0).value).toBe('41');
    expect(input('Mobile number', 0).value).toBe('9243524307');
    expect(input('Address', 0).value).toBe('33/5, Laxmi Chawl, Kothrud, Pune 411038');
    expect(input('Full name', 1).value).toBe('');
    expect(screen.getByRole('status').textContent).toMatch(/Rahul Shinde: filled 6 fields/);
    // nothing to choose, and the answered question is not asked again
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.change(input('Full name', 0), { target: { value: 'Rahul Y Shinde' } });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(input('Full name', 0).value).toBe('Rahul Y Shinde');
  });

  it('asks for the Aadhaar number first in every person block', () => {
    const { container } = render(<Harness sections={FIR_FORM} />);
    const order = [...container.querySelectorAll('[data-field]')].map((el) => el.getAttribute('data-field'));
    for (const p of ['accused_', 'complainant_']) expect(order.indexOf(`${p}aadhaar`)).toBe(order.indexOf(`${p}name`) - 1);
    expect(order.indexOf('fir_no')).toBeLessThan(order.indexOf('accused_aadhaar'));
    expect(screen.queryByText(/Type this first/)).toBeNull();
  });

  it('fills the block again for another Aadhaar number, keeping what was changed by hand', async () => {
    const SUNITA: SgPerson = { ...RAHUL, key: 'A:2', name: 'Sunita Kale', father: null, gender: 'F', age: 35, mobile: '9123456780', aadhaar: '999934958049', address: null, addressParts: null };
    fetchMock.mockImplementation((url: string) => answer({ people: url.includes('999964175739') ? [RAHUL] : url.includes('999934958049') ? [SUNITA] : [], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    expect(input('Address', 0).value).toMatch(/Laxmi Chawl/);
    fireEvent.change(input('Address', 0), { target: { value: 'Typed by hand' } });
    fireEvent.change(aadhaar, { target: { value: '999934958049' } });
    await settle();
    expect(input('Full name', 0).value).toBe('Sunita Kale');
    expect(input('Gender', 0).textContent).toMatch(/^Female/);
    expect(input('Father / husband name', 0).value).toBe('');
    expect(input('Address', 0).value).toBe('Typed by hand');
    // a number nobody holds clears what was filled for the previous one
    fireEvent.change(aadhaar, { target: { value: '234567890124' } });
    await settle();
    expect(input('Full name', 0).value).toBe('');
    expect(input('Mobile number', 0).value).toBe('');
    expect(input('Address', 0).value).toBe('Typed by hand');
    expect(screen.getByText(/No department holds this Aadhaar number yet.*has been cleared/)).toBeTruthy();
  });

  it('looks up an Aadhaar number pasted in and left at once', async () => {
    fetchMock.mockImplementation(() => answer({ people: [RAHUL], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 1);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    aadhaar.blur();
    await settle();
    expect(input('Full name', 1).value).toBe('Rahul Shinde');
    expect(input('Full name', 0).value).toBe('');
  });

  it('shows the list when an Aadhaar number unexpectedly names several people', async () => {
    fetchMock.mockImplementation(() => answer({ people: [RAHUL, { ...RAHUL, key: 'y', name: 'Rahul Patil' }], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    await settle();
    expect(input('Full name', 0).value).toBe('');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    fireEvent.click(screen.getByText('Rahul Patil'));
    expect(input('Full name', 0).value).toBe('Rahul Patil');
  });

  it('shows which departments hold a match, and opens to everything held without choosing it', async () => {
    fetchMock.mockImplementation(() => answer({ people: [RAHUL, { ...RAHUL, key: 'y', name: 'Rahul Patil' }], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    await settle();
    // each match names the departments that hold it, by their own icon and name
    const row = screen.getAllByRole('option')[0];
    expect(row.textContent).toContain('UIDAI');
    expect(row.textContent).toContain('CCTNS');
    expect(row.querySelectorAll('.sg-chip')).toHaveLength(2);
    expect(row.querySelectorAll('.sg-dept').length).toBeGreaterThanOrEqual(2);
    // the details are closed until asked for
    expect(screen.queryByText('Father / husband')).toBeNull();
    const more = screen.getAllByRole('button', { name: 'Show all details' })[0];
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(screen.getByText('Father / husband')).toBeTruthy();
    expect(screen.getByText('Yusuf Shinde')).toBeTruthy();
    expect(screen.getByText('XXXX XXXX 5739')).toBeTruthy();
    expect(screen.getByText('XXXXXX4307')).toBeTruthy();
    expect(screen.getByText('Held by')).toBeTruthy();
    // opening it did not choose the person
    expect(input('Full name', 0).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Use these details' }));
    expect(input('Full name', 0).value).toBe('Rahul Shinde');
  });

  it('can be driven from the keyboard, and closed with Escape', async () => {
    fetchMock.mockImplementation(() => answer({ people: [RAHUL, { ...RAHUL, key: 'x', name: 'Rahul Patil', aadhaar: null }], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const name = input('Full name', 1);
    name.focus();
    fireEvent.change(name, { target: { value: 'Rahul' } });
    await settle();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    fireEvent.keyDown(name, { key: 'ArrowDown' });
    fireEvent.keyDown(name, { key: 'ArrowDown' });
    expect(name.getAttribute('aria-activedescendant')).toMatch(/-1$/);
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(input('Full name', 1).value).toBe('Rahul Patil');
    fireEvent.change(name, { target: { value: 'Priya' } });
    await settle();
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(name, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input('Full name', 1).value).toBe('Priya');
  });

  it('lists every case with an FIR number, then fills its people into the blocks chosen', async () => {
    const other = { ...CASE, key: 'S|727/2022', station: 'Swargate Police Station, Pune', stationName: 'Swargate Police Station', parties: [] };
    fetchMock.mockImplementation(() => answer({ people: [], cases: [CASE, other], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const fir = input('FIR number / year');
    fir.focus();
    fireEvent.change(fir, { target: { value: '727/2022' } });
    await settle();
    expect(screen.getByText('2 cases with this FIR number')).toBeTruthy();
    fireEvent.click(screen.getByText(/Kothrud Police Station$/));
    expect(fir.value).toBe('0727/2022');
    expect(screen.getByText(/People named in FIR 0727\/2022/)).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: /Fill as Accused/ });
    fireEvent.click(buttons[0]);
    expect(input('Full name', 0).value).toBe('Rahul Shinde');
    fireEvent.click(screen.getAllByRole('button', { name: /Fill as Complainant/ })[1]);
    expect(input('Full name', 1).value).toBe('Priya Deshpande');
    expect(screen.getAllByRole('button', { name: /Filled as/ })).toHaveLength(2);
    // the Aadhaar numbers put in by those fills are not looked up again
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText(/People named in FIR/)).toBeNull();
  });

  it('says so when nobody holds the Aadhaar number typed', async () => {
    fetchMock.mockImplementation(() => answer({ people: [], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    expect(screen.getByText(/No department holds this Aadhaar number yet. Fill in the details by hand.$/)).toBeTruthy();
    expect(input('Full name', 0).value).toBe('');
  });

  it('says so when nothing is held for an exact number, and stays quiet while a name is typed', async () => {
    fetchMock.mockImplementation(() => answer({ people: [], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const mobile = input('Mobile number', 0);
    mobile.focus();
    fireEvent.change(mobile, { target: { value: '9876543210' } });
    await settle();
    expect(screen.getByText(/No department holds a person with this number yet/)).toBeTruthy();
    const name = input('Full name', 1);
    name.focus();
    fireEvent.change(name, { target: { value: 'Nobody' } });
    await settle();
    expect(screen.queryByText(/No department holds/)).toBeNull();
  });

  it('keeps the form usable when suggestions fail', async () => {
    fetchMock.mockImplementation(() => answer({ error: 'boom' }, 500));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    expect(screen.getByText('boom')).toBeTruthy();
    expect(aadhaar.value).toBe('999964175739');
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));
    fireEvent.change(aadhaar, { target: { value: '999934958049' } });
    await settle();
    expect(screen.getByText(/Suggestions are not available right now/)).toBeTruthy();
  });

  it('does not redirect away from a half-filled form when the session has ended', async () => {
    fetchMock.mockImplementation(() => answer({ error: 'sign in' }, 401));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 0);
    aadhaar.focus();
    fireEvent.change(aadhaar, { target: { value: '999964175739' } });
    await settle();
    expect(screen.getByText(/Your session has ended/)).toBeTruthy();
  });

  it('asks once per question while typing, and not at all for incomplete values', async () => {
    fetchMock.mockImplementation(() => answer({ people: [], cases: [], unavailable: [] }));
    render(<Harness sections={FIR_FORM} />);
    const aadhaar = input('Aadhaar number', 1);
    aadhaar.focus();
    for (const v of ['9', '99', '9999', '99996417', '99996417573']) fireEvent.change(aadhaar, { target: { value: v } });
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(aadhaar, { target: { value: '999934958049' } });
    fireEvent.change(aadhaar, { target: { value: '99993495804' } });
    fireEvent.change(aadhaar, { target: { value: '999934958049' } });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is off unless the form asks for it', () => {
    const sections = FIR_FORM;
    function Plain() {
      const [values, setValues] = useState<Record<string, unknown>>(empty(sections));
      return <FormFields sections={sections as never} values={values} setValues={setValues} errors={{}} scope="p" />;
    }
    const { container } = render(<Plain />);
    expect(container.querySelector('.sg-host')).toBeNull();
  });
});
