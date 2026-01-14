# Report Edge Cases - Modulo Ordini

**Data analisi:** 2026-01-14  
**Test eseguiti:** 23 edge cases  
**Risultato:** 23/23 passano ✅  
**Totale test progetto:** 59 (nessuna regressione)

---

## 📊 Executive Summary

L'analisi degli edge cases ha rivelato:

- **✅ 19 invarianti correttamente protette**
- **✅ 2 protezioni a livello database documentate**
- **⚠️ 1 bug critico scoperto (idempotenza)**
- **⚠️ 1 race condition potenziale documentata**

---

## 🛡️ Protezioni Confermate (19 test)

### 1. Validazione Ingredienti (9 test)

| Test | Scenario | Protezione |
|------|----------|------------|
| ✅ Empty ingredients | Array vuoto | Validation error 422 |
| ✅ Unavailable ingredient | `is_available=false` | Validation error 422 |
| ✅ Deleted ingredient | Eliminato tra selezione e submit | Validation error 422 |
| ✅ Nonexistent ID | ID ingrediente inesistente | Validation error 422 |
| ✅ Mix valid/invalid | Alcuni validi + alcuni invalidi | Rollback atomico |
| ✅ Three breads | Più di 1 bread | Validation error 422 |
| ✅ Nonexistent time_slot | ID time_slot inventato | Validation error 422 |
| ✅ Only bread | Panino con solo pane | 201 (consentito) |
| ✅ Update empty ingredients | Tentativo svuotamento ordine | Validation error 422 |

**VERDICT:** Validazione ingredienti **ROBUSTA**. Tutti i casi anomali intercettati.

---

### 2. Transizioni Stato (5 test)

| Test | Scenario | Protezione |
|------|----------|------------|
| ✅ Rejected → Confirmed | Admin tenta resurrezione | 422 INVALID_STATE_TRANSITION |
| ✅ Rejected → Ready | Uscita da rejected | 422 INVALID_STATE_TRANSITION |
| ✅ Invalid status value | Stato inventato | Validation error 422 |
| ✅ Ready → Pending | Rollback illegale | 422 INVALID_STATE_TRANSITION |
| ✅ Picked_up → Pending | Rollback estremo | 422 INVALID_STATE_TRANSITION |

**VERDICT:** State machine **BLINDATA**. Nessuna transizione illegale possibile.

---

### 3. Autorizzazioni (2 test)

| Test | Scenario | Protezione |
|------|----------|------------|
| ✅ Delete order altrui | Utente → ordine altro user | 403 Forbidden (Policy) |
| ✅ Change status proprio | User → stato proprio ordine | 403 Forbidden (Policy) |

**VERDICT:** Policy **CORRETTA**. Admin-only su changeStatus verificato.

---

### 4. Business Logic (3 test)

| Test | Scenario | Protezione |
|------|----------|------------|
| ✅ Max_orders = 0 | Chiusura improvvisa | 409 SLOT_FULL |
| ✅ Max_orders < 0 | Valore negativo assurdo | Fallimento controllato |
| ✅ Snapshot immutability | Catalogo modificato post-order | Snapshot preservato |

**VERDICT:** Logica di dominio **SOLIDA**. Snapshot immutabile confermato.

---

## 🏗️ Protezioni Database (2 test)

### Test 1: max_orders NULL

```php
test_max_orders_null_is_prevented_by_database_constraint()
```

**SCENARIO:** Tentativo di settare `working_days.max_orders = NULL`  
**RISULTATO:** ✅ `QueryException` con `NOT NULL constraint failed`  
**PROTEZIONE:** Migration ha `$table->integer('max_orders')`  
**VERDICT:** **PROTETTO a livello DB**. Il codice applicativo non può corrompere questo invariante.

---

### Test 4: TimeSlot Orfano

```php
test_orphan_time_slot_is_prevented_by_foreign_key_constraint()
```

**SCENARIO:** Tentativo di settare `time_slots.working_day_id = 99999` (inesistente)  
**RISULTATO:** ✅ `QueryException` con `FOREIGN KEY constraint failed`  
**PROTEZIONE:** Migration ha `$table->foreignId('working_day_id')->constrained()->onDelete('cascade')`  
**VERDICT:** **PROTETTO a livello DB**. Cascade delete configurato correttamente.

---

## ⚠️ Bug Critico Scoperto

### Test 16: Idempotenza API - DOPPIO SUBMIT

```php
test_duplicate_submission_creates_duplicate_orders_BUG()
```

**SCENARIO:**  
1. User invia POST `/orders` con `time_slot_id=1`, `ingredients=[bread]`
2. Risposta: `201 Created`, ordine #1 salvato
3. **User clicca di nuovo** (UI lenta, doppio click accidentale)
4. Risposta: **201 Created**, ordine #2 salvato ❌

**COMPORTAMENTO ATTUALE:**  
- Nessuna validazione su unicità `(user_id, time_slot_id)`
- Stesso utente può creare N ordini per lo stesso slot
- Contatore `max_orders` aumenta per ogni duplicato

**IMPATTO:**  
- **CRITICO**: Utente malintenzionato può saturare tutti gli slot
- **UX**: Doppio click crea ordini duplicati
- **Business**: Dati sporchi, logistica compromessa

**ROOT CAUSE:**  
Manca constraint di unicità su tabella `orders`:
```sql
UNIQUE (user_id, time_slot_id, status)
-- Dove status != 'rejected' per permettere riordino dopo reject
```

---

### Soluzioni Proposte

#### Opzione A: Unique Constraint DB (RACCOMANDATO)

**Migration:**
```php
Schema::table('orders', function (Blueprint $table) {
    $table->unique(['user_id', 'time_slot_id'], 'unique_user_slot');
});
```

**PRO:**  
✅ Protezione garantita anche in caso di concorrenza  
✅ Errore atomico prima di lockForUpdate  
✅ Impossibile bypassare via query diretta  

**CONTRO:**  
❌ Impedisce riordino dopo cancellazione (se necessario)  
❌ Richiede migration production  

---

#### Opzione B: Validazione Service

**CreateOrderRequest:**
```php
public function withValidator($validator)
{
    $validator->after(function ($validator) {
        $exists = Order::where('user_id', $this->user()->id)
            ->where('time_slot_id', $this->time_slot_id)
            ->where('status', '!=', 'rejected')
            ->exists();
            
        if ($exists) {
            $validator->errors()->add('time_slot_id', 'Hai già un ordine per questo slot.');
        }
    });
}
```

**PRO:**  
✅ Più flessibile (consente riordino)  
✅ Messaggio errore personalizzato  
✅ No migration  

**CONTRO:**  
❌ Race condition possibile (2 richieste simultanee)  
❌ Validazione bypassabile se chiamata diretta al service  

---

#### Opzione C: Idempotency Key (BEST PRACTICE)

**Controller:**
```php
public function store(CreateOrderRequest $request)
{
    $idempotencyKey = $request->header('Idempotency-Key');
    
    if ($idempotencyKey) {
        $cached = Cache::get("order:{$idempotencyKey}");
        if ($cached) {
            return response()->json($cached, 200); // Stessa risposta
        }
    }
    
    // ... creazione ordine ...
    
    if ($idempotencyKey) {
        Cache::put("order:{$idempotencyKey}", $response, 3600);
    }
}
```

**PRO:**  
✅ Pattern standard per API idempotenti  
✅ Gestisce doppio submit + retry network  
✅ Non impatta schema DB  

**CONTRO:**  
❌ Richiede frontend che generi UUID  
❌ Complessità aggiuntiva  
❌ Non protegge da submit manuali  

---

### Raccomandazione Finale

**Implementare Opzione A + B:**
1. **Unique constraint DB** per protezione assoluta
2. **Validazione anticipata** per UX migliore (messaggio chiaro)
3. Gestire `rejected` con partial unique index:
   ```sql
   CREATE UNIQUE INDEX unique_active_user_slot 
   ON orders(user_id, time_slot_id) 
   WHERE status != 'rejected';
   ```

---

## ⚠️ Race Condition Potenziale

### Test 23: Update Durante Cambio Stato

```php
test_update_after_status_change_documents_race_condition()
```

**SCENARIO:**  
```
t=0: Ordine #1 è pending
t=1: Admin PUT /admin/orders/1/status → confirmed
t=2: User  PUT /orders/1 → modifica ingredienti (istanza Eloquent non fresh)
```

**COMPORTAMENTO ATTUALE:**  
- Se `OrderService` usa istanza già caricata, modifica passa ✅
- Se `OrderService` ricarica con `fresh()`, modifica fallisce ❌

**ROOT CAUSE:**  
OrderService non fa `$order->fresh()` prima di `isPending()`:
```php
// OrderService::updateOrder()
public function updateOrder(Order $order, array $ingredientIds): Order
{
    // 🔴 BUG: Se $order è stale, isPending() vede stato vecchio
    if (!$order->isPending()) {
        throw new OrderNotModifiableError();
    }
}
```

**FIX PROPOSTO:**
```php
public function updateOrder(Order $order, array $ingredientIds): Order
{
    // ✅ Ricarica stato fresco da DB
    $order->refresh();
    
    if (!$order->isPending()) {
        throw new OrderNotModifiableError();
    }
}
```

**IMPATTO:**  
- **MEDIO**: Richiede timing preciso (1-2 secondi window)
- User può modificare ordine già confermato
- Snapshot ingredienti sovrascritto

**NOTA:** Il test attuale non fallisce perché race condition difficile da simulare. Documentato per awareness.

---

## 📈 Coverage Summary

### Test Distribution

```
Total: 59 test
├── AdminWeeklyConfiguration: 11 test
├── TimeSlotGeneration:       10 test
├── Order (feature):          13 test
├── OrderEdgeCases (new):     23 test ⭐
└── Example:                   2 test
```

### Edge Cases Breakdown

```
OrderEdgeCasesTest: 23 test
├── Validazione input:        9 test ✅
├── Transizioni stato:        5 test ✅
├── Autorizzazioni:           2 test ✅
├── Business logic:           3 test ✅
├── Protezioni DB:            2 test ✅
├── Bug scoperti:             1 test ⚠️
└── Race conditions:          1 test ⚠️
```

---

## 🎯 Invarianti Protette (Documentate)

### Database Layer
1. ✅ `working_days.max_orders NOT NULL`
2. ✅ `time_slots.working_day_id FOREIGN KEY with CASCADE`
3. ❌ `orders(user_id, time_slot_id)` **MANCA UNIQUE** ⚠️

### Application Layer
4. ✅ Esattamente 1 bread obbligatorio
5. ✅ Ingredienti must exist + is_available
6. ✅ No duplicati ingredienti stesso ordine
7. ✅ Pending-only modifiable (update/delete)
8. ✅ Rejected is terminal (no exit)
9. ✅ No return to pending
10. ✅ Admin-only changeStatus
11. ✅ Ownership su update/delete
12. ✅ Snapshot immutabile post-creazione
13. ✅ max_orders = 0 → SLOT_FULL
14. ✅ Rejected non contano verso max_orders

### Non Protette
15. ❌ Idempotenza doppio submit ⚠️
16. ⚠️ Race condition update durante cambio stato

---

## 📋 Azioni Raccomandate

### Priority 1 (CRITICO)
- [ ] Implementare unique constraint `(user_id, time_slot_id)`
- [ ] Aggiungere test che verifica reject→ricrea per stesso slot

### Priority 2 (IMPORTANTE)
- [ ] Aggiungere `$order->refresh()` in OrderService::updateOrder()
- [ ] Test concorrenza reale con Queue workers

### Priority 3 (NICE TO HAVE)
- [ ] Valutare Idempotency-Key header per API
- [ ] Logging tentativi duplicati per monitoring

---

## 🏆 Conclusioni

Il modulo Ordini dimostra:
- **Architettura solida**: Domain Errors, Service Layer, Policy separation
- **Validazione robusta**: Tutti i casi anomali intercettati
- **State machine blindata**: Nessuna transizione illegale possibile
- **Snapshot design corretto**: Immutabilità garantita

**Gap principali:**
1. Manca protezione idempotenza (facilmente risolvibile)
2. Potenziale race condition su refresh stato (edge case raro)

**Voto complessivo:** **8.5/10**  
Produzione-ready con fix P1 implementato.

---

**Report generato da:** OrderEdgeCasesTest.php  
**Versione test suite:** 59 test / 212 assertions  
**Ultimo run:** 2026-01-14 - All tests passing ✅
