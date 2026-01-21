<?php

namespace App\Console\Commands;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Comando Artisan per confermare automaticamente gli ordini pending.
 * 
 * PERCHÉ LA LOGICA È SERVER-SIDE:
 * ===============================
 * La conferma automatica degli ordini DEVE essere gestita lato server perché:
 * 1. Non dipende dalla presenza dell'utente sul sito
 * 2. Non dipende dal browser o dal dispositivo
 * 3. È garantita anche se nessun utente è connesso
 * 4. È immune a manipolazioni client-side
 * 5. Viene eseguita in modo consistente e affidabile dal cron
 * 
 * PERCHÉ LA DEADLINE È slot_time - max_time:
 * ==========================================
 * Il parametro max_time rappresenta il tempo MASSIMO di anticipo con cui
 * un cliente può modificare o cancellare il proprio ordine.
 * 
 * Esempio pratico:
 * - Slot ritiro: 12:00
 * - max_time: 30 minuti
 * - Deadline: 11:30
 * 
 * Significa che:
 * - Fino alle 11:29, il cliente può ancora modificare l'ordine (pending)
 * - Dalle 11:30 in poi, l'ordine viene "bloccato" (confirmed)
 *   perché il food-truck deve iniziare a prepararlo
 * 
 * Questo garantisce che:
 * - Il cliente abbia tempo sufficiente per modifiche
 * - Il food-truck abbia certezza sugli ordini da preparare
 */
class ConfirmPendingOrders extends Command
{
    /**
     * Nome e signature del comando.
     * 
     * Uso: php artisan orders:confirm-pending
     *
     * @var string
     */
    protected $signature = 'orders:confirm-pending';

    /**
     * Descrizione del comando (visibile in php artisan list).
     *
     * @var string
     */
    protected $description = 'Conferma automaticamente gli ordini pending quando viene superata la deadline (slot_time - max_time)';

    /**
     * Esegue il comando.
     * 
     * LOGICA:
     * -------
     * 1. Determina la data odierna usando il timezone Laravel
     * 2. Recupera SOLO gli ordini pending del giorno corrente
     * 3. Per ogni ordine calcola la deadline
     * 4. Se NOW >= deadline, porta l'ordine a CONFIRMED
     * 
     * IDEMPOTENZA:
     * -----------
     * Il comando è completamente idempotente:
     * - Agisce SOLO su ordini in stato 'pending'
     * - Non tocca mai ordini in altri stati
     * - Può essere eseguito più volte senza effetti collaterali
     *
     * @return int
     */
    public function handle(): int
    {
        // Ottiene la data e ora corrente nel timezone dell'applicazione
        // Il timezone è configurato in config/app.php
        $now = Carbon::now();
        $today = $now->toDateString(); // Formato: 2026-01-21

        $this->info("Esecuzione conferma automatica ordini per il {$today}");
        $this->info("Ora corrente: {$now->toDateTimeString()}");

        // Query per recuperare SOLO gli ordini pending del giorno corrente
        // 
        // OTTIMIZZAZIONE:
        // Filtriamo PRIMA nel database per evitare di caricare ordini inutili.
        // La query seleziona solo gli ordini che:
        // - Sono in stato 'pending'
        // - Appartengono a un working_day con day = oggi
        $pendingOrders = Order::query()
            ->select([
                'orders.*',
                'time_slots.start_time as slot_start_time',
                'working_days.day as working_day',
                'working_days.max_time as max_time'
            ])
            ->join('time_slots', 'orders.time_slot_id', '=', 'time_slots.id')
            ->join('working_days', 'time_slots.working_day_id', '=', 'working_days.id')
            ->where('orders.status', 'pending')
            ->whereDate('working_days.day', $today)
            ->get();

        $this->info("Trovati {$pendingOrders->count()} ordini pending per oggi");

        $confirmedCount = 0;

        foreach ($pendingOrders as $order) {
            // Costruisce il datetime completo dello slot
            // Combina: working_day.day (solo data) + time_slot.start_time
            // NOTA: SQLite può salvare le date come '2026-01-21 00:00:00'
            // quindi usiamo Carbon per estrarre solo la data
            $dayOnly = Carbon::parse($order->working_day)->toDateString();
            $slotDatetime = Carbon::parse($dayOnly . ' ' . $order->slot_start_time);

            // Calcola la deadline sottraendo max_time minuti
            // FALLBACK: se max_time è NULL, usa 0 (deadline = slot_time esatto)
            $maxTimeMinutes = $order->max_time ?? 0;
            $deadline = $slotDatetime->copy()->subMinutes($maxTimeMinutes);

            // Debug info per ogni ordine
            $this->line("  Ordine #{$order->id}: slot={$slotDatetime->toTimeString()}, max_time={$maxTimeMinutes}min, deadline={$deadline->toDateTimeString()}");

            // Verifica se la deadline è stata superata
            // now >= deadline significa che l'ordine deve essere confermato
            if ($now->greaterThanOrEqualTo($deadline)) {
                // Aggiorna lo stato in modo atomico
                // Usiamo un update diretto per garantire atomicità
                DB::transaction(function () use ($order) {
                    $order->status = 'confirmed';
                    $order->save();
                });

                $confirmedCount++;
                $this->info("    → Confermato ordine #{$order->id}");
            } else {
                $this->line("    → Ancora in attesa (mancano " . $now->diffInMinutes($deadline) . " minuti)");
            }
        }

        // Log del risultato per monitoraggio
        $logMessage = "Auto-confirmed {$confirmedCount} orders for {$today}";
        Log::info($logMessage);
        $this->info($logMessage);

        return Command::SUCCESS;
    }
}
