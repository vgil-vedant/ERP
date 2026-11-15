import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// One bundle per app. Express serves dist/ under /account/ui/app/ and each page's HTML shell loads /ui/<app>.js and /ui/<app>.css.
export default defineConfig({
  base: '/account/ui/app/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 600_000,          // pictures are embedded as base64, as on the current pages
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        auth: 'src/apps/auth/main.tsx',
        account: 'src/apps/account/main.tsx',
        hub: 'src/apps/hub/main.tsx',
        console: 'src/apps/console/main.tsx',
        portal: 'src/portals/client.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => (info.name && info.name.endsWith('.css') ? '[name][extname]' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true, css: false },
});
