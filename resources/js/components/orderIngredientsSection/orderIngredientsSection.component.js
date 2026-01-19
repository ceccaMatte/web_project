/**
 * ORDER INGREDIENTS SECTION COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza ingredienti raggruppati per categoria
 * - Usato sia in workOrderRecapCard che in altre viste ordine
 * - Non renderizza categorie vuote
 * 
 * PROPS:
 * - ingredients: { bread: [...], meat: [...], cheese: [...], ... }
 * - variant: 'recap' | 'card' (default: 'recap')
 * 
 * UTILIZZO:
 * buildOrderIngredientsSectionHTML(ingredients, 'recap')
 */

// Category configuration
const CATEGORY_CONFIG = {
    bread: {
        label: 'Bread',
        icon: 'bakery_dining',
        color: 'text-amber-400',
    },
    meat: {
        label: 'Meat',
        icon: 'kebab_dining',
        color: 'text-rose-400',
    },
    cheese: {
        label: 'Cheese',
        icon: 'lunch_dining',
        color: 'text-yellow-400',
    },
    vegetable: {
        label: 'Vegetables',
        icon: 'eco',
        color: 'text-emerald-400',
    },
    sauce: {
        label: 'Sauces',
        icon: 'water_drop',
        color: 'text-orange-400',
    },
    other: {
        label: 'Other',
        icon: 'category',
        color: 'text-slate-400',
    },
};

// Category order for display
const CATEGORY_ORDER = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

/**
 * Build HTML for order ingredients section
 * 
 * @param {Object} ingredients - Grouped ingredients { bread: [...], meat: [...] }
 * @param {string} variant - 'recap' or 'card'
 * @returns {string} - HTML string
 */
export function buildOrderIngredientsSectionHTML(ingredients, variant = 'recap') {
    if (!ingredients || typeof ingredients !== 'object') {
        return `
            <div class="text-center py-4">
                <p class="text-slate-500 text-sm">No ingredients</p>
            </div>
        `;
    }

    // Collect valid categories (those with items)
    const validCategories = CATEGORY_ORDER.filter(category => {
        const items = ingredients[category];
        return items && Array.isArray(items) && items.length > 0;
    });

    const sections = [];

    for (let i = 0; i < validCategories.length; i++) {
        const category = validCategories[i];
        const items = ingredients[category];
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
        const isLast = (i === validCategories.length - 1);

        if (variant === 'recap') {
            sections.push(buildRecapCategoryHTML(config, items, isLast));
        } else {
            sections.push(buildCardCategoryHTML(config, items));
        }
    }

    if (sections.length === 0) {
        return `
            <div class="text-center py-4">
                <p class="text-slate-500 text-sm">No ingredients selected</p>
            </div>
        `;
    }

    return sections.join('');
}

/**
 * Build category section for recap variant (larger, with icons)
 */
function buildRecapCategoryHTML(config, items, isLast = false) {
    const marginClass = isLast ? 'mb-0' : 'mb-3';
    const badgesHTML = items.map(item => `
        <span class="inline-block px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 whitespace-nowrap" title="${item.name}">
            ${item.code || item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}
        </span>
    `).join('');

    return `
        <div class="${marginClass}">
            <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-lg ${config.color}">${config.icon}</span>
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">${config.label}</h4>
            </div>
            <div class="overflow-x-auto whitespace-nowrap space-x-2 pb-2">
                ${badgesHTML}
            </div>
        </div>
    `;
}

/**
 * Build category section for card variant (compact, inline)
 */
function buildCardCategoryHTML(config, items) {
    const codesHTML = items.map(item => `
        <span class="inline-block px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400">
            ${item.code || item.name}
        </span>
    `).join('');

    return `
        <div class="mb-2">
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider mr-2">${config.label}:</span>
            ${codesHTML}
        </div>
    `;
}

export default { buildOrderIngredientsSectionHTML };
