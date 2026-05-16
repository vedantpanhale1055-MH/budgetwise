// ============================================================
// BudgetWise — js/utils.js
// Formatters, helpers, toast, skeleton, category data
// ============================================================

// ── Currency ──────────────────────────────────────────────────
export const formatCurrency = (amount, compact = false) => {
  const num = Number(amount) || 0;
  if (compact && num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (compact && num >= 1000)   return `₹${(num / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

// ── Dates ─────────────────────────────────────────────────────
export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts
  });
};

export const formatDateShort = (dateStr) =>
  formatDate(dateStr, { day: 'numeric', month: 'short' });

export const formatTime = (isoStr) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export const getMonthYear = (dateStr) => {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export const monthLabel = (monthStr) => {
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1, 1)
    .toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export const getDaysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
};

// ── Category config ───────────────────────────────────────────
export const CATEGORIES = {
  Food:          { emoji: '🍽️', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Food'          },
  Transport:     { emoji: '🚗', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Transport'     },
  Health:        { emoji: '💊', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Health'        },
  Utilities:     { emoji: '💡', color: '#EAB308', bg: 'rgba(234,179,8,0.1)',   label: 'Utilities'     },
  Entertainment: { emoji: '🎬', color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  label: 'Entertainment' },
  Shopping:      { emoji: '🛍️', color: '#EC4899', bg: 'rgba(236,72,153,0.1)', label: 'Shopping'      },
  Education:     { emoji: '📚', color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  label: 'Education'     },
  Travel:        { emoji: '✈️', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)',  label: 'Travel'        },
  Other:         { emoji: '📦', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Other'         },
};

export const getCategoryData = (cat) =>
  CATEGORIES[cat] || CATEGORIES['Other'];

// ── Avatar helpers ────────────────────────────────────────────
export const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || 'BW').toUpperCase();
};

export const avatarHtml = (name, color = '#C85A2A', size = 32) =>
  `<div class="avatar" style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};color:#fff;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:${size * 0.375}px;font-weight:700;font-family:var(--font-body);
    flex-shrink:0;
  ">${getInitials(name)}</div>`;

// ── Toast system ──────────────────────────────────────────────
let toastTimer = null;

export const showToast = (message, type = 'info', duration = 3500) => {
  let toast = document.getElementById('bw-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bw-toast';
    toast.style.cssText = `
      position:fixed;bottom:28px;right:28px;
      padding:14px 18px;border-radius:12px;
      font-size:0.9rem;font-weight:500;
      font-family:var(--font-body);
      box-shadow:0 8px 32px rgba(44,36,32,0.2);
      z-index:99999;display:flex;align-items:center;gap:10px;
      transform:translateY(80px);opacity:0;
      transition:transform 0.3s ease,opacity 0.3s ease;
      max-width:340px;pointer-events:none;
    `;
    document.body.appendChild(toast);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const bgs   = {
    success: '#2D7A4F',
    error:   '#DC2626',
    info:    '#2C2420',
    warning: '#B45309',
  };

  toast.style.background = bgs[type] || bgs.info;
  toast.style.color = '#ffffff';
  toast.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;

  // Show
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity   = '1';
  });

  // Auto hide
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.transform = 'translateY(80px)';
    toast.style.opacity   = '0';
  }, duration);
};

// ── Skeleton helpers ──────────────────────────────────────────
export const showSkeletons = (container, count = 5, type = 'row') => {
  if (!container) return;
  container.innerHTML = Array(count).fill(0).map(() =>
    type === 'row'
      ? `<div class="skeleton-row" style="height:56px;border-radius:8px;margin-bottom:8px;background:var(--skeleton-base);animation:skeleton-shimmer 1.5s infinite;"></div>`
      : `<div class="skeleton-card" style="height:120px;border-radius:12px;margin-bottom:12px;background:var(--skeleton-base);animation:skeleton-shimmer 1.5s infinite;"></div>`
  ).join('');
};

// ── Debounce ──────────────────────────────────────────────────
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ── Clipboard ─────────────────────────────────────────────────
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success', 2000);
    return true;
  } catch {
    showToast('Failed to copy. Please copy manually.', 'error');
    return false;
  }
};

// ── Percentage ────────────────────────────────────────────────
export const pct = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

// ── Clamp ─────────────────────────────────────────────────────
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ── Generate random invite code ───────────────────────────────
export const generateInviteCode = () =>
  'BWS-' + Math.floor(1000 + Math.random() * 9000);

// ── Dark mode ─────────────────────────────────────────────────
export const initDarkMode = () => {
  const saved = localStorage.getItem('bw_dark');
  if (saved === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
    return true;
  }
  return false;
};

export const toggleDarkMode = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('bw_dark', 'false');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('bw_dark', 'true');
  }
  return !isDark;
};

// ── Empty state HTML ──────────────────────────────────────────
export const emptyState = (icon, title, desc, btnLabel = '', btnId = '') =>
  `<div class="empty-state" style="text-align:center;padding:64px 24px;">
    <div style="font-size:3rem;margin-bottom:16px;opacity:0.5;">${icon}</div>
    <h3 style="font-size:1.1rem;font-weight:700;color:var(--color-text-primary);margin-bottom:8px;">${title}</h3>
    <p style="font-size:0.875rem;color:var(--color-text-secondary);max-width:280px;margin:0 auto ${btnLabel ? '20px' : '0'};">${desc}</p>
    ${btnLabel ? `<button id="${btnId}" class="btn btn-primary btn-sm">${btnLabel}</button>` : ''}
  </div>`;

// ── Number animation (count up) ───────────────────────────────
export const animateNumber = (el, from, to, duration = 600) => {
  if (!el) return;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = formatCurrency(from + (to - from) * ease);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
};