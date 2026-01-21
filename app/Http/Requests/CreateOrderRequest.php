<?php

namespace App\Http\Requests;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

// Validazione ordine: un solo pane, nessun duplicato, ingredienti disponibili
class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

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

