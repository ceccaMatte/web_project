# Database Entity-Relationship Diagram

Questo diagramma rappresenta la struttura del database dell'applicazione **Paninaro** basata sulle migration presenti nella directory `database/migrations`.

```mermaid
erDiagram
    %% ==========================================
    %% UTENTI E AUTENTICAZIONE
    %% ==========================================
    USERS {
        bigint id PK
        string name
        string nickname
        string email UK
        timestamp email_verified_at
        string password
        enum role "user | admin"
        boolean enabled "default true"
        string remember_token
        timestamp created_at
        timestamp updated_at
    }

    PASSWORD_RESET_TOKENS {
        string email PK
        string token
        timestamp created_at
    }

    SESSIONS {
        string id PK
        bigint user_id FK
        string ip_address
        text user_agent
        text payload
        int last_activity
    }

    %% ==========================================
    %% INGREDIENTI E PANINI
    %% ==========================================
    INGREDIENTS {
        bigint id PK
        string name
        string code
        enum category "bread | meat | cheese | vegetable | sauce | other"
        boolean is_available "default true"
        timestamp created_at
        timestamp updated_at
    }

    FAVORITE_SANDWICHES {
        bigint id PK
        bigint user_id FK
        string ingredient_configuration_id
        timestamp created_at
        timestamp updated_at
    }

    FAVORITE_SANDWICH_INGREDIENTS {
        bigint id PK
        bigint favorite_sandwich_id FK
        bigint ingredient_id FK
    }

    %% ==========================================
    %% PIANIFICAZIONE E SERVIZIO
    %% ==========================================
    WORKING_DAYS {
        bigint id PK
        date day UK
        string location
        int max_orders
        int max_time
        time start_time
        time end_time
        boolean is_active "default true"
        timestamp created_at
        timestamp updated_at
    }

    TIME_SLOTS {
        bigint id PK
        bigint working_day_id FK
        time start_time
        time end_time
        timestamp created_at
        timestamp updated_at
    }

    %% ==========================================
    %% ORDINI
    %% ==========================================
    ORDERS {
        bigint id PK
        bigint user_id FK
        bigint time_slot_id FK
        bigint working_day_id FK
        int daily_number "progressive per giorno"
        enum status "pending | confirmed | ready | picked_up | rejected"
        timestamp created_at
        timestamp updated_at
    }

    ORDER_INGREDIENTS {
        bigint id PK
        bigint order_id FK
        string name "snapshot"
        enum category "snapshot"
    }

    %% ==========================================
    %% RELAZIONI
    %% ==========================================
    
    %% User Relations
    USERS ||--o{ SESSIONS : "ha sessioni"
    USERS ||--o{ FAVORITE_SANDWICHES : "salva preferiti"
    USERS ||--o{ ORDERS : "effettua ordini"
    
    %% Favorite Sandwiches
    FAVORITE_SANDWICHES ||--o{ FAVORITE_SANDWICH_INGREDIENTS : "contiene"
    INGREDIENTS ||--o{ FAVORITE_SANDWICH_INGREDIENTS : "usato in"
    
    %% Working Days & Time Slots
    WORKING_DAYS ||--o{ TIME_SLOTS : "ha slot temporali"
    WORKING_DAYS ||--o{ ORDERS : "riceve ordini"
    
    %% Orders
    TIME_SLOTS ||--o{ ORDERS : "ospita ordini"
    ORDERS ||--o{ ORDER_INGREDIENTS : "contiene snapshot ingredienti"
    
    %% Password Reset
    USERS ||--o{ PASSWORD_RESET_TOKENS : "richiede reset password"
```

## Note Architetturali

### Gestione Ordini
- **daily_number**: Numero progressivo giornaliero degli ordini, garantisce unicità tramite constraint `UNIQUE(working_day_id, daily_number)`
- **order_ingredients**: Snapshot degli ingredienti al momento dell'ordine per storicizzazione
- Gli ordini sono legati sia a `time_slot_id` che a `working_day_id` per ottimizzare le query

### Panini Preferiti
- **ingredient_configuration_id**: Identificatore univoco della configurazione di ingredienti (16 caratteri)
- Relazione many-to-many tra `favorite_sandwiches` e `ingredients` tramite pivot table

### Giorni Lavorativi
- **is_active**: Flag per attivare/disattivare giorni senza eliminarli
- **max_orders** e **max_time**: Limiti configurabili per la gestione del carico di lavoro
- Ogni giorno ha più **time_slots** per gestire la distribuzione degli ordini

### Utenti
- **enabled**: Flag per disabilitare utenti senza eliminarli
- **role**: Enum per distinguere utenti normali da amministratori

### Ingredienti
- **is_available**: Gestione della disponibilità senza eliminazione fisica
- **category**: Categorizzazione per facilitare l'organizzazione nel form di ordine
