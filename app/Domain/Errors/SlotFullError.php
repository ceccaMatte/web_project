<?php

namespace App\Domain\Errors;

/**
 * Errore: lo slot orario ha raggiunto il numero massimo di ordini.
 * 
 * QUANDO VIENE LANCIATO:
 * - Durante la creazione di un ordine
 * - Quando il conteggio ordini >= max_orders
 * 
 * PERCHÉ 409 CONFLICT:
 * - Lo slot esiste ed è valido
 * - Ma è in conflitto con lo stato attuale (pieno)
 * - Non è un errore di validazione (422)
 * - Non è un problema di autorizzazione (403)
 * 
 * COSA DEVE FARE IL CLIENT:
 * - Mostrare messaggio all'utente
 * - Suggerire di scegliere un altro slot
 * - Non ritentare lo stesso slot
 * 
 * GESTIONE CONCORRENZA:
 * Questo errore garantisce che sotto concorrenza
 * non vengano mai creati più ordini del consentito.
 * La verifica avviene dentro una transazione con lock.
 */
class SlotFullError extends DomainError
{
    /**
     * Codice stabile per identificare l'errore.
     */
    public function code(): string
    {
        return 'SLOT_FULL';
    }

    /**
     * Messaggio in italiano per l'utente finale.
     */
    public function message(): string
    {
        return 'Lo slot orario selezionato ha raggiunto il numero massimo di ordini. Scegli un altro orario.';
    }

    /**
     * 409 Conflict: lo slot esiste ma è in conflitto con lo stato (pieno).
     */
    public function httpStatus(): int
    {
        return 409;
    }
}
