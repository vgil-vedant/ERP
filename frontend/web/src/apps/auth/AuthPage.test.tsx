import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthPage } from './AuthPage';
import type { AuthBoot } from './types';

const base: AuthBoot = {
  page: 'login', action: '/account/login', next: null, values: { email: '' }, errors: {}, serverError: '', fatal: '',
  footer: 'eprisons.nic.in · replica', altHref: '/account/register',
  portals: [{ name: 'ePrisons', href: 'http://127.0.0.1:4173/account', here: true }, { name: 'eCourts', href: 'http://127.0.0.1:4178/account' }],
};

describe('AuthPage', () => {
  it('shows the empty-field messages on submit and does not post', () => {
    render(<AuthPage boot={base} />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form')!);
    expect(screen.getByText('Please enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your password.')).toBeInTheDocument();
  });
  it('clears a message when the user types', () => {
    render(<AuthPage boot={base} />);
    fireEvent.submit(screen.getByLabelText('Email').closest('form')!);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
    expect(document.getElementById('email-err')).toBeEmptyDOMElement();
  });
  it('toggles the password and keeps the server message', () => {
    render(<AuthPage boot={{ ...base, serverError: 'No account matches that email and password.' }} />);
    expect(screen.getByText('No account matches that email and password.')).toBeInTheDocument();
    const pw = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(pw.type).toBe('text');
  });
  it('hub page has Reset and no create-account link; reset empties the fields', () => {
    render(<AuthPage boot={{ ...base, page: 'hub-login', action: '/login', values: { username: 'admin' }, altHref: '', portals: [{ name: 'ePrisons' }] }} />);
    expect(screen.queryByText('Create account')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect((screen.getByLabelText('Username') as HTMLInputElement).value).toBe('');
  });
  it('the notice can be dismissed', () => {
    render(<AuthPage boot={base} />);
    fireEvent.click(screen.getByLabelText('Dismiss this notice'));
    expect(screen.getByText(/Unofficial Local Demonstration/).parentElement).toHaveClass('hidden');
  });
});
