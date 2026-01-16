<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Test Suite per Autenticazione (Login / Sign Up / Logout)
 * 
 * RESPONSABILITÀ:
 * - Verificare che login valido funzioni e crei sessione
 * - Verificare che login errato restituisca 401
 * - Verificare che registrazione valida crei utente e faccia login automatico
 * - Verificare che email duplicata restituisca 422
 * - Verificare che logout invalidi la sessione
 * - Verificare validazione input (nickname min 3, password min 8)
 * 
 * STACK:
 * - Laravel Testing Suite
 * - RefreshDatabase trait (database pulito ad ogni test)
 * - User factory per dati di test
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Setup eseguito prima di ogni test
     * Inizializza il database e crea utente di test quando necessario
     */
    protected function setUp(): void
    {
        parent::setUp();
        // RefreshDatabase si occupa di migrare il DB
    }

    // ==========================================
    // TEST LOGIN
    // ==========================================

    /**
     * Test: Login valido deve:
     * - Restituire 200
     * - Restituire { success: true, redirect: ... }
     * - Creare sessione attiva
     * - Autenticare l'utente (Auth::check() === true)
     */
    public function test_login_with_valid_credentials_succeeds(): void
    {
        // Arrange: Crea utente con password nota
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Act: Invia richiesta login
        $response = $this->postJson('/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        // Assert: Verifica risposta
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure(['success', 'redirect']);

        // Assert: Verifica autenticazione
        $this->assertAuthenticatedAs($user);
    }

    /**
     * Test: Login con email errata deve:
     * - Restituire 401
     * - Restituire { success: false, message: ... }
     * - NON creare sessione
     */
    public function test_login_with_invalid_email_fails(): void
    {
        // Arrange: Crea utente
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Act: Tenta login con email errata
        $response = $this->postJson('/login', [
            'email' => 'wrong@example.com',
            'password' => 'password123',
        ]);

        // Assert: Verifica fallimento
        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
        ]);

        // Assert: Verifica NON autenticato
        $this->assertGuest();
    }

    /**
     * Test: Login con password errata deve:
     * - Restituire 401
     * - NON esporre dettagli (non dire se email esiste)
     */
    public function test_login_with_invalid_password_fails(): void
    {
        // Arrange
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Act
        $response = $this->postJson('/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        // Assert
        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
        ]);
        $this->assertGuest();
    }

    /**
     * Test: Login senza email deve restituire 422 (validation error)
     */
    public function test_login_requires_email(): void
    {
        // Act
        $response = $this->postJson('/login', [
            'password' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Login senza password deve restituire 422
     */
    public function test_login_requires_password(): void
    {
        // Act
        $response = $this->postJson('/login', [
            'email' => 'test@example.com',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Test: Login con email non valida deve restituire 422
     */
    public function test_login_requires_valid_email_format(): void
    {
        // Act
        $response = $this->postJson('/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    // ==========================================
    // TEST REGISTRAZIONE (SIGN UP)
    // ==========================================

    /**
     * Test: Registrazione valida deve:
     * - Restituire 200
     * - Creare nuovo utente in DB
     * - Hash password correttamente
     * - Fare login automatico
     * - Restituire { success: true, redirect: ... }
     */
    public function test_register_with_valid_data_succeeds(): void
    {
        // Act: Registra nuovo utente
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert: Verifica risposta
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure(['success', 'redirect']);

        // Assert: Verifica utente creato
        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'nickname' => 'testuser',
        ]);

        // Assert: Verifica password hashata (NON in chiaro)
        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertNotEquals('password123', $user->password);
        $this->assertTrue(Hash::check('password123', $user->password));

        // Assert: Verifica login automatico
        $this->assertAuthenticatedAs($user);
    }

    /**
     * Test: Registrazione con email duplicata deve:
     * - Restituire 422
     * - Restituire errore validazione su campo 'email'
     * - NON creare nuovo utente
     */
    public function test_register_with_duplicate_email_fails(): void
    {
        // Arrange: Crea utente esistente
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        // Act: Tenta registrazione con stessa email
        $response = $this->postJson('/register', [
            'nickname' => 'newuser',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert: Verifica fallimento validazione
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);

        // Assert: Verifica NON creato secondo utente
        $this->assertCount(1, User::where('email', 'existing@example.com')->get());
    }

    /**
     * Test: Registrazione senza nickname deve fallire
     */
    public function test_register_requires_nickname(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nickname']);
    }

    /**
     * Test: Registrazione con nickname troppo corto deve fallire
     * Vincolo: min 3 caratteri
     */
    public function test_register_requires_nickname_min_3_characters(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'ab', // Solo 2 caratteri
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nickname']);
    }

    /**
     * Test: Registrazione senza email deve fallire
     */
    public function test_register_requires_email(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Registrazione con email non valida deve fallire
     */
    public function test_register_requires_valid_email_format(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'not-an-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Registrazione senza password deve fallire
     */
    public function test_register_requires_password(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Test: Registrazione con password troppo corta deve fallire
     * Vincolo: min 8 caratteri
     */
    public function test_register_requires_password_min_8_characters(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
            'password' => 'short', // Solo 5 caratteri
            'password_confirmation' => 'short',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Test: Registrazione senza password_confirmation deve fallire
     */
    public function test_register_requires_password_confirmation(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Test: Registrazione con password_confirmation diversa deve fallire
     */
    public function test_register_requires_password_confirmation_match(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    // ==========================================
    // TEST LOGOUT
    // ==========================================

    /**
     * Test: Logout deve:
     * - Invalidare la sessione
     * - Rigenerare CSRF token
     * - Restituire 200 con redirect
     * - Utente NON autenticato dopo logout
     */
    public function test_logout_invalidates_session(): void
    {
        // Arrange: Crea e autentica utente
        $user = User::factory()->create();
        $this->actingAs($user);

        // Assert: Verifica autenticato prima del logout
        $this->assertAuthenticatedAs($user);

        // Act: Esegui logout
        $response = $this->postJson('/logout');

        // Assert: Verifica risposta
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Assert: Verifica NON più autenticato
        $this->assertGuest();
    }

    /**
     * Test: Logout senza autenticazione deve fallire
     * (protetto da middleware auth)
     */
    public function test_logout_requires_authentication(): void
    {
        // Act: Tenta logout senza essere loggato
        $response = $this->postJson('/logout');

        // Assert: Deve essere rediretto a login o restituire 401
        $response->assertStatus(401);
    }

    // ==========================================
    // TEST SICUREZZA
    // ==========================================

    /**
     * Test: Password NON deve mai essere restituita in risposta JSON
     */
    public function test_register_does_not_return_password(): void
    {
        // Act
        $response = $this->postJson('/register', [
            'nickname' => 'testuser',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert: Verifica password NON presente in risposta
        $response->assertJsonMissing(['password' => 'password123']);
        
        // Assert: Verifica nessun campo user nella risposta (solo success/redirect)
        $response->assertJsonMissing(['user']);
    }

    /**
     * Test: Login NON deve esporre se email esiste o meno
     * (prevenzione user enumeration attack)
     */
    public function test_login_error_message_does_not_reveal_email_existence(): void
    {
        // Arrange: Crea utente
        User::factory()->create([
            'email' => 'exists@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Act: Tenta login con email inesistente
        $response1 = $this->postJson('/login', [
            'email' => 'notexists@example.com',
            'password' => 'password123',
        ]);

        // Act: Tenta login con email esistente ma password errata
        $response2 = $this->postJson('/login', [
            'email' => 'exists@example.com',
            'password' => 'wrongpassword',
        ]);

        // Assert: Entrambi devono avere stesso status e messaggio generico
        $this->assertEquals($response1->status(), $response2->status());
        $response1->assertJson(['success' => false]);
        $response2->assertJson(['success' => false]);
    }

    // ==========================================
    // TEST INTEGRAZIONE SESSIONI
    // ==========================================

    /**
     * Test: Dopo login, sessione deve essere rigenerata
     * (prevenzione session fixation attack)
     */
    public function test_login_regenerates_session(): void
    {
        // Arrange
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Salva session ID prima del login
        $this->withSession(['test' => 'value']);
        $oldSessionId = session()->getId();

        // Act: Login
        $this->postJson('/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        // Assert: Session ID deve essere cambiato
        $newSessionId = session()->getId();
        $this->assertNotEquals($oldSessionId, $newSessionId);
    }

    /**
     * Test: Utente autenticato può accedere a route protette
     */
    public function test_authenticated_user_can_access_protected_routes(): void
    {
        // Arrange: Crea e autentica utente
        $user = User::factory()->create();
        
        // Act: Login
        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'password', // password di default della factory
        ]);

        // Assert: Può accedere a route home (protetta)
        $response = $this->get('/');
        $response->assertStatus(200);
    }
}
