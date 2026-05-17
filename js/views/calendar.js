// ============================================================
// BudgetWise — js/views/calendar.js
// Calendar: monthly grid, day spending, click for detail
// ============================================================

import { store }                        from '../store.js';
import { formatCurrency, formatDate,
         getCategoryData, avatarHtml,
         getDaysInMonth }               from '../utils.js';

// ── State ─────────────────────────────────────────────────────
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based

// ── Render calendar view ──────────────────────────────────────
export const renderCalendar = () => {
  const container = document.getElementById('calendarView');
  if (!container) return;

  container.innerHTML = `
    <div class="calendar-page">

      <!-- Calendar card -->
      <div class="card calendar-card">
        <div class="calendar-nav">
          <button class="cal-nav-btn" onclick="calPrev()">‹</button>
          <h3 class="cal-month-title" id="calMonthTitle"></h3>
          <button class="cal-nav-btn" onclick="calNext()">›</button>
        </div>
        <div class="calendar-grid" id="calendarGrid"></div>
      </div>

      <!-- Day detail panel -->
      <div class="card calendar-detail-card" id="calDetailCard" style="display:none;">
        <div class="calendar-detail-header">
          <h3 id="calDetailDate"></h3>
          <span class="cal-detail-total" id="calDetailTotal"></span>
        </div>
        <div id="calDetailList"></div>
      </div>

    </div>
  `;

  window.calPrev     = calPrev;
  window.calNext     = calNext;
  window.selectCalDay = selectCalDay;

  renderCalGrid();
};

// ── Render calendar grid ──────────────────────────────────────
const renderCalGrid = () => {
  const titleEl = document.getElementById('calMonthTitle');
  const gridEl  = document.getElementById('calendarGrid');
  if (!titleEl || !gridEl) return;

  const monthName = new Date(calYear, calMonth, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  titleEl.textContent = monthName;

  const daysInMonth = getDaysInMonth(calYear, calMonth + 1);
  const firstDay    = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const today       = new Date().toISOString().split('T')[0];

  // Get spending per day for this month
  const monthStr  = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const monthExps = store.expenses.filter(e => e.date.startsWith(monthStr));
  const dailySpend= {};
  monthExps.forEach(e => {
    dailySpend[e.date] = (dailySpend[e.date] || 0) + Number(e.amount);
  });

  // Max for color intensity
  const maxSpend = Math.max(...Object.values(dailySpend), 1);

  let html = `
    <div class="cal-day-labels">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
        `<div class="cal-day-label">${d}</div>`).join('')}
    </div>
    <div class="cal-days-grid">
  `;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const spend    = dailySpend[dateStr] || 0;
    const isToday  = dateStr === today;
    const hasSpend = spend > 0;
    const intensity= hasSpend ? Math.max(0.15, spend / maxSpend) : 0;

    html += `
      <div class="cal-day ${isToday?'today':''} ${hasSpend?'has-spend':''}"
           onclick="selectCalDay('${dateStr}')"
           style="${hasSpend ? `background:rgba(200,90,42,${intensity*0.15});` : ''}">
        <span class="cal-day-num">${d}</span>
        ${hasSpend ? `<span class="cal-day-spend">${formatCurrency(spend, true)}</span>` : ''}
      </div>`;
  }

  html += `</div>`;
  gridEl.innerHTML = html;
};

// ── Select a day ──────────────────────────────────────────────
const selectCalDay = (dateStr) => {
  // Highlight selected
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  const dayNum = parseInt(dateStr.split('-')[2]);
  const allDays= document.querySelectorAll('.cal-day:not(.empty)');
  if (allDays[dayNum - 1]) allDays[dayNum - 1].classList.add('selected');

  // Get expenses for this day
  const dayExps = store.expenses.filter(e => e.date === dateStr);
  const total   = dayExps.reduce((s, e) => s + Number(e.amount), 0);

  const detailCard = document.getElementById('calDetailCard');
  const detailDate = document.getElementById('calDetailDate');
  const detailTot  = document.getElementById('calDetailTotal');
  const detailList = document.getElementById('calDetailList');

  detailCard.style.display = 'block';
  detailDate.textContent   = formatDate(dateStr, {weekday:'long', day:'numeric', month:'long'});
  detailTot.textContent    = total > 0 ? formatCurrency(total) : '';

  if (!dayExps.length) {
    detailList.innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--color-text-secondary);">
        <div style="font-size:2rem;margin-bottom:8px;">📅</div>
        <p>No expenses on this day</p>
      </div>`;
    return;
  }

  detailList.innerHTML = dayExps
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .map(e => {
      const cat = getCategoryData(e.category);
      return `
      <div class="cal-detail-row">
        <div class="cal-detail-icon" style="background:${cat.bg};">${cat.emoji}</div>
        <div class="cal-detail-info">
          <div class="cal-detail-name">${e.name}</div>
          <div class="cal-detail-sub">${e.category}</div>
        </div>
        <div class="cal-detail-right">
          ${avatarHtml(e.profiles?.name||'?', e.profiles?.avatar_color, 26)}
          <div class="cal-detail-amount">${formatCurrency(e.amount)}</div>
        </div>
      </div>`;
    }).join('');
};

// ── Navigation ────────────────────────────────────────────────
const calPrev = () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalGrid();
  document.getElementById('calDetailCard').style.display = 'none';
};

const calNext = () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalGrid();
  document.getElementById('calDetailCard').style.display = 'none';
};