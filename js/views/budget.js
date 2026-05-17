// ============================================================
// BudgetWise — js/views/budget.js
// Budget: summary cards, category rows, edit modal
// ============================================================

import { store }                    from '../store.js';
import { formatCurrency, showToast,
         getCategoryData, pct,
         CATEGORIES }               from '../utils.js';
import { upsertBudget }             from '../supabase.js';

// ── Render budget view ────────────────────────────────────────
export const renderBudget = () => {
  const container = document.getElementById('budgetView');
  if (!container) return;

  const month      = new Date().toISOString().slice(0, 7);
  const expenses   = store.getCurrentMonthExpenses();
  const catTotals  = store.getCategoryTotals(expenses);
  const totalSpent = store.getTotalSpent(expenses);
  const totalBgt   = store.getTotalBudget();
  const remaining  = Math.max(0, totalBgt - totalSpent);
  const overBudget = totalBgt > 0 && totalSpent > totalBgt;

  // Categories that are over 80%
  const warnings = store.budgets
    .filter(b => b.month === month)
    .filter(b => {
      const spent = catTotals[b.category] || 0;
      return pct(spent, b.amount) >= 80;
    });

  container.innerHTML = `

    <!-- Over-budget warning banner -->
    ${overBudget ? `
    <div class="budget-over-banner">
      <span class="budget-over-banner-icon">⚠️</span>
      <div class="budget-over-banner-text">
        <strong>Over Budget!</strong>
        <span>You've spent ${formatCurrency(totalSpent - totalBgt)} more than your monthly budget.</span>
      </div>
    </div>` : ''}

    <!-- Header -->
    <div class="budget-header">
      <div class="budget-header-text">
        <h2>Budget</h2>
        <p>Here's an overview of your budget status.</p>
      </div>
      <button class="btn btn-outline" onclick="openEditBudgets()">✏️ Edit Budgets</button>
    </div>

    <!-- 3 Summary cards -->
    <div class="budget-summary">
      <div class="budget-summary-card">
        <div class="budget-summary-icon total">💼</div>
        <div class="budget-summary-info">
          <div class="budget-summary-label">Total Budget</div>
          <div class="budget-summary-value total">${formatCurrency(totalBgt)}</div>
          <div class="budget-summary-sub">This Month</div>
        </div>
      </div>
      <div class="budget-summary-card">
        <div class="budget-summary-icon spent">📊</div>
        <div class="budget-summary-info">
          <div class="budget-summary-label">Spent So Far</div>
          <div class="budget-summary-value spent">${formatCurrency(totalSpent)}</div>
          <div class="budget-summary-sub">${totalBgt > 0 ? pct(totalSpent,totalBgt) : 0}% of budget</div>
        </div>
      </div>
      <div class="budget-summary-card">
        <div class="budget-summary-icon remain">💰</div>
        <div class="budget-summary-info">
          <div class="budget-summary-label">Remaining</div>
          <div class="budget-summary-value remain">${formatCurrency(remaining)}</div>
          <div class="budget-summary-sub">${totalBgt > 0 ? 100-pct(totalSpent,totalBgt) : 0}% of budget</div>
        </div>
      </div>
    </div>

    <!-- Category budgets -->
    <div class="budget-categories-card">
      <div class="budget-categories-header">
        <div class="budget-categories-header-text">
          <h3>Category Budgets</h3>
          <p>Track your spending across different categories.</p>
        </div>
      </div>

      <div class="budget-table-labels">
        <span class="budget-table-label">Category</span>
        <span class="budget-table-label">Spent / Budget</span>
        <span class="budget-table-label">Progress</span>
      </div>

      ${renderCategoryRows(catTotals, month)}
    </div>

    <!-- Edit budgets modal -->
    ${editBudgetModalHTML()}
  `;

  window.openEditBudgets  = openEditBudgets;
  window.closeEditBudgets = closeEditBudgets;
  window.saveBudgets      = saveBudgets;
};

// ── Category rows ─────────────────────────────────────────────
const renderCategoryRows = (catTotals, month) => {
  const cats = Object.keys(CATEGORIES);

  return cats.map(cat => {
    const budget  = store.budgets.find(b => b.category === cat && b.month === month);
    const spent   = catTotals[cat] || 0;
    const limit   = budget?.amount || 0;
    const p       = limit > 0 ? pct(spent, limit) : 0;
    const catData = getCategoryData(cat);
    const isWarn  = p >= 80 && p < 100;
    const isOver  = p >= 100;
    const stateClass = isOver ? 'over' : isWarn ? 'warning' : 'safe';

    return `
    <div class="budget-category-row ${stateClass}">
      <div class="budget-category-info">
        <div class="budget-category-icon ${cat.toLowerCase()}"
             style="background:${catData.bg};">${catData.emoji}</div>
        <div class="budget-category-details">
          <div class="budget-category-name">${cat}</div>
          <div class="budget-progress-wrap">
            <div class="budget-progress-bar">
              <div class="budget-progress-fill"
                   style="width:${Math.min(p,100)}%;background:${
                     isOver ? 'var(--color-danger)' :
                     isWarn ? 'var(--color-warning)' :
                     catData.color};"></div>
            </div>
            <span class="budget-warning-icon">${isOver?'🔴':isWarn?'⚠️':''}</span>
          </div>
        </div>
      </div>
      <div class="budget-spent-info">
        <span class="budget-spent-amount">${formatCurrency(spent)}</span>
        ${limit > 0 ? ` / ${formatCurrency(limit)}` : ' / No budget'}
      </div>
      <div class="budget-pct-col">
        <span class="budget-pct">${limit > 0 ? p+'%' : '—'}</span>
      </div>
    </div>`;
  }).join('');
};

// ── Edit budgets modal ────────────────────────────────────────
const editBudgetModalHTML = () => {
  const month = new Date().toISOString().slice(0, 7);

  return `
  <div class="modal-backdrop" id="editBudgetOverlay" onclick="handleBudgetOverlay(event)">
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Category Budgets</h3>
        <button class="modal-close" onclick="closeEditBudgets()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:16px;">
          Set monthly spending limits for each category.
        </p>
        <div class="budget-edit-grid">
          ${Object.entries(CATEGORIES).map(([cat, data]) => {
            const b = store.budgets.find(b => b.category === cat && b.month === month);
            return `
            <div class="budget-edit-row">
              <div class="budget-edit-icon" style="background:${data.bg};">${data.emoji}</div>
              <div class="budget-edit-label">${cat}</div>
              <div class="budget-edit-input-wrap">
                <span>₹</span>
                <input class="budget-edit-input" type="number" min="0"
                       id="budgetInput_${cat}"
                       value="${b?.amount || ''}"
                       placeholder="0" />
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeEditBudgets()">Cancel</button>
        <button class="btn btn-primary" id="saveBudgetsBtn" onclick="saveBudgets()">
          <span class="btn-text">Save Budgets</span>
        </button>
      </div>
    </div>
  </div>`;
};

window.handleBudgetOverlay = (e) => {
  if (e.target.id === 'editBudgetOverlay') closeEditBudgets();
};

const openEditBudgets = () => {
  document.getElementById('editBudgetOverlay')?.classList.add('open');
};

const closeEditBudgets = () => {
  document.getElementById('editBudgetOverlay')?.classList.remove('open');
};

const saveBudgets = async () => {
  const month  = new Date().toISOString().slice(0, 7);
  const btn    = document.getElementById('saveBudgetsBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const updates = [];
    for (const cat of Object.keys(CATEGORIES)) {
      const input = document.getElementById(`budgetInput_${cat}`);
      const val   = parseFloat(input?.value);
      if (val > 0) {
        updates.push({ category: cat, amount: val,
          household_id: store.household?.id, month });
      }
    }

    await Promise.all(updates.map(u => upsertBudget(u)));
    updates.forEach(u => {
      const idx = store.budgets.findIndex(b => b.category===u.category && b.month===u.month);
      if (idx !== -1) store.budgets[idx] = { ...store.budgets[idx], ...u };
      else store.budgets.push({ ...u, id: `b-${Date.now()}` });
    });

    closeEditBudgets();
    showToast('Budgets saved!', 'success');
    renderBudget();
  } catch (err) {
    showToast('Failed to save budgets. Please try again.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save Budgets';
  }
};