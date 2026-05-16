// ============================================================
// BudgetWise — js/store.js
// Global state store + optimistic update helpers
// ============================================================

export const store = {
  // ── Auth ──────────────────────────────────────────────────
  user:      null,   // profile row
  household: null,   // households row

  // ── Data ──────────────────────────────────────────────────
  expenses:  [],
  budgets:   [],
  recurring: [],
  members:   [],

  // ── UI state ──────────────────────────────────────────────
  currentTab:    'dashboard',
  isDemoMode:    false,
  isDarkMode:    false,
  isLoading:     false,

  // ── Filters (expenses view) ────────────────────────────────
  filters: {
    search:   '',
    category: '',
    member:   '',
    month:    new Date().toISOString().slice(0, 7), // 'YYYY-MM'
  },

  // ── Pagination ────────────────────────────────────────────
  pagination: {
    page:    1,
    perPage: 10,
  },

  // ── Callbacks (views register these) ──────────────────────
  _listeners: {},

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },

  // ── Optimistic expense add ────────────────────────────────
  optimisticAdd(expense) {
    const temp = { ...expense, id: `temp-${Date.now()}`, _optimistic: true };
    this.expenses.unshift(temp);
    this.emit('expenses:changed', this.expenses);
    return temp.id;
  },

  confirmOptimistic(tempId, real) {
    const idx = this.expenses.findIndex(e => e.id === tempId);
    if (idx !== -1) this.expenses[idx] = real;
    this.emit('expenses:changed', this.expenses);
  },

  rollbackOptimistic(tempId) {
    this.expenses = this.expenses.filter(e => e.id !== tempId);
    this.emit('expenses:changed', this.expenses);
  },

  // ── Optimistic expense update ─────────────────────────────
  optimisticUpdate(id, updates) {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return;
    const backup = { ...this.expenses[idx] };
    this.expenses[idx] = { ...this.expenses[idx], ...updates, _optimistic: true };
    this.emit('expenses:changed', this.expenses);
    return backup;
  },

  rollbackUpdate(id, backup) {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx !== -1) this.expenses[idx] = backup;
    this.emit('expenses:changed', this.expenses);
  },

  // ── Optimistic expense delete ─────────────────────────────
  optimisticDelete(id) {
    const backup = this.expenses.find(e => e.id === id);
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.emit('expenses:changed', this.expenses);
    return backup;
  },

  rollbackDelete(backup) {
    this.expenses.unshift(backup);
    this.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.emit('expenses:changed', this.expenses);
  },

  // ── Getters ───────────────────────────────────────────────
  getFilteredExpenses() {
    const { search, category, member, month } = this.filters;
    return this.expenses.filter(e => {
      if (month && !e.date.startsWith(month)) return false;
      if (category && e.category !== category) return false;
      if (member && e.added_by !== member) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (e.name || '').toLowerCase();
        const memberName = (e.profiles?.name || '').toLowerCase();
        if (!name.includes(q) && !memberName.includes(q)) return false;
      }
      return true;
    });
  },

  getPagedExpenses() {
    const filtered = this.getFilteredExpenses();
    const { page, perPage } = this.pagination;
    const start = (page - 1) * perPage;
    return {
      items: filtered.slice(start, start + perPage),
      total: filtered.length,
      pages: Math.ceil(filtered.length / perPage),
    };
  },

  getCurrentMonthExpenses() {
    const month = new Date().toISOString().slice(0, 7);
    return this.expenses.filter(e => e.date.startsWith(month));
  },

  getTotalSpent(expenseList) {
    return (expenseList || this.getCurrentMonthExpenses())
      .reduce((sum, e) => sum + Number(e.amount), 0);
  },

  getCategoryTotals(expenseList) {
    const list = expenseList || this.getCurrentMonthExpenses();
    return list.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
  },

  getDailyTotals(expenseList) {
    const list = expenseList || this.getCurrentMonthExpenses();
    return list.reduce((acc, e) => {
      const day = e.date;
      acc[day] = (acc[day] || 0) + Number(e.amount);
      return acc;
    }, {});
  },

  getBudgetForCategory(category) {
    const month = new Date().toISOString().slice(0, 7);
    return this.budgets.find(b => b.category === category && b.month === month);
  },

  getTotalBudget() {
    const month = new Date().toISOString().slice(0, 7);
    return this.budgets
      .filter(b => b.month === month)
      .reduce((sum, b) => sum + Number(b.amount), 0);
  },

  getActiveRecurringTotal() {
    return this.recurring
      .filter(r => r.status === 'active' && r.cycle === 'Monthly')
      .reduce((sum, r) => sum + Number(r.amount), 0);
  },
};