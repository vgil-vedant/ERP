import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import type { TableCfg } from './DataTable';

interface Row { name: string; n: number }
const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({ name: 'row' + String(i).padStart(2, '0'), n: i }));
const cfg: TableCfg<Row> = {
  columns: [
    { key: 'name', label: 'Name', sortable: true, render: (r) => r.name, sortValue: (r) => r.name, csv: (r) => r.name },
    { key: 'n', label: 'Number', sortable: true, render: (r) => r.n, sortValue: (r) => r.n, csv: (r) => r.n },
  ],
  rows: () => rows, searchKeys: (r) => [r.name], pageSize: 10, defaultSort: 'n', defaultDir: 'desc', exportName: 'x',
};

describe('DataTable', () => {
  it('sorts by the default column, pages, and reports the range', () => {
    render(<DataTable cfg={cfg} onExport={() => {}} />);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('row24');
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–10 of 25');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 11–20 of 25');
  });
  it('filters by search, shows the empty state and clears it', () => {
    render(<DataTable cfg={cfg} onExport={() => {}} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'row07' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nope' } });
    expect(screen.getByText('Nothing matches these filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear filters'));
    expect(screen.getByText(/Showing/)).toHaveTextContent('of 25');
  });
  it('exports the filtered rows as quoted CSV with a formula guard', () => {
    const onExport = vi.fn();
    const guarded: TableCfg<Row> = { ...cfg, rows: () => [{ name: '=SUM(A1)', n: 1 }] };
    render(<DataTable cfg={guarded} onExport={onExport} />);
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledWith('x.csv', '"Name","Number"\n"\'=SUM(A1)","1"', 1);
  });
  it('folds rows of one subject under one row that opens to show the rest', () => {
    interface P { who: string; what: string; t: number }
    const data: P[] = [{ who: 'Asha', what: 'created', t: 1 }, { who: 'Ravi', what: 'created', t: 2 }, { who: 'Asha', what: 'verified', t: 3 }, { who: 'Asha', what: 'approved', t: 4 }];
    const gcfg: TableCfg<P> = {
      columns: [{ key: 'who', label: 'Person', render: (r) => r.who, sortValue: (r) => r.who, csv: (r) => r.who }, { key: 'what', label: 'Change', render: (r) => r.what, csv: (r) => r.what }, { key: 't', label: 'T', sortable: true, render: (r) => r.t, sortValue: (r) => r.t, csv: (r) => r.t }],
      rows: () => data, searchKeys: (r) => [r.who], pageSize: 10, defaultSort: 't', defaultDir: 'desc', group: { key: (r) => r.who, noun: 'change' },
    };
    render(<DataTable cfg={gcfg} onExport={() => {}} />);
    // two people, not four rows; Asha shows her newest change first
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–2 of 2');
    expect(screen.getByText(/Showing/)).toHaveTextContent('4 changes in all');
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('approved');
    expect(screen.queryByText('created', { selector: 'td' })).toBeInTheDocument(); // Ravi's only row
    fireEvent.click(screen.getByRole('button', { name: 'Show all 3 changes' }));
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('verified')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide all 3 changes' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});
