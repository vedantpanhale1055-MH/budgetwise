// ============================================================
// BudgetWise — js/config.js
// Reads Supabase keys from Vite environment variables.
// This file is safe to commit — it contains no real keys.
// Real keys live in .env (gitignored).
// ============================================================

export const config = {
  supabase: {
    url:     import.meta.env.VITE_SUPABASE_URL  || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name:    import.meta.env.VITE_APP_NAME    || 'BudgetWise',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
};

// Validate that Supabase keys are present
export const isSupabaseConfigured = () =>
  Boolean(config.supabase.url && config.supabase.anonKey);