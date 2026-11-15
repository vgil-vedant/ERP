import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from '../../shared/icons';
import { Field } from './Field';
import { Carousel } from './Carousel';
import type { Slide } from './Carousel';
import type { AuthBoot, FieldDef } from './types';
import heroCitizen from './assets/hero-citizen.webp';
import heroHub from './assets/hero-hub.webp';

const SLIDES_HUB: Slide[] = [
  { title: 'What the ERP received', text: 'Records and citizens as the ERP holds them, read live from its own database.' },
  { title: 'How each write resolved', text: 'Every write-through attempt from the portals, with its result and HTTP status.' },
  { title: 'Service health at a glance', text: 'Whether the ERP, the databases and the five portal replicas are answering.' },
];
const slidesCitizen = (names: string[]): Slide[] => [
  { title: 'One account, every portal', text: `Register once and the same sign-in works on ${names.join(', ')}.` },
  { title: 'Stored in two places, or neither', text: 'Each registration and form is saved on the platform and in the ERP together. If the ERP refuses it, nothing is kept.' },
  { title: 'Every action stays on record', text: 'The ERP audit trail is append-only, so what was received and when can always be checked.' },
];

const FIELDS: Record<AuthBoot['page'], FieldDef[]> = {
  login: [
    { id: 'email', name: 'email', type: 'email', label: 'Email', icon: 'mail', required: true, autoComplete: 'username', empty: 'Please enter your email.' },
    { id: 'password', name: 'password', label: 'Password', icon: 'lock', password: true, required: true, autoComplete: 'current-password', empty: 'Please enter your password.' },
  ],
  register: [
    { id: 'full_name', name: 'full_name', label: 'Full name', icon: 'user', required: true, maxLength: 80, autoComplete: 'name', empty: 'Please enter your full name.' },
    { id: 'email', name: 'email', type: 'email', label: 'Email', icon: 'mail', required: true, maxLength: 120, autoComplete: 'email', empty: 'Please enter your email.' },
    { id: 'mobile', name: 'mobile', label: 'Mobile (optional)', icon: 'phone', maxLength: 10, inputMode: 'numeric', autoComplete: 'tel' },
    { id: 'password', name: 'password', label: 'Password', icon: 'lock', password: true, required: true, autoComplete: 'new-password', empty: 'Please enter a password.' },
    { id: 'confirm_password', name: 'confirm_password', label: 'Confirm password', icon: 'lock', password: true, required: true, autoComplete: 'new-password', empty: 'Please confirm your password.' },
  ],
  'hub-login': [
    { id: 'username', name: 'username', label: 'Username', icon: 'user', required: true, autoComplete: 'username', empty: 'Please enter your username.' },
    { id: 'password', name: 'password', label: 'Password', icon: 'lock', password: true, required: true, autoComplete: 'current-password', empty: 'Please enter your password.' },
  ],
};

const COPY = {
  login: { h1: 'Welcome back', sub: 'Please sign in to your account.', primary: 'Login', busy: 'Signing in…', primaryIcon: 'login', altLabel: 'Create account', altIcon: 'userplus' },
  register: { h1: 'Create your account', sub: 'Register once and the same account is accepted by every portal in this demonstration.', primary: 'Register', busy: 'Registering…', primaryIcon: 'userplus', altLabel: 'Sign in', altIcon: 'login' },
  'hub-login': { h1: 'Welcome back', sub: 'Please sign in to the ERP Hub.', primary: 'Login', busy: 'Signing in…', primaryIcon: 'login', altLabel: '', altIcon: 'login' },
} as const;

const btnBase = 'lg-btn relative flex h-[46px] flex-1 cursor-pointer items-center justify-center rounded-lg px-[14px] pl-[50px] text-[14px] no-underline transition-[background,transform,border-color] duration-[160ms] active:translate-y-px';
const btnPrimary = `${btnBase} lg-btn-primary border-[1.5px] border-lg-btn bg-lg-btn text-lg-btn-ink [box-shadow:0_10px_22px_-16px_var(--lg-shadow)] hover:border-lg-btn-hover hover:bg-lg-btn-hover`;
const btnOutline = `${btnBase} lg-btn-outline border-[1.5px] border-lg-outline bg-transparent text-lg-text hover:bg-lg-chip`;
const bic = 'lg-bic absolute bottom-0 left-[14px] top-0 grid place-items-center [&_svg]:h-[17px] [&_svg]:w-[17px]';

export function AuthPage({ boot }: { boot: AuthBoot }) {
  const hub = boot.page === 'hub-login';
  const fields = FIELDS[boot.page];
  const copy = COPY[boot.page];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, boot.values[f.name] ?? ''])));
  const [errors, setErrors] = useState<Record<string, string>>(boot.errors);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState(boot.serverError);
  const [busy, setBusy] = useState(false);
  const [noticeHidden, setNoticeHidden] = useState(false);

  useEffect(() => {   // back button: undo the busy state
    const on = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setBusy(false);
      // Restored from the browser's cache. On the hub this page is reachable by
      // Back after signing in, where asking for credentials again is wrong: the
      // reload lets the server decide, and it sends a signed-in visitor on to
      // the dashboard. The response carries no-store, so nothing is restored twice.
      if (hub) window.location.reload();
    };
    window.addEventListener('pageshow', on);
    return () => window.removeEventListener('pageshow', on);
  }, [hub]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const next: Record<string, string> = {};
    let first: string | null = null;
    for (const f of fields) {
      if (f.required && !values[f.name].trim()) { next[f.name] = f.empty ?? 'This field is required.'; first ??= f.id; }
    }
    if (first) { e.preventDefault(); setErrors((cur) => ({ ...cur, ...next })); document.getElementById(first)?.focus(); return; }
    window.setTimeout(() => setBusy(true), 0);
  };

  const onReset = () => {
    setErrors({}); setRevealed({}); setServerError('');
    setValues(Object.fromEntries(fields.map((f) => [f.name, ''])));
    window.setTimeout(() => document.getElementById(fields[0].id)?.focus(), 0);
  };

  const slides = hub ? SLIDES_HUB : slidesCitizen(boot.portals.map((p) => p.name));
  const q = boot.next ? `?next=${encodeURIComponent(boot.next)}` : '';

  return (
    <div className="contents">
      <div className={`lg-notice relative flex-none bg-[#064D36] px-11 py-[7px] text-center text-[12.5px] leading-[1.3] text-white ${noticeHidden ? 'hidden' : ''}`}>
        <span>Unofficial Local Demonstration — Not an Official Government Service</span>
        <button type="button" aria-label="Dismiss this notice" onClick={() => setNoticeHidden(true)}
          className="lg-notice-x absolute right-2 top-1/2 grid h-[26px] w-[26px] -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-white hover:bg-white/[.18] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-1 [&_svg]:h-[15px] [&_svg]:w-[15px]">
          <Icon n="close" />
        </button>
      </div>
      <div className="lg-shell grid min-h-0 flex-1 grid-cols-[1.07fr_1fr] bg-lg-card shadow-lg-shell">
        <main id="main" className={`lg-form flex min-h-0 min-w-0 flex-col overflow-y-auto bg-lg-card px-[52px] pb-7 pt-10 ${hub ? 'lg-form--hub' : ''}`}>
          <div className="lg-toprow flex w-full max-w-[520px] items-center gap-3 self-center px-5">
            <div className="lg-mobile-brand hidden items-center gap-[9px]">
              <span className="lg-mark grid h-[34px] w-[34px] flex-none place-items-center rounded-lg bg-gradient-to-br from-[#0F1714] to-[#21362D] text-[#C7F3DC] [&_svg]:h-[18px] [&_svg]:w-[18px]"><Icon n="grid" /></span>
              <span className="text-[16px]">ERP Hub</span>
            </div>
          </div>

          <div className={`lg-portals-top mx-0 mb-0 mt-[18px] w-full max-w-[520px] self-center px-5 text-center ${hub ? 'mt-auto' : ''}`}>
            <h2 className="mb-3 mt-0 text-[15px] font-semibold tracking-[.01em] text-lg-text">All portals</h2>
            <div className="portals m-0 flex flex-wrap justify-center gap-[7px]" role="list">
              {boot.portals.map((p) => {
                const cls = `rounded bg-lg-chip px-[11px] py-1 text-[12px] text-lg-chip-ink no-underline ${p.here ? '!bg-lg-btn !text-lg-btn-ink' : ''}`;
                return p.href
                  ? <a key={p.name} className={cls} href={p.href} role="listitem">{p.name}</a>
                  : <span key={p.name} className={`${cls} cursor-default`} role="listitem">{p.name}</span>;
              })}
            </div>
          </div>

          <div className={`lg-center w-full max-w-[520px] self-center px-5 pb-5 pt-12 ${hub ? 'lg-center--hub mb-auto' : ''}`}>
            <h1 className="m-0 text-[24px] font-normal leading-[1.15] tracking-[-.02em]">{copy.h1}</h1>
            <p className={`lg-sub mb-[30px] mt-[6px] text-[13px] text-lg-muted ${hub ? '!mb-12' : ''}`}>{copy.sub}</p>

            {boot.fatal && (
              <div className="lg-fatal mb-5 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-[14px] py-3 text-[13px] text-[#7f1d1d] [html[data-theme=dark]_&]:border-[#7f1d1d] [html[data-theme=dark]_&]:bg-[#2a1416] [html[data-theme=dark]_&]:text-[#fecaca]" role="alert">{boot.fatal}</div>
            )}

            <form method="post" action={boot.action} noValidate onSubmit={onSubmit} onReset={onReset}>
              {fields.map((f) => (
                <Field key={f.id} def={f} value={values[f.name]} error={errors[f.name] ?? ''}
                  onChange={(v) => { setValues((c) => ({ ...c, [f.name]: v })); if (v) setErrors((c) => ({ ...c, [f.name]: '' })); }}
                  revealed={!!revealed[f.id]} onReveal={(v) => setRevealed((c) => ({ ...c, [f.id]: v }))} />
              ))}

              {serverError && <p className="lg-server-err mb-[10px] mt-1 text-[12.5px] text-lg-danger" role="alert">{serverError}</p>}

              <div className="lg-actions mt-[26px] flex gap-[14px]">
                {hub && (
                  <button className={btnOutline} type="reset">
                    <span className={bic}><Icon n="reset" /></span><span className="lg-lbl">Reset</span>
                  </button>
                )}
                <button className={`${btnPrimary} ${busy ? 'is-busy' : ''}`} type="submit" aria-disabled={busy || undefined}>
                  <span className={bic}><Icon n={copy.primaryIcon} /></span>
                  <span className={`lg-spin absolute left-[17px] top-1/2 -mt-[7px] h-[14px] w-[14px] animate-lg-spin rounded-full border-2 border-current border-r-transparent ${busy ? 'block' : 'hidden'}`} aria-hidden="true" />
                  <span className="lg-lbl">{busy ? copy.busy : copy.primary}</span>
                </button>
                {!hub && (
                  <a className={btnOutline} href={`${boot.altHref}${q}`}>
                    <span className={bic}><Icon n={copy.altIcon} /></span><span className="lg-lbl">{copy.altLabel}</span>
                  </a>
                )}
              </div>
            </form>
          </div>
          <p className={`lg-foot m-0 pt-[14px] text-center text-[11.5px] text-lg-faint ${hub ? 'mt-0' : 'mt-auto'}`}>{boot.footer}</p>
        </main>

        <aside className="lg-hero relative order-first flex min-h-0 flex-col justify-center overflow-hidden bg-lg-hero text-[#111] max-[760px]:hidden" style={hub ? { ['--lg-hero' as string]: '#FDF9EE' } : undefined} aria-label="About this demonstration">
          <img className="lg-art pointer-events-none m-0 mx-auto min-h-0 w-full max-w-[800px] max-h-[800px] flex-[1_1_0] select-none object-contain object-center" src={hub ? heroHub : heroCitizen}
            width={1100} height={hub ? 1184 : 1178} draggable={false}
            alt={hub ? 'Illustration: five portals (ePrisons, CCTNS, e-Forensics, UIDAI / Aadhaar, eCourts) feeding one ERP Hub dashboard'
              : 'Illustration: a person working on a laptop beside a padlock shield, a sign-in card with a masked password, and a database'} />
          <Carousel slides={slides} />
        </aside>
      </div>
    </div>
  );
}
