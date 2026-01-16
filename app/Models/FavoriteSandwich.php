<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Modello FavoriteSandwich - rappresenta una combinazione di ingredienti salvata come preferito.
 * 
 * ARCHITETTURA:
 * - Ogni FavoriteSandwich è associato a un utente
 * - Ha una relazione many-to-many con Ingredient tramite favorite_sandwich_ingredients
 * - ingredient_configuration_id è un hash MD5 degli IDs ingredienti ordinati
 * 
 * TABELLE:
 * - favorite_sandwiches: id, user_id, ingredient_configuration_id, timestamps
 * - favorite_sandwich_ingredients: id, favorite_sandwich_id, ingredient_id (pivot)
 */
class FavoriteSandwich extends Model
{
    protected $fillable = [
        'user_id',
        'ingredient_configuration_id',
    ];

    /**
     * Relazione con User (proprietario del preferito).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relazione many-to-many con Ingredient.
     */
    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'favorite_sandwich_ingredients', 'favorite_sandwich_id', 'ingredient_id');
    }

    /**
     * Genera un configuration ID univoco da un array di nomi ingredienti.
     * 
     * L'ID è un hash MD5 dei nomi ordinati alfabeticamente, troncato a 16 caratteri.
     * Questo garantisce che la stessa combinazione di ingredienti
     * produca sempre lo stesso ID, indipendentemente dall'ordine.
     * 
     * NOTA: Usiamo i nomi perché OrderIngredient è uno snapshot che non
     * ha riferimento all'ID dell'ingrediente originale.
     * 
     * @param array<string> $ingredientNames Array di nomi ingredienti
     * @return string Configuration ID (16 caratteri hex)
     */
    public static function generateConfigurationId(array $ingredientNames): string
    {
        // Ordina i nomi alfabeticamente e normalizza (lowercase, trim)
        $normalizedNames = collect($ingredientNames)
            ->map(fn($name) => strtolower(trim($name)))
            ->sort()
            ->values()
            ->toArray();
        
        // Crea stringa univoca
        $nameString = implode('|', $normalizedNames);
        
        // Hash MD5 troncato a 16 caratteri
        return substr(md5($nameString), 0, 16);
    }

    /**
     * Scope per filtrare i preferiti di un utente specifico.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope per trovare un preferito con una specifica configurazione.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $configurationId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithConfiguration($query, string $configurationId)
    {
        return $query->where('ingredient_configuration_id', $configurationId);
    }

    /**
     * Verifica se l'utente ha salvato come preferito una specifica configurazione.
     * 
     * @param int $userId
     * @param string $configurationId
     * @return bool
     */
    public static function isFavorite(int $userId, string $configurationId): bool
    {
        return self::forUser($userId)->withConfiguration($configurationId)->exists();
    }

    /**
     * Toggle preferito per un utente e configurazione.
     * 
     * @param int $userId
     * @param string $configurationId
     * @param array<string> $ingredientNames Nomi degli ingredienti (per salvare nel preferito)
     * @return bool Nuovo stato is_favorite (true = aggiunto, false = rimosso)
     */
    public static function toggle(int $userId, string $configurationId, array $ingredientNames): bool
    {
        $existing = self::forUser($userId)->withConfiguration($configurationId)->first();

        if ($existing) {
            // Rimuovi preferito
            $existing->ingredients()->detach();
            $existing->delete();
            return false;
        }

        // Crea nuovo preferito
        $favorite = self::create([
            'user_id' => $userId,
            'ingredient_configuration_id' => $configurationId,
        ]);

        // Trova gli IDs degli ingredienti dal catalogo per associarli
        $ingredientIds = \App\Models\Ingredient::whereIn('name', $ingredientNames)
            ->pluck('id')
            ->toArray();

        if (!empty($ingredientIds)) {
            $favorite->ingredients()->attach($ingredientIds);
        }

        return true;
    }
}
