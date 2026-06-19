function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function fetchStats(from, to) {
    const response = await fetch(`/api/admin/statistics?from=${from}&to=${to}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function metric(label, value) {
    return `
        <article class="bg-card-dark border border-border-dark rounded-2xl p-4">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">${label}</p>
            <p class="mt-2 text-2xl font-black text-white">${Number(value || 0)}</p>
        </article>
    `;
}

function list(title, rows, formatter) {
    const max = Math.max(1, ...rows.map(row => Number(row.total || 0)));
    return `
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border-dark">
                <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">${title}</h2>
            </div>
            <div class="divide-y divide-border-dark">
                ${rows.length ? rows.map(row => {
                    const width = Math.max(4, Math.round((Number(row.total || 0) / max) * 100));
                    return `
                        <div class="p-4">
                            <div class="flex items-center justify-between gap-4 text-sm">
                                <span class="text-slate-200 truncate">${formatter(row)}</span>
                                <span class="text-white font-bold">${Number(row.total || 0)}</span>
                            </div>
                            <div class="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div class="h-full bg-primary" style="width:${width}%"></div>
                            </div>
                        </div>
                    `;
                }).join('') : '<div class="p-4 text-sm text-slate-500">No data.</div>'}
            </div>
        </section>
    `;
}

function renderStats(data) {
    const container = document.querySelector('[data-statistics-content]');
    if (!container) return;

    container.innerHTML = `
        <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${metric('Total orders', data.summary?.total_orders)}
            ${metric('Active orders', data.summary?.active_orders)}
            ${metric('Rejected', data.summary?.rejected_orders)}
            ${metric('Customers', data.summary?.unique_customers)}
        </section>
        <section class="grid lg:grid-cols-2 gap-4">
            ${list('Orders by day', data.daily_trend || [], row => escapeHtml(row.date))}
            ${list('Peak time slots', data.popular_slots || [], row => `${escapeHtml(row.start_time)} - ${escapeHtml(row.end_time)}`)}
            ${list('Top ingredients', data.popular_ingredients || [], row => `${escapeHtml(row.name)} <span class="text-slate-500">(${escapeHtml(row.category)})</span>`)}
            ${list('Status distribution', data.status_distribution || [], row => escapeHtml(row.status))}
            ${list('Most frequent customers', data.top_customers || [], row => `${escapeHtml(row.nickname)} <span class="text-slate-500">${escapeHtml(row.email)}</span>`)}
            ${list('Least frequent customers', data.least_customers || [], row => `${escapeHtml(row.nickname)} <span class="text-slate-500">${escapeHtml(row.email)}</span>`)}
        </section>
    `;
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
