# 🐛 DEBUG: Rimozione Ingrediente Non Funziona

## Problema
Click su pulsante "−" non produce effetto, nessun log in console.

## Test da Eseguire

### 1. Apri Console Browser (F12)

### 2. Verifica Stato Iniziale
```javascript
// Controlla stato
console.log('State:', orderFormState.order.selectedIngredients);

// Controlla containers
console.log('Mobile container:', orderFormView.refs.summaryContainer);
console.log('Desktop container:', orderFormView.refs.summaryContainerDesktop);
```

### 3. Verifica Event Listener
```javascript
// Controlla se i pulsanti esistono
const buttons = document.querySelectorAll('[data-action="remove-ingredient"]');
console.log('Remove buttons found:', buttons.length);
buttons.forEach((btn, i) => {
    console.log(`Button ${i}:`, btn.dataset.ingredientId);
});
```

### 4. Test Click Manuale
Clicca su un pulsante "−" e verifica log:

**Log Attesi:**
```
[SelectedIngredientsSummary] 🖱️ CLICK EVENT DETECTED on container!
[SelectedIngredientsSummary] Event target: <span class="material-symbols-outlined">
[SelectedIngredientsSummary] Closest button found: true
[SelectedIngredientsSummary] ✅ Remove button clicked!
═══════════════════════════════════════════════════════
[Actions] 🗑️ DESELECT INGREDIENT CALLED
[Actions] ingredientId: 42
═══════════════════════════════════════════════════════
```

## Possibili Cause

### ❌ Causa 1: Container Non Trovato
**Sintomo:** Nessun log tipo "RENDER START"

**Fix:** Verifica che i data attributes nel Blade siano corretti:
```blade
<div data-summary-container>
<div data-summary-container-desktop>
```

### ❌ Causa 2: Callback Non Passata
**Sintomo:** Log "onRemove callback is MISSING"

**Fix:** Verifica in `orderForm.render.js` che `deselectIngredient` sia importato:
```javascript
import { deselectIngredient } from './orderForm.actions.js';
```

### ❌ Causa 3: Event Listener Non Attaccato
**Sintomo:** Click non produce log "CLICK EVENT DETECTED"

**Fix:** Verifica che `listen` funzioni:
```javascript
// Test in console
const container = document.querySelector('[data-summary-container]');
container.addEventListener('click', (e) => console.log('Click!'));
```

### ❌ Causa 4: Event Bubbling Bloccato
**Sintomo:** Log "CLICK EVENT" ma "Closest button found: false"

**Fix:** Verifica HTML generato. Il button deve avere:
```html
<button data-action="remove-ingredient" data-ingredient-id="42">
    <span class="material-symbols-outlined">remove</span>
</button>
```

### ❌ Causa 5: Multiple Render / Listener Persi
**Sintomo:** Funziona dopo primo render, poi smette

**Fix:** Verifica cleanup listener:
```javascript
if (cleanupListener) {
    cleanupListener(); // Deve essere chiamato
    cleanupListener = null;
}
```

## Test Finale

Copia in console:
```javascript
// Test completo
window.testRemove = function() {
    console.log('=== TEST RIMOZIONE ===');
    
    // 1. Stato
    console.log('Ingredienti:', orderFormState.order.selectedIngredients.length);
    
    // 2. Container
    const container = document.querySelector('[data-summary-container]');
    console.log('Container:', !!container);
    
    // 3. Pulsanti
    const buttons = container?.querySelectorAll('[data-action="remove-ingredient"]');
    console.log('Buttons:', buttons?.length || 0);
    
    // 4. Simula click
    if (buttons && buttons.length > 0) {
        console.log('Simulando click sul primo pulsante...');
        buttons[0].click();
    } else {
        console.error('Nessun pulsante trovato!');
    }
};

testRemove();
```

## Checklist Risoluzione

- [ ] Log "RENDER START" appare in console → Container trovato ✅
- [ ] Log "Event listener ATTACHED" appare → Listener configurato ✅
- [ ] Click produce log "CLICK EVENT DETECTED" → Evento catturato ✅
- [ ] Log "Remove button clicked" appare → Button trovato ✅
- [ ] Log "DESELECT INGREDIENT CALLED" appare → Callback eseguita ✅
- [ ] Ingrediente sparisce da UI → Render funziona ✅

---

**Aggiornato:** 21 Gen 2026  
**Versione debug:** 2.0
