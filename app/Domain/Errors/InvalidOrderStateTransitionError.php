<?php

namespace App\Domain\Errors;

/**
 * Errore: tentativo di transizione di stato non consentita.
 * 
 * QUANDO VIENE LANCIATO:
 * - Durante cambio stato da parte dell'admin
 * - Quando la transizione richiesta viola le regole di business
 * 
 * REGOLE DI TRANSIZIONE:
 * 
 * 1. PENDING È SOLO INIZIALE
 *    - Un ordine nasce sempre in pending
 *    - NON è mai possibile tornare a pending da altri stati
 * 
 * 2. REJECTED È FINALE
 *    - Qualsiasi stato può andare a rejected
 *    - rejected non può più cambiare stato
 * 
 * 3. ALTRE TRANSIZIONI LIBERE
 *    - confirmed → ready ✔️
 *    - ready → picked_up ✔️
 *    - picked_up → confirmed ✔️ (rollback permesso)
 *    - ready → confirmed ✔️ (rollback permesso)
 * 
 * ESEMPI DI TRANSIZIONI INVALIDE:
 * - confirmed → pending ❌
 * - rejected → ready ❌
 * - rejected → confirmed ❌
 * 
 * PERCHÉ 422 UNPROCESSABLE ENTITY:
 * - La richiesta è sintatticamente valida
 * - Ma la transizione di stato richiesta non è consentita
 * - Non è un problema di autorizzazione (403)
 * 
 * COSA DEVE FARE IL CLIENT:
 * - Mostrare messaggio di errore
 * - Ricaricare lo stato corrente dell'ordine
 * - Aggiornare UI con transizioni consentite
 */
class InvalidOrderStateTransitionError extends DomainError
{
    private string $from;
    private string $to;

    /**
     * Costruttore con stati from/to per messaggio dettagliato.
     */
    public function __construct(string $from, string $to)
    {
        $this->from = $from;
        $this->to = $to;
        
        parent::__construct($this->message());
    }

    /**
     * Codice stabile per identificare l'errore.
     */
    public function code(): string
    {
        return 'INVALID_STATE_TRANSITION';
    }

    /**
     * Messaggio in italiano con dettagli sugli stati.
     */
    public function message(): string
    {
        return "Transizione di stato non consentita: da '{$this->from}' a '{$this->to}'. " .
               "Ricorda: non è possibile tornare a 'pending' e 'rejected' è uno stato finale.";
    }

    /**
     * 422 Unprocessable Entity: transizione non valida.
     */
    public function httpStatus(): int
    {
        return 422;
    }
}
