// ============================================================
// BudgetWise — js/config.js
// Reads all keys from Vite environment variables.
// Safe to commit — contains no real keys.
// Real keys live in .env (gitignored).
// ============================================================

export const config = {
  supabase: {
    url:     import.meta.env.VITE_SUPABASE_URL      || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  groq: {
    // Powers AI Advisor + Receipt Scanner for all users
    // Key is bundled at build time via Vite — safe for portfolio
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  },
  app: {
    name:    import.meta.env.VITE_APP_NAME    || 'BudgetWise',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
};

// Validation helpers
export const isSupabaseConfigured = () =>
  Boolean(config.supabase.url && config.supabase.anonKey);

export const isGroqConfigured = () =>
  Boolean(config.groq.apiKey);