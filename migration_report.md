# Report migrazione MySQL/XAMPP

## Sintesi

Il progetto Campus Truck e' stato predisposto per usare MySQL/MariaDB tramite XAMPP con database:

```text
campus_truck
```

Il dominio applicativo non e' stato modificato. Le modifiche hanno riguardato configurazione, migration fragili per MySQL e documentazione operativa.

## File modificati o creati

- `.env.example`: configurazione MySQL/XAMPP di esempio.
- `.env`: aggiornato solo localmente per eseguire la verifica MySQL; il file e' presente in `.gitignore` e non deve essere committato.
- `database/migrations/2026_01_14_105649_add_start_end_time_to_working_days_table.php`: aggiunti default agli orari.
- `database/migrations/2026_01_15_160729_add_daily_number_and_working_day_to_orders_table.php`: resa robusta la creazione di `working_day_id`, foreign key e unique.
- `transition.md`: guida step by step per passare da SQLite a MySQL/XAMPP.
- `migration_report.md`: questo report.

## Migration controllate

Sono state controllate le migration in `database/migrations` relative a:

- cache e jobs;
- `users`, `password_reset_tokens`, `sessions`;
- `ingredients`;
- `favorite_sandwiches`;
- `favorite_sandwich_ingredients`;
- `working_days`;
- `time_slots`;
- `orders`;
- `order_ingredients`;
- `ingredient_availabilities`;
- colonne successive `start_time`, `end_time`, `daily_number`, `working_day_id`, `is_active`, `enabled`.

## Migration corrette

- `2026_01_14_105649_add_start_end_time_to_working_days_table.php`
  - Prima aggiungeva `start_time` e `end_time` come `TIME NOT NULL` senza default.
  - Ora usa default coerenti:
    - `start_time`: `12:00:00`
    - `end_time`: `14:00:00`

- `2026_01_15_160729_add_daily_number_and_working_day_to_orders_table.php`
  - Prima creava `working_day_id` direttamente con `constrained()`, quindi con foreign key immediata.
  - Ora usa una strategia in piu' fasi:
    1. aggiunge `working_day_id` nullable senza foreign key;
    2. aggiunge `daily_number` nullable;
    3. esegue backfill da `time_slots.working_day_id`;
    4. aggiunge indice di supporto `orders_working_day_id_index`;
    5. aggiunge foreign key nominata `orders_working_day_id_fk`;
    6. aggiunge unique nominato `orders_working_day_daily_number_unique`.
  - Il `down()` rimuove prima unique e foreign key usando i nomi espliciti, poi l'indice di supporto e infine elimina le colonne.

## Seeder controllati

Seeder principali controllati:

- `DatabaseSeeder`
- `UserSeeder`
- `IngredientsSeeder`
- `WorkingDaySeeder`
- `TimeSlotSeeder`
- `OrderSeeder`
- `FavoriteSandwichesSeeder`

Ordine del seed standard verificato:

```text
users -> ingredients -> working_days -> time_slots -> orders -> favorite_sandwiches
```

Seeder extra controllati:

- `TestDataSeeder`
- `UserRequirementsSeeder`
- `TestWorkingDaySeeder`

Nota: `TestDataSeeder` e `UserRequirementsSeeder` usano `SET FOREIGN_KEY_CHECKS`, istruzione compatibile con MySQL/MariaDB. Non sono chiamati dal `DatabaseSeeder` standard.

## Problemi trovati

- `.env.example` puntava ancora a SQLite.
- `.env` locale puntava ancora a SQLite.
- La migration degli orari di `working_days` era fragile su MySQL in caso di tabella gia' popolata.
- La migration `orders.working_day_id` era fragile per MySQL perche' aggiungeva subito una foreign key obbligatoria.

## Modifiche applicate

- Aggiornata configurazione MySQL/XAMPP in `.env.example`.
- Aggiornato `.env` locale dopo verifica che `.env` e' ignorato da Git.
- Creata/verificata localmente la presenza del database `campus_truck` con charset `utf8mb4` e collation `utf8mb4_unicode_ci`.
- Rese robuste le migration indicate sopra.
- Creata guida `transition.md`.

## Test eseguiti

Ambiente database rilevato:

```text
MariaDB 10.4.32
```

Comandi eseguiti con successo:

```bash
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS campus_truck CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan optimize:clear
php artisan migrate:fresh --seed
php artisan tinker --execute="echo DB::connection()->getDriverName();"
php artisan test --do-not-cache-result
npm run build
```

Risultato verifica driver Laravel:

```text
mysql
```

Risultato database dopo seed:

- `users`: 6 record
- `ingredients`: 29 record
- `working_days`: 10 record
- `time_slots`: 150 record
- `orders`: 39 record

Vincoli MySQL verificati su `orders`:

- `orders_working_day_id_fk` verso `working_days`;
- `orders_working_day_daily_number_unique`.
- `orders_working_day_id_index`.

Rollback verificato:

```bash
php artisan migrate:rollback --step=1
```

Il rollback della migration critica e' stato eseguito con successo dopo l'aggiunta dell'indice esplicito di supporto alla foreign key.

Risultato test PHP:

```text
181 passed, 1 risky
```

Nota: i test automatici usano SQLite in memoria come indicato in `phpunit.xml`; sono quindi un controllo di regressione applicativa, non la verifica principale MySQL.

Il test risky e' preesistente: `Tests\Feature\SeedingValidationTest::past orders have correct status` non esegue assertion.

Risultato build frontend:

```text
npm run build: completato con successo
```

Nota build: Vite segnala un warning preesistente su import dinamico/statico di `adminWorkService.actions.js`; non blocca la build.

## Test non eseguiti

Nessun test fondamentale e' rimasto non eseguito. La verifica MySQL principale e' stata completata con successo su XAMPP/MariaDB locale.

## Istruzioni residue per l'utente

Su un'altra macchina:

1. Avvia Apache e MySQL da XAMPP.
2. Crea il database `campus_truck` da phpMyAdmin.
3. Copia `.env.example` in `.env` se non esiste gia'.
4. Verifica il blocco DB nel file `.env`.
5. Esegui:

```bash
php artisan optimize:clear
php artisan migrate:fresh --seed
php artisan serve
```

## Rischi residui

- `migrate:fresh` cancella tutte le tabelle del database selezionato: usarlo solo in sviluppo.
- Se XAMPP usa una porta diversa da `3306`, bisogna aggiornare `DB_PORT`.
- Se l'utente `root` ha una password locale, bisogna impostarla solo nel proprio `.env`, senza committarla.
- I warning PHPUnit sui metadata nei doc-comment non sono legati alla migrazione MySQL, ma potranno diventare rilevanti con PHPUnit 12.
