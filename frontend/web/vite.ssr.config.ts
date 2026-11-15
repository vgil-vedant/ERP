import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Server bundle for the portal replicas: one self-contained CommonJS file (React included), loaded by the Node servers.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  ssr: { noExternal: true },
  build: {
    ssr: 'src/portals/ssr.tsx', outDir: 'dist-ssr', emptyOutDir: true, minify: false,
    rollupOptions: { output: { format: 'cjs', entryFileNames: 'portals.cjs', exports: 'named' } },
  },
});
