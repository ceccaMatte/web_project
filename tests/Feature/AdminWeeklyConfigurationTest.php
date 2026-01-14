<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per il controller AdminWeeklyConfigurationController.
 * Verifica che la configurazione settimanale funzioni correttamente
 * per admin autenticati, bloccando accessi non autorizzati e
 * rispettando le regole di non-retroattività.
 */
class AdminWeeklyConfigurationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Payload JSON realistico per i test.
     * Rappresenta una configurazione settimanale tipica.
     */
    private array $validPayload = [
        'max_orders' => 50,
        'max_time' => 30,
        'location' => 'Piazza Centrale',
        'days' => [
            'monday' => [
                'enabled' => true,
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'tuesday' => [
                'enabled' => true,
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'wednesday' => [
                'enabled' => true, // Modificato per test
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'thursday' => [
                'enabled' => true,
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'friday' => [
                'enabled' => true,
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'saturday' => [
                'enabled' => true, // Modificato per test
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
            'sunday' => [
                'enabled' => true, // Modificato per test
                'start_time' => '08:00',
                'end_time' => '18:00',
            ],
        ],
    ];

    /**
     * Setup per ogni test: congela la data a un venerdì per rendere i test deterministici.
     * Venerdì 8 gennaio 2026, così possiamo testare giorni passati e futuri.
     */
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::create(2026, 1, 8)); // Venerdì
    }

    /**
     * Test: utente guest (non autenticato) non può accedere all'endpoint.
     * Verifica che il middleware auth blocchi l'accesso.
     */
    public function test_guest_cannot_access_admin_weekly_configuration()
    {
        // Simula una richiesta senza autenticazione
        $response = $this->postJson('/admin/weekly-configuration', $this->validPayload);

        // Deve restituire errore 401 (Unauthorized)
        $response->assertStatus(401);

        // Verifica che non sia stato creato nessun working_day
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: utente autenticato ma non admin riceve 403 Forbidden.
     * Verifica che il middleware admin funzioni correttamente.
     */
    public function test_non_admin_user_cannot_access_admin_weekly_configuration()
    {
        // Crea un utente normale (non admin)
        $user = User::factory()->user()->create();

        // Simula richiesta autenticata come user normale
        $response = $this->actingAs($user)->postJson('/admin/weekly-configuration', $this->validPayload);

        // Deve restituire 403 Forbidden
        $response->assertStatus(403);

        // Verifica che non sia stato creato nessun working_day
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: admin può creare working_days per giorni futuri abilitati.
     * Verifica la logica principale: crea solo per giorni futuri enabled=true.
     */
    public function test_admin_can_create_future_working_days_from_weekly_configuration()
    {
        // Crea un admin
        $admin = User::factory()->admin()->create();

        // Simula richiesta come admin
        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $this->validPayload);

        // Deve restituire successo
        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Configurazione settimanale aggiornata con successo.',
                 ]);

        // Verifica che siano stati creati solo i giorni futuri abilitati
        // Oggi è venerdì 8/01/2026, quindi:
        // - Sabato 11/01 (futuro, enabled) → creato
        // - Domenica 12/01 (futuro, enabled) → creato
        // - Lunedì 13/01 (futuro, enabled) → creato
        // - Martedì 14/01 (futuro, enabled) → creato
        // - Mercoledì 15/01 (futuro, enabled) → creato
        // - Giovedì 9/01 (futuro, enabled) → creato
        // - Venerdì 10/01 (futuro, enabled) → creato

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-09 00:00:00', // Giovedì
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-10 00:00:00', // Venerdì
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-11 00:00:00', // Sabato
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-12 00:00:00', // Domenica
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-13 00:00:00', // Lunedì
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-14 00:00:00', // Martedì
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-15 00:00:00', // Mercoledì
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        // Totale working_days creati: 7 (tutti i giorni futuri)
        $this->assertDatabaseCount('working_days', 7);
    }

    /**
     * Test: giorni passati non vengono modificati.
     * Verifica la regola fondamentale di non-retroattività.
     */
    public function test_past_working_days_are_not_modified()
    {
        // Crea un admin
        $admin = User::factory()->admin()->create();

        // Crea un working_day per un giorno passato (giovedì scorso)
        WorkingDay::create([
            'day' => '2026-01-07', // Giovedì passato
            'location' => 'Vecchio Luogo',
            'max_orders' => 10,
            'max_time' => 15,
            'start_time' => '09:00',
            'end_time' => '17:00',
        ]);

        // Simula richiesta come admin
        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $this->validPayload);

        // Deve restituire successo
        $response->assertStatus(200);

        // Verifica che il working_day passato NON sia stato modificato
        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-07 00:00:00',
            'location' => 'Vecchio Luogo', // Non cambiato
            'max_orders' => 10, // Non cambiato
            'max_time' => 15, // Non cambiato
            'start_time' => '09:00', // Non cambiato
            'end_time' => '17:00', // Non cambiato
        ]);

        // Verifica che siano stati creati solo i giorni futuri abilitati
        $this->assertDatabaseCount('working_days', 8); // 1 passato + 7 futuri
    }

    /**
     * Test: working_days esistenti futuri non vengono modificati.
     * Verifica che non si aggiornino working_days già presenti.
     */
    public function test_existing_future_working_days_are_not_modified()
    {
        // Crea un admin
        $admin = User::factory()->admin()->create();

        // Crea un working_day esistente per il prossimo lunedì
        WorkingDay::create([
            'day' => '2026-01-12', // Prossimo lunedì
            'location' => 'Vecchio Luogo',
            'max_orders' => 10,
            'max_time' => 15,
            'start_time' => '09:00',
            'end_time' => '17:00',
        ]);

        // Simula richiesta come admin (lunedì è enabled=true)
        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $this->validPayload);

        // Deve restituire successo
        $response->assertStatus(200);

        // Verifica che il working_day esistente NON sia stato modificato
        $this->assertDatabaseHas('working_days', [
            'day' => '2026-01-12 00:00:00',
            'location' => 'Vecchio Luogo', // Non cambiato
            'max_orders' => 10, // Non cambiato
            'max_time' => 15, // Non cambiato
            'start_time' => '09:00', // Non cambiato
            'end_time' => '17:00', // Non cambiato
        ]);

        // Gli altri giorni futuri abilitati devono essere creati
        $this->assertDatabaseCount('working_days', 7); // 1 esistente + 6 nuovi
    }

    /**
     * Test: idempotenza - seconda chiamata con stessa configurazione non cambia nulla.
     * Verifica che il sistema sia idempotente.
     */
    public function test_weekly_configuration_is_idempotent()
    {
        // Crea un admin
        $admin = User::factory()->admin()->create();

        // Prima chiamata
        $response1 = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $this->validPayload);
        $response1->assertStatus(200);

        // Conta i working_days dopo la prima chiamata
        $countAfterFirst = WorkingDay::count();

        // Seconda chiamata con stessa configurazione
        $response2 = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $this->validPayload);
        $response2->assertStatus(200);

        // Conta i working_days dopo la seconda chiamata
        $countAfterSecond = WorkingDay::count();

        // Deve essere invariato
        $this->assertEquals($countAfterFirst, $countAfterSecond);

        // Verifica che tutti i working_days siano ancora presenti
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-09 00:00:00']); // Giovedì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-10 00:00:00']); // Venerdì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-11 00:00:00']); // Sabato
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-12 00:00:00']); // Domenica
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-13 00:00:00']); // Lunedì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-14 00:00:00']); // Martedì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-15 00:00:00']); // Mercoledì
    }

    /**
     * Test: validazione - max_orders non valido restituisce 422.
     */
    public function test_validation_fails_for_invalid_max_orders()
    {
        $admin = User::factory()->admin()->create();

        $invalidPayload = $this->validPayload;
        $invalidPayload['max_orders'] = 0; // Non valido (deve essere > 0)

        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $invalidPayload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['max_orders']);

        // Nessun working_day creato
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: validazione - max_time negativo restituisce 422.
     */
    public function test_validation_fails_for_negative_max_time()
    {
        $admin = User::factory()->admin()->create();

        $invalidPayload = $this->validPayload;
        $invalidPayload['max_time'] = -1; // Non valido (deve essere >= 0)

        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $invalidPayload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['max_time']);

        // Nessun working_day creato
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: validazione - giorno abilitato senza start_time restituisce 422.
     */
    public function test_validation_fails_for_enabled_day_without_start_time()
    {
        $admin = User::factory()->admin()->create();

        $invalidPayload = $this->validPayload;
        unset($invalidPayload['days']['monday']['start_time']); // Rimuove start_time

        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $invalidPayload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['days.monday.start_time']);

        // Nessun working_day creato
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: validazione - end_time <= start_time restituisce 422.
     */
    public function test_validation_fails_for_end_time_before_start_time()
    {
        $admin = User::factory()->admin()->create();

        $invalidPayload = $this->validPayload;
        $invalidPayload['days']['monday']['end_time'] = '07:00'; // Prima di start_time

        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $invalidPayload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['days.monday.end_time']);

        // Nessun working_day creato
        $this->assertDatabaseCount('working_days', 0);
    }

    /**
     * Test: eliminazione working_days futuri disabilitati.
     * Nota: Nella implementazione attuale, l'eliminazione avviene sempre.
     * Se in futuro si aggiungeranno controlli per ordini esistenti, questo test
     * dovrà essere aggiornato per riflettere il comportamento corretto.
     */
    public function test_admin_can_delete_future_working_days_when_disabled()
    {
        // Crea un admin
        $admin = User::factory()->admin()->create();

        // Payload con solo lunedì, martedì, mercoledì abilitati
        $payloadWithSomeDisabled = [
            'max_orders' => 50,
            'max_time' => 30,
            'location' => 'Piazza Centrale',
            'days' => [
                'monday' => [
                    'enabled' => true,
                    'start_time' => '08:00',
                    'end_time' => '18:00',
                ],
                'tuesday' => [
                    'enabled' => true,
                    'start_time' => '08:00',
                    'end_time' => '18:00',
                ],
                'wednesday' => [
                    'enabled' => true,
                    'start_time' => '08:00',
                    'end_time' => '18:00',
                ],
                'thursday' => [
                    'enabled' => false, // Disabilitato
                ],
                'friday' => [
                    'enabled' => false, // Disabilitato
                ],
                'saturday' => [
                    'enabled' => false, // Disabilitato
                ],
                'sunday' => [
                    'enabled' => false, // Disabilitato
                ],
            ],
        ];

        // Crea working_days esistenti per giorni che saranno disabilitati
        WorkingDay::create([
            'day' => '2026-01-09', // Venerdì prossimo (sarà disabled)
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        WorkingDay::create([
            'day' => '2026-01-15', // Giovedì prossimo (sarà disabled)
            'location' => 'Piazza Centrale',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '08:00',
            'end_time' => '18:00',
        ]);

        // Simula richiesta come admin
        $response = $this->actingAs($admin)->postJson('/admin/weekly-configuration', $payloadWithSomeDisabled);

        // Deve restituire successo
        $response->assertStatus(200);

        // Verifica che i working_days disabilitati siano stati eliminati
        $this->assertDatabaseMissing('working_days', ['day' => '2026-01-09 00:00:00']); // Venerdì eliminato
        $this->assertDatabaseMissing('working_days', ['day' => '2026-01-15 00:00:00']); // Giovedì eliminato

        // I giorni abilitati devono essere presenti
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-12 00:00:00']); // Lunedì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-13 00:00:00']); // Martedì
        $this->assertDatabaseHas('working_days', ['day' => '2026-01-14 00:00:00']); // Mercoledì

        // Totale: eliminati 2, creati 3 nuovi abilitati = 3 working_days
        $this->assertDatabaseCount('working_days', 3);
    }
}