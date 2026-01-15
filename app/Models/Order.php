<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modello Order - rappresenta un ordine effettuato da un utente.
 * 
 * CICLO DI VITA DI UN ORDINE:
 * 
 * 1. Creazione: nasce sempre in stato "pending"
 * 2. Elaborazione: può passare per confirmed → ready → picked_up
 * 3. Annullamento: può andare a "rejected" da qualsiasi stato
 * 
 * REGOLE DI BUSINESS:
 * 
 * - Un ordine appartiene a UN utente (non modificabile)
 * - Un ordine appartiene a UN time_slot (non modificabile)
 * - Lo stato può cambiare solo tramite admin (tranne la cancellazione)
 * - Solo gli ordini "pending" possono essere modificati/cancellati dall'utente
 * - Gli ingredienti sono snapshot immutabili
 * 
 * STATI POSSIBILI:
 * 
 * - pending: in attesa di conferma (modificabile dall'utente)
 * - confirmed: confermato dall'admin, in preparazione
 * - ready: pronto per il ritiro
 * - picked_up: ritirato dall'utente
 * - rejected: annullato (finale)
 * 
 * TRANSIZIONI VIETATE:
 * 
 * - Qualsiasi stato → pending (pending è solo iniziale)
 * - rejected → qualsiasi altro stato (rejected è finale)
 */
class Order extends Model
{
    use HasFactory;

    /**
     * Campi mass-assignable.
     * 
     * NOTA: lo status non è fillable perché viene gestito
     * esplicitamente dal service per garantire le transizioni corrette.
     */
    protected $fillable = [
        'user_id',
        'time_slot_id',
        'working_day_id',
        'daily_number',
    ];

    /**
     * Casting dei campi.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relazione: l'ordine appartiene a un utente.
     * 
     * Usato per:
     * - Verificare ownership nelle policy
     * - Mostrare chi ha fatto l'ordine
     * - Filtrare ordini per utente
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relazione: l'ordine appartiene a un time slot.
     * 
     * Usato per:
     * - Verificare disponibilità slot (concorrenza)
     * - Mostrare l'orario dell'ordine
     * - Contare ordini per slot
     */
    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    /**
     * Relazione: l'ordine appartiene a un working day.
     * 
     * Usato per:
     * - Raggruppare ordini per giorno
     * - Assegnare daily_number unico per giorno
     * - Filtrare ordini per giornata lavorativa
     */
    public function workingDay(): BelongsTo
    {
        return $this->belongsTo(WorkingDay::class);
    }

    /**
     * Relazione: l'ordine ha molti ingredienti (snapshot).
     * 
     * IMPORTANTE: questi NON sono relazioni live con la tabella ingredients.
     * Sono snapshot che preservano il contenuto dell'ordine al momento della creazione.
     * 
     * Se un ingrediente viene rinominato o eliminato nel catalogo,
     * questi record rimangono invariati.
     */
    public function ingredients(): HasMany
    {
        return $this->hasMany(OrderIngredient::class);
    }

    /**
     * Verifica se l'ordine è in stato "pending".
     * 
     * Solo gli ordini pending possono essere modificati o cancellati dall'utente.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Verifica se l'ordine è in stato "rejected".
     * 
     * rejected è uno stato finale: non può più cambiare.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Verifica se una transizione di stato è consentita.
     * 
     * REGOLE:
     * - Non si può mai tornare a "pending"
     * - Non si può uscire da "rejected"
     * - Tutte le altre transizioni sono permesse
     * 
     * @param string $newStatus Lo stato di destinazione
     * @return bool True se la transizione è consentita
     */
    public function canTransitionTo(string $newStatus): bool
    {
        // Non si può mai tornare a pending
        if ($newStatus === 'pending') {
            return false;
        }

        // Non si può uscire da rejected
        if ($this->status === 'rejected') {
            return false;
        }

        // Tutte le altre transizioni sono permesse
        return true;
    }
}
