<?php

/**
 * Configurazione Service Planning.
 * 
 * Contiene i valori di DEFAULT per la pagina Service Planning.
 * Questi valori vengono utilizzati quando non esistono working_days
 * per la settimana selezionata.
 * 
 * I valori effettivi vengono persistiti nei working_days e time_slots.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Default Max Orders Per Slot
    |--------------------------------------------------------------------------
    |
    | Numero massimo di ordini per ogni time slot.
    | Questo è il valore di default quando si attiva un nuovo giorno.
    |
    */
    'default_max_orders_per_slot' => 10,

    /*
    |--------------------------------------------------------------------------
    | Default Max Pending Time
    |--------------------------------------------------------------------------
    |
    | Minuti prima dell'inizio dello slot oltre i quali
    | l'ordine non è più modificabile dall'utente.
    |
    */
    'default_max_pending_time' => 30,

    /*
    |--------------------------------------------------------------------------
    | Default Location
    |--------------------------------------------------------------------------
    |
    | Luogo di default dove opera il servizio.
    | Viene salvato nel campo location di ogni working_day creato.
    |
    */
    'default_location' => 'Piazza Centrale - Engineering Hub',

    /*
    |--------------------------------------------------------------------------
    | Default Day Start Time
    |--------------------------------------------------------------------------
    |
    | Orario di inizio servizio di default (formato 24H).
    | Utilizzato quando si attiva un nuovo giorno lavorativo.
    |
    */
    'default_day_start_time' => '12:00',

    /*
    |--------------------------------------------------------------------------
    | Default Day End Time
    |--------------------------------------------------------------------------
    |
    | Orario di fine servizio di default (formato 24H).
    | L'ultimo slot inizia prima di questo orario.
    |
    */
    'default_day_end_time' => '20:00',

    /*
    |--------------------------------------------------------------------------
    | Time Slot Duration
    |--------------------------------------------------------------------------
    |
    | Durata in minuti di ogni time slot.
    | Valore fisso, non modificabile a runtime.
    | Tutti gli orari devono essere multipli di questa durata.
    |
    */
    'time_slot_duration' => 15,
];
