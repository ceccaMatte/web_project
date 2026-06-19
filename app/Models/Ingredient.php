<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modello Ingredient - rappresenta un ingrediente disponibile nel catalogo.
 */
class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'category',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function availabilities(): HasMany
    {
        return $this->hasMany(IngredientAvailability::class);
    }
}
