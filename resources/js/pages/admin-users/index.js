function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function fetchUsers() {
    const response = await fetch('/api/admin/users', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function setEnabled(userId, enabled) {
    const response = await fetch(`/api/admin/users/${userId}/enabled`, {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ enabled }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
}

function renderUsers(users) {
    const container = document.querySelector('[data-users-list]');
    const status = document.querySelector('[data-users-status]');
    if (!container) return;

    status.textContent = `${users.length} customers`;

    if (users.length === 0) {
        container.innerHTML = '<div class="p-6 text-sm text-slate-500">No customers found.</div>';
        return;
    }

    container.innerHTML = users.map(user => {
        const enabled = Boolean(user.enabled);
        return `
            <article class="p-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-white truncate">${escapeHtml(user.nickname || user.name)}</h3>
                        <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                            ${enabled ? 'Enabled' : 'Blocked'}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500 truncate">${escapeHtml(user.email)}</p>
                    <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span>${Number(user.orders_count || 0)} orders</span>
                        <span>${Number(user.picked_up_orders_count || 0)} picked up</span>
                        <span>${Number(user.rejected_orders_count || 0)} rejected</span>
                    </div>
                </div>
                <button
                    type="button"
                    data-action="toggle-user-enabled"
                    data-user-id="${user.id}"
                    data-enabled="${enabled ? 'false' : 'true'}"
                    class="rounded-xl border ${enabled ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'} px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    ${enabled ? 'Block' : 'Unblock'}
                </button>
            </article>
        `;
    }).join('');
}

function openSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.remove('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.remove('hidden');
}

function closeSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.add('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.add('hidden');
}

export async function initAdminUsersPage() {
    let users = [];

    async function load() {
        const status = document.querySelector('[data-users-status]');
        if (status) status.textContent = 'Loading...';
        const data = await fetchUsers();
        users = data.users || [];
        renderUsers(users);
    }

    document.addEventListener('click', async (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        if (target.dataset.action === 'open-sidebar') return openSidebar();
        if (target.dataset.action === 'close-sidebar') return closeSidebar();

        if (target.dataset.action === 'toggle-user-enabled') {
            target.disabled = true;
            try {
                await setEnabled(Number(target.dataset.userId), target.dataset.enabled === 'true');
                await load();
            } catch (error) {
                alert(error.message || 'Unable to update user');
            } finally {
                target.disabled = false;
            }
        }
    });

    await load();
}

export default { initAdminUsersPage };
