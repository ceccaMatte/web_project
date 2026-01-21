/**
 * ESEMPIO PRATICO - Test Rimozione Ingrediente
 * 
 * Copia-incolla questo codice nella console del browser
 * per testare la funzionalità di rimozione ingrediente.
 */

// ============================================================================
// SETUP: Abilita debug logging
// ============================================================================

console.log('%c[TEST] Inizializzazione test rimozione ingrediente...', 'color: #4CAF50; font-weight: bold;');

// ============================================================================
// HELPER: Stampa stato corrente
// ============================================================================

function printCurrentState() {
    console.group('%cSTATO CORRENTE', 'color: #2196F3; font-weight: bold;');
    
    console.log('Totale ingredienti selezionati:', orderFormState.order.selectedIngredients.length);
    
    console.table(orderFormState.order.selectedIngredients.map(i => ({
        ID: i.id,
        Nome: i.name,
        Categoria: i.category
    })));
    
    console.log('IDs:', orderFormState.order.selectedIngredients.map(i => i.id));
    console.log('Ordine valido:', isOrderValid());
    
    console.groupEnd();
}

// ============================================================================
// HELPER: Verifica UI sincronizzata
// ============================================================================

function verifyUISync() {
    console.group('%cVERIFICA UI', 'color: #FF9800; font-weight: bold;');
    
    const selectedIds = orderFormState.order.selectedIngredients.map(i => i.id);
    const summaryCount = orderFormState.order.selectedIngredients.length;
    
    // Conta elementi in "Your Selection"
    const summaryElements = document.querySelectorAll('[data-action="remove-ingredient"]').length;
    
    // Conta checkbox checked in dropdown
    const checkedBoxes = document.querySelectorAll('[data-action="toggle-ingredient"][aria-pressed="true"]').length;
    
    console.log('📊 Conteggi:');
    console.log('  - State count:', summaryCount);
    console.log('  - Summary elements:', summaryElements);
    console.log('  - Checked boxes:', checkedBoxes);
    
    const isSync = summaryCount === summaryElements && summaryCount === checkedBoxes;
    
    if (isSync) {
        console.log('%c✅ UI SINCRONIZZATA', 'color: #4CAF50; font-weight: bold;');
    } else {
        console.error('❌ UI NON SINCRONIZZATA!');
        console.error('State dice', summaryCount, 'ma UI mostra:', summaryElements, 'summary,', checkedBoxes, 'checked');
    }
    
    console.groupEnd();
    
    return isSync;
}

// ============================================================================
// TEST 1: Stato iniziale
// ============================================================================

console.log('\n%c━━━ TEST 1: Verifica Stato Iniziale ━━━', 'color: #9C27B0; font-weight: bold; font-size: 14px;');

printCurrentState();
verifyUISync();

// ============================================================================
// TEST 2: Rimozione singolo ingrediente
// ============================================================================

console.log('\n%c━━━ TEST 2: Rimozione Singolo Ingrediente ━━━', 'color: #9C27B0; font-weight: bold; font-size: 14px;');

if (orderFormState.order.selectedIngredients.length > 0) {
    const toRemove = orderFormState.order.selectedIngredients[0];
    
    console.log('%c🎯 Rimuoverò:', 'color: #E91E63; font-weight: bold;', toRemove.name, `(ID: ${toRemove.id})`);
    console.log('Premere il pulsante "−" accanto a:', toRemove.name);
    console.log('Oppure esegui manualmente:');
    console.log(`%cdeselectIngredient(${toRemove.id})`, 'background: #263238; color: #FFA726; padding: 4px 8px; border-radius: 3px;');
    
    // Per test automatico (opzionale):
    // deselectIngredient(toRemove.id);
    // setTimeout(() => {
    //     console.log('\n%cDOPO RIMOZIONE:', 'color: #4CAF50; font-weight: bold;');
    //     printCurrentState();
    //     verifyUISync();
    // }, 100);
} else {
    console.warn('⚠️ Nessun ingrediente selezionato. Seleziona alcuni ingredienti prima.');
}

// ============================================================================
// TEST 3: Verifica dopo rimozione manuale
// ============================================================================

console.log('\n%c━━━ TEST 3: Dopo Rimozione (esegui dopo click "−") ━━━', 'color: #9C27B0; font-weight: bold; font-size: 14px;');
console.log('Dopo aver cliccato "−", esegui:');
console.log('%cprintCurrentState(); verifyUISync();', 'background: #263238; color: #FFA726; padding: 4px 8px; border-radius: 3px;');

// ============================================================================
// TEST 4: Test automatico completo
// ============================================================================

console.log('\n%c━━━ TEST 4: Test Automatico Completo ━━━', 'color: #9C27B0; font-weight: bold; font-size: 14px;');
console.log('Per eseguire test automatico, esegui:');
console.log('%crunAutomatedTest()', 'background: #263238; color: #FFA726; padding: 4px 8px; border-radius: 3px;');

window.runAutomatedTest = async function() {
    console.clear();
    console.log('%c🤖 TEST AUTOMATICO AVVIATO', 'color: #4CAF50; font-weight: bold; font-size: 16px;');
    
    // Salva stato iniziale
    const initialCount = orderFormState.order.selectedIngredients.length;
    
    if (initialCount === 0) {
        console.error('❌ Test fallito: seleziona almeno 1 ingrediente prima.');
        return;
    }
    
    console.log(`\n📋 Stato iniziale: ${initialCount} ingredienti selezionati`);
    printCurrentState();
    
    // Rimuovi primo ingrediente
    const toRemove = orderFormState.order.selectedIngredients[0];
    console.log(`\n🗑️ Rimozione: ${toRemove.name} (ID: ${toRemove.id})`);
    
    deselectIngredient(toRemove.id);
    
    // Attendi render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n📊 Dopo rimozione:');
    printCurrentState();
    
    // Verifica
    const newCount = orderFormState.order.selectedIngredients.length;
    const expectedCount = initialCount - 1;
    
    console.log('\n🔍 Verifica:');
    console.log(`  - Count atteso: ${expectedCount}`);
    console.log(`  - Count effettivo: ${newCount}`);
    console.log(`  - Ingrediente rimosso: ${!orderFormState.order.selectedIngredients.some(i => i.id === toRemove.id)}`);
    
    const uiSync = verifyUISync();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (newCount === expectedCount && uiSync) {
        console.log('%c✅ TEST SUPERATO!', 'color: #4CAF50; font-weight: bold; font-size: 18px;');
        console.log('Ingrediente rimosso correttamente, UI sincronizzata.');
    } else {
        console.error('%c❌ TEST FALLITO!', 'color: #F44336; font-weight: bold; font-size: 18px;');
        if (newCount !== expectedCount) {
            console.error('Lo stato non è stato aggiornato correttamente.');
        }
        if (!uiSync) {
            console.error('La UI non è sincronizzata con lo stato.');
        }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// ============================================================================
// TEST 5: Verifica invarianti
// ============================================================================

window.verifyInvariants = function() {
    console.log('%c🔍 VERIFICA INVARIANTI', 'color: #2196F3; font-weight: bold; font-size: 14px;');
    
    const ingredients = orderFormState.order.selectedIngredients;
    const ids = ingredients.map(i => i.id);
    const uniqueIds = [...new Set(ids)];
    
    console.log('\n📊 Check duplicati:');
    console.log(`  - IDs totali: ${ids.length}`);
    console.log(`  - IDs unici: ${uniqueIds.length}`);
    
    if (ids.length === uniqueIds.length) {
        console.log('%c✅ Nessun duplicato', 'color: #4CAF50; font-weight: bold;');
    } else {
        console.error('%c❌ DUPLICATI TROVATI!', 'color: #F44336; font-weight: bold;');
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.error('IDs duplicati:', [...new Set(duplicates)]);
    }
    
    console.log('\n📊 Check categorie bread:');
    const breads = ingredients.filter(i => i.category === 'bread');
    console.log(`  - Bread selezionati: ${breads.length}`);
    
    if (breads.length <= 1) {
        console.log('%c✅ Max 1 bread', 'color: #4CAF50; font-weight: bold;');
    } else {
        console.error('%c❌ Più di 1 bread selezionato!', 'color: #F44336; font-weight: bold;');
    }
    
    console.log('\n📊 Check ordine valido:');
    const valid = isOrderValid();
    console.log(`  - isOrderValid(): ${valid}`);
    console.log(`  - Has bread: ${breads.length > 0}`);
    console.log(`  - Has time slot (create): ${orderFormState.order.selectedTimeSlotId || 'N/A'}`);
    
    if (orderFormState.mode === 'create') {
        if (valid === (breads.length > 0 && orderFormState.order.selectedTimeSlotId !== null)) {
            console.log('%c✅ Validazione coerente', 'color: #4CAF50; font-weight: bold;');
        } else {
            console.error('%c❌ Validazione inconsistente!', 'color: #F44336; font-weight: bold;');
        }
    } else {
        if (valid === (breads.length > 0)) {
            console.log('%c✅ Validazione coerente', 'color: #4CAF50; font-weight: bold;');
        } else {
            console.error('%c❌ Validazione inconsistente!', 'color: #F44336; font-weight: bold;');
        }
    }
};

// ============================================================================
// COMANDI DISPONIBILI
// ============================================================================

console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #607D8B;');
console.log('%c📚 COMANDI DISPONIBILI:', 'color: #FFC107; font-weight: bold; font-size: 14px;');
console.log('');
console.log('%cprintCurrentState()', 'background: #263238; color: #FFA726; padding: 2px 6px; border-radius: 3px;');
console.log('  → Stampa stato corrente');
console.log('');
console.log('%cverifyUISync()', 'background: #263238; color: #FFA726; padding: 2px 6px; border-radius: 3px;');
console.log('  → Verifica sincronizzazione UI');
console.log('');
console.log('%crunAutomatedTest()', 'background: #263238; color: #FFA726; padding: 2px 6px; border-radius: 3px;');
console.log('  → Esegue test automatico completo');
console.log('');
console.log('%cverifyInvariants()', 'background: #263238; color: #FFA726; padding: 2px 6px; border-radius: 3px;');
console.log('  → Verifica invarianti stato');
console.log('');
console.log('%cdeselectIngredient(id)', 'background: #263238; color: #FFA726; padding: 2px 6px; border-radius: 3px;');
console.log('  → Rimuove ingrediente (programmaticamente)');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #607D8B;');
console.log('');
console.log('%c💡 TIP: Esegui runAutomatedTest() per un test completo!', 'color: #03A9F4; font-style: italic;');
console.log('');

// Export per uso globale
window.testHelpers = {
    printCurrentState,
    verifyUISync,
    verifyInvariants,
    runAutomatedTest
};

console.log('%c✅ Test helpers caricati con successo!', 'color: #4CAF50; font-weight: bold;');
