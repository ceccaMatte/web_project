<?php

namespace Tests\Feature;

use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use App\Services\TimeSlotGeneratorService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per la generazione automatica degli slot temporali.
 * 
 * Verifica che:
 * - Gli slot siano generati correttamente
 * - Non ci siano sovrapposizioni
 * - La generazione sia idempotente
 * - La cancellazione sia cascata
 * - Venga rispettata la durata configurata
 */
class TimeSlotGenerationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Service per la generazione degli slot.
     */
    private TimeSlotGeneratorService $service;

    /**
     * Setup per ogni test: inizializza il service e congela la data.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TimeSlotGeneratorService::class);
        Carbon::setTestNow(Carbon::create(2026, 1, 8)); // Venerdì
    }

    /**
     * Test: verifica che il numero di slot generati sia corretto.
     * 
     * Esempio: dalle 08:00 alle 18:00 (10 ore = 600 minuti)
     * con slot da 15 minuti = 600 / 15 = 40 slot
     */
    public function test_generates_correct_number_of_slots()
    {
        // Crea un working_day con orario 08:00 - 18:00
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        // Genera gli slot
        $count = $this->service->generate($workingDay);

        // Verifica numero corretto: 10 ore * 60 min / 15 min = 40 slot
        $this->assertEquals(40, $count);
        $this->assertDatabaseCount('time_slots', 40);
    }

    /**
     * Test: verifica che gli orari degli slot siano corretti.
     * 
     * Primo slot: 08:00 - 08:15
     * Ultimo slot: 17:45 - 18:00
     */
    public function test_slot_times_are_correct()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->service->generate($workingDay);

        // Primo slot
        $firstSlot = TimeSlot::where('working_day_id', $workingDay->id)
                             ->orderBy('start_time')
                             ->first();
        
        $this->assertEquals('08:00:00', $firstSlot->start_time);
        $this->assertEquals('08:15:00', $firstSlot->end_time);

        // Ultimo slot
        $lastSlot = TimeSlot::where('working_day_id', $workingDay->id)
                            ->orderBy('start_time', 'desc')
                            ->first();
        
        $this->assertEquals('17:45:00', $lastSlot->start_time);
        $this->assertEquals('18:00:00', $lastSlot->end_time);
    }

    /**
     * Test: verifica che non ci siano sovrapposizioni tra slot.
     * 
     * Ogni slot deve terminare esattamente quando inizia il successivo.
     */
    public function test_slots_do_not_overlap()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '12:00',
        ]);

        $this->service->generate($workingDay);

        // Ottiene tutti gli slot ordinati
        $slots = TimeSlot::where('working_day_id', $workingDay->id)
                         ->orderBy('start_time')
                         ->get();

        // Verifica che ogni slot termini quando inizia il successivo
        for ($i = 0; $i < count($slots) - 1; $i++) {
            $currentEnd = $slots[$i]->end_time;
            $nextStart = $slots[$i + 1]->start_time;
            
            $this->assertEquals($currentEnd, $nextStart, 
                "Lo slot {$i} termina a {$currentEnd} ma il successivo inizia a {$nextStart}");
        }
    }

    /**
     * Test: verifica che ogni slot appartenga al working_day corretto.
     */
    public function test_slots_belong_to_correct_working_day()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        $this->service->generate($workingDay);

        // Tutti gli slot devono avere il working_day_id corretto
        $allSlotsHaveCorrectId = TimeSlot::where('working_day_id', $workingDay->id)
                                         ->count() === TimeSlot::count();
        
        $this->assertTrue($allSlotsHaveCorrectId);

        // Verifica anche la relazione Eloquent
        $this->assertCount(8, $workingDay->timeSlots);
    }

    /**
     * Test: verifica idempotenza della generazione.
     * 
     * Chiamare il service due volte non deve creare duplicati.
     */
    public function test_generation_is_idempotent()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        // Prima chiamata
        $count1 = $this->service->generate($workingDay);
        $this->assertEquals(8, $count1);

        // Seconda chiamata: deve restituire 0 (nessuno slot creato)
        $count2 = $this->service->generate($workingDay);
        $this->assertEquals(0, $count2);

        // Verifica che il totale sia sempre 8
        $this->assertDatabaseCount('time_slots', 8);
    }

    /**
     * Test: verifica cancellazione cascata degli slot.
     * 
     * Eliminando il working_day, devono essere eliminati anche gli slot.
     */
    public function test_slots_are_deleted_when_working_day_is_deleted()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        $this->service->generate($workingDay);
        $this->assertDatabaseCount('time_slots', 8);

        // Elimina il working_day
        $workingDay->delete();

        // Gli slot devono essere stati eliminati automaticamente
        $this->assertDatabaseCount('time_slots', 0);
    }

    /**
     * Test: verifica che venga rispettata la durata configurata.
     * 
     * Ogni slot deve avere esattamente la durata definita in config.
     */
    public function test_respects_configured_duration()
    {
        // Ottiene la durata configurata
        $durationMinutes = config('time_slots.duration_minutes');
        $this->assertEquals(15, $durationMinutes, 'La durata deve essere 15 minuti');

        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $this->service->generate($workingDay);

        // Verifica che ogni slot abbia durata di 15 minuti
        $slots = TimeSlot::where('working_day_id', $workingDay->id)->get();
        
        foreach ($slots as $slot) {
            $start = Carbon::parse($slot->start_time);
            $end = Carbon::parse($slot->end_time);
            $duration = $start->diffInMinutes($end);
            
            $this->assertEquals(15, $duration, 
                "Lo slot {$slot->start_time} - {$slot->end_time} deve durare 15 minuti, non {$duration}");
        }
    }

    /**
     * Test: verifica che gli slot vengano generati automaticamente
     * tramite il controller nella stessa transazione.
     */
    public function test_slots_generated_automatically_via_controller()
    {
        $admin = User::factory()->admin()->create();

        $payload = [
            'max_orders' => 50,
            'max_time' => 30,
            'location' => 'Piazza Centrale',
            'days' => [
                'monday' => [
                    'enabled' => true,
                    'start_time' => '08:00',
                    'end_time' => '10:00',
                ],
                'tuesday' => ['enabled' => false],
                'wednesday' => ['enabled' => false],
                'thursday' => ['enabled' => false],
                'friday' => ['enabled' => false],
                'saturday' => ['enabled' => false],
                'sunday' => ['enabled' => false],
            ],
        ];

        // Chiama il controller
        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $payload);
        
        $response->assertStatus(200);

        // Verifica che sia stato creato il working_day
        $this->assertDatabaseCount('working_days', 1);

        // Verifica che siano stati generati gli slot automaticamente
        $workingDay = WorkingDay::first();
        $this->assertNotNull($workingDay);
        $this->assertEquals(8, $workingDay->timeSlots()->count());
    }

    /**
     * Test: verifica comportamento con orari non multipli della durata.
     * 
     * Esempio: 08:00 - 10:07 con slot da 15 minuti
     * L'ultimo slot deve essere troncato a 10:07
     */
    public function test_handles_non_multiple_duration_correctly()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '08:37', // 37 minuti = 2 slot da 15 + 1 slot da 7
        ]);

        $this->service->generate($workingDay);

        $slots = TimeSlot::where('working_day_id', $workingDay->id)
                         ->orderBy('start_time')
                         ->get();

        // Deve creare 3 slot
        $this->assertCount(3, $slots);

        // Verifica il terzo slot (troncato)
        $lastSlot = $slots->last();
        $this->assertEquals('08:30:00', $lastSlot->start_time);
        $this->assertEquals('08:37:00', $lastSlot->end_time);
    }

    /**
     * Test: verifica che non vengano creati slot se start_time >= end_time.
     */
    public function test_does_not_generate_slots_if_invalid_times()
    {
        $workingDay = WorkingDay::create([
            'day' => '2026-01-10',
            'location' => 'Piazza Test',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '18:00',
            'end_time' => '08:00', // Fine prima di inizio
        ]);

        $count = $this->service->generate($workingDay);

        $this->assertEquals(0, $count);
        $this->assertDatabaseCount('time_slots', 0);
    }
}
