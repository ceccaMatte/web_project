# FLUSSO RIMOZIONE INGREDIENTE

## Principio Fondamentale: Single Source of Truth (SSOT)

Lo **STATO** è l'unica fonte di verità.  
La **UI** NON decide mai, riflette SEMPRE lo stato.

---

## Architettura

```
STATE (orderForm.state.js)
   ↓
   → selectedIngredients: Array<{id, name, category}>
   ↓
RENDER (orderForm.render.js)
   ↓
   ├─→ "Your Selection" component
   └─→ "Add Ingredients" component
```

**Entrambe le viste** leggono dallo **stesso stato**.  
**Nessuna sincronizzazione manuale** è necessaria.

---

## Flusso Completo: Click su "−" in "Your Selection"

### 1. **Evento UI** (selectedIngredientsSummary.component.js)

```javascript
// Utente clicca pulsante "−"
<button data-action="remove-ingredient" data-ingredient-id="42">
  <span>remove</span>
</button>

// Event delegation intercetta click
listen(container, 'click', (e) => {
  const button = e.target.closest('[data-action="remove-ingredient"]');
  if (button) {
    const ingredientId = parseInt(button.dataset.ingredientId);
    onRemove(ingredientId); // ← Chiama callback
  }
});
```

**Ruolo**: Intercettare evento, estrarre ID, delegare logica.  
**NON fa**: Modificare DOM, leggere stato, decidere cosa mostrare.

---

### 2. **Action Handler** (orderForm.actions.js)

```javascript
export function deselectIngredient(ingredientId) {
  // Step 1: Aggiorna STATO (unica fonte di verità)
  removeIngredient(ingredientId);
  
  // Step 2: Re-renderizza TUTTO
  renderOrderFormPage();
}
```

**Ruolo**: Coordinare modifica stato + render.  
**NON fa**: Manipolare DOM direttamente.

---

### 3. **State Mutation** (orderForm.state.js)

```javascript
export function removeIngredient(ingredientId) {
  // SSOT: Rimuovi dall'array
  orderFormState.order.selectedIngredients = 
    orderFormState.order.selectedIngredients.filter(i => i.id !== ingredientId);
}
```

**Ruolo**: Modificare stato centralizzato.  
**NON fa**: Renderizzare, chiamare componenti, manipolare DOM.

---

### 4. **Orchestrator** (orderForm.render.js)

```javascript
export function renderOrderFormPage() {
  // Re-renderizza "Your Selection"
  renderSummaryComponent();
  
  // Re-renderizza "Add Ingredients"
  renderIngredientsComponent();
  
  // Entrambi leggono dallo STESSO stato aggiornato
}
```

**Ruolo**: Orchestrare render di tutti i componenti.  
**NON fa**: Decidere logica business, modificare stato.

---

### 5a. **Render Summary** (selectedIngredientsSummary.component.js)

```javascript
export function renderSelectedIngredientsSummary(container, props) {
  const { selectedIngredients } = props; // ← Dallo STATO
  
  // Se array vuoto → mostra "No ingredients"
  if (selectedIngredients.length === 0) {
    // ...
  }
  
  // Altrimenti renderizza lista
  selectedIngredients.forEach(ing => {
    // ... genera HTML per ingrediente
  });
}
```

**Effetto**: Ingrediente rimosso **NON appare più** perché non è più nello stato.

---

### 5b. **Render Ingredients** (ingredientSection.component.js)

```javascript
function renderIngredientsComponent() {
  // Deriva IDs selezionati DALLO STATO
  const selectedIds = orderFormState.order.selectedIngredients.map(i => i.id);
  
  renderIngredientSections(container, {
    selectedIngredientIds: selectedIds // ← Passa allo stato
  });
}

// Nel componente:
items.map(item => {
  const selected = selectedIds.has(item.id); // ← Confronta con stato
  return renderIngredientItem({ ...item, selected });
});
```

**Effetto**: Checkbox dell'ingrediente rimosso diventa **unchecked** perché il suo ID non è più in `selectedIds`.

---

## Risultato Finale

1. ✅ Ingrediente **sparisce** da "Your Selection"
2. ✅ Checkbox diventa **unchecked** in "Add Ingredients"
3. ✅ Nessuna sincronizzazione manuale
4. ✅ Nessuna manipolazione diretta DOM
5. ✅ Stato e UI sempre coerenti

---

## Anti-Pattern Vietati ❌

```javascript
// ❌ NON FARE: Rimuovere elemento dal DOM
button.addEventListener('click', () => {
  button.parentElement.remove(); // SBAGLIATO!
});

// ❌ NON FARE: Modificare checkbox direttamente
button.addEventListener('click', () => {
  document.querySelector(`#ingredient-${id}`).checked = false; // SBAGLIATO!
});

// ❌ NON FARE: Leggere stato dalla UI
function isSelected(id) {
  return document.querySelector(`#ingredient-${id}`).checked; // SBAGLIATO!
}
```

**Perché sono vietati?**  
Creano **doppia fonte di verità** (stato + DOM).  
Porta a **inconsistenze** e **bug difficili da debuggare**.

---

## Pattern Corretto ✅

```javascript
// ✅ GIUSTO: Aggiorna stato
removeIngredient(id);

// ✅ GIUSTO: Ri-renderizza tutto
renderOrderFormPage();

// ✅ GIUSTO: Leggi sempre dallo stato
const isSelected = orderFormState.order.selectedIngredients.some(i => i.id === id);
```

**Perché funziona?**  
- **Un'unica fonte di verità** (lo stato)
- **UI derivata deterministicamente** dallo stato
- **Impossibile** avere inconsistenze

---

## Debugging

Se un ingrediente non viene rimosso correttamente:

1. **Verifica stato**: `console.log(orderFormState.order.selectedIngredients)`
2. **Verifica render**: Componenti ricevono props aggiornati?
3. **Verifica callback**: `onRemove` è collegato correttamente?

**Mai** guardare il DOM per capire lo stato.  
**Sempre** guardare `orderFormState`.

---

## Accessibilità

```html
<button 
  data-action="remove-ingredient"
  data-ingredient-id="42"
  aria-label="Rimuovi Mozzarella"
>
  <span class="material-symbols-outlined">remove</span>
</button>
```

- `aria-label` descrittivo
- Focus gestito dal browser
- Aggiornamenti UI non cambiano focus
- Screen reader annuncia rimozione

---

## Casi Particolari

### Rimozione ultimo ingrediente di categoria

```javascript
// Lo stato aggiorna automaticamente
selectedIngredients = [
  { id: 1, category: 'bread' },
  { id: 5, category: 'cheese' }
]

// Rimuovi id=5 (unico cheese)
removeIngredient(5);

// Risultato:
selectedIngredients = [
  { id: 1, category: 'bread' }
]

// Render automatico:
// - "Cheese" section in "Your Selection" sparisce
// - Tutti checkbox "Cheese" in dropdown diventano unchecked
```

### Rimozione bread

```javascript
// Bread è obbligatorio per validazione
selectedIngredients = [
  { id: 1, category: 'bread' },
  { id: 3, category: 'meat' }
]

removeIngredient(1); // Rimuovi bread

// isOrderValid() ritorna false
// Submit button diventa disabled (tramite render)
```

---

## Test Manuale

1. Crea ordine con 3-4 ingredienti
2. Click "−" su un ingrediente in "Your Selection"
3. ✅ Ingrediente sparisce da summary
4. ✅ Checkbox unchecked in dropdown
5. Click stesso ingrediente in dropdown
6. ✅ Riappare in summary
7. ✅ Checkbox checked

**Tutto deve funzionare senza bug di sincronizzazione.**
