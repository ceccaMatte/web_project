# Transizione da SQLite a MySQL/XAMPP

## 1. Obiettivo della transizione

Il progetto Campus Truck e' stato predisposto per usare MySQL/MariaDB tramite XAMPP al posto di SQLite. Il database target si chiama:

```text
campus_truck
```

Laravel continuera' a creare le tabelle tramite migration e a popolarle tramite seeder.

## 2. Prerequisiti

Prima di iniziare servono:

- XAMPP installato;
- Apache avviato;
- MySQL avviato;
- Composer installato;
- dipendenze PHP installate con `composer install`;
- terminale aperto nella cartella root del progetto Laravel.

## 3. Avvio di XAMPP

1. Apri XAMPP Control Panel.
2. Avvia Apache.
3. Avvia MySQL.
4. Verifica che entrambi risultino in stato `running`.

Apache serve principalmente per usare phpMyAdmin dal browser. MySQL/MariaDB e' invece il database usato dal progetto Laravel.

## 4. Creazione database da phpMyAdmin

1. Apri il browser.
2. Vai su:

```text
http://localhost/phpmyadmin
```

3. Clicca su `Nuovo`.
4. Crea un database chiamato:

```text
campus_truck
```

5. Usa la collation:

```text
utf8mb4_unicode_ci
```

6. Non creare manualmente le tabelle: saranno create da Laravel con le migration.

## 5. Configurazione file `.env`

Nel file `.env` del progetto deve esserci questo blocco:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campus_truck
DB_USERNAME=root
DB_PASSWORD=
```

Con XAMPP la password dell'utente `root` di solito e' vuota, quindi `DB_PASSWORD=` deve rimanere senza valore.

Se MySQL usa una porta diversa, per esempio `3307`, modifica:

```env
DB_PORT=3307
```

## 6. Pulizia cache Laravel

Apri il terminale nella root del progetto e lancia:

```bash
php artisan optimize:clear
```

Questo comando forza Laravel a rileggere la configurazione del database dal file `.env`.

## 7. Esecuzione migration e seeder

Lancia:

```bash
php artisan migrate:fresh --seed
```

Questo comando:

- elimina eventuali tabelle presenti nel database;
- ricrea tutte le tabelle tramite migration;
- popola il database con i dati demo dei seeder.

Attenzione: `migrate:fresh` cancella le tabelle esistenti nel database selezionato. Usarlo solo su database di sviluppo o progetto universitario.

## 8. Avvio del progetto Laravel

Lancia:

```bash
php artisan serve
```

Il sito sara' disponibile su:

```text
http://127.0.0.1:8000
```

## 9. Verifica che Laravel stia usando MySQL

Lancia:

```bash
php artisan tinker
```

Dentro Tinker esegui:

```php
DB::connection()->getDriverName();
```

Il risultato atteso e':

```text
mysql
```

Puoi anche usare un comando diretto:

```bash
php artisan tinker --execute="echo DB::connection()->getDriverName();"
```

## 10. Verifica da phpMyAdmin

Torna su phpMyAdmin e apri il database `campus_truck`. Devono comparire tabelle come:

- `users`;
- `ingredients`;
- `working_days`;
- `time_slots`;
- `orders`;
- `order_ingredients`;
- `favorite_sandwiches`;
- `favorite_sandwich_ingredients`;
- `ingredient_availabilities`.

## 11. Errori comuni

### Errore: `Unknown database 'campus_truck'`

Significa che il database non e' stato creato in phpMyAdmin.

Soluzione: crea il database `campus_truck` e rilancia:

```bash
php artisan migrate:fresh --seed
```

### Errore: `Access denied for user 'root'@'localhost'`

Significa che username o password nel file `.env` non sono corretti. Con XAMPP di solito:

```env
DB_USERNAME=root
DB_PASSWORD=
```

### Errore: Laravel usa ancora SQLite

Soluzione:

```bash
php artisan optimize:clear
```

Poi verifica che nel file `.env` ci sia:

```env
DB_CONNECTION=mysql
```

### Errore: MySQL di XAMPP non parte

Controlla:

- se XAMPP e' stato aperto come amministratore;
- se la porta `3306` e' occupata;
- se MySQL deve usare una porta diversa, ad esempio `3307`;
- se la cartella dati di XAMPP e' corrotta.

Non modificare automaticamente file interni di XAMPP se non sai esattamente cosa stai facendo.

### Errore: migration fallisce per foreign key

Controlla:

- ordine delle migration;
- tabelle referenziate;
- valori dei seeder;
- coerenza tra `orders`, `time_slots` e `working_days`.

## 12. Comandi riassuntivi finali

```bash
php artisan optimize:clear
php artisan migrate:fresh --seed
php artisan serve
```
