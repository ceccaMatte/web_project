# 🚀 QUICK REFERENCE - Rimozione Ingrediente

## TL;DR

**Cosa succede quando clicchi "−":**
1. Stato aggiornato → `removeIngredient(id)`
2. UI re-renderizzata → `renderOrderFormPage()`
3. Entrambe viste sincronizzate automaticamente ✅

---

## 📝 Codice Chiave

### Rimuovi ingrediente (state.js)
```javascript
export function removeIngredient(ingredientId) {
  orderFormState.order.selectedIngredients = 
    orderFormState.order.selectedIngredients.filter(i => i.id !== ingredientId);
}
```

### Action handler (actions.js)
```javascript
export function deselectIngredient(ingredientId) {
  removeIngredient(ingredientId);    // 1. Aggiorna stato
  renderOrderFormPage();              // 2. Re-render tutto
}
```

### Render orchestrator (render.js)
```javascript
function renderSummaryComponent() {
  renderSelectedIngredientsSummary(container, {
    selectedIngredients: orderFormState.order.selectedIngredients  // ← Legge da SSOT
  }, {
    onRemove: deselectIngredient  // ← Callback
  });
}

function renderIngredientsComponent() {
  const selectedIds = orderFormState.order.selectedIngredients.map(i => i.id);
  renderIngredientSections(container, {
    selectedIngredientIds: selectedIds  // ← Sincronizza checkbox
  });
}
```

---

## 🎯 Flusso in 5 Steps

```
USER → Click "−"
  ↓
COMPONENT → onRemove(id)
  ↓
ACTION → removeIngredient(id) + renderOrderFormPage()
  ↓
STATE → selectedIngredients.filter(...)
  ↓
RENDER → Summary aggiornata + Dropdown sincronizzato
```

---

## ✅ Checklist Veloce

- [x] Click "−" rimuove da stato
- [x] Summary si aggiorna
- [x] Checkbox unchecked
- [x] No manipolazione DOM diretta
- [x] Submit button reagisce (se rimuovi bread)

---

## 🐛 Debug 1-Liner

```javascript
console.log(orderFormState.order.selectedIngredients.map(i => i.name));
```

Esegui prima e dopo click "−". Se array cambia, funziona ✅

---

## 📂 File Modificati

```
orderForm.state.js          ← Aggiunti commenti SSOT
orderForm.actions.js        ← Aggiunti commenti flusso
orderForm.render.js         ← Aggiunti commenti sync
selectedIngredientsSummary  ← Aggiunti commenti callback
ingredientSection           ← Aggiunti commenti selected
```

---

## 📚 Documentazione

- `IMPLEMENTATION_STATUS.md` → Status completo
- `FLUSSO_RIMOZIONE_INGREDIENTE.md` → Spiegazione dettagliata
- `ARCHITECTURE_DIAGRAM.txt` → Diagramma ASCII
- `__tests__/remove-ingredient.test.md` → Test case

---

## ⚠️ Cose da NON fare

```javascript
// ❌ NO
button.parentElement.remove();

// ❌ NO
checkbox.checked = false;

// ❌ NO
const selected = document.querySelector('#ing-5').checked;

// ✅ YES
removeIngredient(5);
renderOrderFormPage();
```

---

## 🎓 Principio Chiave

> **Lo STATO decide, la UI riflette.**  
> Mai il contrario.

---

## 🔗 Link Utili

- [MDN: Event Delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation)
- [Single Source of Truth](https://en.wikipedia.org/wiki/Single_source_of_truth)
- [Unidirectional Data Flow](https://redux.js.org/understanding/thinking-in-redux/glossary#unidirectional-data-flow)

---

**Versione**: 1.0  
**Data**: 2025-01-21  
**Status**: ✅ PRODUCTION READY
