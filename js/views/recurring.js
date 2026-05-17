// ============================================================
// BudgetWise — js/views/recurring.js
// Recurring: subscription table, add/edit/pause/delete
// ============================================================

import { store }                     from '../store.js';
import { formatCurrency, formatDate,
         showToast, CATEGORIES }     from '../utils.js';
import { insertRecurring,
         updateRecurring,
         deleteRecurring }           from '../supabase.js';

// ── State ─────────────────────────────────────────────────────
let editingRecurringId = null;

// ── Render recurring view ─────────────────────────────────────
export const renderRecurring = () => {
  const container = document.getElementById('recurringView');
  if (!container) return;

  const items       = store.recurring;
  const activeItems = items.filter(r => r.status === 'active');
  const monthlyTotal= items
    .filter(r => r.status === 'active')
    .reduce((s, r) => {
      if (r.cycle === 'Monthly') return s + Number(r.amount);
      if (r.cycle === 'Yearly')  return s + Number(r.amount) / 12;
      if (r.cycle === 'Weekly')  return s + Number(r.amount) * 4.33;
      return s;
    }, 0);

  container.innerHTML = `
    <!-- Header -->
    <div class="recurring-header">
      <div class="recurring-header-text">
        <h2>Subscriptions and Bills</h2>
        <p>Manage all your recurring payments and subscriptions.</p>
      </div>
      <button class="btn btn-primary" onclick="openAddRecurring()">
        + Add Recurring
      </button>
    </div>

    <!-- Table card -->
    <div class="recurring-card">

      <!-- Column headers -->
      <div class="recurring-table-header">
        <span class="recurring-col-label">Item</span>
        <span class="recurring-col-label">Cycle</span>
        <span class="recurring-col-label">Next Due</span>
        <span class="recurring-col-label">Status</span>
        <span class="recurring-col-label right">Amount</span>
        <span class="recurring-col-label"></span>
      </div>

      <!-- Rows -->
      ${items.length > 0
        ? items.map(r => recurringRow(r)).join('')
        : `<div style="text-align:center;padding:64px;color:var(--color-text-secondary);">
            <div style="font-size:3rem;margin-bottom:12px;opacity:0.4;">🔄</div>
            <h3 style="font-weight:700;color:var(--color-text-primary);margin-bottom:8px;">No subscriptions yet</h3>
            <p style="font-size:0.875rem;max-width:280px;margin:0 auto 20px;">Add your Netflix, Spotify, rent and other recurring bills.</p>
            <button class="btn btn-primary btn-sm" onclick="openAddRecurring()">+ Add First Subscription</button>
          </div>`
      }

      <!-- Footer summary -->
      ${items.length > 0 ? `
      <div class="recurring-footer">
        <div class="recurring-footer-left">
          <div class="recurring-footer-icon">🔄</div>
          <div>
            <div class="recurring-footer-label">Total Active</div>
            <div class="recurring-footer-sub">${activeItems.length} subscription${activeItems.length!==1?'s':''}</div>
          </div>
        </div>
        <div class="recurring-footer-right">
          <div class="recurring-footer-total-label">Total Monthly Spend</div>
          <div class="recurring-footer-total-value">${formatCurrency(monthlyTotal)}</div>
        </div>
      </div>` : ''}
    </div>

    <!-- Add/Edit Modal -->
    ${recurringModalHTML()}
  `;

  window.openAddRecurring    = openAddRecurring;
  window.openEditRecurring   = openEditRecurring;
  window.togglePauseRecurring= togglePauseRecurring;
  window.deleteRecurringItem = deleteRecurringItem;
  window.closeRecurringModal = closeRecurringModal;
  window.saveRecurring       = saveRecurring;
  window.toggleRecurringMenu = toggleRecurringMenu;
};

// ── Recurring row ─────────────────────────────────────────────
const recurringRow = (r) => {
  const today   = new Date().toISOString().split('T')[0];
  const daysUntil = Math.ceil((new Date(r.next_due) - new Date(today)) / (1000*60*60*24));
  const dueClass  = daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'soon' : '';

  return `
  <div class="recurring-row ${r.status}" data-id="${r.id}">
    <!-- Item -->
    <div class="recurring-item">
      <div class="recurring-item-icon" style="background:${r.icon_color}20;">
        <span style="font-size:1.25rem;">${getCatEmoji(r.category)}</span>
      </div>
      <div class="recurring-item-info">
        <div class="recurring-item-name">${r.name}</div>
        <div class="recurring-item-sub">${r.category}</div>
      </div>
    </div>
    <!-- Cycle -->
    <div>
      <span class="cycle-pill ${r.cycle.toLowerCase()}">${r.cycle}</span>
    </div>
    <!-- Next due -->
    <div class="recurring-due ${dueClass}">
      <span class="recurring-due-icon">📅</span>
      ${formatDate(r.next_due, {day:'numeric',month:'short',year:'numeric'})}
    </div>
    <!-- Status -->
    <div class="recurring-status ${r.status}">
      <span class="status-dot ${r.status}"></span>
      ${r.status === 'active' ? 'Active' : 'Paused'}
    </div>
    <!-- Amount -->
    <div class="recurring-amount">
      <span class="recurring-amount-value">${formatCurrency(r.amount)}</span>
      <span class="recurring-amount-cycle">per ${r.cycle === 'Yearly' ? 'year' : r.cycle === 'Weekly' ? 'week' : 'month'}</span>
    </div>
    <!-- Actions -->
    <div class="recurring-actions" style="position:relative;">
      <button class="recurring-menu-btn" onclick="toggleRecurringMenu('${r.id}')">⋯</button>
      <div class="recurring-dropdown" id="menu_${r.id}" style="display:none;">
        <button class="recurring-dropdown-item" onclick="openEditRecurring('${r.id}')">✏️ Edit</button>
        <button class="recurring-dropdown-item" onclick="togglePauseRecurring('${r.id}')">
          ${r.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
        </button>
        <div class="recurring-dropdown-divider"></div>
        <button class="recurring-dropdown-item danger" onclick="deleteRecurringItem('${r.id}')">🗑️ Delete</button>
      </div>
    </div>
  </div>`;
};

// ── Modal HTML ────────────────────────────────────────────────
const recurringModalHTML = () => `
  <div class="modal-overlay" id="recurringModalOverlay" onclick="handleRecurringOverlay(event)">
    <div class="modal">
      <div class="modal-header">
        <h3 id="recurringModalTitle">Add Recurring</h3>
        <button class="modal-close" onclick="closeRecurringModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="recurring-form-grid">
          <div class="form-group full">
            <label class="form-label">Name *</label>
            <input class="form-input" id="recName" type="text" placeholder="e.g. Netflix Premium" />
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹) *</label>
            <input class="form-input" id="recAmount" type="number" min="0" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Cycle *</label>
            <select class="form-select" id="recCycle">
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-select" id="recCategory">
              ${Object.keys(CATEGORIES).map(c =>
                `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Next Due Date *</label>
            <input class="form-input" id="recNextDue" type="date" />
          </div>
          <div class="form-group full">
            <label class="form-label">Icon Color</label>
            <div class="icon-color-picker" id="iconColorPicker">
              ${['#EF4444','#22C55E','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#C85A2A','#6B7280'].map(c =>
                `<div class="icon-color-swatch ${c==='#C85A2A'?'selected':''}"
                      style="background:${c};"
                      onclick="selectIconColor('${c}',this)"
                      data-color="${c}"></div>`).join('')}
            </div>
            <input type="hidden" id="recIconColor" value="#C85A2A" />
          </div>
        </div>
        <div class="form-error" id="recError"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeRecurringModal()">Cancel</button>
        <button class="btn btn-primary" id="saveRecurringBtn" onclick="saveRecurring()">
          Save
        </button>
      </div>
    </div>
  </div>`;

window.handleRecurringOverlay = (e) => {
  if (e.target.id === 'recurringModalOverlay') closeRecurringModal();
};

window.selectIconColor = (color, el) => {
  document.getElementById('recIconColor').value = color;
  document.querySelectorAll('.icon-color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
};

// ── Open/close modal ──────────────────────────────────────────
const openAddRecurring = () => {
  editingRecurringId = null;
  document.getElementById('recurringModalTitle').textContent = 'Add Recurring';
  clearRecurringForm();
  document.getElementById('recurringModalOverlay').classList.add('active');
};

const openEditRecurring = (id) => {
  const item = store.recurring.find(r => r.id === id);
  if (!item) return;
  editingRecurringId = id;
  closeAllMenus();
  document.getElementById('recurringModalTitle').textContent = 'Edit Recurring';
  document.getElementById('recName').value      = item.name;
  document.getElementById('recAmount').value    = item.amount;
  document.getElementById('recCycle').value     = item.cycle;
  document.getElementById('recCategory').value  = item.category;
  document.getElementById('recNextDue').value   = item.next_due;
  document.getElementById('recIconColor').value = item.icon_color;
  document.querySelectorAll('.icon-color-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === item.icon_color);
  });
  document.getElementById('recurringModalOverlay').classList.add('active');
};

const closeRecurringModal = () => {
  document.getElementById('recurringModalOverlay')?.classList.remove('active');
  editingRecurringId = null;
  clearRecurringForm();
};

const clearRecurringForm = () => {
  ['recName','recAmount','recNextDue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('recCycle').value    = 'Monthly';
  document.getElementById('recCategory').value = 'Entertainment';
  document.getElementById('recError').textContent = '';
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  document.getElementById('recNextDue').value = next.toISOString().split('T')[0];
};

// ── Save ──────────────────────────────────────────────────────
const saveRecurring = async () => {
  const name      = document.getElementById('recName').value.trim();
  const amount    = parseFloat(document.getElementById('recAmount').value);
  const cycle     = document.getElementById('recCycle').value;
  const category  = document.getElementById('recCategory').value;
  const next_due  = document.getElementById('recNextDue').value;
  const icon_color= document.getElementById('recIconColor').value;
  const errEl     = document.getElementById('recError');
  const btn       = document.getElementById('saveRecurringBtn');

  errEl.textContent = '';
  if (!name)              return (errEl.textContent = 'Please enter a name.');
  if (!amount||amount<=0) return (errEl.textContent = 'Please enter a valid amount.');
  if (!next_due)          return (errEl.textContent = 'Please select a next due date.');

  btn.disabled = true;
  btn.textContent = 'Saving...';

  const data = { name, amount, cycle, category, next_due, icon_color,
    household_id: store.household?.id, status: 'active' };

  try {
    if (editingRecurringId) {
      const updated = await updateRecurring(editingRecurringId, data);
      const idx = store.recurring.findIndex(r => r.id === editingRecurringId);
      if (idx !== -1) store.recurring[idx] = updated;
    } else {
      const saved = await insertRecurring(data);
      store.recurring.push(saved);
    }
    closeRecurringModal();
    showToast(editingRecurringId ? 'Updated!' : 'Added!', 'success');
    renderRecurring();
  } catch (err) {
    errEl.textContent = 'Failed to save. Please try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
};

// ── Pause/resume ──────────────────────────────────────────────
const togglePauseRecurring = async (id) => {
  closeAllMenus();
  const item = store.recurring.find(r => r.id === id);
  if (!item) return;
  const newStatus = item.status === 'active' ? 'paused' : 'active';
  try {
    await updateRecurring(id, { status: newStatus });
    item.status = newStatus;
    showToast(newStatus === 'paused' ? 'Subscription paused' : 'Subscription resumed', 'success');
    renderRecurring();
  } catch {
    showToast('Failed. Please try again.', 'error');
  }
};

// ── Delete ────────────────────────────────────────────────────
const deleteRecurringItem = async (id) => {
  closeAllMenus();
  if (!confirm('Delete this recurring item?')) return;
  try {
    await deleteRecurring(id);
    store.recurring = store.recurring.filter(r => r.id !== id);
    showToast('Deleted!', 'success');
    renderRecurring();
  } catch {
    showToast('Delete failed.', 'error');
  }
};

// ── 3-dot menu toggle ─────────────────────────────────────────
const toggleRecurringMenu = (id) => {
  const menu = document.getElementById(`menu_${id}`);
  const isOpen = menu?.style.display !== 'none';
  closeAllMenus();
  if (menu && !isOpen) menu.style.display = 'block';
};

const closeAllMenus = () => {
  document.querySelectorAll('.recurring-dropdown').forEach(m => m.style.display = 'none');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.recurring-actions')) closeAllMenus();
});

// ── Helper ────────────────────────────────────────────────────
const getCatEmoji = (cat) => {
  const map = {
    Food:'🍽️', Transport:'🚗', Health:'💊', Utilities:'💡',
    Entertainment:'🎬', Shopping:'🛍️', Education:'📚', Travel:'✈️', Other:'📦'
  };
  return map[cat] || '📦';
};