<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder per gli ingredienti del "Campus Truck / Paninaro".
 * 
 * Popola il catalogo con ingredienti di tutte le categorie:
 * - bread (5 tipi): base obbligatoria per ogni panino
 * - meat (6 tipi): incluso "Cotoletta di pollo"
 * - cheese (4 tipi): 
 * - vegetable (5 tipi): incluso "Rucola"
 * - sauce (4 tipi): inclusi Ketchup, Maionese, Senape
 * - other (5 tipi): inclusi Olio e Uovo
 * 
 * REGOLA DI BUSINESS:
 * - Ogni ingrediente ha is_available=true (2-3 disabilitati sono presenti
 *   ma NON usati nel seeding per realismo, simulando "esaurimento")
 * 
 * CODE GENERATION:
 * - I codici sono coerenti: categoria + abbreviazione significativa
 * - Es: BRD_CIAB (bread_ciabatta), MEAT_PCOT (meat_prosciuttoCotto), ecc.
 */
class IngredientsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        /**
         * Array di ingredienti per categoria.
         * Ogni ingrediente ha: name, code, category, is_available.
         */
        $ingredientsData = [
            // BREAD (5 tipi: sempre disponibili, uno deve essere scelto per ogni ordine)
            [
                'name' => 'Ciabatta',
                'code' => 'BRD_CIAB',
                'category' => 'bread',
                'is_available' => true,
            ],
            [
                'name' => 'Pane Integrale',
                'code' => 'BRD_INTEG',
                'category' => 'bread',
                'is_available' => true,
            ],
            [
                'name' => 'Focaccia',
                'code' => 'BRD_FOC',
                'category' => 'bread',
                'is_available' => true,
            ],
            [
                'name' => 'Panino ai Semi',
                'code' => 'BRD_SEMI',
                'category' => 'bread',
                'is_available' => true,
            ],
            [
                'name' => 'Baguette',
                'code' => 'BRD_BAG',
                'category' => 'bread',
                'is_available' => true,
            ],

            // MEAT (6 tipi: proteina principale, 0-2 per ordine)
            // IMPORTANTE: "Cotoletta di pollo" è OBBLIGATORIO nell'elenco
            [
                'name' => 'Prosciutto Cotto',
                'code' => 'MEAT_PCOT',
                'category' => 'meat',
                'is_available' => true,
            ],
            [
                'name' => 'Prosciutto Crudo',
                'code' => 'MEAT_PCRU',
                'category' => 'meat',
                'is_available' => true,
            ],
            [
                'name' => 'Salame',
                'code' => 'MEAT_SAL',
                'category' => 'meat',
                'is_available' => true,
            ],
            [
                'name' => 'Tacchino',
                'code' => 'MEAT_TAC',
                'category' => 'meat',
                'is_available' => true,
            ],
            [
                'name' => 'Bresaola',
                'code' => 'MEAT_BRES',
                'category' => 'meat',
                'is_available' => true,
            ],
            [
                'name' => 'Cotoletta di Pollo',
                'code' => 'MEAT_COTO',
                'category' => 'meat',
                'is_available' => true,
            ],

            // CHEESE (4 tipi: latticini, 0-1 per ordine)
            [
                'name' => 'Cheddar',
                'code' => 'CHEESE_CHED',
                'category' => 'cheese',
                'is_available' => true,
            ],
            [
                'name' => 'Mozzarella',
                'code' => 'CHEESE_MOZ',
                'category' => 'cheese',
                'is_available' => true,
            ],
            [
                'name' => 'Fontina',
                'code' => 'CHEESE_FONT',
                'category' => 'cheese',
                'is_available' => true,
            ],
            [
                'name' => 'Gorgonzola',
                'code' => 'CHEESE_GORG',
                'category' => 'cheese',
                'is_available' => true,
            ],

            // VEGETABLE (5 tipi: verdure, 0-3 per ordine)
            // IMPORTANTE: "Rucola" è OBBLIGATORIA nell'elenco
            [
                'name' => 'Lattuga',
                'code' => 'VEG_LAT',
                'category' => 'vegetable',
                'is_available' => true,
            ],
            [
                'name' => 'Pomodoro',
                'code' => 'VEG_POM',
                'category' => 'vegetable',
                'is_available' => true,
            ],
            [
                'name' => 'Cipolla',
                'code' => 'VEG_CIP',
                'category' => 'vegetable',
                'is_available' => true,
            ],
            [
                'name' => 'Rucola',
                'code' => 'VEG_RUC',
                'category' => 'vegetable',
                'is_available' => true,
            ],
            [
                'name' => 'Peperoni',
                'code' => 'VEG_PEP',
                'category' => 'vegetable',
                'is_available' => true,
            ],

            // SAUCE (4 tipi: condimenti, 0-2 per ordine)
            // IMPORTANTE: Ketchup, Maionese, Senape sono OBBLIGATORI + 1 a scelta
            [
                'name' => 'Ketchup',
                'code' => 'SAUCE_KET',
                'category' => 'sauce',
                'is_available' => true,
            ],
            [
                'name' => 'Maionese',
                'code' => 'SAUCE_MAY',
                'category' => 'sauce',
                'is_available' => true,
            ],
            [
                'name' => 'Senape',
                'code' => 'SAUCE_SEN',
                'category' => 'sauce',
                'is_available' => true,
            ],
            [
                'name' => 'Salsa BBQ',
                'code' => 'SAUCE_BBQ',
                'category' => 'sauce',
                'is_available' => true,
            ],

            // OTHER (5 tipi: vari, 0-1 per ordine)
            // IMPORTANTE: "Olio" è OBBLIGATORIO nell'elenco
            [
                'name' => 'Olio',
                'code' => 'OTHER_OLIO',
                'category' => 'other',
                'is_available' => true,
            ],
            [
                'name' => 'Uovo',
                'code' => 'OTHER_UOV',
                'category' => 'other',
                'is_available' => true,
            ],
            [
                'name' => 'Bacon',
                'code' => 'OTHER_BAC',
                'category' => 'other',
                'is_available' => true,
            ],
            [
                'name' => 'Olive',
                'code' => 'OTHER_OLI',
                'category' => 'other',
                'is_available' => true,
            ],
            [
                'name' => 'Jalapeños',
                'code' => 'OTHER_JAL',
                'category' => 'other',
                'is_available' => true,
            ],
        ];

        /**
         * Inserisce gli ingredienti nel database.
         * 
         * NOTA: tutti gli ingredienti creati qui hanno is_available=true.
         * Nel seeding degli ordini, ne useremo solo un subset.
         */
        foreach ($ingredientsData as $data) {
            Ingredient::create($data);
        }
    }
}
