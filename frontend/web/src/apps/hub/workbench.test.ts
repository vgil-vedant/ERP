import { describe, expect, it } from 'vitest';
import { applies, checkField, checkForm, collect, initialValues, isWorkbenchView, workbenchMeta } from './workbench';
import type { Field } from './workbench';

const f = (x: Partial<Field>): Field => ({ name: 'x', label: 'X', type: 'text', ...x });

describe('workbench addresses', () => {
  it('knows its own views and nothing else', () => {
    for (const v of ['apply', 'apply:cctns', 'apply:cctns:fir', 'apply:uidai:aadhaar_update', 'approvals', 'work', 'work:ecourts', 'rec:eprisons:12'])
      expect(isWorkbenchView(v)).toBe(true);
    for (const v of ['dashboard', 'records', 'dept:cctns', 'rec:cctns', 'rec:cctns:abc', 'apply:CCTNS', 'work:', 'approvals:x'])
      expect(isWorkbenchView(v)).toBe(false);
  });
  it('names each view in the breadcrumb under Workbench', () => {
    expect(workbenchMeta('apply:cctns:fir')).toEqual(['New application', 'Workbench']);
    expect(workbenchMeta('approvals')).toEqual(['Approvals', 'Workbench']);
    expect(workbenchMeta('work:uidai')).toEqual(['All records', 'Workbench']);
    expect(workbenchMeta('rec:uidai:4')).toEqual(['Record', 'Workbench']);
  });
});

describe('form conditions (same rules as the server)', () => {
  it('is / in / truthy / includes / not', () => {
    expect(applies({ field: 'a', is: 'x' }, { a: 'x' })).toBe(true);
    expect(applies({ field: 'a', is: 'x' }, { a: 'y' })).toBe(false);
    expect(applies({ field: 'a', in: ['x', 'y'] }, { a: 'y' })).toBe(true);
    expect(applies({ field: 'a', truthy: true }, { a: [] })).toBe(false);
    expect(applies({ field: 'a', includes: 'Name' }, { a: ['Name', 'Gender'] })).toBe(true);
    expect(applies({ field: 'a', not: 0 }, { a: 0 })).toBe(false);
    expect(applies({ field: 'a', not: 0 }, { a: '2' })).toBe(true);
    expect(applies({ field: 'a', not: 0 }, { a: '' })).toBe(false);
    expect(applies(undefined, {})).toBe(true);
  });
});

describe('field checks', () => {
  it('required, length and pattern', () => {
    expect(checkField(f({ required: true }), '')).toMatch(/required/);
    expect(checkField(f({}), '')).toBeNull();
    expect(checkField(f({ max: 3 }), 'abcd')).toMatch(/at most 3/);
    expect(checkField(f({ pattern: '^\\d{1,5}/\\d{4}$', patternMessage: 'Use number/year' }), '12-2026')).toBe('Use number/year');
    expect(checkField(f({ pattern: '^\\d{1,5}/\\d{4}$' }), '0123/2026')).toBeNull();
  });
  it('Aadhaar: twelve digits, no leading 0 or 1, Verhoeff check digit', () => {
    const a = f({ type: 'aadhaar', label: 'Aadhaar' });
    expect(checkField(a, '99996417573')).toMatch(/12 digits/);
    expect(checkField(a, '999964175738')).toMatch(/not valid/);
    expect(checkField(a, '9999 6417 5739')).toBeNull();
    expect(checkField(a, '123456789012')).toMatch(/not valid/);
  });
  it('mobile, PIN, e-mail, number, select, dates', () => {
    expect(checkField(f({ type: 'mobile' }), '+91 98220 12345')).toBeNull();
    expect(checkField(f({ type: 'mobile' }), '5822012345')).toMatch(/6, 7, 8 or 9/);
    expect(checkField(f({ type: 'pin' }), '011038')).toMatch(/six digits/);
    expect(checkField(f({ type: 'email' }), 'a@b')).toMatch(/e-mail/);
    expect(checkField(f({ type: 'number', min: 0, max: 9 }), '10')).toMatch(/at most 9/);
    expect(checkField(f({ type: 'number' }), '1.5')).toMatch(/whole number/);
    expect(checkField(f({ type: 'select', options: [{ value: 'A', label: 'a' }] }), 'B')).toMatch(/from the list/);
    expect(checkField(f({ type: 'date', notFuture: true }), '2999-01-01')).toMatch(/future/);
    expect(checkField(f({ type: 'date', notPast: true }), '2000-01-01')).toMatch(/past/);
    expect(checkField(f({ type: 'date' }), '01-02-2026')).toMatch(/valid date/);
  });
});

describe('a whole form', () => {
  const sections = [
    { title: 'A', fields: [
      f({ name: 'category', type: 'select', required: true, options: ['Criminal', 'Civil'], default: 'Criminal' }),
      f({ name: 'fir_no', required: true, when: { field: 'category', is: 'Criminal' } }),
      f({ name: 'nature', required: true, when: { field: 'category', is: 'Civil' } }),
      f({ name: 'count', type: 'number' }),
    ] },
    { title: 'Civil only', when: { field: 'category', is: 'Civil' }, fields: [f({ name: 'plaintiff', required: true })] },
    { title: 'Exhibits', fields: [f({ name: 'exhibits', type: 'group', required: true, min: 1, itemLabel: 'exhibit', fields: [
      f({ name: 'description', required: true }), f({ name: 'quantity', type: 'number', required: true }),
    ] })] },
  ];
  it('starts from the defaults, with one row in a required group', () => {
    const v = initialValues(sections);
    expect(v.category).toBe('Criminal');
    expect(Array.isArray(v.exhibits) && (v.exhibits as unknown[]).length).toBe(1);
  });
  it('checks only what applies, and names group errors as the server does', () => {
    const v = initialValues(sections);
    const e = checkForm(sections, v);
    expect(Object.keys(e).sort()).toEqual(['exhibits.0.description', 'exhibits.0.quantity', 'fir_no']);
    const civil = checkForm(sections, { ...v, category: 'Civil' });
    expect(Object.keys(civil).sort()).toEqual(['exhibits.0.description', 'exhibits.0.quantity', 'nature', 'plaintiff']);
  });
  it('sends only what applies, numbers as numbers', () => {
    const out = collect(sections, { category: 'Criminal', fir_no: '1/2026', nature: 'left over', count: '3', plaintiff: 'x', exhibits: [{ description: 'knife', quantity: '2' }] });
    expect(out).toEqual({ category: 'Criminal', fir_no: '1/2026', count: 3, exhibits: [{ description: 'knife', quantity: 2 }] });
  });
});
