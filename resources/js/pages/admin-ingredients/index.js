const categories = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

const categoryMeta = {
    bread: { label: 'Bread', icon: 'bakery_dining' },
    meat: { label: 'Meat', icon: 'lunch_dining' },
    cheese: { label: 'Cheese', icon: 'egg_alt' },
    vegetable: { label: 'Vegetables', icon: 'psychiatry' },
    sauce: { label: 'Sauces', icon: 'water_drop' },
    other: { label: 'Other', icon: 'category' },
};

const state = {
    ingredients: [],
    selectedDate: null,
    workingDay: null,
    selectedCategory: 'bread',
    selectedIngredientId: null,
};

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

function categoryLabel(category) {
    return categoryMeta[category]?.label || category;
}

function categoryIcon(category) {
    return categoryMeta[category]?.icon || 'category';
}

function setMessage(message, isError = false) {
    const el = document.querySelector('[data-ingredients-message]');
    if (!el) return;
    el.textContent = message;
    el.className = `text-xs min-h-5 ${isError ? 'text-rose-400' : 'text-slate-500'}`;
}

function selectedIngredient() {
    return state.ingredients.find(ingredient => Number(ingredient.id) === Number(state.selectedIngredientId)) || null;
}

function countByCategory(category) {
    return state.ingredients.filter(ingredient => ingredient.category === category).length;
}

function updateSelectedDayLabel() {
    const label = document.querySelector('[data-selected-day-label]');
    if (!label) return;

    label.textContent = state.workingDay
        ? `${state.workingDay.date} - ${state.workingDay.location}`
        : 'No service configured for this date';
}

function renderCategoryOptions() {
    const container = document.querySelector('[data-category-options]');
    if (!container) return;

    container.innerHTML = categories.map(category => `
        <button
            type="button"
            data-action="select-category-option"
            data-category="${category}"
            class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5 flex items-center justify-between gap-3 ${category === state.selectedCategory ? 'bg-primary/15 text-white' : ''}"
        >
            <span class="flex min-w-0 items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[20px]">${categoryIcon(category)}</span>
                <span class="truncate">${categoryLabel(category)}</span>
            </span>
            <span class="text-[11px] font-bold text-slate-500">${countByCategory(category)}</span>
        </button>
    `).join('');
}

function setCategory(category, syncForm = true) {
    if (!categories.includes(category)) return;

    state.selectedCategory = category;

    if (syncForm) {
        const hidden = document.querySelector('[data-ingredient-category]');
        const label = document.querySelector('[data-selected-category-label]');
        const icon = document.querySelector('[data-selected-category-icon]');

        if (hidden) hidden.value = category;
        if (label) label.textContent = categoryLabel(category);
        if (icon) icon.textContent = categoryIcon(category);
    }

    renderCategoryTabs();
    renderCategoryOptions();
}

function closeCategoryDropdown() {
    document.querySelector('[data-category-menu]')?.classList.add('hidden');
}

function toggleCategoryDropdown() {
    document.querySelector('[data-category-menu]')?.classList.toggle('hidden');
}

function renderCategoryTabs() {
    const container = document.querySelector('[data-category-tabs]');
    if (!container) return;

    container.innerHTML = categories.map(category => {
        const active = category === state.selectedCategory;
        return `
            <button
                type="button"
                data-action="select-category-tab"
                data-category="${category}"
                class="min-h-20 rounded-xl border px-3 py-3 text-left transition ${active ? 'border-primary/60 bg-primary/15 text-white' : 'border-border-dark bg-input-bg/60 text-slate-300 hover:border-slate-600'}"
            >
                <span class="flex items-center justify-between gap-2">
                    <span class="material-symbols-outlined text-[22px] ${active ? 'text-primary' : 'text-slate-500'}">${categoryIcon(category)}</span>
                    <span class="text-lg font-black">${countByCategory(category)}</span>
                </span>
                <span class="mt-2 block text-xs font-bold uppercase tracking-widest">${categoryLabel(category)}</span>
            </button>
        `;
    }).join('');
}

function availabilitySwitch(ingredient) {
    const checked = Boolean(ingredient.daily_available);
    const disabled = !state.workingDay;

    return `
        <button
            type="button"
            role="switch"
            aria-checked="${checked ? 'true' : 'false'}"
            data-action="toggle-daily-availability"
            data-ingredient-id="${ingredient.id}"
            data-current="${checked ? '1' : '0'}"
            ${disabled ? 'disabled' : ''}
            class="relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-700'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary/30'}"
        >
            <span class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}"></span>
        </button>
    `;
}

function renderIngredientCard(ingredient) {
    const isSelected = Number(ingredient.id) === Number(state.selectedIngredientId);
    const availabilityText = ingredient.daily_available ? 'Available' : 'Unavailable';
    const availabilityClass = ingredient.daily_available ? 'text-emerald-300' : 'text-rose-300';

    return `
        <article class="rounded-xl border overflow-hidden transition ${isSelected ? 'border-primary/70 bg-primary/10' : 'border-border-dark bg-input-bg/60 hover:border-slate-600'}">
            <button type="button" data-action="select-ingredient" data-ingredient-id="${ingredient.id}" class="w-full min-h-24 p-3 text-left">
                <span class="flex items-start justify-between gap-3">
                    <span class="min-w-0">
                        <span class="block truncate text-sm font-bold text-white">${escapeHtml(ingredient.name)}</span>
                        <span class="mt-1 block truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500">${escapeHtml(ingredient.code)}</span>
                    </span>
                    <span class="material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-slate-600'}">edit</span>
                </span>
            </button>
            <div class="border-t border-border-dark px-3 py-2 flex items-center justify-between gap-3">
                <span class="text-xs font-semibold ${availabilityClass}">${availabilityText}</span>
                ${availabilitySwitch(ingredient)}
            </div>
        </article>
    `;
}

function renderIngredients() {
    const container = document.querySelector('[data-ingredients-list]');
    if (!container) return;

    if (state.ingredients.length === 0) {
        container.innerHTML = `
            <section class="bg-card-dark border border-border-dark rounded-2xl p-6 text-sm text-slate-500">
                No ingredients found for the catalog.
            </section>
        `;
        return;
    }

    container.innerHTML = categories.map(category => {
        const ingredients = state.ingredients.filter(ingredient => ingredient.category === category);
        return `
            <section data-category-section="${category}" class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
                <div class="px-4 py-3 border-b border-border-dark flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">
                        <span class="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <span class="material-symbols-outlined text-[20px]">${categoryIcon(category)}</span>
                        </span>
                        <div class="min-w-0">
                            <h3 class="truncate text-sm font-bold text-white">${categoryLabel(category)}</h3>
                            <p class="text-xs text-slate-500">${ingredients.length} ingredients</p>
                        </div>
                    </div>
                    <button type="button" data-action="prepare-category-create" data-category="${category}" class="rounded-lg border border-border-dark bg-surface-dark px-3 py-2 text-slate-300 hover:text-white" aria-label="Create in ${categoryLabel(category)}">
                        <span class="material-symbols-outlined text-[19px]">add</span>
                    </button>
                </div>
                <div class="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    ${ingredients.length
                        ? ingredients.map(renderIngredientCard).join('')
                        : '<div class="rounded-xl border border-dashed border-border-dark p-4 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">No ingredients in this category.</div>'
                    }
                </div>
            </section>
        `;
    }).join('');
}

function updateFormMode() {
    const ingredient = selectedIngredient();
    const title = document.querySelector('[data-form-title]');
    const hint = document.querySelector('[data-form-hint]');
    const submit = document.querySelector('[data-action="submit-ingredient"]');
    const deleteButton = document.querySelector('[data-action="delete-ingredient"]');

    if (title) title.textContent = ingredient ? 'Edit ingredient' : 'New ingredient';
    if (hint) {
        hint.textContent = ingredient
            ? 'Editing the selected ingredient for this service day.'
            : 'Create an ingredient for the selected service day.';
    }
    if (submit) submit.textContent = ingredient ? 'Modify' : 'Create';
    if (deleteButton) deleteButton.classList.toggle('hidden', !ingredient);
}

function fillForm(ingredient = null) {
    document.querySelector('[data-ingredient-id]').value = ingredient?.id || '';
    document.querySelector('[data-ingredient-name]').value = ingredient?.name || '';
    document.querySelector('[data-ingredient-code]').value = ingredient?.code || '';

    setCategory(ingredient?.category || state.selectedCategory || 'bread');
    updateFormMode();
}

function resetForm(category = state.selectedCategory || 'bread') {
    state.selectedIngredientId = null;
    setCategory(category);
    fillForm(null);
    setMessage('');
    renderIngredients();
}

function readFormPayload() {
    return {
        name: document.querySelector('[data-ingredient-name]')?.value.trim() || '',
        code: document.querySelector('[data-ingredient-code]')?.value.trim() || '',
        category: document.querySelector('[data-ingredient-category]')?.value || state.selectedCategory,
    };
}

function validateForm(payload) {
    if (!state.workingDay?.id) {
        throw new Error('Choose a configured service day before saving.');
    }
    if (!payload.name || !payload.code) {
        throw new Error('Name and code are required.');
    }
}

async function load(date = null) {
    const url = date ? `/api/admin/ingredients?date=${encodeURIComponent(date)}` : '/api/admin/ingredients';
    const data = await requestJson(url, { method: 'GET' });

    state.ingredients = data.ingredients || [];
    state.selectedDate = data.selected_date;
    state.workingDay = data.working_day || null;

    const dateInput = document.querySelector('[data-ingredient-date]');
    if (dateInput && dateInput.value !== state.selectedDate) {
        dateInput.value = state.selectedDate || '';
    }

    if (state.selectedIngredientId && !selectedIngredient()) {
        state.selectedIngredientId = null;
    }

    updateSelectedDayLabel();
    renderCategoryTabs();
    renderCategoryOptions();
    updateFormMode();
    renderIngredients();
}

function selectIngredient(ingredientId) {
    const ingredient = state.ingredients.find(item => Number(item.id) === Number(ingredientId));
    if (!ingredient) return;

    state.selectedIngredientId = ingredient.id;
    state.selectedCategory = ingredient.category;
    fillForm(ingredient);
    setMessage('');
    renderIngredients();
}

async function submitIngredient() {
    const payload = readFormPayload();
    validateForm(payload);

    const ingredient = selectedIngredient();
    const dailyAvailable = ingredient ? Boolean(ingredient.daily_available) : true;
    const body = {
        ...payload,
        working_day_id: state.workingDay.id,
        daily_available: dailyAvailable,
    };

    const response = ingredient
        ? await requestJson(`/api/admin/ingredients/${ingredient.id}`, {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': csrfToken() },
            body: JSON.stringify(body),
        })
        : await requestJson('/api/admin/ingredients', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrfToken() },
            body: JSON.stringify(body),
        });

    state.selectedIngredientId = response.ingredient?.id || state.selectedIngredientId;
    state.selectedCategory = payload.category;
    await load(state.selectedDate);
    fillForm(selectedIngredient());
    setMessage(ingredient ? 'Ingredient updated.' : 'Ingredient created.');
}

async function deleteIngredient() {
    const ingredient = selectedIngredient();
    if (!ingredient) return;

    const confirmed = window.confirm(`Delete ${ingredient.name}?`);
    if (!confirmed) return;

    await requestJson(`/api/admin/ingredients/${ingredient.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrfToken() },
    });

    const category = ingredient.category;
    state.selectedIngredientId = null;
    await load(state.selectedDate);
    resetForm(category);
    setMessage('Ingredient deleted.');
}

async function toggleDailyAvailability(target) {
    const ingredientId = Number(target.dataset.ingredientId);
    const current = target.dataset.current === '1';

    if (!state.workingDay?.id) {
        setMessage('Choose a configured service day before editing availability.', true);
        return;
    }

    await requestJson(`/api/admin/ingredients/${ingredientId}/availability`, {
        method: 'PATCH',
        headers: { 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify({
            working_day_id: state.workingDay.id,
            is_available: !current,
        }),
    });

    await load(state.selectedDate);
    if (state.selectedIngredientId) fillForm(selectedIngredient());
    setMessage('Daily availability updated.');
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
    renderCategoryOptions();
    setCategory('bread');

    document.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-ingredient-form]');
        if (!form) return;

        event.preventDefault();
        try {
            await submitIngredient();
        } catch (error) {
            setMessage(error.message || 'Unable to save ingredient.', true);
        }
    });

    document.addEventListener('click', async (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        if (action === 'open-sidebar') return openSidebar();
        if (action === 'close-sidebar') return closeSidebar();

        if (action === 'toggle-category-dropdown') {
            event.preventDefault();
            return toggleCategoryDropdown();
        }

        if (action === 'select-category-option') {
            event.preventDefault();
            setCategory(target.dataset.category);
            closeCategoryDropdown();
            return;
        }

        if (action === 'select-category-tab') {
            event.preventDefault();
            setCategory(target.dataset.category);
            document.querySelector(`[data-category-section="${target.dataset.category}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        if (action === 'prepare-category-create') {
            event.preventDefault();
            resetForm(target.dataset.category);
            document.querySelector('[data-ingredient-name]')?.focus();
            return;
        }

        if (action === 'select-ingredient') {
            event.preventDefault();
            selectIngredient(target.dataset.ingredientId);
            document.querySelector('[data-ingredient-name]')?.focus();
            return;
        }

        if (action === 'toggle-daily-availability') {
            event.preventDefault();
            try {
                await toggleDailyAvailability(target);
            } catch (error) {
                setMessage(error.message || 'Unable to update availability.', true);
            }
            return;
        }

        if (action === 'reset-ingredient-form') {
            event.preventDefault();
            resetForm();
            document.querySelector('[data-ingredient-name]')?.focus();
            return;
        }

        if (action === 'delete-ingredient') {
            event.preventDefault();
            try {
                await deleteIngredient();
            } catch (error) {
                setMessage(error.message || 'Unable to delete ingredient.', true);
            }
        }
    });

    document.addEventListener('change', async (event) => {
        const dateInput = event.target.closest('[data-ingredient-date]');
        if (!dateInput) return;

        setMessage('');
        await load(dateInput.value || null);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-category-dropdown]')) closeCategoryDropdown();
    });

    await load();
}

export default { initAdminIngredientsPage };
