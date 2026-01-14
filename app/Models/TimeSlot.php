<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modello TimeSlot: rappresenta uno slot temporale prenotabile.
 * 
 * Gli slot sono generati automaticamente dal TimeSlotGeneratorService
 * a partire dai working_days. Non sono mai creati manualmente.
 * 
 * Ogni slot ha:
 * - un working_day di appartenenza
 * - un orario di inizio e fine
 * - durata fissa definita in config/time_slots.php
 */
class TimeSlot extends Model
{
    /**
     * Campi assegnabili in massa.
     */
    protected $fillable = [
        'working_day_id',
        'start_time',
        'end_time',
    ];

    /**
     * Cast automatici per i campi.
     */
    protected $casts = [
        'start_time' => 'string',
        'end_time' => 'string',
    ];

    /**
     * Relazione: ogni time_slot appartiene a un working_day.
     */
    public function workingDay(): BelongsTo
    {
        return $this->belongsTo(WorkingDay::class);
    }
}
