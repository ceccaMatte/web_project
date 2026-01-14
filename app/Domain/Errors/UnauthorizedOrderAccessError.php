<?php

namespace App\Domain\Errors;

/**
 * Errore: utente tenta di accedere/modificare un ordine che non gli appartiene.
 * 
 * QUANDO VIENE LANCIATO:
 * - Durante update di un ordine altrui
 * - Durante delete di un ordine altrui
 * - Quando user_id dell'ordine != utente autenticato
 * 
 * REGOLA DI BUSINESS:
 * Un utente può modificare solo i propri ordini.
 * Gli admin hanno privilegi separati (possono modificare stato, non contenuto).
 * 
 * PERCHÉ 403 FORBIDDEN:
 * - L'utente è autenticato (non è 401)
 * - L'ordine esiste (non è 404)
 * - Ma l'utente non ha il permesso di modificarlo
 * 
 * DIFFERENZA CON POLICY:
 * Questo errore viene lanciato dal service quando la policy è già passata
 * ma emerge un problema di autorizzazione a runtime.
 * 
 * COSA DEVE FARE IL CLIENT:
 * - Mostrare messaggio di errore
 * - NON esporre dettagli dell'ordine altrui
 * - Registrare tentativo sospetto nei log
 */
class UnauthorizedOrderAccessError extends DomainError
{
    /**
     * Codice stabile per identificare l'errore.
     */
    public function code(): string
    {
        return 'UNAUTHORIZED_ORDER_ACCESS';
    }

    /**
     * Messaggio in italiano per l'utente finale.
     */
    public function message(): string
    {
        return 'Non sei autorizzato ad accedere o modificare questo ordine.';
    }

    /**
     * 403 Forbidden: autenticato ma non autorizzato.
     */
    public function httpStatus(): int
    {
        return 403;
    }
}
