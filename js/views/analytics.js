// ============================================================
// BudgetWise — js/views/analytics.js
// Analytics: 4 charts — category bar, trend line, donut, top days
// ============================================================

import { store }                              from '../store.js';
import { formatCurrency, getCategoryData,
         monthLabel, pct }                    from '../utils.js';
import { renderCategoryBarChart,
         renderTrendChart,
         renderDonutChart,
         renderTopDaysChart }                 from '../charts.js';

// ── Render analytics view ─────────────────────────────────────
export const renderAnalytics = () => {
  const container = document.getElementById('analyticsView');
  if (!container) return;

  const expenses   = store.getCurrentMonthExpenses();
  const catTotals  = store.getCategoryTotals(expenses);
  const dailyTotals= store.getDailyTotals(expenses);
  const monthly    = getMonthlyTotals();

  container.innerHTML = `
    <!-- 2x2 chart grid -->
    <div class="analytics-grid">

      <!-- Category breakdown (horizontal bar) -->
      <div class="card analytics-chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Spending by Category</h3>
            <p class="card-sub">This month's breakdown</p>
          </div>
        </div>
        <div class="chart-wrap" style="height:260px;">
          <canvas id="categoryBarChart"></canvas>
        </div>
      </div>

      <!-- Monthly trend (line) -->
      <div class="card analytics-chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Monthly Trend</h3>
            <p class="card-sub">Last 6 months</p>
          </div>
        </div>
        <div class="chart-wrap" style="height:260px;">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <!-- Distribution donut -->
      <div class="card analytics-chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Spending Distribution</h3>
            <p class="card-sub">By category this month</p>
          </div>
        </div>
        <div class="donut-wrap" style="gap:16px;">
          <div style="height:200px;position:relative;flex:0 0 200px;">
            <canvas id="analyticsDonut"></canvas>
          </div>
          <div class="donut-legend" id="analyticsDonutLegend">
            ${renderDonutLegendHTML(catTotals)}
          </div>
        </div>
      </div>

      <!-- Top spending days -->
      <div class="card analytics-chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Top Spending Days</h3>
            <p class="card-sub">Highest spend days this month</p>
          </div>
        </div>
        <div class="chart-wrap" style="height:260px;">
          <canvas id="topDaysChart"></canvas>
        </div>
      </div>

    </div>

    <!-- Summary stats row -->
    <div class="card analytics-stats-card">
      <div class="analytics-stats-grid">
        ${analyticsStats(expenses)}
      </div>
    </div>
  `;

  // Render all 4 charts after DOM is ready
  requestAnimationFrame(() => {
    if (Object.keys(catTotals).length)  renderCategoryBarChart('categoryBarChart', catTotals);
    if (Object.keys(monthly).length)    renderTrendChart('trendChart', monthly);
    if (Object.keys(catTotals).length)  renderDonutChart('analyticsDonut', catTotals);
    if (Object.keys(dailyTotals).length)renderTopDaysChart('topDaysChart', dailyTotals);
  });
};

// ── Monthly totals (last 6 months) ───────────────────────────
const getMonthlyTotals = () => {
  const result = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    result[key] = 0;
  }
  store.expenses.forEach(e => {
    const key = e.date.slice(0, 7);
    if (key in result) result[key] += Number(e.amount);
  });
  return result;
};

// ── Donut legend HTML ─────────────────────────────────────────
const renderDonutLegendHTML = (catTotals) => {
  const total   = Object.values(catTotals).reduce((a,b) => a+b, 0);
  const entries = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0,7);
  return entries.map(([cat, amt]) => {
    const catData = getCategoryData(cat);
    const p       = pct(amt, total);
    return `
    <div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${catData.color};"></span>
      <span class="donut-legend-label">${cat}</span>
      <span class="donut-legend-value">${formatCurrency(amt,true)} (${p}%)</span>
    </div>`;
  }).join('');
};

// ── Analytics summary stats ───────────────────────────────────
const analyticsStats = (expenses) => {
  const total    = expenses.reduce((s,e) => s+Number(e.amount), 0);
  const avgTx    = expenses.length ? total/expenses.length : 0;
  const maxExp   = expenses.reduce((max,e) => Number(e.amount)>Number(max?.amount||0)?e:max, null);
  const topCat   = Object.entries(store.getCategoryTotals(expenses)).sort((a,b)=>b[1]-a[1])[0];
  const members  = {};
  expenses.forEach(e => {
    const name = e.profiles?.name || 'Unknown';
    members[name] = (members[name]||0) + Number(e.amount);
  });
  const topMember = Object.entries(members).sort((a,b)=>b[1]-a[1])[0];

  const stats = [
    { label: 'Total Transactions', value: expenses.length.toString(), icon: '🧾' },
    { label: 'Average per Transaction', value: formatCurrency(avgTx), icon: '📊' },
    { label: 'Largest Expense', value: maxExp ? formatCurrency(maxExp.amount) : '—', sub: maxExp?.name, icon: '💰' },
    { label: 'Top Category', value: topCat?.[0] || '—', sub: topCat ? formatCurrency(topCat[1]) : '', icon: getCategoryData(topCat?.[0])?.emoji || '📦' },
    { label: 'Top Spender', value: topMember?.[0]?.split(' ')[0] || '—', sub: topMember ? formatCurrency(topMember[1]) : '', icon: '👤' },
  ];

  return stats.map(s => `
    <div class="analytics-stat">
      <div class="analytics-stat-icon">${s.icon}</div>
      <div class="analytics-stat-value">${s.value}</div>
      <div class="analytics-stat-label">${s.label}</div>
      ${s.sub ? `<div class="analytics-stat-sub">${s.sub}</div>` : ''}
    </div>
  `).join('');
};