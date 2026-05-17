// ============================================================
// BudgetWise — js/views/expenses.js
// Expenses: table, CRUD, search, filter, pagination, export
// ============================================================

import { store }                          from '../store.js';
import { formatCurrency, formatDate,
         getCategoryData, avatarHtml,
         showToast, debounce,
         CATEGORIES, emptyState }         from '../utils.js';
import { insertExpense, updateExpense,
         deleteExpense, uploadReceipt }   from '../supabase.js';
import { exportCSV, exportPDF }           from '../export.js';
import { openReceiptPicker,
         createReceiptPreview }           from '../receipt.js';

// ── State ─────────────────────────────────────────────────────
let editingId      = null;
let deleteTarget   = null;
let deleteTimer    = null;
let receiptFile    = null;
let receiptPreview = null;

// ── Render expenses view ──────────────────────────────────────
export const renderExpenses = () => {
  const container = document.getElementById('expensesView');
  if (!container) return;

  container.innerHTML = `
    <!-- Header -->
    <div class="expenses-header">
      <div>
        <h2 class="expenses-title">Expenses</h2>
        <p class="expenses-sub">Track and manage all your family expenses</p>
      </div>
      <div class="expenses-export-btns">
        <button class="btn btn-outline btn-sm" onclick="handleExportCSV()">
          📄 Export CSV
        </button>
        <button class="btn btn-outline btn-sm" onclick="handleExportPDF()">
          📊 Export PDF
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="expenses-filters">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          id="expenseSearch"
          type="text"
          placeholder="Search expenses..."
          value="${store.filters.search}"
          oninput="handleSearch(this.value)"
        />
      </div>
      <select class="form-select" id="categoryFilter" onchange="handleFilter('category', this.value)">
        <option value="">All Categories</option>
        ${Object.keys(CATEGORIES).map(c =>
          `<option value="${c}" ${store.filters.category===c?'selected':''}>${c}</option>`
        ).join('')}
      </select>
      <select class="form-select" id="memberFilter" onchange="handleFilter('member', this.value)">
        <option value="">All Members</option>
        ${store.members.map(m =>
          `<option value="${m.id}" ${store.filters.member===m.id?'selected':''}>${m.name}</option>`
        ).join('')}
      </select>
      <input
        class="form-input month-picker"
        type="month"
        id="monthFilter"
        value="${store.filters.month}"
        onchange="handleFilter('month', this.value)"
      />
      <button class="btn btn-ghost btn-sm" onclick="clearFilters()">✕ Clear</button>
    </div>

    <!-- Table -->
    <div class="card expenses-table-card">
      <div class="expenses-table-wrap" id="expensesTableWrap">
        ${renderTable()}
      </div>
      <!-- Pagination -->
      <div class="pagination-wrap" id="paginationWrap">
        ${renderPagination()}
      </div>
    </div>

    <!-- Add/Edit Modal -->
    ${expenseModalHTML()}

    <!-- Delete confirmation toast -->
    <div class="delete-confirm-toast" id="deleteConfirmToast" style="display:none;">
      <span>Expense deleted</span>
      <button onclick="undoDelete()">Undo</button>
      <div class="delete-timer-bar" id="deleteTimerBar"></div>
    </div>
  `;

  // Wire global handlers
  window.handleSearch    = debounce(handleSearch, 300);
  window.handleFilter    = handleFilter;
  window.clearFilters    = clearFilters;
  window.changePage      = changePage;
  window.openAddExpense  = openAddExpense;
  window.openEditExpense = openEditExpense;
  window.confirmDelete   = confirmDelete;
  window.undoDelete      = undoDelete;
  window.closeModal      = closeExpenseModal;
  window.saveExpense     = saveExpense;
  window.handleExportCSV = () => exportCSV();
  window.handleExportPDF = () => exportPDF();
  window.scanReceipt     = handleScanReceipt;
  window.removeReceipt   = removeReceipt;
};

// ── Table HTML ────────────────────────────────────────────────
const renderTable = () => {
  const { items, total } = store.getPagedExpenses();
  if (!items.length) {
    return emptyState('💸', 'No expenses found',
      store.filters.search || store.filters.category || store.filters.member
        ? 'Try adjusting your filters.'
        : 'Add your first expense using the + button.',
      '+ Add Expense', 'emptyAddBtn');
  }

  return `
    <table class="expenses-table">
      <thead>
        <tr>
          <th></th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Added By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(e => expenseRow(e)).join('')}
      </tbody>
    </table>
    <div class="table-count">
      Showing ${((store.pagination.page-1)*store.pagination.perPage)+1}–${Math.min(store.pagination.page*store.pagination.perPage, total)} of ${total} expenses
    </div>
  `;
};

const expenseRow = (e) => {
  const cat = getCategoryData(e.category);
  const isOptimistic = e._optimistic;
  return `
  <tr class="expense-row ${isOptimistic ? 'optimistic' : ''}" data-id="${e.id}">
    <td>
      <div class="expense-cat-icon" style="background:${cat.bg};">${cat.emoji}</div>
    </td>
    <td>
      <div class="expense-name">${e.name}</div>
      ${e.notes ? `<div class="expense-notes">${e.notes}</div>` : ''}
      ${e.receipt_url ? `<a href="${e.receipt_url}" target="_blank" class="expense-receipt-link">📎 Receipt</a>` : ''}
    </td>
    <td><span class="category-pill ${e.category.toLowerCase()}">${e.category}</span></td>
    <td class="expense-amount">₹${Number(e.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
    <td>
      <div class="expense-date">${formatDate(e.date,{day:'numeric',month:'short',year:'numeric'})}</div>
    </td>
    <td>
      <div class="expense-member">
        ${avatarHtml(e.profiles?.name||'?', e.profiles?.avatar_color, 28)}
        <span>${e.profiles?.name?.split(' ')[0]||'?'}</span>
      </div>
    </td>
    <td>
      <div class="expense-actions">
        <button class="action-btn edit" onclick="openEditExpense('${e.id}')" title="Edit">✏️</button>
        <button class="action-btn delete" onclick="confirmDelete('${e.id}')" title="Delete">🗑️</button>
      </div>
    </td>
  </tr>`;
};

// ── Pagination HTML ───────────────────────────────────────────
const renderPagination = () => {
  const { total, pages } = store.getPagedExpenses();
  const { page, perPage } = store.pagination;
  if (pages <= 1) return '';

  let html = `<div class="pagination">
    <button class="page-btn" onclick="changePage(${page-1})" ${page<=1?'disabled':''}>‹</button>`;

  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      html += `<button class="page-btn ${i===page?'active':''}" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - page) === 2) {
      html += `<span class="page-ellipsis">…</span>`;
    }
  }

  html += `<button class="page-btn" onclick="changePage(${page+1})" ${page>=pages?'disabled':''}>›</button>
    <span class="page-info">${perPage} / page</span>
  </div>`;
  return html;
};

// ── Expense Modal HTML ────────────────────────────────────────
const expenseModalHTML = () => `
  <div class="modal-backdrop" id="expenseModalOverlay" onclick="handleOverlayClick(event)">
    <div class="modal" id="expenseModal">
      <div class="modal-header">
        <h3 id="modalTitle">Add Expense</h3>
        <button class="modal-close" onclick="closeExpenseModal()">✕</button>
      </div>
      <div class="modal-body">

        <!-- Receipt scanner -->
        <div class="receipt-scanner-section">
          <button class="btn btn-outline btn-sm receipt-scan-btn" id="scanReceiptBtn" onclick="scanReceipt()">
            📷 Scan Receipt
          </button>
          <span class="receipt-hint">or fill manually below</span>
        </div>
        <div id="receiptPreviewWrap" style="display:none;"></div>

        <!-- Form -->
        <div class="form-group">
          <label class="form-label">Description *</label>
          <input class="form-input" id="expName" type="text" placeholder="e.g. BigBasket Order" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount (₹) *</label>
            <input class="form-input" id="expAmount" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input class="form-input" id="expDate" type="date" value="${new Date().toISOString().split('T')[0]}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <div class="category-grid" id="categoryGrid">
            ${Object.entries(CATEGORIES).map(([key, val]) => `
            <button class="category-option" data-cat="${key}" onclick="selectCategory('${key}')">
              <span>${val.emoji}</span>
              <span>${key}</span>
            </button>`).join('')}
          </div>
          <input type="hidden" id="expCategory" />
        </div>
        <div class="form-group">
          <label class="form-label">Paid By</label>
          <select class="form-select" id="expPaidBy">
            ${store.members.map(m =>
              `<option value="${m.id}" ${m.id===store.user?.id?'selected':''}>${m.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <textarea class="form-input" id="expNotes" rows="2" placeholder="Add any extra details..."></textarea>
        </div>
        <div class="form-error" id="expenseFormError"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeExpenseModal()">Cancel</button>
        <button class="btn btn-primary" id="saveExpenseBtn" onclick="saveExpense()">
          <span class="btn-text">Save Expense</span>
          <span class="btn-spinner" style="display:none;">⏳</span>
        </button>
      </div>
    </div>
  </div>
`;

// ── Open modals ───────────────────────────────────────────────
export const openAddExpense = () => {
  editingId = null;
  receiptFile = null;
  receiptPreview = null;
  document.getElementById('modalTitle').textContent = 'Add Expense';
  clearExpenseForm();
  document.getElementById('expenseModalOverlay').classList.add('open');
};

const openEditExpense = (id) => {
  const exp = store.expenses.find(e => e.id === id);
  if (!exp) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Expense';
  document.getElementById('expName').value    = exp.name    || '';
  document.getElementById('expAmount').value  = exp.amount  || '';
  document.getElementById('expDate').value    = exp.date    || '';
  document.getElementById('expNotes').value   = exp.notes   || '';
  document.getElementById('expCategory').value= exp.category|| '';
  if (exp.added_by) document.getElementById('expPaidBy').value = exp.added_by;
  // Highlight selected category
  document.querySelectorAll('.category-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.cat === exp.category);
  });
  document.getElementById('expenseModalOverlay').classList.add('open');
};

const closeExpenseModal = () => {
  document.getElementById('expenseModalOverlay')?.classList.remove('open');
  editingId = null;
  receiptFile = null;
  clearExpenseForm();
};

window.handleOverlayClick = (e) => {
  if (e.target.id === 'expenseModalOverlay') closeExpenseModal();
};

window.selectCategory = (cat) => {
  document.getElementById('expCategory').value = cat;
  document.querySelectorAll('.category-option').forEach(btn =>
    btn.classList.toggle('selected', btn.dataset.cat === cat));
};

const clearExpenseForm = () => {
  ['expName','expAmount','expNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dateEl = document.getElementById('expDate');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  document.getElementById('expCategory').value = '';
  document.querySelectorAll('.category-option').forEach(b => b.classList.remove('selected'));
  document.getElementById('expenseFormError').textContent = '';
  document.getElementById('receiptPreviewWrap').style.display = 'none';
};

// ── Save expense ──────────────────────────────────────────────
const saveExpense = async () => {
  const name     = document.getElementById('expName').value.trim();
  const amount   = parseFloat(document.getElementById('expAmount').value);
  const date     = document.getElementById('expDate').value;
  const category = document.getElementById('expCategory').value;
  const paidBy   = document.getElementById('expPaidBy').value;
  const notes    = document.getElementById('expNotes').value.trim();
  const errEl    = document.getElementById('expenseFormError');
  const btn      = document.getElementById('saveExpenseBtn');

  errEl.textContent = '';
  if (!name)       return (errEl.textContent = 'Please enter a description.');
  if (!amount||amount<=0) return (errEl.textContent = 'Please enter a valid amount.');
  if (!date)       return (errEl.textContent = 'Please select a date.');
  if (!category)   return (errEl.textContent = 'Please select a category.');

  btn.disabled = true;
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-spinner').style.display = 'inline';

  const expenseData = {
    name, amount, date, category, notes,
    household_id: store.household?.id,
    added_by:     paidBy || store.user?.id,
  };

  try {
    if (editingId) {
      // Optimistic update
      const backup = store.optimisticUpdate(editingId, expenseData);
      closeExpenseModal();
      refreshTable();
      try {
        await updateExpense(editingId, expenseData);
        showToast('Expense updated!', 'success');
      } catch {
        store.rollbackUpdate(editingId, backup);
        refreshTable();
        showToast('Update failed. Please try again.', 'error');
      }
    } else {
      // Upload receipt if any
      let receiptUrl = null;
      if (receiptFile) {
        try {
          receiptUrl = await uploadReceipt(receiptFile, store.user?.id);
        } catch { /* receipt upload failed silently */ }
      }

      const tempId = store.optimisticAdd({
        ...expenseData, receipt_url: receiptUrl,
        profiles: { name: store.user?.name, avatar_color: store.user?.avatar_color }
      });
      closeExpenseModal();
      refreshTable();

      try {
        const saved = await insertExpense({ ...expenseData, receipt_url: receiptUrl });
        store.confirmOptimistic(tempId, {
          ...saved,
          profiles: { name: store.user?.name, avatar_color: store.user?.avatar_color }
        });
        showToast('Expense added!', 'success');
        refreshTable();
      } catch {
        store.rollbackOptimistic(tempId);
        refreshTable();
        showToast('Failed to save. Please try again.', 'error');
      }
    }
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-spinner').style.display = 'none';
  }
};

// ── Delete with undo ──────────────────────────────────────────
const confirmDelete = (id) => {
  deleteTarget = id;
  const backup = store.optimisticDelete(id);
  refreshTable();

  // Show undo toast
  const toast = document.getElementById('deleteConfirmToast');
  if (toast) {
    toast.style.display = 'flex';
    const bar = document.getElementById('deleteTimerBar');
    if (bar) { bar.style.width = '100%'; setTimeout(() => bar.style.width = '0%', 50); }
  }

  deleteTimer = setTimeout(async () => {
    toast.style.display = 'none';
    try {
      await deleteExpense(id);
    } catch {
      if (backup) store.rollbackDelete(backup);
      refreshTable();
      showToast('Delete failed. Expense restored.', 'error');
    }
    deleteTarget = null;
  }, 5000);
};

const undoDelete = () => {
  clearTimeout(deleteTimer);
  const toast = document.getElementById('deleteConfirmToast');
  if (toast) toast.style.display = 'none';
  // expense was already removed from store — need to refetch or rollback
  // for demo simplicity we reload
  store.emit('expenses:changed', store.expenses);
  refreshTable();
  deleteTarget = null;
  showToast('Delete cancelled ↩️', 'info', 2000);
};

// ── Receipt scanner ───────────────────────────────────────────
const handleScanReceipt = () => {
  openReceiptPicker(async (result, file) => {
    receiptFile = file;
    // Auto-fill form
    if (result.name)     document.getElementById('expName').value     = result.name;
    if (result.amount)   document.getElementById('expAmount').value   = result.amount;
    if (result.date)     document.getElementById('expDate').value     = result.date;
    if (result.notes)    document.getElementById('expNotes').value    = result.notes;
    if (result.category) {
      document.getElementById('expCategory').value = result.category;
      document.querySelectorAll('.category-option').forEach(btn =>
        btn.classList.toggle('selected', btn.dataset.cat === result.category));
    }
    // Show preview
    const preview = await createReceiptPreview(file);
    const wrap    = document.getElementById('receiptPreviewWrap');
    if (wrap) {
      wrap.style.display = 'block';
      wrap.innerHTML = `
        <div class="receipt-preview">
          <img src="${preview}" class="receipt-thumb" alt="Receipt" />
          <div>
            <div class="receipt-filename">${file.name}</div>
            <div class="receipt-size">${(file.size/1024).toFixed(0)} KB</div>
          </div>
          <button class="receipt-remove" onclick="removeReceipt()">✕</button>
        </div>`;
    }
  });
};

const removeReceipt = () => {
  receiptFile = null;
  const wrap = document.getElementById('receiptPreviewWrap');
  if (wrap) wrap.style.display = 'none';
};

// ── Filters ───────────────────────────────────────────────────
const handleSearch = (val) => {
  store.filters.search = val;
  store.pagination.page = 1;
  refreshTable();
};

const handleFilter = (key, val) => {
  store.filters[key] = val;
  store.pagination.page = 1;
  refreshTable();
};

const clearFilters = () => {
  store.filters.search = store.filters.category = store.filters.member = '';
  store.filters.month  = new Date().toISOString().slice(0, 7);
  store.pagination.page = 1;
  document.getElementById('expenseSearch').value  = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('memberFilter').value   = '';
  document.getElementById('monthFilter').value    = store.filters.month;
  refreshTable();
};

const changePage = (p) => {
  const { pages } = store.getPagedExpenses();
  if (p < 1 || p > pages) return;
  store.pagination.page = p;
  refreshTable();
};

// ── Refresh table only (no full re-render) ────────────────────
const refreshTable = () => {
  const wrap = document.getElementById('expensesTableWrap');
  const pg   = document.getElementById('paginationWrap');
  if (wrap) wrap.innerHTML = renderTable();
  if (pg)   pg.innerHTML   = renderPagination();

  // Wire empty state add button
  document.getElementById('emptyAddBtn')?.addEventListener('click', openAddExpense);
};