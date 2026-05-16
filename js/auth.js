// ============================================================
// BudgetWise — js/auth.js
// Session management, auth state, redirect guards
// ============================================================

import { supabase, getSession, fetchProfile, signOut } from './supabase.js';
import { store } from './store.js';
import { showToast } from './utils.js';

// ── Guard: require auth on app.html ──────────────────────────
export const requireAuth = async () => {
  // Allow demo mode
  if (sessionStorage.getItem('bw_demo') === 'true') {
    return { demo: true };
  }

  if (!supabase) {
    window.location.href = './index.html';
    return null;
  }

  const session = await getSession();
  if (!session) {
    window.location.href = './index.html';
    return null;
  }

  // Fetch full profile + household
  const profile = await fetchProfile(session.user.id);
  if (!profile || !profile.household_id) {
    // Signed in but no household — send back to setup
    await signOut();
    window.location.href = './index.html';
    return null;
  }

  // Hydrate store
  store.user      = profile;
  store.household = profile.households;

  return profile;
};

// ── Sign out handler ──────────────────────────────────────────
export const handleSignOut = async () => {
  try {
    sessionStorage.removeItem('bw_demo');
    await signOut();
    window.location.href = './index.html';
  } catch (err) {
    showToast('Sign out failed. Please try again.', 'error');
  }
};

// ── Listen for auth state changes ────────────────────────────
export const onAuthStateChange = (callback) => {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = './index.html';
    }
    callback(event, session);
  });
};

// ── Get avatar initials + color ───────────────────────────────
export const getAvatarData = (name = '', color = '#C85A2A') => {
  const parts    = name.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.slice(0, 2) || 'BW').toUpperCase();
  return { initials, color };
};