<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/**
 * Policy per la gestione delle autorizzazioni sugli ordini.
 * 
 * RESPONSABILITÀ:
 * - Verifica che l'utente possa modificare/eliminare l'ordine
 * - Verifica che l'admin possa cambiare lo stato
 * 
 * NOTA:
 * La Policy verifica solo i permessi di base (ownership, ruolo).
 * Le regole di business (pending, transizioni) sono nel Service.
 * 
 * SEPARAZIONE:
 * - Policy: "CHI può fare COSA"
 * - Service: "QUANDO può essere fatto"
 */
class OrderPolicy
{
    /**
     * L'utente può aggiornare l'ordine se:
     * - È il proprietario dell'ordine
     * 
     * NOTA: La verifica dello stato "pending" è nel Service,
     * non nella Policy, perché è una regola di business, non di autorizzazione.
     */
    public function update(User $user, Order $order): bool
    {
        return $user->id === $order->user_id;
    }

    /**
     * L'utente può eliminare l'ordine se:
     * - È il proprietario dell'ordine
     * 
     * NOTA: La verifica dello stato "pending" è nel Service.
     */
    public function delete(User $user, Order $order): bool
    {
        return $user->id === $order->user_id;
    }

    /**
     * Solo gli admin possono cambiare lo stato di un ordine.
     * 
     * Gli utenti normali non possono mai cambiare lo stato,
     * nemmeno dei propri ordini.
     */
    public function changeStatus(User $user, Order $order): bool
    {
        return $user->is_admin;
    }
}
