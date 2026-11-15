import type { Config } from 'tailwindcss';
import citizen from './src/shared/tailwind/citizen';
import account from './src/shared/tailwind/account';

// Each site gets its own preset (palette, fonts). The citizen pages and the hub sign-in use the erphub.html palette.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [citizen, account],
  darkMode: ['variant', '&:is([data-theme="dark"] *)'],
  corePlugins: { preflight: false },
} satisfies Config;
