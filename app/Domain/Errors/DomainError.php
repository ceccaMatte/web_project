<?php

namespace App\Domain\Errors;

use Exception;

/**
 * Classe astratta base per tutti gli errori di dominio.
 * 
 * Gli errori di dominio rappresentano condizioni di errore che fanno parte
 * della logica di business e non sono bug o eccezioni di sistema.
 * 
 * PERCHÉ ESISTONO I DOMAIN ERROR:
 * 
 * 1. SEPARAZIONE DELLE RESPONSABILITÀ
 *    - Il dominio (business logic) NON deve conoscere HTTP, controller, request
 *    - Il service lancia un'eccezione di dominio pura
 *    - Il controller converte l'errore in una risposta HTTP
 * 
 * 2. TESTABILITÀ
 *    - Posso testare il service in isolamento
 *    - Non serve simulare oggetti HTTP
 * 
 * 3. RIUTILIZZABILITÀ
 *    - Lo stesso errore può essere gestito in contesti diversi:
 *      - API JSON
 *      - CLI command
 *      - Job asincrono
 * 
 * 4. CHIAREZZA DEL CODICE
 *    - Gli errori hanno nomi espliciti (SlotFullError)
 *    - Non serve leggere messaggi stringhe per capire il tipo di errore
 *    - Il tipo di errore è verificabile con instanceof
 * 
 * ESEMPIO DI UTILIZZO:
 * 
 * Service:
 *   if ($slotsCount >= $maxOrders) {
 *       throw new SlotFullError();
 *   }
 * 
 * Controller:
 *   try {
 *       $this->orderService->createOrder(...);
 *   } catch (DomainError $e) {
 *       return response()->json([
 *           'code' => $e->code(),
 *           'message' => $e->message(),
 *       ], $e->httpStatus());
 *   }
 */
abstract class DomainError extends Exception
{
    /**
     * Codice identificativo stabile dell'errore.
     * 
     * Esempi: 'SLOT_FULL', 'ORDER_NOT_MODIFIABLE', 'UNAUTHORIZED_ACCESS'
     * 
     * Il codice è usato:
     * - dal client per identificare il tipo di errore
     * - nei log per filtrare e aggregare errori
     * - nei test per verificare l'errore corretto
     */
    abstract public function code(): string;

    /**
     * Messaggio leggibile dell'errore (in italiano).
     * 
     * Destinato all'utente finale o allo sviluppatore.
     * Deve essere chiaro e indicare cosa è andato storto.
     */
    abstract public function message(): string;

    /**
     * Status HTTP da restituire quando l'errore viene convertito in risposta HTTP.
     * 
     * Mapping comune:
     * - 400 Bad Request: errore generico client
     * - 401 Unauthorized: manca autenticazione
     * - 403 Forbidden: autenticato ma non autorizzato
     * - 404 Not Found: risorsa non trovata
     * - 409 Conflict: conflitto con lo stato attuale (es. slot pieno)
     * - 422 Unprocessable Entity: validazione fallita o stato non valido
     * - 500 Internal Server Error: errore server (NON usare per errori di dominio)
     */
    abstract public function httpStatus(): int;
}
