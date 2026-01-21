<?php

/**
 * Configurazione degli slot temporali.
 * 
 * La durata è una costante di progetto per garantire:
 * - Prevedibilità del sistema
 * - Coerenza tra tutti i working_days
 * - Semplicità nella gestione degli ordini
 */

return [
    // Slot duration fixed to 15 minutes
    'duration_minutes' => 15,
];
