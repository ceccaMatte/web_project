# 📊 Database Seeding - Dati di Test

## 🎯 Scopo

Popolare il database con dati realistici per sviluppo e test locale.

## 🚀 Esecuzione

```bash
php artisan migrate:fresh --seed
```

Questo comando:
1. ❌ Cancella tutte le tabelle
2. 🔄 Esegue tutte le migrazioni (crea da zero)
3. 📊 Popola il database con dati di test

## 📋 Cosa viene creato

### 👤 Utenti (3 totali)

| Email | Password | Ruolo | Stato |
|-------|----------|-------|-------|
| `mario@test.it` | `password` | user | ✅ Abilitato |
| `luigi@test.it` | `password` | user | ✅ Abilitato |
| `admin@test.it` | `password` | admin | ✅ Abilitato |

**Per login rapido:** Usa `mario@test.it` / `password`

### 📅 Working Days (2 giorni)

- **Oggi** (2026-01-16)
  - Luogo: Piazza Centrale - Engineering Hub
  - Orari: 11:00 - 13:00
  - Max ordini per slot: 20
  - Stato: ✅ Attivo

- **Domani** (2026-01-17)
  - Luogo: Piazza Centrale - Engineering Hub
  - Orari: 11:00 - 13:00
  - Max ordini per slot: 20
  - Stato: ✅ Attivo

### ⏰ Time Slots (6 per giorno)

Ogni giorno ha 6 slot da 15 minuti:
- 11:00 - 11:15
- 11:15 - 11:30
- 11:30 - 11:45
- 11:45 - 12:00
- 12:00 - 12:15
- 12:15 - 12:30

**Totale:** 12 slot (6 oggi + 6 domani)

### 🛒 Ordini (6 per oggi)

Tutti gli ordini sono legati al working day di **oggi**:

| User | Stato | Slot | Note |
|------|-------|------|------|
| Mario | `pending` | 11:00 | Modificabile |
| Mario | `confirmed` | 11:15 | Confermato, in preparazione |
| Mario | `ready` | 11:30 | Pronto per il ritiro |
| Mario | `picked_up` | 11:45 | Già ritirato |
| Mario | `rejected` | 12:00 | Annullato |
| Luigi | `pending` | 11:15 | Modificabile |

## 🧪 Come testare

### 1. Login e Home
```bash
1. Avvia il server: php artisan serve
2. Vai a http://localhost:8000
3. Login con mario@test.it / password
4. Vedi la home con:
   - Truck status card (attivo oggi)
   - Week scheduler (oggi selezionato)
   - Your Orders for Today (6 ordini con stati diversi)
   - Pre-book for Tomorrow (slot disponibili per domani)
```

### 2. Verifica Dati nel DB
```bash
# Vedi tutti gli utenti
SELECT * FROM users;

# Vedi ordini per oggi
SELECT * FROM orders WHERE working_day_id = 1;

# Vedi slot disponibili
SELECT * FROM time_slots WHERE working_day_id = 1;
```

### 3. Distinguere Loggato vs Non-Loggato
- **Non loggato:** Vedi home senza dati personali
- **Loggato come Mario:** Vedi i 5 ordini di Mario
- **Loggato come Luigi:** Vedi l'1 ordine di Luigi

## 📝 Note Importanti

### Seeder Location
```
database/seeders/TestDataSeeder.php
```

### Configurable via .env
Attualmente hardcoded. Per renderlo configurabile in futuro:
```php
// Nel seeder
'location' => env('TEST_LOCATION', 'Piazza Centrale'),
'start_time' => env('TEST_START_TIME', '11:00'),
```

### Re-esecuzione
Se il database è già popolato e vuoi eseguire il seeder di nuovo:
```bash
# Opzione 1: Reset completo (raccomandato per dev)
php artisan migrate:fresh --seed

# Opzione 2: Solo seeder (mantiene struttura)
php artisan db:seed --class=TestDataSeeder
```

### Cancellazione Dati
Per cancellare tutto e ricominciare da zero:
```bash
php artisan migrate:fresh
```

## 🔒 Sicurezza

⚠️ **AVVERTENZA:** Questo seeder è SOLO per sviluppo locale.

- Le password sono in chiaro nel codice (non fare mai in produzione!)
- I dati sono completamente pubblici
- NON fare mai deploy con questo seeder

## 🐛 Troubleshooting

### Errore: "Foreign key constraint failed"
```bash
# Soluzione: Disabilita foreign keys
SET FOREIGN_KEY_CHECKS=0;
php artisan migrate:fresh --seed
SET FOREIGN_KEY_CHECKS=1;
```

### Errore: "Table already exists"
```bash
# Soluzione: Reset completo
php artisan migrate:fresh --seed
```

### Nessun dato visibile
```bash
# Verifica il database
php artisan tinker
>>> User::count()
>>> Order::count()
```

## 📞 Contatti / Support

Per dubbi sulla struttura del seed, vedi:
- [database/seeders/TestDataSeeder.php](TestDataSeeder.php)
- [app/Models/](../app/Models/)
- [database/migrations/](../migrations/)
