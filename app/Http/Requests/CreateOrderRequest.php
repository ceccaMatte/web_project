<?php

namespace App\Http\Requests;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * FormRequest per la creazione di un ordine.
 * 
 * VALIDAZIONE INGREDIENTI (REGOLA FONDAMENTALE):
 * 
 * 1. Deve esserci ESATTAMENTE UN ingrediente di categoria "bread"
 *    - Zero pani → errore
 *    - Due o più pani → errore
 * 
 * 2. Altri ingredienti (meat, cheese, vegetable, sauce, other):
 *    - Tutti opzionali
 *    - Possono essere multipli
 * 
 * 3. Nessun ingrediente può essere duplicato
 * 
 * 4. Tutti gli ingredienti devono:
 *    - Esistere nel database
 *    - Essere disponibili (is_available = true)
 * 
 * ESEMPIO VALIDO:
 * ingredients: [1, 3, 5, 7]  // 1=pane, 3=prosciutto, 5=mozzarella, 7=pomodoro
 * 
 * ESEMPIO INVALIDO:
 * ingredients: [1, 2, 3]  // 1 e 2 sono entrambi pane → errore
 * ingredients: [3, 5, 7]  // nessun pane → errore
 * ingredients: [1, 3, 3]  // 3 è duplicato → errore
 */
class CreateOrderRequest extends FormRequest
{
    /**
     * L'utente deve essere autenticato.
     * L'autorizzazione è gestita dal middleware auth.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regole di validazione.
     */
    public function rules(): array
    {
        return [
            // Time slot obbligatorio e deve esistere
            'time_slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            
            // Array di ingredienti obbligatorio
            'ingredients' => ['required', 'array', 'min:1'],
            
            // Ogni ingrediente deve essere un ID intero
            'ingredients.*' => ['integer', 'exists:ingredients,id'],
        ];
    }

    /**
     * Validazione personalizzata dopo le regole base.
     * 
     * Qui verifichiamo:
     * 1. Esattamente un pane
     * 2. Nessun duplicato
     * 3. Ingredienti disponibili
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $ingredientIds = $this->input('ingredients', []);

            // VERIFICA 1: Nessun duplicato
            if (count($ingredientIds) !== count(array_unique($ingredientIds))) {
                $validator->errors()->add(
                    'ingredients',
                    'Non puoi selezionare lo stesso ingrediente più volte.'
                );
                return; // Ferma validazione se ci sono duplicati
            }

            // Carica gli ingredienti dal DB
            $ingredients = Ingredient::whereIn('id', $ingredientIds)->get();

            // VERIFICA 2: Tutti gli ingredienti esistono e sono disponibili
            $unavailableIngredients = $ingredients->filter(fn($i) => !$i->is_available);
            if ($unavailableIngredients->isNotEmpty()) {
                $names = $unavailableIngredients->pluck('name')->implode(', ');
                $validator->errors()->add(
                    'ingredients',
                    "Alcuni ingredienti non sono disponibili: {$names}"
                );
            }

            // VERIFICA 3: Esattamente un pane
            $breadCount = $ingredients->where('category', 'bread')->count();
            
            if ($breadCount === 0) {
                $validator->errors()->add(
                    'ingredients',
                    'Devi selezionare un tipo di pane per il tuo ordine.'
                );
            } elseif ($breadCount > 1) {
                $validator->errors()->add(
                    'ingredients',
                    'Puoi selezionare solo un tipo di pane per ordine.'
                );
            }
        });
    }

    /**
     * Messaggi di errore personalizzati.
     */
    public function messages(): array
    {
        return [
            'time_slot_id.required' => 'Devi selezionare un orario per il ritiro.',
            'time_slot_id.exists' => 'L\'orario selezionato non è valido.',
            'ingredients.required' => 'Devi selezionare almeno un ingrediente.',
            'ingredients.array' => 'Gli ingredienti devono essere un elenco valido.',
            'ingredients.min' => 'Devi selezionare almeno un ingrediente.',
            'ingredients.*.exists' => 'Uno o più ingredienti selezionati non esistono.',
        ];
    }
}

