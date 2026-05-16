// ============================================================
// BudgetWise — js/demo.js
// Demo mode seed data — no Supabase needed
// Loaded when sessionStorage bw_demo === 'true'
// ============================================================

export const DEMO_USER = {
  id:           'demo-user-1',
  name:         'Rahul Sharma',
  email:        'rahul@demo.com',
  avatar_color: '#C85A2A',
  role:         'admin',
  household_id: 'demo-household-1',
};

export const DEMO_HOUSEHOLD = {
  id:          'demo-household-1',
  name:        'The Sharma Family',
  invite_code: 'BWS-4821',
  created_by:  'demo-user-1',
};

export const DEMO_MEMBERS = [
  { id: 'demo-user-1', name: 'Rahul Sharma',  avatar_color: '#C85A2A', role: 'admin'  },
  { id: 'demo-user-2', name: 'Priya Sharma',  avatar_color: '#2D7A4F', role: 'member' },
  { id: 'demo-user-3', name: 'Aarav Sharma',  avatar_color: '#1A5FA8', role: 'member' },
];

// ── Generate expenses for last 3 months ──────────────────────
const today = new Date();
const fmt   = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

export const DEMO_EXPENSES = [
  // This month
  { id: 'e1',  household_id: 'demo-household-1', name: 'BigBasket Order',         category: 'Food',          amount: 1248,  date: daysAgo(0),  added_by: 'demo-user-2', receipt_url: null, notes: 'Weekly groceries', profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e2',  household_id: 'demo-household-1', name: 'Uber Ride to Airport',     category: 'Transport',     amount: 642,   date: daysAgo(0),  added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e3',  household_id: 'demo-household-1', name: 'Pharmacy Medicines',       category: 'Health',        amount: 856,   date: daysAgo(1),  added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e4',  household_id: 'demo-household-1', name: 'Electricity Bill Payment', category: 'Utilities',     amount: 2450,  date: daysAgo(2),  added_by: 'demo-user-1', receipt_url: null, notes: 'BESCOM May',      profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e5',  household_id: 'demo-household-1', name: 'PVR Movie Tickets',        category: 'Entertainment', amount: 1200,  date: daysAgo(2),  added_by: 'demo-user-3', receipt_url: null, notes: 'Saturday evening', profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e6',  household_id: 'demo-household-1', name: 'Bus Pass Recharge',        category: 'Transport',     amount: 550,   date: daysAgo(3),  added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e7',  household_id: 'demo-household-1', name: 'Cafe Coffee Day',          category: 'Food',          amount: 320,   date: daysAgo(3),  added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e8',  household_id: 'demo-household-1', name: 'Water Bill',               category: 'Utilities',     amount: 680,   date: daysAgo(4),  added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e9',  household_id: 'demo-household-1', name: 'Reliance Mart',            category: 'Food',          amount: 1150,  date: daysAgo(4),  added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e10', household_id: 'demo-household-1', name: 'Health Insurance Premium', category: 'Health',        amount: 5999,  date: daysAgo(5),  added_by: 'demo-user-1', receipt_url: null, notes: 'Annual premium',  profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e11', household_id: 'demo-household-1', name: 'Swiggy Order',             category: 'Food',          amount: 856,   date: daysAgo(5),  added_by: 'demo-user-2', receipt_url: null, notes: 'Dinner',          profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e12', household_id: 'demo-household-1', name: 'Amazon Shopping',          category: 'Shopping',      amount: 3200,  date: daysAgo(6),  added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e13', household_id: 'demo-household-1', name: 'School Books',             category: 'Education',     amount: 1480,  date: daysAgo(7),  added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e14', household_id: 'demo-household-1', name: 'Petrol Fill',              category: 'Transport',     amount: 2800,  date: daysAgo(8),  added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e15', household_id: 'demo-household-1', name: 'Zepto Groceries',          category: 'Food',          amount: 960,   date: daysAgo(9),  added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e16', household_id: 'demo-household-1', name: 'Gym Membership',           category: 'Health',        amount: 1499,  date: daysAgo(10), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e17', household_id: 'demo-household-1', name: 'Myntra Order',             category: 'Shopping',      amount: 2100,  date: daysAgo(11), added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e18', household_id: 'demo-household-1', name: 'Internet Bill',            category: 'Utilities',     amount: 1299,  date: daysAgo(12), added_by: 'demo-user-1', receipt_url: null, notes: 'Airtel 300Mbps',  profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e19', household_id: 'demo-household-1', name: 'Inox Movie',               category: 'Entertainment', amount: 980,   date: daysAgo(13), added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e20', household_id: 'demo-household-1', name: 'Fresh Vegetables',         category: 'Food',          amount: 480,   date: daysAgo(14), added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  // Last month
  { id: 'e21', household_id: 'demo-household-1', name: 'BigBasket Groceries',      category: 'Food',          amount: 3200,  date: daysAgo(32), added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e22', household_id: 'demo-household-1', name: 'Car Service',              category: 'Transport',     amount: 4500,  date: daysAgo(35), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e23', household_id: 'demo-household-1', name: 'Doctor Visit',             category: 'Health',        amount: 800,   date: daysAgo(38), added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e24', household_id: 'demo-household-1', name: 'BESCOM Bill',              category: 'Utilities',     amount: 2100,  date: daysAgo(40), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e25', household_id: 'demo-household-1', name: 'Zomato Weekend',           category: 'Food',          amount: 1650,  date: daysAgo(42), added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  { id: 'e26', household_id: 'demo-household-1', name: 'Flipkart Sale',            category: 'Shopping',      amount: 5600,  date: daysAgo(45), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e27', household_id: 'demo-household-1', name: 'Petrol',                   category: 'Transport',     amount: 2400,  date: daysAgo(48), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e28', household_id: 'demo-household-1', name: 'Sports Shoes',             category: 'Shopping',      amount: 3200,  date: daysAgo(50), added_by: 'demo-user-3', receipt_url: null, notes: null,              profiles: { name: 'Aarav Sharma',  avatar_color: '#1A5FA8' } },
  // 2 months ago
  { id: 'e29', household_id: 'demo-household-1', name: 'BigBasket April',          category: 'Food',          amount: 2900,  date: daysAgo(62), added_by: 'demo-user-2', receipt_url: null, notes: null,              profiles: { name: 'Priya Sharma',  avatar_color: '#2D7A4F' } },
  { id: 'e30', household_id: 'demo-household-1', name: 'Annual Medical',           category: 'Health',        amount: 3500,  date: daysAgo(65), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e31', household_id: 'demo-household-1', name: 'Electricity April',        category: 'Utilities',     amount: 1980,  date: daysAgo(68), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
  { id: 'e32', household_id: 'demo-household-1', name: 'Petrol April',             category: 'Transport',     amount: 2600,  date: daysAgo(70), added_by: 'demo-user-1', receipt_url: null, notes: null,              profiles: { name: 'Rahul Sharma',  avatar_color: '#C85A2A' } },
];

export const DEMO_BUDGETS = [
  { id: 'b1', household_id: 'demo-household-1', category: 'Food',          amount: 15000, month: fmt(today).slice(0,7) },
  { id: 'b2', household_id: 'demo-household-1', category: 'Transport',     amount: 8000,  month: fmt(today).slice(0,7) },
  { id: 'b3', household_id: 'demo-household-1', category: 'Health',        amount: 5000,  month: fmt(today).slice(0,7) },
  { id: 'b4', household_id: 'demo-household-1', category: 'Utilities',     amount: 6000,  month: fmt(today).slice(0,7) },
  { id: 'b5', household_id: 'demo-household-1', category: 'Entertainment', amount: 4000,  month: fmt(today).slice(0,7) },
  { id: 'b6', household_id: 'demo-household-1', category: 'Shopping',      amount: 8000,  month: fmt(today).slice(0,7) },
  { id: 'b7', household_id: 'demo-household-1', category: 'Education',     amount: 3000,  month: fmt(today).slice(0,7) },
];

export const DEMO_RECURRING = [
  { id: 'r1', household_id: 'demo-household-1', name: 'Netflix Premium',    category: 'Entertainment', amount: 649,   cycle: 'Monthly', next_due: daysAgo(-7),  status: 'active', icon_color: '#EF4444' },
  { id: 'r2', household_id: 'demo-household-1', name: 'Spotify Premium',    category: 'Entertainment', amount: 119,   cycle: 'Monthly', next_due: daysAgo(-10), status: 'active', icon_color: '#22C55E' },
  { id: 'r3', household_id: 'demo-household-1', name: 'HDFC Credit Card',   category: 'Shopping',      amount: 5250,  cycle: 'Monthly', next_due: daysAgo(-12), status: 'active', icon_color: '#3B82F6' },
  { id: 'r4', household_id: 'demo-household-1', name: 'House Rent',         category: 'Utilities',     amount: 18000, cycle: 'Monthly', next_due: daysAgo(-14), status: 'active', icon_color: '#F59E0B' },
  { id: 'r5', household_id: 'demo-household-1', name: 'Gym Membership',     category: 'Health',        amount: 1499,  cycle: 'Monthly', next_due: daysAgo(-6),  status: 'paused', icon_color: '#8B5CF6' },
  { id: 'r6', household_id: 'demo-household-1', name: 'Disney+ Hotstar',    category: 'Entertainment', amount: 1499,  cycle: 'Yearly',  next_due: daysAgo(-180),status: 'active', icon_color: '#EC4899' },
];

// ── Demo data accessor (mirrors Supabase API shape) ───────────
export const demoDb = {
  expenses:  [...DEMO_EXPENSES],
  budgets:   [...DEMO_BUDGETS],
  recurring: [...DEMO_RECURRING],

  addExpense(exp) {
    const newExp = { ...exp, id: `e-${Date.now()}`, profiles: { name: DEMO_USER.name, avatar_color: DEMO_USER.avatar_color } };
    this.expenses.unshift(newExp);
    return newExp;
  },
  updateExpense(id, updates) {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx !== -1) this.expenses[idx] = { ...this.expenses[idx], ...updates };
    return this.expenses[idx];
  },
  deleteExpense(id) {
    this.expenses = this.expenses.filter(e => e.id !== id);
  },
  upsertBudget(budget) {
    const idx = this.budgets.findIndex(b => b.category === budget.category && b.month === budget.month);
    if (idx !== -1) { this.budgets[idx] = { ...this.budgets[idx], ...budget }; }
    else { this.budgets.push({ ...budget, id: `b-${Date.now()}` }); }
  },
  addRecurring(item) {
    const newItem = { ...item, id: `r-${Date.now()}` };
    this.recurring.push(newItem);
    return newItem;
  },
  updateRecurring(id, updates) {
    const idx = this.recurring.findIndex(r => r.id === id);
    if (idx !== -1) this.recurring[idx] = { ...this.recurring[idx], ...updates };
    return this.recurring[idx];
  },
  deleteRecurring(id) {
    this.recurring = this.recurring.filter(r => r.id !== id);
  },
};