-- ============================================================
--  DATABASE SCHEMA: panini_app
--  Autore: <tuo nome>
--  Scopo: Sistema di pre-ordinazione panini con gestione slot
--
--  Questo file rappresenta la DEFINIZIONE STRUTTURALE (DDL)
--  del database. È la fonte di verità del progetto:
--  - il backend PHP si ADATTA a questo schema
--  - la UI non deve forzare stati non rappresentabili
--
--  Il file è volutamente commentato per spiegare:
--  - perché esistono certe tabelle
--  - perché certi campi sono modellati in un certo modo
-- ============================================================


-- ============================================================
--  RESET COMPLETO DEL DATABASE (solo in sviluppo)
--
--  In fase di sviluppo è fondamentale poter ricreare il DB
--  da zero in modo deterministico e ripetibile.
--  In produzione questa istruzione NON va usata.
-- ============================================================
DROP DATABASE IF EXISTS panini_app;


-- ============================================================
--  CREAZIONE DATABASE
--
--  utf8mb4:
--    - supporta caratteri accentati
--    - supporta emoji
--    - è lo standard moderno per MySQL/MariaDB
-- ============================================================
CREATE DATABASE panini_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE panini_app;



-- ============================================================
--  TABELLA: users
--
--  Politica:
--  - esiste UNA SOLA entità utente
--  - admin NON è un'entità separata
--  - admin = user con ruolo diverso
--
--  Questa scelta:
--  - semplifica autenticazione
--  - evita duplicazioni
--  - rende l’autorizzazione una logica applicativa
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Email:
  -- - identificatore logico dell’utente
  -- - usata per il login
  -- - UNIQUE: il DB impedisce duplicati
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Hash della password:
  -- - MAI salvare password in chiaro
  -- - contiene il risultato di password_hash() in PHP
  password_hash VARCHAR(255) NOT NULL,

  -- Nickname:
  -- - solo informativo / visuale
  -- - non è unico
  nickname VARCHAR(100) NOT NULL,

  -- Ruolo:
  -- - definisce i permessi applicativi
  -- - il DB NON gestisce i permessi, solo li dichiara
  role ENUM('user','admin') NOT NULL DEFAULT 'user',

  -- Timestamp di creazione:
  -- - valorizzato automaticamente dal DB
  -- - utile per debug, storico, ordinamenti
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
--  TABELLA: ingredients
--
--  Politica:
--  - rappresenta lo STATO CORRENTE degli ingredienti
--  - NON rappresenta lo storico
--  - gli ordini fanno SNAPSHOT (vedi order_ingredients)
--
--  Scelta fondamentale:
--  - se un ingrediente diventa non disponibile,
--    gli ordini già creati restano validi
-- ============================================================
CREATE TABLE ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Nome esteso visibile all’utente
  name VARCHAR(100) NOT NULL,

  -- Sigla breve usata dall’operatore
  code VARCHAR(50) NOT NULL,

  -- Categoria:
  -- - enum perché il dominio è chiuso
  -- - evita tabelle inutili
  category ENUM(
    'bread',
    'meat',
    'cheese',
    'vegetable',
    'sauce',
    'other'
  ) NOT NULL,

  -- Disponibilità:
  -- - TRUE  = ingrediente ordinabile
  -- - FALSE = ingrediente finito
  -- - NON invalida ordini esistenti
  available BOOLEAN NOT NULL DEFAULT 1
);



-- ============================================================
--  TABELLA: favorite_sandwiches
--
--  Politica:
--  - un panino preferito NON è un'entità globale
--  - è una configurazione salvata da un utente
--  - utenti diversi possono salvare la stessa combinazione
--
--  Non esiste deduplicazione volontaria:
--  - il matching è LOGICO (insiemi di ingredienti)
-- ============================================================
CREATE TABLE favorite_sandwiches (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Proprietario della configurazione
  user_id INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);



-- ============================================================
--  TABELLA: favorite_sandwich_ingredients
--
--  Politica:
--  - rappresenta la composizione di un panino preferito
--  - relazione N:N tra preferito e ingredienti
--  - quantità non previste (presenza/assenza)
-- ============================================================
CREATE TABLE favorite_sandwich_ingredients (
  favorite_sandwich_id INT NOT NULL,
  ingredient_id INT NOT NULL,

  PRIMARY KEY (favorite_sandwich_id, ingredient_id),

  FOREIGN KEY (favorite_sandwich_id)
    REFERENCES favorite_sandwiches(id)
    ON DELETE CASCADE,

  FOREIGN KEY (ingredient_id)
    REFERENCES ingredients(id)
);



-- ============================================================
--  TABELLA: working_days
--
--  Politica:
--  - rappresenta una GIORNATA lavorativa
--  - contiene parametri condivisi da tutti i time slot
--  - è il riferimento temporale principale
--
--  Scelte:
--  - il luogo è legato alla giornata
--  - max_time e max_orders sono condivisi
-- ============================================================
CREATE TABLE working_days (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Giorno di erogazione del servizio
  day DATE NOT NULL,

  -- Luogo fisico del servizio
  location VARCHAR(100) NOT NULL,

  -- Minuti prima dello slot entro cui l’ordine è modificabile
  max_time_minutes INT NOT NULL,

  -- Numero massimo di ordini per ciascun time slot
  max_orders_per_slot INT NOT NULL
);



-- ============================================================
--  TABELLA: time_slots
--
--  Politica:
--  - ogni slot appartiene a una sola giornata
--  - i limiti sono applicati per singolo slot
--  - l’atomicità è garantita dal backend (lock)
-- ============================================================
CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,

  working_day_id INT NOT NULL,

  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  FOREIGN KEY (working_day_id)
    REFERENCES working_days(id)
    ON DELETE CASCADE
);



-- ============================================================
--  TABELLA: orders
--
--  Politica:
--  - un ordine appartiene a:
--      - un utente
--      - un time slot
--  - il giorno si ricava dal time slot
--  - lo stato è volutamente NON vincolato rigidamente
--
--  Stato:
--  - può avanzare o retrocedere
--  - rejected può avvenire in qualunque momento
-- ============================================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,
  time_slot_id INT NOT NULL,

  status ENUM(
    'pending',
    'confirmed',
    'ready',
    'picked_up',
    'rejected'
  ) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id),

  FOREIGN KEY (time_slot_id)
    REFERENCES time_slots(id)
);



-- ============================================================
--  TABELLA: order_ingredients
--
--  Politica FONDAMENTALE:
--  - questa tabella è uno SNAPSHOT
--  - NON usa foreign key verso ingredients
--  - serve a congelare lo stato dell’ordine
--
--  Questo garantisce che:
--  - cambiamenti futuri agli ingredienti
--    NON alterino ordini passati
-- ============================================================
CREATE TABLE order_ingredients (
  order_id INT NOT NULL,

  -- Dati copiati al momento dell’ordine
  ingredient_name VARCHAR(100) NOT NULL,
  ingredient_code VARCHAR(50) NOT NULL,
  ingredient_category ENUM(
    'bread',
    'meat',
    'cheese',
    'vegetable',
    'sauce',
    'other'
  ) NOT NULL,

  PRIMARY KEY (order_id, ingredient_code),

  FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
);



-- ============================================================
--  FINE SCHEMA
--
--  Da questo momento in poi:
--  - il backend PHP implementa i casi d’uso
--  - la UI NON deve violare queste regole
-- ============================================================
