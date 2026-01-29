<?php

namespace Database\Seeders;

use App\Models\FavoriteSandwich;
use App\Models\User;
use App\Models\Ingredient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeder per i panini preferiti (Favorite Sandwiches).
 * 
 * LOGICA:
 * 1. Per ogni utente (5 normali + 1 admin):
 *    - Crea 5-7 panini preferiti
 *    - Ogni preferito ha ESATTAMENTE 1 bread + 1-5 ingredienti extra
 *    - Genera un ingredient_configuration_id univoco
 * 
 * 2. TABELLE:
 *    - favorite_sandwiches: record principale con user_id e ingredient_configuration_id
 *    - favorite_sandwich_ingredients (pivot): associa ingredienti al favorito
 * 
 * 3. INGREDIENT_CONFIGURATION_ID:
 *    - Hash MD5 generato dai nomi ingredienti ordinati
 *    - Univoco per ogni combinazione
 *    - Truncato a 16 caratteri
 * 
 * 4. VINCOLI:
 *    - 1 bread obbligatorio per ogni preferito
 *    - No duplicati dentro lo stesso preferito
 *    - È lecito che preferiti somiglino o coincidano (es. due users con stesso panino)
 */
class FavoriteSandwichesSeeder extends Seeder
{
    use WithoutModelEvents;

    // Range per ingredienti extra (oltre il bread obbligatorio)
    private int $minExtraIngredients;
    private int $maxExtraIngredients;

    // Range per numero di preferiti per utente
    private int $minFavoritesPerUser;
    private int $maxFavoritesPerUser;

    // Ingredienti raggruppati per categoria
    private array $ingredientsByCategory = [];

    public function run(): void
    {
        // Carica configurazione
        $config = config('panini');
        $this->minExtraIngredients = $config['seeding']['extra_ingredients_per_favorite_min'];
        $this->maxExtraIngredients = $config['seeding']['extra_ingredients_per_favorite_max'];
        $this->minFavoritesPerUser = $config['seeding']['favorite_sandwiches_per_user_min'];
        $this->maxFavoritesPerUser = $config['seeding']['favorite_sandwiches_per_user_max'];

        // Carica gli ingredienti raggruppati per categoria
        $this->loadIngredientsByCategory();

        /**
         * Recupera tutti gli utenti (sia normali che admin).
         * Tutti possono avere panini preferiti.
         */
        $allUsers = User::all();

        foreach ($allUsers as $user) {
            $this->createFavoriteSandwichesForUser($user);
        }
    }

    /**
     * Carica gli ingredienti dal DB e li organizza per categoria.
     */
    private function loadIngredientsByCategory(): void
    {
        $allIngredients = Ingredient::where('is_available', true)->get();

        foreach ($allIngredients as $ingredient) {
            $category = $ingredient->category;
            if (!isset($this->ingredientsByCategory[$category])) {
                $this->ingredientsByCategory[$category] = [];
            }
            $this->ingredientsByCategory[$category][] = $ingredient;
        }
    }

    /**
     * Crea panini preferiti per un singolo utente.
     * 
     * @param User $user
     */
    private function createFavoriteSandwichesForUser(User $user): void
    {
        // Numero di preferiti per questo utente
        $favoritesCount = rand($this->minFavoritesPerUser, $this->maxFavoritesPerUser);

        // Tiene traccia dei preferiti già creati per evitare duplicati (opzionale)
        $createdConfigurations = [];

        for ($i = 0; $i < $favoritesCount; $i++) {
            /**
             * Genera ingredienti per il preferito.
             * Rispetta il vincolo: 1 bread obbligatorio + 1-5 extra.
             */
            $ingredientIds = $this->generateRandomSandwich();

            /**
             * Genera l'ingredient_configuration_id come hash dei nomi ingredienti.
             * Se la stessa combinazione esiste già per questo utente, salta.
             */
            $configId = $this->generateConfigurationId($ingredientIds);

            if (in_array($configId, $createdConfigurations)) {
                // Duplicato per questo utente, salta
                continue;
            }

            /**
             * Crea il record favorite_sandwich.
             */
            $favorite = FavoriteSandwich::create([
                'user_id' => $user->id,
                'ingredient_configuration_id' => $configId,
            ]);

            /**
             * Associa gli ingredienti al preferito tramite tabella pivot.
             */
            $this->attachIngredientsToFavorite($favorite, $ingredientIds);

            $createdConfigurations[] = $configId;
        }
    }

    /**
     * Genera un panino casuale con:
     * - 1 bread obbligatorio
     * - 1-5 ingredienti extra (distribuiti fra le altre categorie)
     * 
     * @return array Array di ingredient IDs
     */
    private function generateRandomSandwich(): array
    {
        $ingredientIds = [];

        // 1 BREAD (obbligatorio)
        if (!empty($this->ingredientsByCategory['bread'])) {
            $bread = $this->ingredientsByCategory['bread'][array_rand($this->ingredientsByCategory['bread'])];
            $ingredientIds[] = $bread->id;
        }

        // Extra ingredienti: 1-5 da categorie varie
        $extraCount = rand($this->minExtraIngredients, $this->maxExtraIngredients);
        $nonBreadCategories = ['meat', 'cheese', 'vegetable', 'sauce', 'other'];

        for ($i = 0; $i < $extraCount; $i++) {
            // Sceglie una categoria casuale (escludendo bread)
            $randomCategory = $nonBreadCategories[array_rand($nonBreadCategories)];

            if (!empty($this->ingredientsByCategory[$randomCategory])) {
                $ingredient = $this->ingredientsByCategory[$randomCategory][array_rand($this->ingredientsByCategory[$randomCategory])];

                // Evita duplicati nello stesso preferito
                if (!in_array($ingredient->id, $ingredientIds)) {
                    $ingredientIds[] = $ingredient->id;
                }
            }
        }

        return $ingredientIds;
    }

    /**
     * Genera l'ingredient_configuration_id.
     * 
     * È un hash MD5 dei nomi ingredienti ordinati alfabeticamente, truncato a 16 caratteri.
     * Questo garantisce che la stessa combinazione di ingredienti produca sempre lo stesso ID.
     * 
     * ESEMPIO:
     * - Ingredienti: "Ciabatta", "Prosciutto Cotto", "Mozzarella"
     * - Ordinati: "Ciabatta", "Mozzarella", "Prosciutto Cotto"
     * - Hash: md5("Ciabatta|Mozzarella|Prosciutto Cotto") = "abc123def456..."
     * - ConfigId: "abc123def456" (first 16 chars)
     * 
     * @param array $ingredientIds Array di ingredient IDs
     * @return string Configuration ID (16 caratteri)
     */
    private function generateConfigurationId(array $ingredientIds): string
    {
        // Recupera i nomi degli ingredienti
        $ingredients = Ingredient::whereIn('id', $ingredientIds)
            ->pluck('name')
            ->sort()
            ->toArray();

        // Hash dei nomi ordinati
        $hash = md5(implode('|', $ingredients));

        // Trunca a 16 caratteri
        return substr($hash, 0, 16);
    }

    /**
     * Associa gli ingredienti al preferito tramite tabella pivot.
     * 
     * @param FavoriteSandwich $favorite
     * @param array $ingredientIds Array di ingredient IDs
     */
    private function attachIngredientsToFavorite(FavoriteSandwich $favorite, array $ingredientIds): void
    {
        // Crea i record nella tabella pivot favorite_sandwich_ingredients
        $favorite->ingredients()->attach($ingredientIds);
    }
}
