<?php

/**
 * Configurazione per il seeding del "Campus Truck / Paninaro".
 * 
 * Contiene le costanti di business che regolano:
 * - Durata dei time slot (15 minuti)
 * - Capacità massima per slot (10 ordini)
 * - Location di default
 * - Orari di servizio per le diverse settimane
 * 
 * NOTA: questi valori NON devono essere modificati nel seeding
 * perché sono costanti di business.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Durata Time Slot
    |--------------------------------------------------------------------------
    |
    | Costante di progetto: ogni time slot dura 15 minuti.
    | Non modificabile a runtime durante il seeding.
    |
    */
    'time_slot_minutes' => 15,

    /*
    |--------------------------------------------------------------------------
    | Capacità Max Ordini per Slot
    |--------------------------------------------------------------------------
    |
    | Numero massimo di ordini che possono essere creati per ogni time slot.
    | Nel seeding non supereremo mai questo valore.
    |
    */
    'max_orders_per_slot' => 10,

    /*
    |--------------------------------------------------------------------------
    | Location di Default
    |--------------------------------------------------------------------------
    |
    | Luogo principale dove il servizio è disponibile.
    | Usato nel seeding per tutti i working_days.
    |
    */
    'default_location' => 'Campus - Unibo Cesena',

    /*
    |--------------------------------------------------------------------------
    | Orari di Servizio - Settimane Passate
    |--------------------------------------------------------------------------
    |
    | Giorni lavorativi (Lunedì-Venerdì) in settimane passate (prima di oggi).
    | Ogni settimana passata avrà ANCHE un giorno "sospeso" casuale
    | (nessun working_day attivo per quel giorno).
    |
    */
    'past_weeks' => [
        'start_time' => '11:30',  // Orario apertura
        'end_time' => '14:30',    // Orario chiusura
    ],

    /*
    |--------------------------------------------------------------------------
    | Orari di Servizio - Settimana Corrente
    |--------------------------------------------------------------------------
    |
    | Giorni lavorativi (Lunedì-Venerdì) della settimana che contiene
    | il 29 gennaio 2026 (il "oggi" per il seeding).
    |
    */
    'current_week' => [
        'start_time' => '10:30',  // Orario apertura
        'end_time' => '15:00',    // Orario chiusura
    ],

    /*
    |--------------------------------------------------------------------------
    | Configurazione Seeding
    |--------------------------------------------------------------------------
    |
    | Parametri per il comportamento realistico dei dati fake.
    |
    */
    'seeding' => [
        // Numero di utenti normali da creare (+ 1 admin)
        'normal_users_count' => 5,

        // Range di ordini che un utente può fare in 30 giorni
        'user_orders_per_month_min' => 8,
        'user_orders_per_month_max' => 12,

        // Range di ordini per giorno quando un utente compra
        'orders_per_purchase_min' => 1,
        'orders_per_purchase_max' => 2,

        // Range di favorite sandwiches per utente
        'favorite_sandwiches_per_user_min' => 5,
        'favorite_sandwiches_per_user_max' => 7,

        // Range di ingredienti per favorite sandwich (escluso bread obbligatorio)
        'extra_ingredients_per_favorite_min' => 1,
        'extra_ingredients_per_favorite_max' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Categorie Ingredienti
    |--------------------------------------------------------------------------
    |
    | Elenco delle categorie di ingredienti gestite dal sistema.
    | Usato per validazione e organizzazione del catalogo.
    |
    */
    'ingredient_categories' => [
        'bread',
        'meat',
        'cheese',
        'vegetable',
        'sauce',
        'other',
    ],
];
