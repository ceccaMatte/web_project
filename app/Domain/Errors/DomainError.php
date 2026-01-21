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
<?php

namespace App\Domain\Errors;

use Exception;

abstract class DomainError extends Exception
{
    abstract public function code(): string;
    abstract public function message(): string;
    abstract public function httpStatus(): int;
}
     * Esempi: 'SLOT_FULL', 'ORDER_NOT_MODIFIABLE', 'UNAUTHORIZED_ACCESS'
