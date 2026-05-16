// ============================================================
// BudgetWise — js/router.js
// Tab switching, mobile nav sync, URL hash routing
// ============================================================

import { store } from './store.js';

// ── All valid tabs ────────────────────────────────────────────
export const TABS = [
  'dashboard',
  'expenses',
  'calendar',
  'analytics',
  'budget',
  'recurring',
  'ai-advisor',
];

// ── View render functions (registered by views) ───────────────
const viewRenderers = {};

export const registerView = (tab, renderFn) => {
  viewRenderers[tab] = renderFn;
};

// ── Navigate to a tab ─────────────────────────────────────────
export const navigateTo = (tab) => {
  if (!TABS.includes(tab)) tab = 'dashboard';

  store.currentTab = tab;

  // Update sidebar nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  // Update bottom mobile nav active state
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  // Show correct view panel
  document.querySelectorAll('.view-panel').forEach(el => {
    el.classList.toggle('active', el.dataset.view === tab);
  });

  // Update page title in topbar
  updatePageTitle(tab);

  // Update URL hash (no page reload)
  history.replaceState(null, '', `#${tab}`);

  // Close mobile sidebar overlay if open
  closeMobileSidebar();

  // Render the view
  if (viewRenderers[tab]) {
    viewRenderers[tab]();
  }

  // Scroll main content to top
  const main = document.querySelector('.main-content');
  if (main) main.scrollTop = 0;
};

// ── Page title map ────────────────────────────────────────────
const PAGE_TITLES = {
  'dashboard':  { title: 'Dashboard',              sub: "Here's what's happening with your finances today." },
  'expenses':   { title: 'Expenses',               sub: 'Track and manage all your family expenses.'        },
  'calendar':   { title: 'Calendar',               sub: 'View your spending day by day.'                    },
  'analytics':  { title: 'Analytics',              sub: 'Understand your spending patterns.'                },
  'budget':     { title: 'Budget',                 sub: "Here's an overview of your budget status."         },
  'recurring':  { title: 'Subscriptions and Bills',sub: 'Manage all your recurring payments.'               },
  'ai-advisor': { title: 'AI Advisor',             sub: 'Your smart financial companion for better decisions.'},
};

const updatePageTitle = (tab) => {
  const data = PAGE_TITLES[tab] || PAGE_TITLES['dashboard'];
  const titleEl = document.getElementById('pageTitle');
  const subEl   = document.getElementById('pageSubtitle');
  if (titleEl) titleEl.textContent = data.title;
  if (subEl)   subEl.textContent   = data.sub;
};

// ── Mobile sidebar toggle ─────────────────────────────────────
export const toggleMobileSidebar = () => {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar?.classList.contains('mobile-open');

  sidebar?.classList.toggle('mobile-open', !isOpen);
  overlay?.classList.toggle('active', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
};

export const closeMobileSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar?.classList.remove('mobile-open');
  overlay?.classList.remove('active');
  document.body.style.overflow = '';
};

// ── Init router ───────────────────────────────────────────────
export const initRouter = () => {
  // Read hash on load
  const hash = window.location.hash.replace('#', '');
  const initial = TABS.includes(hash) ? hash : 'dashboard';

  // Wire up sidebar nav clicks
  document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.tab));
  });

  // Wire up bottom mobile nav clicks
  document.querySelectorAll('.bottom-nav-item[data-tab]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.tab));
  });

  // Hamburger button
  document.getElementById('hamburgerBtn')
    ?.addEventListener('click', toggleMobileSidebar);

  // Sidebar overlay (click outside to close)
  document.getElementById('sidebarOverlay')
    ?.addEventListener('click', closeMobileSidebar);

  // Navigate to initial tab
  navigateTo(initial);
};