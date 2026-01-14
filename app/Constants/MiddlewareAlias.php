<?php

namespace App\Constants;

/**
 * Classe per definire i nomi degli alias dei middleware.
 * Questo approccio centralizza i nomi degli alias, evitando errori di digitazione
 * e facilitando la manutenzione del codice quando si aggiungono nuovi middleware.
 */
class MiddlewareAlias
{
    /**
     * Alias per il middleware che controlla l'accesso admin.
     * Usato per proteggere route che richiedono privilegi amministrativi.
     */
    const ADMIN = 'admin';
}