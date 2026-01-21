<?php

namespace App\Console\Commands;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Conferma automatica degli ordini pending alla scadenza della deadline
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
    protected $description = 'Conferma gli ordini pending oltre la deadline';

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
        $now = Carbon::now();
        $today = $now->toDateString();

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

        $confirmedCount = 0;

        foreach ($pendingOrders as $order) {
            $dayOnly = Carbon::parse($order->working_day)->toDateString();
            $slotDatetime = Carbon::parse($dayOnly . ' ' . $order->slot_start_time);

            // max_time può essere NULL su dati legacy → fallback 0
            $maxTimeMinutes = $order->max_time ?? 0;
            $deadline = $slotDatetime->copy()->subMinutes($maxTimeMinutes);

            if ($now->greaterThanOrEqualTo($deadline)) {
                DB::transaction(function () use ($order) {
                    $order->status = 'confirmed';
                    $order->save();
                });

                $confirmedCount++;
            }
        }

        $logMessage = "Auto-confirmed {$confirmedCount} orders for {$today}";
        Log::info($logMessage);
        $this->info($logMessage);

        return Command::SUCCESS;
    }
}
