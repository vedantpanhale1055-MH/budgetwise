// ============================================================
// BudgetWise — js/supabase.js
// Supabase client init + Realtime subscriptions
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config.js';
import { store } from './store.js';

// ── Client ───────────────────────────────────────────────────
export let supabase = null;

if (isSupabaseConfigured()) {
  supabase = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
  });
}

// ── Auth helpers ─────────────────────────────────────────────
export const getSession = async () => {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

// ── Profile ───────────────────────────────────────────────────
export const fetchProfile = async (userId) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*, households(*)')
    .eq('id', userId)
    .single();
  if (error) { console.error('fetchProfile:', error); return null; }
  return data;
};

// ── Expenses ─────────────────────────────────────────────────
export const fetchExpenses = async (householdId, filters = {}) => {
  if (!supabase) return [];
  let query = supabase
    .from('expenses')
    .select('*, profiles(name, avatar_color)')
    .eq('household_id', householdId)
    .order('date', { ascending: false });

  if (filters.month) {
    const [year, month] = filters.month.split('-');
    const start = `${year}-${month}-01`;
    const end   = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('date', start).lte('date', end);
  }
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.addedBy)  query = query.eq('added_by', filters.addedBy);

  const { data, error } = await query;
  if (error) { console.error('fetchExpenses:', error); return []; }
  return data || [];
};

export const insertExpense = async (expense) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('expenses').insert(expense).select().single();
  if (error) throw error;
  return data;
};

export const updateExpense = async (id, updates) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('expenses').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id) => {
  if (!supabase) return;
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
};

// ── Budgets ───────────────────────────────────────────────────
export const fetchBudgets = async (householdId, month) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('household_id', householdId)
    .eq('month', month);
  if (error) { console.error('fetchBudgets:', error); return []; }
  return data || [];
};

export const upsertBudget = async (budget) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('budgets').upsert(budget, { onConflict: 'household_id,category,month' })
    .select().single();
  if (error) throw error;
  return data;
};

// ── Recurring ─────────────────────────────────────────────────
export const fetchRecurring = async (householdId) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('recurring')
    .select('*')
    .eq('household_id', householdId)
    .order('next_due', { ascending: true });
  if (error) { console.error('fetchRecurring:', error); return []; }
  return data || [];
};

export const insertRecurring = async (item) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recurring').insert(item).select().single();
  if (error) throw error;
  return data;
};

export const updateRecurring = async (id, updates) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recurring').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteRecurring = async (id) => {
  if (!supabase) return;
  const { error } = await supabase.from('recurring').delete().eq('id', id);
  if (error) throw error;
};

// ── Profiles (household members) ─────────────────────────────
export const fetchMembers = async (householdId) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_color, role')
    .eq('household_id', householdId);
  if (error) { console.error('fetchMembers:', error); return []; }
  return data || [];
};

// ── Realtime subscriptions ────────────────────────────────────
let realtimeChannel = null;

export const subscribeToExpenses = (householdId, onUpdate) => {
  if (!supabase) return;

  // Unsubscribe from any existing channel first
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabase
    .channel(`household-${householdId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',         // INSERT, UPDATE, DELETE
        schema: 'public',
        table:  'expenses',
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => {
        console.log('Realtime expense update:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();
};

export const unsubscribeRealtime = () => {
  if (supabase && realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
};

// ── Receipt upload ────────────────────────────────────────────
export const uploadReceipt = async (file, userId) => {
  if (!supabase) return null;
  const ext      = file.name.split('.').pop();
  const filename = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filename, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filename);
  return urlData.publicUrl;
};