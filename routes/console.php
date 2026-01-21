<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * SCHEDULER: Conferma automatica ordini pending
 * ==============================================
 * 
 * Questo task esegue il comando 'orders:confirm-pending' ogni minuto.
 * 
 * LOGICA:
 * -------
 * Ogni minuto:
 * 1. Il comando legge gli ordini pending del giorno corrente
 * 2. Calcola la deadline per ogni ordine: slot_time - max_time
 * 3. Se NOW >= deadline, porta l'ordine a stato CONFIRMED
 * 
 * IDEMPOTENZA:
 * -----------
 * Il comando è completamente idempotente:
 * - Se un ordine è già confirmed, non lo modifica
 * - Se viene eseguito più volte nello stesso minuto, il risultato è lo stesso
 * - Non tocca ordini in altri stati (rejected, ready, picked_up)
 * 
 * PER ATTIVARE IN PRODUZIONE:
 * ---------------------------
 * Aggiungere questa riga al crontab del server:
 * * * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
 */
Schedule::command('orders:confirm-pending')
    ->everyMinute()
    ->withoutOverlapping();
