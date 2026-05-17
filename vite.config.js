// ============================================================
// BudgetWise — Vite Configuration
// Multi-page app: index.html (login) + app.html (main app)
// ============================================================

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ── Multi-page entries ──────────────────────────────────
  // Tells Vite about both HTML entry points.
  // index.html = login/signup page (GitHub Pages root)
  // app.html   = main application (post-auth)
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app:  resolve(__dirname, 'app.html'),
      },
    },
    // Output directory (deployed by GitHub Actions)
    outDir: 'dist',

    // Generate source maps for easier debugging
    sourcemap: false,

    // Chunk size warning limit (kb)
    chunkSizeWarningLimit: 1000,
  },

  // ── Dev server ──────────────────────────────────────────
  server: {
    port: 5173,
    open: true, // auto-opens browser on npm run dev
  },

  // ── Base path ───────────────────────────────────────────
  // IMPORTANT: Change 'budgetwise' to your GitHub repo name
  // if deploying to GitHub Pages at:
  // https://yourusername.github.io/budgetwise
  //
  // If using a custom domain, set base: '/'
  base: '/',

  // ── Path aliases ────────────────────────────────────────
  // Lets you import with @/ instead of ../../
  // Example: import { supabase } from '@/js/supabase.js'
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});