import type { Config } from 'tailwindcss';

// My account page: colours are CSS variables (set per theme in account.css).
const names = ['bg', 'card', 'side', 'text', 'muted', 'faint', 'line', 'chip', 'accent', 'accent-ink', 'btn', 'btn-ink', 'focus', 'code',
  'good-bg', 'good-line', 'good-ink', 'nav-ink', 'ic', 'shadow'];
export default {
  content: [],
  theme: { extend: { colors: { ac: Object.fromEntries(names.map((n) => [n, `var(--ac-${n})`])) } } },
} satisfies Config;
