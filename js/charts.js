// ============================================================
// BudgetWise — js/charts.js
// Chart.js wrappers: bar, donut, line, horizontal bar
// ============================================================

import { CATEGORIES, formatCurrency } from './utils.js';

// ── Chart registry (for destroy/recreate) ─────────────────────
const charts = {};

const destroyChart = (key) => {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
};

// ── Chart.js global defaults ──────────────────────────────────
export const initChartDefaults = () => {
  if (!window.Chart) return;
  Chart.defaults.font.family     = "'DM Sans', sans-serif";
  Chart.defaults.font.size       = 12;
  Chart.defaults.color           = '#7A6A5E';
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = '#2C2420';
  Chart.defaults.plugins.tooltip.titleColor       = '#FBF8F4';
  Chart.defaults.plugins.tooltip.bodyColor        = '#B09A8A';
  Chart.defaults.plugins.tooltip.padding          = 10;
  Chart.defaults.plugins.tooltip.cornerRadius     = 8;
  Chart.defaults.plugins.tooltip.callbacks = {
    ...Chart.defaults.plugins.tooltip.callbacks,
  };
};

// ── Daily Spending Bar Chart (Dashboard) ──────────────────────
export const renderDailyChart = (canvasId, dailyData) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  destroyChart(canvasId);

  const labels = Object.keys(dailyData).sort();
  const values = labels.map(d => dailyData[d]);
  const avg    = values.length ? values.reduce((a,b) => a+b, 0) / values.length : 0;

  // Format labels as "Mon\nMay 12"
  const formattedLabels = labels.map(d => {
    const date = new Date(d + 'T00:00:00');
    return [
      date.toLocaleDateString('en-IN', { weekday: 'short' }),
      date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    ];
  });

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: formattedLabels,
      datasets: [
        {
          label:           'Daily Spend',
          data:            values,
          backgroundColor: '#C85A2A',
          borderRadius:    6,
          borderSkipped:   false,
          hoverBackgroundColor: '#A84820',
        },
        {
          // Dashed average line
          label:       'Average',
          data:        labels.map(() => avg),
          type:        'line',
          borderColor: '#C85A2A',
          borderWidth: 1.5,
          borderDash:  [6, 4],
          pointRadius: 0,
          tension:     0,
          fill:        false,
        }
      ]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.label === 'Average'
              ? `Avg: ${formatCurrency(ctx.raw)}`
              : `Spent: ${formatCurrency(ctx.raw)}`,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 0 },
        },
        y: {
          grid: { color: 'rgba(232,224,213,0.5)', drawBorder: false },
          ticks: {
            callback: (v) => formatCurrency(v, true),
            font: { size: 11 },
          },
          beginAtZero: true,
        }
      }
    }
  });
};

// ── Category Donut Chart (Dashboard + Analytics) ──────────────
export const renderDonutChart = (canvasId, categoryTotals) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  destroyChart(canvasId);

  const entries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const total  = entries.reduce((s, [,v]) => s + v, 0);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([,v]) => v);
  const colors = labels.map(l => CATEGORIES[l]?.color || '#6B7280');

  charts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: colors,
        borderWidth:     2,
        borderColor:     getComputedStyle(document.documentElement)
                           .getPropertyValue('--color-surface') || '#fff',
        hoverOffset:     6,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      // Center text plugin
      id: 'centerText',
      beforeDraw(chart) {
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const cx = left + width  / 2;
        const cy = top  + height / 2;
        // Total amount
        ctx.fillStyle = '#2C2420';
        ctx.font      = `700 18px 'DM Serif Display', serif`;
        ctx.fillText(formatCurrency(total, true), cx, cy - 8);
        // Label
        ctx.fillStyle = '#7A6A5E';
        ctx.font      = `500 11px 'DM Sans', sans-serif`;
        ctx.fillText('Total Spend', cx, cy + 12);
        ctx.restore();
      }
    }]
  });

  return { labels, values, colors, total };
};

// ── Monthly Trend Line Chart (Analytics) ─────────────────────
export const renderTrendChart = (canvasId, monthlyData) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  destroyChart(canvasId);

  const labels = Object.keys(monthlyData).sort();
  const values = labels.map(m => monthlyData[m]);

  charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label:           'Monthly Spend',
        data:            values,
        borderColor:     '#C85A2A',
        borderWidth:     2.5,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(200,90,42,0.25)');
          gradient.addColorStop(1, 'rgba(200,90,42,0)');
          return gradient;
        },
        fill:        true,
        tension:     0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#C85A2A',
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Spent: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: 'rgba(232,224,213,0.5)', drawBorder: false },
          ticks: { callback: (v) => formatCurrency(v, true), font: { size: 11 } },
          beginAtZero: true,
        }
      }
    }
  });
};

// ── Category Horizontal Bar Chart (Analytics) ─────────────────
export const renderCategoryBarChart = (canvasId, categoryTotals) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  destroyChart(canvasId);

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const labels  = entries.map(([k]) => k);
  const values  = entries.map(([,v]) => v);
  const colors  = labels.map(l => CATEGORIES[l]?.color || '#6B7280');

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: colors,
        borderRadius:    4,
        borderSkipped:   false,
      }]
    },
    options: {
      indexAxis:           'y',
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw)}` }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(232,224,213,0.5)', drawBorder: false },
          ticks: { callback: (v) => formatCurrency(v, true), font: { size: 11 } },
          beginAtZero: true,
        },
        y: { grid: { display: false }, ticks: { font: { size: 12 } } }
      }
    }
  });
};

// ── Top Spending Days Bar Chart (Analytics) ───────────────────
export const renderTopDaysChart = (canvasId, dailyTotals) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  destroyChart(canvasId);

  const sorted = Object.entries(dailyTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const labels = sorted.map(([d]) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  });
  const values = sorted.map(([,v]) => v);
  const max    = Math.max(...values);

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: values.map(v => v === max ? '#C85A2A' : 'rgba(200,90,42,0.35)'),
        borderRadius:    4,
        borderSkipped:   false,
      }]
    },
    options: {
      indexAxis:           'y',
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw)}` }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(232,224,213,0.5)', drawBorder: false },
          ticks: { callback: (v) => formatCurrency(v, true), font: { size: 11 } },
          beginAtZero: true,
        },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
};

// ── Export chart as image (for PDF) ──────────────────────────
export const chartToImage = (canvasId) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  return canvas.toDataURL('image/png', 1.0);
};

// ── Destroy all charts (cleanup) ─────────────────────────────
export const destroyAllCharts = () => {
  Object.keys(charts).forEach(destroyChart);
};