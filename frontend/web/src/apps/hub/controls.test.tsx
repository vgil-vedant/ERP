import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './controls';

const options = [{ value: 'a', label: 'Aurangabad' }, { value: 'p', label: 'Pune' }, { value: 'n', label: 'Nagpur' }, { value: 'pa', label: 'Palghar' }];

describe('Select', () => {
  it('has a search box that narrows the list, and Enter picks the highlighted match', () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={onChange} options={options} ariaLabel="City" placeholder="All cities" clearable />);
    fireEvent.click(screen.getByRole('combobox', { name: 'City' }));
    const box = screen.getByRole('searchbox', { name: 'Search City' });
    expect(screen.getAllByRole('option')).toHaveLength(5); // the "All cities" row and four cities
    fireEvent.change(box, { target: { value: 'pa' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Palghar']);
    fireEvent.change(box, { target: { value: 'zzz' } });
    expect(screen.getByText('No match')).toBeInTheDocument();
    fireEvent.change(box, { target: { value: 'pu' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('p');
  });
});
