<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkingDay;
use App\Models\TimeSlot;
use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * SEEDER PER DATI DI TEST
 * 
 * Popola il database con dati realistici per sviluppo locale.
 * 
 * ✅ Crea:
 * - 3 utenti (1 loggabile principale, 2 aggiuntivi)
 * - WorkingDay per oggi (con time slots)
 * - WorkingDay per domani (con time slots)
 * - 5 ordini per oggi (stati: pending, confirmed, ready, picked_up, rejected)
 * 
 * 🔐 CREDENZIALI DI TEST:
 * - Email: mario@test.it
 * - Password: password
 * 
 * 📝 ESECUZIONE:
 * php artisan db:seed --class=TestDataSeeder
 */
class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Disabilita foreign key constraints per truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Svuota le tabelle (ordine inverso delle dipendenze)
        Order::truncate();
        TimeSlot::truncate();
        WorkingDay::truncate();
        User::truncate();

        // Riabilita foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ============================================
        // 1️⃣  CREA UTENTI
        // ============================================
        
        $userMario = User::create([
            'name' => 'Mario Rossi',
            'nickname' => 'Mario',
            'email' => 'mario@test.it',
            'password' => 'password', // Hash automatico tramite cast 'hashed'
            'role' => 'user',
            'enabled' => true,
        ]);

        $userLuigi = User::create([
            'name' => 'Luigi Bianchi',
            'nickname' => 'Luigi',
            'email' => 'luigi@test.it',
            'password' => 'password',
            'role' => 'user',
            'enabled' => true,
        ]);

        $userAdmin = User::create([
            'name' => 'Admin User',
            'nickname' => 'Admin',
            'email' => 'admin@test.it',
            'password' => 'password',
            'role' => 'admin',
            'enabled' => true,
        ]);

        echo "✅ Creati 3 utenti\n";

        // ============================================
        // 2️⃣  CREA WORKING DAY OGGI
        // ============================================
        
        $today = now()->toDateString();
        $todayWorkingDay = WorkingDay::create([
            'day' => $today,
            'location' => 'Piazza Centrale - Engineering Hub',
            'max_orders' => 20,
            'max_time' => 30, // 30 minuti per modificare ordine
            'start_time' => '11:00',
            'end_time' => '13:00',
            'is_active' => true,
        ]);

        echo "✅ Creato WorkingDay per oggi: {$today}\n";

        // ============================================
        // 3️⃣  CREA TIME SLOTS PER OGGI
        // ============================================
        
        $todaySlots = $this->createTimeSlots($todayWorkingDay, '11:00', '12:30', 15); // 15 min interval

        echo "✅ Creati " . count($todaySlots) . " time slots per oggi\n";

        // ============================================
        // 4️⃣  CREA WORKING DAY DOMANI
        // ============================================
        
        $tomorrow = now()->addDay()->toDateString();
        $tomorrowWorkingDay = WorkingDay::create([
            'day' => $tomorrow,
            'location' => 'Piazza Centrale - Engineering Hub',
            'max_orders' => 20,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '13:00',
            'is_active' => true,
        ]);

        echo "✅ Creato WorkingDay per domani: {$tomorrow}\n";

        // ============================================
        // 5️⃣  CREA TIME SLOTS PER DOMANI
        // ============================================
        
        $tomorrowSlots = $this->createTimeSlots($tomorrowWorkingDay, '11:00', '12:30', 15);

        echo "✅ Creati " . count($tomorrowSlots) . " time slots per domani\n";

        // ============================================
        // 6️⃣  CREA ORDINI PER OGGI
        // ============================================
        
        $orderStatuses = ['pending', 'confirmed', 'ready', 'picked_up', 'rejected'];

        foreach ($orderStatuses as $index => $status) {
            Order::create([
                'user_id' => $userMario->id,
                'time_slot_id' => $todaySlots[$index]->id,
                'working_day_id' => $todayWorkingDay->id,
                'status' => $status,
            ]);
        }

        // Ordine extra per Luigi (stato: pending)
        Order::create([
            'user_id' => $userLuigi->id,
            'time_slot_id' => $todaySlots[1]->id,
            'working_day_id' => $todayWorkingDay->id,
            'status' => 'pending',
        ]);

        echo "✅ Creati 6 ordini per oggi (stati: pending, confirmed, ready, picked_up, rejected)\n";

        // ============================================
        // RIEPILOGO
        // ============================================
        
        echo "\n";
        echo "╔════════════════════════════════════════════╗\n";
        echo "║   📊 SEED COMPLETATO                       ║\n";
        echo "╠════════════════════════════════════════════╣\n";
        echo "║ 👤 Utenti: 3                              ║\n";
        echo "║    - mario@test.it (password)             ║\n";
        echo "║    - luigi@test.it (password)             ║\n";
        echo "║    - admin@test.it (password, admin)      ║\n";
        echo "║                                            ║\n";
        echo "║ 📅 Working Days: 2                         ║\n";
        echo "║    - Oggi: " . $today . "                 ║\n";
        echo "║    - Domani: " . $tomorrow . "               ║\n";
        echo "║                                            ║\n";
        echo "║ ⏰ Time Slots: " . (count($todaySlots) + count($tomorrowSlots)) . "                          ║\n";
        echo "║    - Oggi: " . count($todaySlots) . " slot                        ║\n";
        echo "║    - Domani: " . count($tomorrowSlots) . " slot                        ║\n";
        echo "║                                            ║\n";
        echo "║ 🛒 Ordini: 6                              ║\n";
        echo "║    - Pending: 2                            ║\n";
        echo "║    - Confirmed: 1                          ║\n";
        echo "║    - Ready: 1                              ║\n";
        echo "║    - Picked up: 1                          ║\n";
        echo "║    - Rejected: 1                           ║\n";
        echo "╚════════════════════════════════════════════╝\n";
    }

    /**
     * Helper: crea time slots per un working day
     * 
     * @param WorkingDay $workingDay
     * @param string $startTime (es. "11:00")
     * @param string $endTime (es. "12:30")
     * @param int $intervalMinutes (es. 15)
     * 
     * @return array di TimeSlot creati
     */
    private function createTimeSlots(WorkingDay $workingDay, string $startTime, string $endTime, int $intervalMinutes): array
    {
        $slots = [];
        
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = Carbon::createFromFormat('H:i', $endTime);

        while ($start < $end) {
            $slotEnd = $start->clone()->addMinutes($intervalMinutes);

            $slot = TimeSlot::create([
                'working_day_id' => $workingDay->id,
                'start_time' => $start->format('H:i:s'),
                'end_time' => $slotEnd->format('H:i:s'),
            ]);

            $slots[] = $slot;
            $start = $slotEnd;
        }

        return $slots;
    }
}
