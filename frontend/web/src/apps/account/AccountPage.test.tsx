import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountPage } from './AccountPage';
import type { AccountBoot } from './types';

const col = (n: number) => Array.from({ length: 7 }, (_, d) => ({ date: `2026-10-${String(1 + d).padStart(2, '0')}`, count: n ? 1 : 0, level: n ? 4 : 0 }));
const boot: AccountBoot = {
  site: { code: 'eprisons', name: 'ePrisons', hostname: 'eprisons.nic.in' },
  portals: [{ code: 'eprisons', name: 'ePrisons', hostname: 'eprisons.nic.in', port: 4173, href: 'http://127.0.0.1:4173/account' },
    { code: 'ecourts', name: 'eCourts', hostname: 'ecourts.gov.in', port: 4178, href: 'http://127.0.0.1:4178/account' }],
  links: [['Dashboard', '/public/DashBoard', 'dash']],
  person: { fullName: 'Asha Rao', email: 'asha@example.test', mobile: '', personRef: 'CIT-1', registeredOn: '2026-11-03', registeredVia: 'eprisons', erpCitizenRef: null },
  submissions: [{ site: 'eprisons', heading: 'Lodge a grievance', route: '/public/grievance', reference: 'GRV-1', erpRef: null, createdAt: '2026-11-03 10:00:00' }],
  activity: { total: 1, portalsTotal: 2, portalsUsed: 1, confirmed: 0, last: '2026-11-03T10:00:00.000Z',
    byPortal: [{ code: 'eprisons', name: 'ePrisons', port: 4173, count: 1, current: true }, { code: 'ecourts', name: 'eCourts', port: 4178, count: 0, current: false }],
    here: { count: 1, byForm: [{ label: 'Lodge a grievance', count: 1 }] }, heat: { weeks: 1, from: '2026-10-01', to: '2026-10-07', inWindow: 1, columns: [col(1)] } },
  justRegistered: true,
};

describe('AccountPage', () => {
  it('starts on the overview with the counted figures and the registration notice', () => {
    render(<AccountPage boot={boot} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Overview');
    expect(screen.getByText(/Registered\. This one account/)).toBeInTheDocument();
    expect(screen.getByText('across all 2 websites')).toBeInTheDocument();
  });
  it('switches to My submissions and shows the ERP ref as an em dash when there is none', () => {
    render(<AccountPage boot={boot} />);
    fireEvent.click(screen.getAllByText('My submissions')[0]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My submissions on ePrisons');
    expect(screen.getByText('GRV-1')).toBeInTheDocument();
    expect(location.hash).toBe('#submissions');
  });
  it('opens the website switcher and marks the current site', () => {
    render(<AccountPage boot={boot} />);
    fireEvent.click(screen.getByTitle('Switch website'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('aria-current', 'true');
  });
  it('signs out by posting to /account/logout', () => {
    render(<AccountPage boot={boot} />);
    expect(screen.getByText('Sign out of all portals').closest('form')).toHaveAttribute('action', '/account/logout');
  });
});
