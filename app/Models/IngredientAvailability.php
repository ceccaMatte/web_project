<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'ingredient_id',
        'working_day_id',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function workingDay(): BelongsTo
    {
        return $this->belongsTo(WorkingDay::class);
    }
}
