const categories = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

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

async function requestJson(url, options = {}) {
    const headers = {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(url, {
        headers,
        credentials: 'same-origin',
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
}

function categoryOptions(selected) {
    return categories.map(category => `
        <option value="${category}" ${category === selected ? 'selected' : ''}>${category}</option>
    `).join('');
}

function renderWorkingDays(data) {
    const select = document.querySelector('[data-working-day-select]');
    if (!select) return;

    const current = data.working_day?.id || '';
    select.innerHTML = `
        <option value="">No working day selected</option>
        ${(data.working_days || []).map(day => `
            <option value="${day.id}" data-date="${day.date}" ${day.id === current ? 'selected' : ''}>
                ${escapeHtml(day.label)}
            </option>
        `).join('')}
    `;

    const label = document.querySelector('[data-selected-day-label]');
    if (label) {
        label.textContent = data.working_day
            ? `${data.working_day.date} - ${data.working_day.location}`
            : 'Select a configured working day to manage daily availability.';
    }
}

function renderIngredients(data) {
    const container = document.querySelector('[data-ingredients-list]');
    if (!container) return;

    const workingDayId = data.working_day?.id || null;
    const ingredients = data.ingredients || [];

    if (ingredients.length === 0) {
        container.innerHTML = '<div class="p-6 text-sm text-slate-500">No ingredients found.</div>';
        return;
    }

    container.innerHTML = ingredients.map(ingredient => `
        <article class="p-4 space-y-3" data-ingredient-row="${ingredient.id}">
            <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_150px_auto] md:items-center">
                <input data-field="name" value="${escapeHtml(ingredient.name)}" class="bg-input-bg border border-border-dark rounded-xl px-3 py-2 text-sm text-white">
                <input data-field="code" value="${escapeHtml(ingredient.code)}" class="bg-input-bg border border-border-dark rounded-xl px-3 py-2 text-sm text-white">
                <select data-field="category" class="bg-input-bg border border-border-dark rounded-xl px-3 py-2 text-sm text-white">
                    ${categoryOptions(ingredient.category)}
                </select>
                <button type="button" data-action="save-ingredient" data-ingredient-id="${ingredient.id}" class="rounded-xl border border-primary/30 text-primary px-4 py-2 text-xs font-bold uppercase tracking-widest">
                    Save
                </button>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs">
                <label class="inline-flex items-center gap-2 text-slate-300">
                    <input type="checkbox" data-field="is_available" ${ingredient.global_available ? 'checked' : ''} class="accent-primary">
                    Global available
                </label>
                ${workingDayId ? `
                    <label class="inline-flex items-center gap-2 text-slate-300">
                        <input
                            type="checkbox"
                            data-action="toggle-daily-availability"
                            data-ingredient-id="${ingredient.id}"
                            data-working-day-id="${workingDayId}"
                            ${ingredient.daily_available ? 'checked' : ''}
                            class="accent-primary"
                        >
                        Available this day
                    </label>
                    <span class="text-slate-500">
                        ${ingredient.override_available === null ? 'Using global default' : 'Daily override active'}
                    </span>
                ` : '<span class="text-slate-500">Daily availability needs a working day.</span>'}
            </div>
        </article>
    `).join('');
}

function setMessage(message, isError = false) {
    const el = document.querySelector('[data-ingredients-message]');
    if (!el) return;
    el.textContent = message;
    el.className = `mt-3 text-xs ${isError ? 'text-rose-400' : 'text-slate-500'}`;
}

function readRow(ingredientId) {
    const row = document.querySelector(`[data-ingredient-row="${ingredientId}"]`);
    return {
        name: row.querySelector('[data-field="name"]').value.trim(),
        code: row.querySelector('[data-field="code"]').value.trim(),
        category: row.querySelector('[data-field="category"]').value,
        is_available: row.querySelector('[data-field="is_available"]').checked,
    };
}

function openSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.remove('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.remove('hidden');
}

function closeSidebar() {
    document.querySelector('[data-admin-sidebar]')?.classList.add('translate-x-full');
    document.querySelector('[data-sidebar-backdrop]')?.classList.add('hidden');
}

export async function initAdminIngredientsPage() {
    let currentDate = null;

    const categorySelect = document.querySelector('[data-ingredient-category]');
    if (categorySelect) categorySelect.innerHTML = categoryOptions('other');

    async function load(date = null) {
        const url = date ? `/api/admin/ingredients?date=${date}` : '/api/admin/ingredients';
        const data = await requestJson(url, { method: 'GET' });
        currentDate = data.selected_date;
        renderWorkingDays(data);
        renderIngredients(data);
    }

    document.addEventListener('click', async (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        if (target.dataset.action === 'open-sidebar') return openSidebar();
        if (target.dataset.action === 'close-sidebar') return closeSidebar();

        if (target.dataset.action === 'create-ingredient') {
            const payload = {
                name: document.querySelector('[data-ingredient-name]').value.trim(),
                code: document.querySelector('[data-ingredient-code]').value.trim(),
                category: document.querySelector('[data-ingredient-category]').value,
                is_available: true,
            };

            try {
                await requestJson('/api/admin/ingredients', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify(payload),
                });
                document.querySelector('[data-ingredient-name]').value = '';
                document.querySelector('[data-ingredient-code]').value = '';
                setMessage('Ingredient added.');
                await load(currentDate);
            } catch (error) {
                setMessage(error.message || 'Unable to add ingredient.', true);
            }
        }

        if (target.dataset.action === 'save-ingredient') {
            const ingredientId = Number(target.dataset.ingredientId);
            try {
                await requestJson(`/api/admin/ingredients/${ingredientId}`, {
                    method: 'PATCH',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify(readRow(ingredientId)),
                });
                setMessage('Ingredient saved.');
                await load(currentDate);
            } catch (error) {
                setMessage(error.message || 'Unable to save ingredient.', true);
            }
        }
    });

    document.addEventListener('change', async (event) => {
        const select = event.target.closest('[data-working-day-select]');
        if (select) {
            const option = select.selectedOptions[0];
            await load(option?.dataset.date || null);
            return;
        }

        const dailyToggle = event.target.closest('[data-action="toggle-daily-availability"]');
        if (dailyToggle) {
            try {
                await requestJson(`/api/admin/ingredients/${dailyToggle.dataset.ingredientId}/availability`, {
                    method: 'PATCH',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify({
                        working_day_id: Number(dailyToggle.dataset.workingDayId),
                        is_available: dailyToggle.checked,
                    }),
                });
                setMessage('Daily availability updated.');
                await load(currentDate);
            } catch (error) {
                dailyToggle.checked = !dailyToggle.checked;
                setMessage(error.message || 'Unable to update availability.', true);
            }
        }
    });

    await load();
}

export default { initAdminIngredientsPage };
