import type { Config } from 'tailwindcss';

// Colours are CSS variables, set per theme in index.css, so one class works in light and dark.
const v = (name: string) => `var(--lg-${name})`;

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        lg: {
          card: v('card'), text: v('text'), muted: v('muted'), faint: v('faint'), line: v('line'), input: v('input'),
          'input-line': v('input-line'), focus: v('focus'), btn: v('btn'), 'btn-hover': v('btn-hover'), 'btn-ink': v('btn-ink'),
          danger: v('danger'), link: v('link'), hero: v('hero'), outline: v('outline'), chip: v('chip'), 'chip-ink': v('chip-ink'),
        },
      },
      fontFamily: { lg: ["'Nunito'", '-apple-system', "'Segoe UI'", 'Roboto', 'Arial', 'system-ui', 'sans-serif'] },
      boxShadow: { 'lg-shell': '0 30px 80px -30px rgba(41,40,50,.45)', 'lg-btn': '0 10px 22px -16px var(--lg-shadow)', 'lg-ring': '0 0 0 4px var(--lg-ring)' },
      keyframes: { 'lg-spin': { to: { transform: 'rotate(360deg)' } } },
      animation: { 'lg-spin': 'lg-spin .7s linear infinite' },
    },
  },
} satisfies Config;
