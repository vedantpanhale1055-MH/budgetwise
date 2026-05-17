// ============================================================
// BudgetWise — js/app.js
// Main bootstrap: auth check, data load, realtime, views
// ============================================================

import { requireAuth, handleSignOut,
         onAuthStateChange }              from './auth.js';
import { store }                          from './store.js';
import { initDarkMode, toggleDarkMode,
         showToast, copyToClipboard,
         formatCurrency, getGreeting }    from './utils.js';
import { initRouter, registerView,
         navigateTo }                     from './router.js';
import { initChartDefaults }             from './charts.js';
import { initVoice }                      from './voice.js';
import { renderDashboard }                from './views/dashboard.js';
import { renderExpenses,
         openAddExpense }                 from './views/expenses.js';
import { renderCalendar }                 from './views/calendar.js';
import { renderAnalytics }                from './views/analytics.js';
import { renderBudget }                   from './views/budget.js';
import { renderRecurring }                from './views/recurring.js';
import { renderAIChat,
         getGroqKey, setGroqKey,
         validateGroqKey }               from './ai-chat.js';
import { fetchExpenses, fetchBudgets,
         fetchRecurring, fetchMembers,
         subscribeToExpenses }           from './supabase.js';


// ── Bootstrap ─────────────────────────────────────────────────
const init = async () => {
  // 1. Dark mode (instant, no flicker)
  const isDark = initDarkMode();
  store.isDarkMode = isDark;

  // 2. Check auth
  const profile = await requireAuth();
  if (!profile) return; // redirected to login

  // 3. Load data
  store.user      = profile;
  store.household = profile.households;
  await loadRealData();
  setupRealtime();

  // 4. Render shell
  renderShell();

  // 5. Register all views
  registerView('dashboard',  renderDashboard);
  registerView('expenses',   renderExpenses);
  registerView('calendar',   renderCalendar);
  registerView('analytics',  renderAnalytics);
  registerView('budget',     renderBudget);
  registerView('recurring',  renderRecurring);
  registerView('ai-advisor', renderAIChat);

  // 6. Init systems
  initChartDefaults();
  initRouter();
  initVoice();
  wireGlobalEvents();

  // 7. Auth state listener
  onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = './index.html';
    }
  });
};

// ── Load real data from Supabase ──────────────────────────────
const loadRealData = async () => {
  store.isLoading = true;
  try {
    const hid   = store.household?.id;
    const month = new Date().toISOString().slice(0, 7);

    const [expenses, budgets, recurring, members] = await Promise.all([
      fetchExpenses(hid),
      fetchBudgets(hid, month),
      fetchRecurring(hid),
      fetchMembers(hid),
    ]);

    store.expenses  = expenses;
    store.budgets   = budgets;
    store.recurring = recurring;
    store.members   = members;
  } catch (err) {
    console.error('Data load error:', err);
    showToast('Failed to load data. Please refresh.', 'error');
  } finally {
    store.isLoading = false;
  }
};

// ── Realtime subscription ─────────────────────────────────────
const setupRealtime = () => {
  subscribeToExpenses(store.household?.id, async (payload) => {
    const hid      = store.household?.id;
    const expenses = await fetchExpenses(hid);
    store.expenses = expenses;
    store.emit('expenses:changed', expenses);

    if (store.currentTab === 'dashboard') renderDashboard();
    if (store.currentTab === 'expenses')  renderExpenses();
  });
};

// ── Render app shell ──────────────────────────────────────────
const renderShell = () => {
  const app = document.getElementById('app');
  if (!app) return;

  const greeting = getGreeting();
  const user     = store.user;
  const hh       = store.household;
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'BW';

  app.innerHTML = `
    <!-- Sidebar overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- ── SIDEBAR ────────────────────────────────────── -->
    <aside class="sidebar" id="sidebar">

      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 26 26" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L2 11h3v12h6v-8h4v8h6V11h3z"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">BudgetWise</span>
          <span class="logo-sub">Family Tracker</span>
        </div>
      </div>

      <!-- Family card -->
      <div class="family-card">
        <div class="family-card-icon">🏠</div>
        <div class="family-card-info">
          <div class="family-name">${hh?.name || 'My Family'}</div>
          <div class="family-members">${store.members.length || 1} member${store.members.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Invite code -->
      <div class="invite-code-wrap">
        <span class="invite-label">Invite code</span>
        <div class="invite-code-box" onclick="copyInviteCode()">
          <span class="invite-code">${hh?.invite_code || 'BWS-0000'}</span>
          <span class="invite-copy-icon">📋</span>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="sidebar-nav">
        <button class="nav-item" data-tab="dashboard">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Dashboard</span>
        </button>
        <button class="nav-item" data-tab="expenses">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Expenses</span>
        </button>
        <button class="nav-item" data-tab="calendar">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Calendar</span>
        </button>
        <button class="nav-item" data-tab="analytics">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Analytics</span>
        </button>
        <button class="nav-item" data-tab="budget">
          <span class="nav-icon">🎯</span>
          <span class="nav-label">Budget</span>
        </button>
        <button class="nav-item" data-tab="recurring">
          <span class="nav-icon">🔄</span>
          <span class="nav-label">Recurring</span>
        </button>
        <button class="nav-item" data-tab="ai-advisor">
          <span class="nav-icon">🤖</span>
          <span class="nav-label">AI Advisor</span>
          <span class="nav-badge">Beta</span>
        </button>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <!-- User card -->
        <div class="user-card">
          <div class="user-avatar" style="background:${user?.avatar_color||'#C85A2A'};">
            ${initials}
          </div>
          <div class="user-info">
            <div class="user-name">${user?.name || 'User'}</div>
            <div class="user-email">${user?.email || ''}</div>
          </div>
          <button class="user-menu-btn" onclick="toggleUserMenu()" title="Options">▾</button>
        </div>

        <!-- User dropdown -->
        <div class="user-dropdown" id="userDropdown" style="display:none;">
          <button class="user-dropdown-item" onclick="openSettings()">⚙️ Settings</button>
          <button class="user-dropdown-item danger" onclick="handleSignOut()">🚪 Sign Out</button>
        </div>

        <!-- Dark mode toggle -->
        <div class="dark-mode-row">
          <span class="dark-mode-label">🌙 Dark mode</span>
          <label class="toggle-switch">
            <input type="checkbox" id="darkModeToggle" ${store.isDarkMode?'checked':''} onchange="handleDarkMode()">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </aside>

    <!-- ── MAIN AREA ───────────────────────────────────── -->
    <div class="main-content">

      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger" id="hamburgerBtn"><span></span><span></span><span></span></button>
          <div class="topbar-greeting">
            <div class="greeting-emoji-topbar">${greeting.emoji}</div>
            <div>
              <div class="topbar-title">
                ${greeting.text}, ${user?.name?.split(' ')[0] || 'there'}!
              </div>
              <div class="topbar-sub" id="pageSubtitle">
                Here's what's happening with your finances today.
              </div>
            </div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-date-range">
            📅 ${new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric'})} – ${new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
          </div>
          <button class="btn-icon" id="voiceBtn" title="Voice commands">🎤</button>
          <button class="btn btn-primary" id="addExpenseBtn" onclick="openAddExpense()">
            + Add Expense
          </button>
        </div>
      </header>

      <!-- Mobile topbar -->
      <header class="mobile-topbar">
        <button class="hamburger" id="hamburgerBtnMobile" onclick="toggleMobileSidebar()"><span></span><span></span><span></span></button>
        <div class="mobile-logo">
          <div class="logo-icon-sm">
            <svg viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
              <path d="M10 1L1 8.5h2.5v9h4.5v-5.5h4V17.5h4.5v-9H19z"/>
            </svg>
          </div>
          <span>BudgetWise</span>
        </div>
        <button class="btn-icon" onclick="openAddExpense()">➕</button>
      </header>

      <!-- Main content -->
      <main class="page-content">

        <!-- View panels -->
        <div class="view-panel active" data-view="dashboard" id="dashboardView"></div>
        <div class="view-panel" data-view="expenses"  id="expensesView"></div>
        <div class="view-panel" data-view="calendar"  id="calendarView"></div>
        <div class="view-panel" data-view="analytics" id="analyticsView"></div>
        <div class="view-panel" data-view="budget"    id="budgetView"></div>
        <div class="view-panel" data-view="recurring" id="recurringView"></div>
        <div class="view-panel" data-view="ai-advisor"id="aiChatView"></div>

      </main>

      <!-- Bottom nav (mobile) -->
      <nav class="mobile-nav"><div class="mobile-nav-inner">
        <button class="mobile-nav-item active" data-tab="dashboard">
          <span>🏠</span><span>Dashboard</span>
        </button>
        <button class="mobile-nav-item" data-tab="expenses">
          <span>💳</span><span>Expenses</span>
        </button>
        <button class="mobile-nav-item" data-tab="calendar">
          <span>📅</span><span>Calendar</span>
        </button>
        <button class="mobile-nav-item" data-tab="budget">
          <span>🎯</span><span>Budget</span>
        </button>
        <button class="mobile-nav-item" data-tab="ai-advisor">
          <span>🤖</span><span>AI</span>
        </button>
      </div></nav>

      <!-- Floating FAB (mobile) -->
      <button class="fab" onclick="openAddExpense()" title="Add Expense">+</button>

    </div>

    <!-- Settings Modal -->
    <div class="modal-overlay" id="settingsOverlay" onclick="handleSettingsOverlay(event)">
      <div class="modal">
        <div class="modal-header">
          <h3>⚙️ Settings</h3>
          <button class="modal-close" onclick="closeSettings()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Groq API Key</label>
            <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-bottom:8px;">
              Get your free key at <a href="https://console.groq.com" target="_blank" style="color:var(--color-primary);">console.groq.com</a>
            </p>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="groqKeyInput" type="password"
                     placeholder="gsk_..." value="${getGroqKey()}" />
              <button class="btn btn-outline btn-sm" onclick="testGroqKey()">Test</button>
            </div>
            <div id="groqKeyStatus" style="margin-top:6px;font-size:0.8125rem;"></div>
          </div>
          <div style="margin-top:16px;padding:12px;background:var(--color-bg-secondary);border-radius:8px;">
            <p style="font-size:0.8125rem;color:var(--color-text-secondary);">
              🔒 Your key is stored only in your browser's localStorage — never sent to our servers or committed to GitHub.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeSettings()">Cancel</button>
          <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
        </div>
      </div>
    </div>
  `;
};

// ── Wire global events ────────────────────────────────────────
const wireGlobalEvents = () => {
  document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
    navigateTo('expenses');
    setTimeout(() => openAddExpense(), 100);
  });

  window.openAddExpense = openAddExpense;
  window.openSettings   = openSettings;
  window.closeSettings  = closeSettings;
  window.saveSettings   = saveSettings;
  window.testGroqKey    = testGroqKey;
  window.handleSignOut  = handleSignOut;
  window.copyInviteCode = copyInviteCode;
  window.handleDarkMode = handleDarkMode;
  window.toggleUserMenu = toggleUserMenu;
  window.handleSettingsOverlay = (e) => {
    if (e.target.id === 'settingsOverlay') closeSettings();
  };
};

// ── Settings ──────────────────────────────────────────────────
const openSettings = () => {
  toggleUserMenu(false);
  document.getElementById('settingsOverlay')?.classList.add('active');
  document.getElementById('groqKeyInput').value = getGroqKey();
  document.getElementById('groqKeyStatus').textContent = '';
};

const closeSettings = () => {
  document.getElementById('settingsOverlay')?.classList.remove('active');
};

const saveSettings = () => {
  const key = document.getElementById('groqKeyInput').value.trim();
  setGroqKey(key);
  closeSettings();
  showToast(key ? 'Groq API key saved! ✅' : 'API key cleared.', 'success');
  if (store.currentTab === 'ai-advisor') renderAIChat();
};

const testGroqKey = async () => {
  const key    = document.getElementById('groqKeyInput').value.trim();
  const status = document.getElementById('groqKeyStatus');
  if (!key) { status.textContent = '⚠️ Please enter a key first.'; return; }
  status.textContent = '⏳ Testing...';
  status.style.color = 'var(--color-text-secondary)';
  const valid = await validateGroqKey(key);
  if (valid) {
    status.textContent = '✅ Key is valid!';
    status.style.color = 'var(--color-success)';
  } else {
    status.textContent = '❌ Invalid key. Please check and try again.';
    status.style.color = 'var(--color-danger)';
  }
};

// ── Dark mode ─────────────────────────────────────────────────
const handleDarkMode = () => {
  store.isDarkMode = toggleDarkMode();
};

// ── User menu ─────────────────────────────────────────────────
const toggleUserMenu = (forceClose = null) => {
  const menu = document.getElementById('userDropdown');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = (forceClose === false || forceClose === true)
    ? (forceClose ? 'none' : 'block')
    : (isOpen ? 'none' : 'block');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar-footer')) {
    const menu = document.getElementById('userDropdown');
    if (menu) menu.style.display = 'none';
  }
});

// ── Copy invite code ──────────────────────────────────────────
const copyInviteCode = () => {
  const code = store.household?.invite_code;
  if (code) copyToClipboard(code);
};

// ── Mobile sidebar ────────────────────────────────────────────
window.toggleMobileSidebar = async () => {
  const { toggleMobileSidebar } = await import('./router.js');
  toggleMobileSidebar();
};

// ── Start ─────────────────────────────────────────────────────
init().catch(err => {
  console.error('BudgetWise init error:', err);
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;font-family:sans-serif;">
      <div style="font-size:3rem;">⚠️</div>
      <h2>Something went wrong</h2>
      <p style="color:#7A6A5E;">Please check your Supabase configuration in .env</p>
      <a href="./index.html" style="color:#C85A2A;font-weight:600;">← Go back to login</a>
    </div>`;
});