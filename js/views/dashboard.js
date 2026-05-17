// ============================================================
// BudgetWise — js/views/dashboard.js
// Dashboard: KPI cards, charts, recent expenses, budget mini
// ============================================================

import { store }                              from '../store.js';
import { formatCurrency, formatDate,
         getCategoryData, getGreeting,
         avatarHtml, showSkeletons,
         pct, CATEGORIES }                    from '../utils.js';
import { renderDailyChart, renderDonutChart } from '../charts.js';
import { navigateTo }                         from '../router.js';

// ── Render dashboard ──────────────────────────────────────────
export const renderDashboard = () => {
  const container = document.getElementById('dashboardView');
  if (!container) return;

  // Show skeletons while loading
  if (store.isLoading) {
    container.innerHTML = skeletonHTML();
    return;
  }

  const expenses   = store.getCurrentMonthExpenses();
  const total      = store.getTotalSpent(expenses);
  const budget     = store.getTotalBudget();
  const dailyAvg   = expenses.length > 0
    ? total / new Set(expenses.map(e => e.date)).size
    : 0;
  const recurring  = store.getActiveRecurringTotal();
  const budgetPct  = pct(total, budget);
  const catTotals  = store.getCategoryTotals(expenses);
  const dailyTotals= store.getDailyTotals(expenses);
  const recent     = [...expenses].sort((a,b) =>
    new Date(b.created_at||b.date) - new Date(a.created_at||a.date)).slice(0, 5);

  // Compare with last month
  const lastMonth  = getPrevMonthExpenses();
  const lastTotal  = store.getTotalSpent(lastMonth);
  const changePct  = lastTotal > 0
    ? (((total - lastTotal) / lastTotal) * 100).toFixed(1)
    : null;

  const greeting   = getGreeting();
  const userName   = store.user?.name?.split(' ')[0] || 'there';

  container.innerHTML = `
    <!-- Greeting (mobile only — desktop shows in topbar) -->
    <div class="dashboard-greeting-mobile">
      <span class="greeting-emoji">${greeting.emoji}</span>
      <div>
        <h2>${greeting.text}, ${userName}!</h2>
        <p>Here's what's happening with your finances today.</p>
      </div>
    </div>

    <!-- KPI Cards (Style A — serif numbers, corner accent) -->
    <div class="kpi-grid">
      ${kpiCard({
        icon: '💳', iconBg: 'rgba(200,90,42,0.1)',
        label: 'Monthly Spend', value: formatCurrency(total),
        sub: changePct !== null
          ? `<span class="${Number(changePct)>0?'kpi-up':'kpi-down'}">${Number(changePct)>0?'▲':'▼'} ${Math.abs(changePct)}% from last month</span>`
          : 'No data from last month',
        accent: 'var(--color-primary)',
      })}
      ${kpiCard({
        icon: '📅', iconBg: 'rgba(26,95,168,0.1)',
        label: 'Daily Average', value: formatCurrency(dailyAvg),
        sub: `Based on ${new Set(expenses.map(e=>e.date)).size} days`,
        accent: '#1A5FA8',
      })}
      ${kpiCard({
        icon: '🎯', iconBg: 'rgba(45,122,79,0.1)',
        label: 'Budget Used',
        value: budget > 0 ? `${budgetPct}%` : 'No budget',
        sub: budget > 0
          ? `${formatCurrency(total)} of ${formatCurrency(budget)}`
          : '<a onclick="navigateTo(\'budget\')" style="color:var(--color-primary);cursor:pointer;">Set budget →</a>',
        accent: budgetPct > 80 ? 'var(--color-danger)' : '#2D7A4F',
        progress: budget > 0 ? budgetPct : null,
      })}
      ${kpiCard({
        icon: '🔄', iconBg: 'rgba(168,85,247,0.1)',
        label: 'Recurring', value: formatCurrency(recurring),
        sub: `${store.recurring.filter(r=>r.status==='active').length} active subscriptions`,
        accent: '#A855F7',
      })}
    </div>

    <!-- Charts row -->
    <div class="dashboard-charts-row">

      <!-- Daily spending chart -->
      <div class="card dashboard-chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Daily Spending</h3>
          </div>
          <div class="chart-period-toggle">
            <button class="chart-toggle-btn active" onclick="setChartPeriod('week',this)">This Week</button>
            <button class="chart-toggle-btn" onclick="setChartPeriod('month',this)">This Month</button>
          </div>
        </div>
        <div class="chart-wrap" style="height:220px;">
          <canvas id="dailyChart"></canvas>
        </div>
      </div>

      <!-- Right column: Budget overview + Donut -->
      <div class="dashboard-right-col">

        <!-- Budget mini -->
        <div class="card budget-mini-card">
          <div class="card-header">
            <h3 class="card-title">Budget Overview</h3>
            <button class="btn-link" onclick="navigateTo('budget')">View All</button>
          </div>
          <div class="budget-mini-list">
            ${renderBudgetMini(catTotals)}
          </div>
        </div>

        <!-- Donut chart -->
        <div class="card donut-card">
          <div class="card-header">
            <h3 class="card-title">Category Breakdown</h3>
            <select class="chart-period-select" onchange="setDonutPeriod(this.value)">
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div class="donut-wrap">
            <div class="donut-chart-container" style="height:180px;position:relative;">
              <canvas id="donutChart"></canvas>
            </div>
            <div class="donut-legend" id="donutLegend">
              ${renderDonutLegend(catTotals)}
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Recent expenses -->
    <div class="card recent-card">
      <div class="card-header">
        <h3 class="card-title">Recent Expenses</h3>
        <button class="btn-link" onclick="navigateTo('expenses')">View All</button>
      </div>
      ${recent.length > 0 ? `
      <div class="recent-table">
        <div class="recent-table-header">
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span>Member</span>
          <span class="text-right">Amount</span>
        </div>
        ${recent.map(e => recentRow(e)).join('')}
      </div>
      ` : `
      <div class="empty-state" style="padding:40px;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:12px;">💸</div>
        <p style="color:var(--color-text-secondary);">No expenses this month. Add your first one!</p>
      </div>
      `}
    </div>
  `;

  // Wire global handlers
  window.navigateTo       = navigateTo;
  window.setChartPeriod   = setChartPeriod;
  window.setDonutPeriod   = setDonutPeriod;

  // Render charts
  requestAnimationFrame(() => {
    renderDailyChart('dailyChart', dailyTotals);
    const result = renderDonutChart('donutChart', catTotals);
  });
};

// ── KPI card HTML (Style A) ───────────────────────────────────
const kpiCard = ({ icon, iconBg, label, value, sub, accent, progress }) => `
  <div class="kpi-card">
    <div class="kpi-card-accent" style="background:${accent};"></div>
    <div class="kpi-icon" style="background:${iconBg};">${icon}</div>
    <div class="kpi-body">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="color:${accent};">${value}</div>
      <div class="kpi-sub">${sub}</div>
      ${progress !== null && progress !== undefined ? `
      <div class="kpi-progress-bar">
        <div class="kpi-progress-fill" style="width:${Math.min(progress,100)}%;background:${accent};"></div>
      </div>` : ''}
    </div>
  </div>
`;

// ── Budget mini list ──────────────────────────────────────────
const renderBudgetMini = (catTotals) => {
  const month = new Date().toISOString().slice(0, 7);
  const budgets = store.budgets.filter(b => b.month === month);

  if (!budgets.length) {
    return `<div style="padding:16px;text-align:center;color:var(--color-text-secondary);font-size:0.875rem;">
      <a onclick="navigateTo('budget')" style="color:var(--color-primary);cursor:pointer;">Set up category budgets →</a>
    </div>`;
  }

  return budgets.slice(0, 5).map(b => {
    const spent   = catTotals[b.category] || 0;
    const p       = pct(spent, b.amount);
    const catData = getCategoryData(b.category);
    const isWarn  = p >= 80;
    return `
    <div class="budget-mini-row">
      <div class="budget-mini-icon" style="background:${catData.bg};">${catData.emoji}</div>
      <div class="budget-mini-info">
        <div class="budget-mini-name">${b.category}</div>
        <div class="budget-mini-bar">
          <div class="budget-mini-fill" style="width:${Math.min(p,100)}%;background:${isWarn?'var(--color-danger)':catData.color};"></div>
        </div>
      </div>
      <div class="budget-mini-pct" style="color:${isWarn?'var(--color-danger)':catData.color};">${p}%</div>
    </div>`;
  }).join('');
};

// ── Donut legend ──────────────────────────────────────────────
const renderDonutLegend = (catTotals) => {
  const total   = Object.values(catTotals).reduce((a,b) => a+b, 0);
  const entries = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 6);
  return entries.map(([cat, amt]) => {
    const catData = getCategoryData(cat);
    const p       = pct(amt, total);
    return `
    <div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${catData.color};"></span>
      <span class="donut-legend-label">${cat}</span>
      <span class="donut-legend-value">${formatCurrency(amt, true)} (${p}%)</span>
    </div>`;
  }).join('');
};

// ── Recent expense row ────────────────────────────────────────
const recentRow = (e) => {
  const cat = getCategoryData(e.category);
  return `
  <div class="recent-row">
    <div class="recent-date">${formatDate(e.date, {day:'numeric',month:'short'})}</div>
    <div class="recent-desc">
      <div class="recent-icon" style="background:${cat.bg};">${cat.emoji}</div>
      <div>
        <div class="recent-name">${e.name}</div>
        <div class="recent-sub">${e.category}</div>
      </div>
    </div>
    <div><span class="category-pill ${e.category.toLowerCase()}">${e.category}</span></div>
    <div class="recent-member">
      ${avatarHtml(e.profiles?.name || '?', e.profiles?.avatar_color, 28)}
      <span>${e.profiles?.name?.split(' ')[0] || '?'}</span>
    </div>
    <div class="recent-amount">₹${Number(e.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
  </div>`;
};

// ── Chart period toggle ───────────────────────────────────────
const setChartPeriod = (period, btn) => {
  document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  let data;
  if (period === 'week') {
    const week = getLast7Days();
    data = store.getDailyTotals(store.expenses.filter(e => week.includes(e.date)));
  } else {
    data = store.getDailyTotals(store.getCurrentMonthExpenses());
  }
  renderDailyChart('dailyChart', data);
};

const setDonutPeriod = (period) => {
  const expenses = period === 'all'
    ? store.expenses
    : store.getCurrentMonthExpenses();
  const catTotals = store.getCategoryTotals(expenses);
  renderDonutChart('donutChart', catTotals);
  document.getElementById('donutLegend').innerHTML = renderDonutLegend(catTotals);
};

// ── Helpers ───────────────────────────────────────────────────
const getLast7Days = () => {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
};

const getPrevMonthExpenses = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prev = d.toISOString().slice(0, 7);
  return store.expenses.filter(e => e.date.startsWith(prev));
};

// ── Skeleton HTML ─────────────────────────────────────────────
const skeletonHTML = () => `
  <div class="kpi-grid">
    ${Array(4).fill(0).map(() => `
    <div class="kpi-card skeleton">
      <div class="kpi-card-accent" style="background:var(--skeleton-base);"></div>
      <div class="kpi-icon skeleton-box" style="width:44px;height:44px;border-radius:10px;"></div>
      <div class="kpi-body">
        <div class="skeleton-box" style="width:80px;height:12px;margin-bottom:8px;"></div>
        <div class="skeleton-box" style="width:120px;height:24px;margin-bottom:6px;"></div>
        <div class="skeleton-box" style="width:100px;height:10px;"></div>
      </div>
    </div>`).join('')}
  </div>
  <div class="dashboard-charts-row">
    <div class="card" style="height:300px;">
      <div class="skeleton-box" style="width:100%;height:100%;border-radius:12px;"></div>
    </div>
    <div class="dashboard-right-col">
      <div class="card" style="height:140px;">
        <div class="skeleton-box" style="width:100%;height:100%;border-radius:12px;"></div>
      </div>
      <div class="card" style="height:140px;">
        <div class="skeleton-box" style="width:100%;height:100%;border-radius:12px;"></div>
      </div>
    </div>
  </div>
`;