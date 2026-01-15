<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modello per rappresentare un giorno lavorativo.
 * Ogni record corrisponde a un giorno in cui il servizio è attivo.
 */
class WorkingDay extends Model
{
    use HasFactory;
    /**
     * Campi che possono essere assegnati in massa.
     * Protegge da mass assignment non autorizzato.
     */
    protected $fillable = [
        'day',           // Data del giorno lavorativo
        'location',      // Luogo del servizio
        'max_orders',    // Numero massimo di ordini per slot
        'max_time',      // Minuti limite per modifiche ordini
        'start_time',    // Ora di inizio servizio
        'end_time',      // Ora di fine servizio
        'is_active',     // Indica se il giorno è attivo
    ];

    /**
     * Cast automatici per i tipi di dati.
     * Converte automaticamente i valori dal database.
     */
    protected $casts = [
        'day' => 'date',        // Converte in oggetto Carbon/Date
        'start_time' => 'datetime:H:i',  // Converte in oggetto Carbon per ora
        'end_time' => 'datetime:H:i',    // Converte in oggetto Carbon per ora
        'max_orders' => 'integer',       // Assicura sia intero
        'max_time' => 'integer',         // Assicura sia intero
    ];

    /**
     * Relazione: ogni working_day ha molti time_slots.
     * Gli slot vengono generati automaticamente alla creazione del working_day.
     */
    public function timeSlots(): HasMany
    {
        return $this->hasMany(TimeSlot::class);
    }
}
