# Test per AdminWeeklyConfiguration

## Cosa Stiamo Testando

Questo file contiene i test per il controller `AdminWeeklyConfigurationController`, che permette agli amministratori di configurare la settimana lavorativa creando o eliminando record `WorkingDay` per giorni futuri.

I test verificano che:
- Solo gli admin autenticati possano accedere all'endpoint
- I giorni passati non vengano mai modificati (regola di non-retroattività)
- I giorni futuri vengano creati/eliminati correttamente secondo la configurazione
- Il sistema sia idempotente (ripetere la stessa configurazione non cambia nulla)
- La validazione degli input funzioni correttamente

## Perché È Importante

Questi test garantiscono l'integrità del sistema di prenotazione panini:
- **Sicurezza**: Solo admin possono modificare la configurazione lavorativa
- **Integrità dati**: Giorni passati non vengono alterati per non invalidare prenotazioni esistenti
- **Affidabilità**: Il sistema risponde prevedibilmente agli input validi
- **Robustezza**: Input invalidi vengono rifiutati con messaggi chiari

## Come Eseguire i Test

### Prerequisiti
- Laravel installato e configurato
- Database configurato (i test usano SQLite in memoria)
- PHPUnit installato

### Comandi
```bash
# Eseguire tutti i test
php artisan test

# Eseguire solo i test di questa feature
php artisan test tests/Feature/AdminWeeklyConfigurationTest.php

# Eseguire un test specifico
php artisan test --filter test_admin_can_create_future_working_days_from_weekly_configuration

# Con PHPUnit direttamente
vendor/bin/phpunit tests/Feature/AdminWeeklyConfigurationTest.php
```

### Configurazione Test
I test usano:
- `RefreshDatabase`: Ricrea il database per ogni test
- `Carbon::setTestNow()`: Congela la data a mercoledì 15 gennaio 2026 per determinare giorni passati/futuri

## Test Cases Dettagliati

### 1. `test_guest_cannot_access_admin_weekly_configuration`
**Scenario**: Utente non autenticato tenta di accedere all'endpoint
**Input**: Payload valido
**Comportamento Atteso**:
- Status code: 401 (Unauthorized)
- Nessun working_day creato
**Perché importante**: Verifica che il middleware `auth` funzioni

### 2. `test_non_admin_user_cannot_access_admin_weekly_configuration`
**Scenario**: Utente autenticato ma con ruolo 'user' tenta di accedere
**Input**: Payload valido
**Comportamento Atteso**:
- Status code: 403 (Forbidden)
- Nessun working_day creato
**Perché importante**: Verifica che il middleware `admin` funzioni

### 3. `test_admin_can_create_future_working_days_from_weekly_configuration`
**Scenario**: Admin configura settimana lavorativa
**Input**: Configurazione con alcuni giorni abilitati
**Comportamento Atteso**:
- Status code: 200
- Creazione working_days solo per giorni futuri abilitati
- Parametri corretti (location, max_orders, max_time, orari)
- Giorni disabilitati non creati
**Perché importante**: Testa la logica principale di creazione

### 4. `test_past_working_days_are_not_modified`
**Scenario**: Esiste un working_day per un giorno passato
**Input**: Configurazione che includerebbe quel giorno
**Comportamento Atteso**:
- Status code: 200
- Working_day passato rimane invariato
- Giorni futuri creati normalmente
**Perché importante**: Garantisce non-retroattività

### 5. `test_existing_future_working_days_are_not_modified`
**Scenario**: Esiste già un working_day per un giorno futuro abilitato
**Input**: Configurazione che mantiene quel giorno abilitato
**Comportamento Atteso**:
- Status code: 200
- Working_day esistente NON modificato
- Altri giorni futuri creati
**Perché importante**: Previene aggiornamenti accidentali

### 6. `test_weekly_configuration_is_idempotent`
**Scenario**: Stessa configurazione inviata due volte
**Input**: Payload identico due volte
**Comportamento Atteso**:
- Status code: 200 entrambe le volte
- Numero working_days invariato dopo seconda chiamata
**Perché importante**: Sistema prevedibile e sicuro

### 7. `test_validation_fails_for_invalid_max_orders`
**Scenario**: max_orders = 0 (non valido)
**Input**: Payload con max_orders invalido
**Comportamento Atteso**:
- Status code: 422
- Errore di validazione per max_orders
- Nessun working_day creato
**Perché importante**: Validazione input

### 8. `test_validation_fails_for_negative_max_time`
**Scenario**: max_time = -1 (non valido)
**Input**: Payload con max_time negativo
**Comportamento Atteso**:
- Status code: 422
- Errore di validazione per max_time
- Nessun working_day creato
**Perché importante**: Validazione input

### 9. `test_validation_fails_for_enabled_day_without_start_time`
**Scenario**: Giorno abilitato senza start_time
**Input**: Payload mancante di start_time per giorno enabled
**Comportamento Atteso**:
- Status code: 422
- Errore di validazione per start_time
- Nessun working_day creato
**Perché importante**: Validazione orari

### 10. `test_validation_fails_for_end_time_before_start_time`
**Scenario**: end_time precedente a start_time
**Input**: Payload con orari invalidi
**Comportamento Atteso**:
- Status code: 422
- Errore di validazione per end_time
- Nessun working_day creato
**Perché importante**: Validazione logica orari

### 11. `test_admin_can_delete_future_working_days_when_disabled`
**Scenario**: Working_days esistenti per giorni che diventano disabilitati
**Input**: Configurazione che disabilita giorni esistenti
**Comportamento Atteso**:
- Status code: 200
- Working_days disabilitati eliminati
- Giorni abilitati creati/mantenuti
**Perché importante**: Testa logica di eliminazione
**Nota TODO**: Attualmente elimina sempre. Se si aggiungeranno controlli per ordini esistenti, questo test dovrà essere aggiornato per verificare che l'eliminazione NON avvenga quando ci sono ordini.

## Limiti e TODO

### Eliminazione Working Days
Nella implementazione attuale, i working_days futuri disabilitati vengono sempre eliminati. Tuttavia, nel codice è presente un TODO per aggiungere controlli che prevengano l'eliminazione se esistono ordini associati a quel giorno.

Quando questa funzionalità sarà implementata:
- Il test `test_admin_can_delete_future_working_days_when_disabled` dovrà essere modificato
- Potrebbe servire un nuovo test che verifica il blocco dell'eliminazione quando ci sono ordini
- La risposta potrebbe includere informazioni sui giorni che non sono stati eliminati

### Gestione Time Slots
Il controller attualmente non gestisce la creazione automatica degli slot orari. Quando questa funzionalità sarà aggiunta, serviranno test specifici per verificare che gli slot vengano creati correttamente per i working_days.

### Performance
Per settimane con molti giorni, potrebbe essere necessario ottimizzare le query. I test attuali non coprono scenari di performance.

## Struttura Database per Test

I test creano working_days con questa struttura:
- `day`: Data nel formato YYYY-MM-DD
- `location`: Stringa (es. "Piazza Centrale")
- `max_orders`: Intero positivo
- `max_time`: Intero >= 0
- `start_time`: Ora nel formato HH:MM
- `end_time`: Ora nel formato HH:MM

## Factory Utilizzate

- `UserFactory`: Crea utenti con ruoli 'admin' o 'user'
- Stati disponibili: `admin()`, `user()`, `unverified()`

## Comandi Utili per Debug

```bash
# Vedere tutti i working_days creati durante un test
php artisan tinker
>>> App\Models\WorkingDay::all()

# Verificare la data corrente nei test
php artisan tinker
>>> now() // Ma nei test è congelata
```