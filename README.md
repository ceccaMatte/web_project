# Campus Truck

Campus Truck e un'applicazione Laravel per la gestione di un servizio di prenotazione panini in ambito universitario. Gli utenti possono consultare i giorni di servizio, prenotare un panino in uno slot orario, vedere i propri ordini e modificarli quando consentito. L'admin puo gestire il servizio operativo e la pianificazione settimanale.

Questa guida spiega come avviare il progetto dopo aver clonato il repository.

## Requisiti

Prima di iniziare assicurati di avere installato:

- PHP 8.2 o superiore
- Composer
- Node.js e npm
- SQLite, oppure un altro database supportato da Laravel
- Git

Estensioni PHP normalmente richieste da Laravel:

- `pdo`
- `pdo_sqlite` se usi SQLite
- `mbstring`
- `openssl`
- `tokenizer`
- `xml`
- `ctype`
- `json`
- `fileinfo`

Il progetto usa Laravel 12, Vite 7 e Tailwind CSS 4.

## Installazione da zero

Clona il repository e entra nella cartella del progetto:

```bash
git clone <url-del-repository>
cd web_project
```

Installa le dipendenze PHP:

```bash
composer install
```

Installa le dipendenze JavaScript:

```bash
npm install
```

Crea il file `.env` partendo dall'esempio:

```bash
cp .env.example .env
```

Su Windows PowerShell puoi usare:

```powershell
Copy-Item .env.example .env
```

Genera la chiave dell'applicazione:

```bash
php artisan key:generate
```

## Configurazione del database

La configurazione predefinita usa SQLite:

```env
DB_CONNECTION=sqlite
```

Con SQLite non devi creare un server database. Devi solo creare il file del database:

```bash
touch database/database.sqlite
```

Su Windows PowerShell:

```powershell
New-Item -ItemType File database/database.sqlite
```

Se preferisci MySQL o MariaDB, modifica il file `.env` in questo modo:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nome_database
DB_USERNAME=utente
DB_PASSWORD=password
```

In quel caso crea prima il database vuoto nel tuo DBMS, poi esegui le migrazioni.

## Creazione tabelle e dati demo

Per creare tutte le tabelle e popolare il database con dati di prova:

```bash
php artisan migrate:fresh --seed
```

Attenzione: `migrate:fresh` elimina tutte le tabelle esistenti e le ricrea da zero. Usalo solo in sviluppo locale o quando vuoi resettare i dati.

Il seeding principale crea:

- utenti normali
- un utente admin
- ingredienti
- giorni lavorativi
- slot orari
- ordini di esempio
- panini preferiti

## Login utenti demo

Dopo il seed puoi accedere con questi utenti. Tutte le password demo sono `password`.

| Ruolo | Nome/Nickname | Email | Password |
| --- | --- | --- | --- |
| Utente | User 1 | `user1@test.it` | `password` |
| Utente | User 2 | `user2@test.it` | `password` |
| Utente | User 3 | `user3@test.it` | `password` |
| Utente | User 4 | `user4@test.it` | `password` |
| Utente | User 5 | `user5@test.it` | `password` |
| Admin | Admin | `admin@test.it` | `password` |

L'utente admin puo accedere alle pagine di gestione come `/admin/work-service` e `/admin/service-planning`.

## Avvio del progetto in sviluppo

Per lavorare in locale servono due processi:

1. server Laravel
2. server Vite per asset CSS/JS

Apri un primo terminale e avvia Laravel:

```bash
php artisan serve
```

Di solito l'app sara disponibile su:

```text
http://127.0.0.1:8000
```

Apri un secondo terminale e avvia Vite:

```bash
npm run dev
```

Vite parte di default su:

```text
http://127.0.0.1:5173
```

Non devi aprire direttamente Vite nel browser: visita l'app Laravel su `http://127.0.0.1:8000`. Laravel carichera automaticamente gli asset compilati da Vite.

## Avvio rapido con un solo comando

Il progetto include anche uno script Composer per avviare insieme server Laravel, queue listener, log viewer e Vite:

```bash
composer run dev
```

Questo comando usa `concurrently`, installato tra le dipendenze npm. Se fallisce, verifica di aver gia eseguito:

```bash
npm install
```

## Build frontend per produzione

Per generare gli asset ottimizzati:

```bash
npm run build
```

Gli asset vengono compilati nella cartella `public/build`.

## Test

Per eseguire la suite di test Laravel:

```bash
php artisan test
```

In alternativa puoi usare lo script Composer:

```bash
composer test
```

## Pagine principali

Una volta avviata l'app puoi visitare:

- `/` home pubblica con stato servizio e slot disponibili
- `/login` pagina di accesso
- `/register` registrazione
- `/orders` ordini dell'utente autenticato
- `/orders/create` creazione ordine
- `/admin/work-service` gestione operativa ordini, solo admin
- `/admin/service-planning` pianificazione servizio, solo admin

Le rotte admin richiedono login con `admin@test.it`.

## Comandi utili

Reset completo del database con dati demo:

```bash
php artisan migrate:fresh --seed
```

Svuotare le cache di configurazione:

```bash
php artisan optimize:clear
```

Vedere le rotte disponibili:

```bash
php artisan route:list
```

Aprire Tinker:

```bash
php artisan tinker
```

## Risoluzione problemi

### Errore: `No application encryption key has been specified`

Hai dimenticato di generare la chiave:

```bash
php artisan key:generate
```

### Errore SQLite: `Database file does not exist`

Crea il file database:

```bash
touch database/database.sqlite
```

Su Windows PowerShell:

```powershell
New-Item -ItemType File database/database.sqlite
```

Poi esegui:

```bash
php artisan migrate:fresh --seed
```

### Gli stili o gli script non si caricano

Assicurati che Vite sia in esecuzione:

```bash
npm run dev
```

Se stai preparando una build statica per produzione:

```bash
npm run build
```

### Dopo una modifica a `.env` non cambia nulla

Pulisci la cache:

```bash
php artisan optimize:clear
```

### Porta 8000 gia occupata

Avvia Laravel su un'altra porta:

```bash
php artisan serve --port=8001
```

Poi apri:

```text
http://127.0.0.1:8001
```

### Porta 5173 gia occupata

Vite e configurato per usare la porta `5173`. Chiudi il processo che la sta usando oppure modifica temporaneamente la porta in `vite.config.js`.

## Flusso consigliato per chi clona il repo

Questi sono i comandi essenziali, in ordine:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve
```

In un secondo terminale:

```bash
npm run dev
```

Poi apri:

```text
http://127.0.0.1:8000
```
