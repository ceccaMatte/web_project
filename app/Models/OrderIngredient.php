<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modello OrderIngredient - rappresenta uno snapshot di un ingrediente in un ordine.
 * 
 * PERCHÉ ESISTE QUESTO MODELLO:
 * 
 * Gli ingredienti di un ordine NON sono relazioni live con la tabella ingredients.
 * Sono SNAPSHOT che preservano il contenuto dell'ordine al momento della creazione.
 * 
 * ESEMPIO:
 * 
 * 1. L'utente ordina un panino con "Mozzarella di bufala"
 * 2. Viene salvato uno snapshot: name="Mozzarella di bufala", category="cheese"
 * 3. Il giorno dopo l'admin rinomina l'ingrediente in "Mozzarella DOP"
 * 4. L'ordine storico continua a mostrare "Mozzarella di bufala"
 * 
 * VANTAGGI:
 * 
 * - Storico immutabile: l'ordine è sempre coerente
 * - Indipendenza: gli ordini non si rompono se il catalogo cambia
 * - Audit: possiamo sapere esattamente cosa conteneva l'ordine
 * 
 * SVANTAGGI:
 * 
 * - Ridondanza: il nome è duplicato
 * - Aggiornamenti: non possiamo correggere errori storici
 * 
 * Per questo progetto, i vantaggi superano gli svantaggi.
 */
class OrderIngredient extends Model
{
    /**
     * IMPORTANTE: questa tabella NON ha timestamps.
     * 
     * Usa i timestamp dell'ordine padre per sapere quando è stato creato.
     * Non serve tracciare created_at/updated_at separatamente.
     */
    public $timestamps = false;

    /**
     * Campi mass-assignable.
     */
    protected $fillable = [
        'order_id',
        'name',
        'category',
    ];

    /**
     * Relazione: l'ingrediente dello snapshot appartiene a un ordine.
     * 
     * Se l'ordine viene eliminato, anche gli snapshot spariscono (cascade).
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
