// ============================================================
// BudgetWise — js/export.js
// PDF export (jsPDF + chart canvas) + CSV download
// ============================================================

import { store }                      from './store.js';
import { formatCurrency, formatDate,
         getCategoryData, getMonthYear } from './utils.js';
import { chartToImage }               from './charts.js';

// ── CSV Export ────────────────────────────────────────────────
export const exportCSV = (expenses = null) => {
  const data = expenses || store.getFilteredExpenses();
  if (!data.length) {
    import('./utils.js').then(({ showToast }) =>
      showToast('No expenses to export.', 'warning'));
    return;
  }

  const headers = ['Date', 'Description', 'Category', 'Amount (₹)', 'Added By', 'Notes'];
  const rows    = data.map(e => [
    e.date,
    `"${(e.name  || '').replace(/"/g, '""')}"`,
    e.category,
    Number(e.amount).toFixed(2),
    `"${(e.profiles?.name || '').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const month = store.filters.month || new Date().toISOString().slice(0, 7);

  a.href     = url;
  a.download = `BudgetWise-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  import('./utils.js').then(({ showToast }) =>
    showToast('CSV downloaded successfully!', 'success'));
};

// ── PDF Export ────────────────────────────────────────────────
export const exportPDF = async (expenses = null) => {
  const data = expenses || store.getFilteredExpenses();
  const { showToast } = await import('./utils.js');

  if (!data.length) {
    showToast('No expenses to export.', 'warning');
    return;
  }

  if (!window.jspdf) {
    showToast('Loading PDF library...', 'info');
    await loadJsPDF();
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();
  const ORANGE = [200, 90, 42];
  const DARK   = [44, 36, 32];
  const MID    = [122, 106, 94];
  const LIGHT  = [232, 224, 213];

  let y = 0;

  const newPage = () => {
    doc.addPage();
    y = 20;
    addHeader();
  };

  const checkPage = (needed = 20) => {
    if (y + needed > H - 20) newPage();
  };

  // ── Header bar ──────────────────────────────────────────
  const addHeader = () => {
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, W, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BudgetWise — Family Expense Report', 14, 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, W - 14, 9, { align: 'right' });
  };

  addHeader();
  y = 22;

  // ── Title ────────────────────────────────────────────────
  const month = store.filters.month || new Date().toISOString().slice(0, 7);
  doc.setTextColor(...DARK);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Report', 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID);
  doc.text(`${getMonthYear(month + '-01')}  ·  ${store.household?.name || 'Family'}`, 14, y);
  y += 12;

  // ── KPI Summary boxes ────────────────────────────────────
  const total    = data.reduce((s, e) => s + Number(e.amount), 0);
  const totalBgt = store.getTotalBudget();
  const kpis = [
    { label: 'Total Spent',    value: formatCurrency(total),   color: ORANGE },
    { label: 'Total Budget',   value: formatCurrency(totalBgt), color: DARK  },
    { label: 'Remaining',      value: formatCurrency(Math.max(0, totalBgt - total)), color: [45, 122, 79] },
    { label: 'Transactions',   value: String(data.length),     color: DARK  },
  ];

  const boxW = (W - 28 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const bx = 14 + i * (boxW + 3);
    doc.setFillColor(250, 248, 244);
    doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
    doc.setDrawColor(...LIGHT);
    doc.roundedRect(bx, y, boxW, 20, 3, 3, 'S');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID);
    doc.text(kpi.label, bx + boxW / 2, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, bx + boxW / 2, y + 15, { align: 'center' });
  });
  y += 26;

  // ── Daily spending chart (if available) ──────────────────
  const chartImg = chartToImage('dailyChart');
  if (chartImg) {
    checkPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Daily Spending', 14, y);
    y += 4;
    doc.addImage(chartImg, 'PNG', 14, y, W - 28, 50);
    y += 56;
  }

  // ── Category breakdown ────────────────────────────────────
  const catTotals = {};
  data.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount); });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  if (catEntries.length) {
    checkPage(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Spending by Category', 14, y);
    y += 6;

    catEntries.forEach(([cat, amt]) => {
      checkPage(10);
      const pctVal = total > 0 ? (amt / total) * 100 : 0;
      const barW   = ((W - 28) - 60) * (pctVal / 100);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID);
      doc.text(cat, 14, y + 4);

      // Progress bar bg
      doc.setFillColor(...LIGHT);
      doc.roundedRect(50, y, (W - 28) - 60, 5, 1, 1, 'F');

      // Progress bar fill
      const catData = getCategoryData(cat);
      const rgb = hexToRgb(catData.color);
      doc.setFillColor(...rgb);
      if (barW > 0) doc.roundedRect(50, y, barW, 5, 1, 1, 'F');

      // Amount + pct
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(`${formatCurrency(amt)}  (${pctVal.toFixed(0)}%)`, W - 14, y + 4, { align: 'right' });

      y += 10;
    });
    y += 4;
  }

  // ── Expense table ─────────────────────────────────────────
  checkPage(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('All Expenses', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(...ORANGE);
  doc.rect(14, y, W - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const cols = [
    { label: 'Date',        x: 16,      w: 22 },
    { label: 'Description', x: 38,      w: 60 },
    { label: 'Category',    x: 98,      w: 30 },
    { label: 'Added By',    x: 128,     w: 35 },
    { label: 'Amount',      x: W - 28,  w: 0, align: 'right' },
  ];

  cols.forEach(col =>
    doc.text(col.label, col.x, y + 5.5, { align: col.align || 'left' })
  );
  y += 8;

  // Table rows
  data.forEach((expense, i) => {
    checkPage(8);
    if (i % 2 === 0) {
      doc.setFillColor(251, 248, 244);
      doc.rect(14, y, W - 28, 7, 'F');
    }

    doc.setTextColor(...MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(formatDate(expense.date), cols[0].x, y + 4.5);
    doc.text(
      doc.splitTextToSize(expense.name || '', cols[1].w)[0],
      cols[1].x, y + 4.5
    );
    doc.text(expense.category || '', cols[2].x, y + 4.5);
    doc.text(expense.profiles?.name || '', cols[3].x, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text(formatCurrency(expense.amount), cols[4].x, y + 4.5, { align: 'right' });

    // Bottom border
    doc.setDrawColor(...LIGHT);
    doc.line(14, y + 7, W - 14, y + 7);

    y += 7;
  });

  // Total row
  checkPage(10);
  doc.setFillColor(...ORANGE);
  doc.rect(14, y, W - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', 16, y + 5.5);
  doc.text(formatCurrency(total), W - 14, y + 5.5, { align: 'right' });
  y += 12;

  // ── Footer ────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID);
    doc.text(`BudgetWise · Page ${i} of ${pageCount}`, W / 2, H - 8, { align: 'center' });
  }

  // ── Save ──────────────────────────────────────────────────
  doc.save(`BudgetWise-${month}.pdf`);
  showToast('PDF downloaded successfully!', 'success');
};

// ── Load jsPDF dynamically ────────────────────────────────────
const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf) return resolve();
  const script  = document.createElement('script');
  script.src    = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

// ── Hex to RGB helper ─────────────────────────────────────────
const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};