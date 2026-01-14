<?php

namespace App\Http\Requests;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * FormRequest per l'aggiornamento di un ordine esistente.
 * 
 * REGOLE:
 * - L'utente può aggiornare solo i propri ordini (verificato da Policy)
 * - L'ordine deve essere in stato "pending" (verificato da Service)
 * - Non è possibile cambiare time_slot (se vuole, deve cancellare e ricreare)
 * - Gli ingredienti vengono completamente sostituiti (non merge)
 * 
 * VALIDAZIONE:
 * Stessa validazione di CreateOrderRequest:
 * - Esattamente un pane
 * - Nessun duplicato
 * - Ingredienti disponibili
 */
class UpdateOrderRequest extends FormRequest
{
    /**
     * L'autorizzazione è gestita dalla Policy.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regole di validazione.
     * 
     * NOTA: time_slot_id NON è presente perché non può essere modificato.
     */
    public function rules(): array
    {
        return [
            // Array di ingredienti obbligatorio
            'ingredients' => ['required', 'array', 'min:1'],
            
            // Ogni ingrediente deve essere un ID intero
            'ingredients.*' => ['integer', 'exists:ingredients,id'],
        ];
    }

    /**
     * Validazione personalizzata: stessa logica di CreateOrderRequest.
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
                return;
            }

            // Carica gli ingredienti dal DB
            $ingredients = Ingredient::whereIn('id', $ingredientIds)->get();

            // VERIFICA 2: Tutti gli ingredienti sono disponibili
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
            'ingredients.required' => 'Devi selezionare almeno un ingrediente.',
            'ingredients.array' => 'Gli ingredienti devono essere un elenco valido.',
            'ingredients.min' => 'Devi selezionare almeno un ingrediente.',
            'ingredients.*.exists' => 'Uno o più ingredienti selezionati non esistono.',
        ];
    }
}
