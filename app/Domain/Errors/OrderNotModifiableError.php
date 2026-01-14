<?php

namespace App\Domain\Errors;

/**
 * Errore: tentativo di modificare un ordine non in stato "pending".
 * 
 * QUANDO VIENE LANCIATO:
 * - Durante update di un ordine
 * - Durante delete di un ordine
 * - Se lo stato dell'ordine NON è "pending"
 * 
 * REGOLA DI BUSINESS:
 * Solo gli ordini in stato "pending" possono essere modificati o cancellati.
 * Una volta che l'ordine viene confermato o entra in elaborazione,
 * diventa immutabile per l'utente.
 * 
 * PERCHÉ 422 UNPROCESSABLE ENTITY:
 * - La richiesta è sintatticamente valida
 * - Ma semanticamente non può essere processata
 * - Lo stato corrente dell'ordine non lo consente
 * 
 * COSA DEVE FARE IL CLIENT:
 * - Mostrare messaggio all'utente
 * - Disabilitare pulsanti modifica/cancella per ordini non pending
 * - Eventualmente contattare supporto per modifiche straordinarie
 */
class OrderNotModifiableError extends DomainError
{
    /**
     * Codice stabile per identificare l'errore.
     */
    public function code(): string
    {
        return 'ORDER_NOT_MODIFIABLE';
    }

    /**
     * Messaggio in italiano per l'utente finale.
     */
    public function message(): string
    {
        return 'L\'ordine non può essere modificato perché non è più in stato "in attesa". Contatta il supporto per assistenza.';
    }

    /**
     * 422 Unprocessable Entity: richiesta valida ma non processabile.
     */
    public function httpStatus(): int
    {
        return 422;
    }
}
