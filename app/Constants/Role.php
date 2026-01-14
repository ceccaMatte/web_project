<?php

namespace App\Constants;

/**
 * Classe per definire le costanti dei ruoli utente.
 * Questo approccio centralizza le stringhe dei ruoli, evitando errori di digitazione
 * e facilitando la manutenzione del codice.
 */
class Role
{
    /**
     * Ruolo amministratore.
     * Gli utenti con questo ruolo hanno accesso completo al sistema.
     */
    const ADMIN = 'admin';

    /**
     * Ruolo utente standard.
     * Gli utenti con questo ruolo hanno accesso limitato alle funzionalità base.
     */
    const USER = 'user';
}