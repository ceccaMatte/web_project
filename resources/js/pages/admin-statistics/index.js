import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const chartInstances = new Map();
const textColor = '#cbd5e1';
const mutedColor = '#64748b';
const gridColor = 'rgba(148, 163, 184, 0.12)';
const blue = '#3b82f6';
const emerald = '#10b981';
const amber = '#f59e0b';
const rose = '#f43f5e';
const violet = '#8b5cf6';
const cyan = '#06b6d4';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function fetchStats(from, to) {
    const response = await fetch(`/api/admin/statistics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function destroyCharts() {
    chartInstances.forEach(chart => chart.destroy());
    chartInstances.clear();
}

function metric(label, value, icon, tone) {
    const toneClass = {
        blue: 'bg-primary/15 text-primary',
        emerald: 'bg-emerald/15 text-emerald',
        rose: 'bg-rose/15 text-rose',
        amber: 'bg-amber/15 text-amber',
    }[tone] || 'bg-slate-700 text-slate-300';

    return `
        <article class="bg-card-dark border border-border-dark rounded-2xl p-4 min-h-28 flex items-start justify-between gap-4">
            <div>
                <p class="text-[10px] font-bold uppercase text-slate-500">${label}</p>
                <p class="mt-3 text-3xl font-black text-white">${Number(value || 0)}</p>
            </div>
            <span class="flex size-10 items-center justify-center rounded-xl ${toneClass}">
                <span class="material-symbols-outlined text-[22px]">${icon}</span>
            </span>
        </article>
    `;
}

function chartCard(title, subtitle, canvasId, rows, formatter) {
    return `
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border-dark flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <h2 class="truncate text-sm font-bold text-white">${title}</h2>
                    <p class="mt-1 text-xs text-slate-500">${subtitle}</p>
                </div>
            </div>
            <div class="p-4">
                <div class="relative h-72">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
            <div class="border-t border-border-dark divide-y divide-border-dark">
                ${rows.length ? rows.slice(0, 6).map(row => `
                    <div class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
                        <span class="min-w-0 truncate text-slate-300">${formatter(row)}</span>
                        <span class="font-bold text-white">${Number(row.total || 0)}</span>
                    </div>
                `).join('') : '<div class="px-4 py-3 text-sm text-slate-500">No data.</div>'}
            </div>
        </section>
    `;
}

function statusLabel(status) {
    return String(status || '').replaceAll('_', ' ');
}

function slotLabel(row) {
    return `${row.start_time} - ${row.end_time}`;
}

function ingredientLabel(row) {
    return `${escapeHtml(row.name)} <span class="text-slate-500">(${escapeHtml(row.category)})</span>`;
}

function customerLabel(row) {
    return `${escapeHtml(row.nickname)} <span class="text-slate-500">${escapeHtml(row.email)}</span>`;
}

function lineChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                borderColor: '#1e2536',
                borderWidth: 1,
                titleColor: '#ffffff',
                bodyColor: textColor,
                displayColors: false,
            },
        },
        scales: {
            x: {
                ticks: { color: mutedColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                grid: { color: gridColor },
                border: { color: gridColor },
            },
            y: {
                beginAtZero: true,
                ticks: { color: mutedColor, precision: 0 },
                grid: { color: gridColor },
                border: { color: gridColor },
            },
        },
    };
}

function barChartOptions(indexAxis = 'x') {
    return {
        indexAxis,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                borderColor: '#1e2536',
                borderWidth: 1,
                titleColor: '#ffffff',
                bodyColor: textColor,
                displayColors: false,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { color: mutedColor, precision: 0 },
                grid: { color: gridColor },
                border: { color: gridColor },
            },
            y: {
                beginAtZero: true,
                ticks: { color: mutedColor, precision: 0 },
                grid: { color: indexAxis === 'y' ? gridColor : 'transparent' },
                border: { color: gridColor },
            },
        },
    };
}

function dateRangeLabels(from, to, rows) {
    if (!from || !to) return rows.map(row => row.date);

    const totals = new Map(rows.map(row => [row.date, Number(row.total || 0)]));
    const labels = [];
    const values = [];
    const current = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    let guard = 0;

    while (current <= end && guard < 370) {
        const iso = current.toISOString().slice(0, 10);
        labels.push(iso);
        values.push(totals.get(iso) || 0);
        current.setDate(current.getDate() + 1);
        guard += 1;
    }

    return labels.map((date, index) => ({ label: date.slice(5), value: values[index], rawDate: date }));
}

function makeLineChart(canvasId, points) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    chartInstances.set(canvasId, new Chart(canvas, {
        type: 'line',
        data: {
            labels: points.map(point => point.label),
            datasets: [{
                data: points.map(point => point.value),
                borderColor: blue,
                backgroundColor: 'rgba(59, 130, 246, 0.16)',
                pointBackgroundColor: '#ffffff',
                pointBorderColor: blue,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 3,
                tension: 0.35,
                fill: true,
            }],
        },
        options: lineChartOptions(),
    }));
}

function makeBarChart(canvasId, rows, labeler, color, indexAxis = 'y') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const safeRows = rows.length ? rows : [{ label: 'No data', total: 0 }];

    chartInstances.set(canvasId, new Chart(canvas, {
        type: 'bar',
        data: {
            labels: safeRows.map(row => row.label || labeler(row)),
            datasets: [{
                data: safeRows.map(row => Number(row.total || 0)),
                backgroundColor: color,
                borderColor: color,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 28,
            }],
        },
        options: barChartOptions(indexAxis),
    }));
}

function renderCharts(data) {
    destroyCharts();

    requestAnimationFrame(() => {
        makeLineChart('daily-trend-chart', dateRangeLabels(data.range?.from, data.range?.to, data.daily_trend || []));
        makeBarChart('slots-chart', data.popular_slots || [], slotLabel, blue);
        makeBarChart('ingredients-chart', data.popular_ingredients || [], row => row.name, emerald);
        makeBarChart('status-chart', data.status_distribution || [], row => statusLabel(row.status), amber);
        makeBarChart('top-customers-chart', data.top_customers || [], row => row.nickname, violet);
        makeBarChart('least-customers-chart', data.least_customers || [], row => row.nickname, cyan);
    });
}

function renderStats(data) {
    const container = document.querySelector('[data-statistics-content]');
    if (!container) return;

    const dailyRows = data.daily_trend || [];
    const dailyTotalRows = dailyRows.map(row => ({ ...row, total: row.total }));

    container.innerHTML = `
        <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${metric('Total orders', data.summary?.total_orders, 'receipt_long', 'blue')}
            ${metric('Active orders', data.summary?.active_orders, 'local_shipping', 'emerald')}
            ${metric('Rejected', data.summary?.rejected_orders, 'block', 'rose')}
            ${metric('Customers', data.summary?.unique_customers, 'groups', 'amber')}
        </section>
        <section class="grid gap-4">
            ${chartCard('Orders by day', 'Line chart for the temporal progression.', 'daily-trend-chart', dailyTotalRows, row => escapeHtml(row.date))}
        </section>
        <section class="grid lg:grid-cols-2 gap-4">
            ${chartCard('Peak time slots', 'Direct comparison by pickup slot.', 'slots-chart', data.popular_slots || [], row => escapeHtml(slotLabel(row)))}
            ${chartCard('Top ingredients', 'Most selected ingredients.', 'ingredients-chart', data.popular_ingredients || [], ingredientLabel)}
            ${chartCard('Status distribution', 'Orders grouped by status.', 'status-chart', data.status_distribution || [], row => escapeHtml(statusLabel(row.status)))}
            ${chartCard('Most frequent customers', 'Customers with more orders.', 'top-customers-chart', data.top_customers || [], customerLabel)}
            ${chartCard('Least frequent customers', 'Customers with fewer orders.', 'least-customers-chart', data.least_customers || [], customerLabel)}
        </section>
    `;

    renderCharts(data);
}

function openSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.remove('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.remove('hidden');
}

function closeSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.add('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.add('hidden');
}

export async function initAdminStatisticsPage() {
    const defaultsScript = document.querySelector('[data-statistics-defaults]');
    const defaults = defaultsScript ? JSON.parse(defaultsScript.textContent) : {};
    const fromInput = document.querySelector('[data-stats-from]');
    const toInput = document.querySelector('[data-stats-to]');
    const status = document.querySelector('[data-statistics-status]');

    fromInput.value = defaults.from || '';
    toInput.value = defaults.to || '';

    async function load() {
        status.textContent = 'Loading...';
        try {
            const data = await fetchStats(fromInput.value, toInput.value);
            renderStats(data);
            status.textContent = `${data.range.from} to ${data.range.to}`;
        } catch (error) {
            status.textContent = error.message || 'Unable to load statistics.';
        }
    }

    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        if (target.dataset.action === 'open-sidebar') return openSidebar();
        if (target.dataset.action === 'close-sidebar') return closeSidebar();
        if (target.dataset.action === 'refresh-statistics') return load();
    });

    await load();
}

export default { initAdminStatisticsPage };
