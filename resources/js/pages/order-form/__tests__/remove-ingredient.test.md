# Test Manuale: Rimozione Ingrediente

## Obiettivo
Verificare che la rimozione di un ingrediente dalla sezione "Your Selection" sincronizzi correttamente entrambe le viste (summary e dropdown).

---

## Setup

1. Apri browser console (F12)
2. Naviga a `/orders/create` o `/orders/{id}/modify`
3. Abilita verbose logging:
   ```javascript
   localStorage.setItem('debug', 'true');
   ```

---

## Test Case 1: Rimozione Base

### Precondizioni
- Ordine vuoto

### Steps
1. **Seleziona** 3 ingredienti da categorie diverse:
   - 1 Bread (es. "Ciabatta")
   - 1 Protein (es. "Prosciutto")
   - 1 Cheese (es. "Mozzarella")

2. **Verifica stato iniziale** in console:
   ```javascript
   console.log(orderFormState.order.selectedIngredients);
   // Expected: Array(3) con i 3 ingredienti
   ```

3. **Verifica UI**:
   - [ ] "Your Selection" mostra 3 ingredienti
   - [ ] Ogni ingrediente ha badge categoria
   - [ ] Ogni ingrediente ha pulsante "−"
   - [ ] Dropdown "Add Ingredients" mostra checkbox checked per i 3

4. **Click "−"** su "Mozzarella"

5. **Verifica stato aggiornato**:
   ```javascript
   console.log(orderFormState.order.selectedIngredients);
   // Expected: Array(2) SENZA Mozzarella
   ```

6. **Verifica UI aggiornata**:
   - [ ] "Your Selection" mostra SOLO 2 ingredienti
   - [ ] Mozzarella NON appare più
   - [ ] Dropdown "Cheese" → Mozzarella checkbox è UNCHECKED
   - [ ] Altri 2 ingredienti ancora checked

### Expected Result
✅ Mozzarella rimossa da stato  
✅ Mozzarella sparita da summary  
✅ Checkbox Mozzarella unchecked  
✅ Altri ingredienti inalterati

---

## Test Case 2: Rimozione e Ri-selezione

### Precondizioni
- Completa Test Case 1 (2 ingredienti selezionati)

### Steps
1. **Click "−"** su "Prosciutto"

2. **Verifica stato**:
   ```javascript
   console.log(orderFormState.order.selectedIngredients.length);
   // Expected: 1 (solo Ciabatta rimasta)
   ```

3. **Verifica UI**:
   - [ ] "Your Selection" mostra SOLO 1 ingrediente (Ciabatta)
   - [ ] Dropdown "Protein" → Prosciutto checkbox UNCHECKED

4. **Ri-seleziona Prosciutto** dal dropdown

5. **Verifica stato**:
   ```javascript
   console.log(orderFormState.order.selectedIngredients.length);
   // Expected: 2 (Ciabatta + Prosciutto)
   ```

6. **Verifica UI**:
   - [ ] "Your Selection" mostra 2 ingredienti
   - [ ] Prosciutto riappare
   - [ ] Checkbox Prosciutto è CHECKED

### Expected Result
✅ Rimozione e ri-aggiunta funziona senza bug  
✅ Stato sempre sincronizzato con UI  
✅ Nessun duplicato

---

## Test Case 3: Rimozione Ultimo Ingrediente Categoria

### Preconditions
- 3 ingredienti selezionati, UNO SOLO nella categoria "Sauce"

### Steps
1. **Seleziona** 1 solo Sauce (es. "Ketchup")

2. **Verifica "Your Selection"**:
   - [ ] Header "SAUCE" presente
   - [ ] "Ketchup" listato sotto

3. **Click "−"** su "Ketchup"

4. **Verifica stato**:
   ```javascript
   const sauces = orderFormState.order.selectedIngredients.filter(i => i.category === 'sauce');
   console.log(sauces.length);
   // Expected: 0
   ```

5. **Verifica UI**:
   - [ ] Header "SAUCE" NON appare più in "Your Selection"
   - [ ] Nessun ingrediente sauce listato
   - [ ] Dropdown "Sauce" → tutti checkbox UNCHECKED

### Expected Result
✅ Categoria sparisce quando vuota  
✅ UI pulita senza header orfani  
✅ Dropdown coerente

---

## Test Case 4: Rimozione Bread (Validazione)

### Preconditions
- 1 Bread + 2 altri ingredienti selezionati

### Steps
1. **Verifica submit button**:
   - [ ] Submit button è ENABLED (ordine valido)

2. **Click "−"** su Bread

3. **Verifica stato**:
   ```javascript
   const bread = orderFormState.order.selectedIngredients.find(i => i.category === 'bread');
   console.log(bread);
   // Expected: undefined

   console.log(isOrderValid());
   // Expected: false
   ```

4. **Verifica UI**:
   - [ ] Bread sparito da "Your Selection"
   - [ ] Submit button è DISABLED
   - [ ] Tooltip/messaggio errore visibile

5. **Ri-seleziona Bread**

6. **Verifica**:
   - [ ] Submit button torna ENABLED

### Expected Result
✅ Rimozione Bread invalida ordine  
✅ Submit button reagisce automaticamente  
✅ Ri-aggiunta ripristina validità

---

## Test Case 5: Multiple Rimozioni Rapide

### Preconditions
- 5+ ingredienti selezionati

### Steps
1. **Click "−"** rapido su 3 ingredienti consecutivi

2. **Verifica console logs**:
   ```
   [State] Ingredient 5 removed. Remaining: 4
   [RenderOrderForm] SSOT check: summaryCount=4
   [State] Ingredient 7 removed. Remaining: 3
   [RenderOrderForm] SSOT check: summaryCount=3
   [State] Ingredient 2 removed. Remaining: 2
   [RenderOrderForm] SSOT check: summaryCount=2
   ```

3. **Verifica UI**:
   - [ ] Tutti e 3 ingredienti spariti
   - [ ] Tutti checkbox unchecked
   - [ ] Nessun elemento "orfano"
   - [ ] Nessun duplicato

4. **Verifica stato**:
   ```javascript
   const ids = orderFormState.order.selectedIngredients.map(i => i.id);
   const uniqueIds = [...new Set(ids)];
   console.log(ids.length === uniqueIds.length);
   // Expected: true (no duplicates)
   ```

### Expected Result
✅ Click rapidi gestiti correttamente  
✅ Nessuna race condition  
✅ Stato sempre coerente

---

## Test Case 6: Rimozione in MODIFY Mode

### Preconditions
- Ordine esistente con ingredienti
- Alcuni ingredienti non più disponibili (out of stock)

### Steps
1. **Naviga** a `/orders/{orderId}/modify`

2. **Verifica ingredienti out of stock**:
   - [ ] Ingredienti out of stock ma selezionati mostrano badge "Out of Stock"
   - [ ] Sono ancora cliccabili (per rimuoverli)

3. **Click "−"** su ingrediente out of stock

4. **Verifica**:
   - [ ] Ingrediente rimosso nonostante out of stock
   - [ ] Stato coerente

5. **Click "−"** su ingrediente disponibile

6. **Verifica**:
   - [ ] Entrambe rimozioni funzionano identicamente
   - [ ] Nessuna differenza di comportamento

### Expected Result
✅ Out of stock rimovibile in modify  
✅ Comportamento uniforme disponibile/non disponibile

---

## Test Case 7: Console Errors Check

### Durante TUTTI i test precedenti

1. **Monitora console**:
   - [ ] Nessun errore JavaScript
   - [ ] Nessun warning React/Vue
   - [ ] Nessun warning `undefined` o `null`

2. **Verifica logs attesi**:
   ```
   [Actions] Deselecting ingredient: X
   [State] Ingredient X removed. Remaining: Y
   [RenderOrderForm] SSOT check: summaryCount=Y, selectedIds=[...]
   [RenderOrderForm] Page rendered successfully
   ```

### Expected Result
✅ Zero errori  
✅ Logs consistenti  
✅ Nessun warning

---

## Regression Test: DOM Non Manipolato

### Steps
1. **Apri DevTools** → Elements tab

2. **Seleziona** elemento summary container

3. **Break on** → Subtree modifications

4. **Click "−"** su ingrediente

5. **Verifica**:
   - [ ] Breakpoint triggered
   - [ ] Callstack mostra `safeInnerHTML` o `renderSelectedIngredientsSummary`
   - [ ] NON mostra manipolazioni dirette (`.remove()`, `.innerHTML =`, etc.)

### Expected Result
✅ DOM aggiornato solo via render  
✅ Nessuna manipolazione diretta

---

## Performance Test

### Setup
```javascript
console.time('removeIngredient');
```

### Steps
1. **Seleziona** 10 ingredienti
2. **Click "−"** su uno
3. **Console**:
   ```javascript
   console.timeEnd('removeIngredient');
   // Expected: < 50ms
   ```

### Expected Result
✅ Render veloce (< 50ms)  
✅ No freeze UI  
✅ Smooth animation

---

## Accessibility Test

### Steps
1. **Keyboard only**:
   - [ ] Tab fino a pulsante "−"
   - [ ] Premi Enter
   - [ ] Ingrediente rimosso
   - [ ] Focus gestito correttamente

2. **Screen reader** (NVDA/JAWS):
   - [ ] Annuncia "Rimuovi [nome ingrediente]"
   - [ ] Annuncia rimozione completata
   - [ ] Non perde contesto

3. **Zoom 200%**:
   - [ ] Pulsante "−" ancora cliccabile
   - [ ] Nessun overlap

### Expected Result
✅ Accessibile da tastiera  
✅ Screen reader friendly  
✅ Funziona a zoom alto

---

## Bug Checklist ❌

Durante i test, verifica che NON succeda:

- [ ] ❌ Ingrediente rimane in summary dopo click
- [ ] ❌ Checkbox resta checked dopo rimozione
- [ ] ❌ Duplicati nello stato
- [ ] ❌ Header categoria orfano (senza ingredienti)
- [ ] ❌ Errori console
- [ ] ❌ Race condition su click rapidi
- [ ] ❌ Focus perso dopo rimozione
- [ ] ❌ Layout broken
- [ ] ❌ Submit button non aggiorna stato
- [ ] ❌ Ingrediente riappare dopo refresh

---

## Sign-off

**Tester**: _______________  
**Data**: _______________  
**Browser**: _______________  
**Risultato**: ☐ PASS  ☐ FAIL

**Note**:
```
(eventuali bug trovati)
```
