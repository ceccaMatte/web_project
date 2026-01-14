<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest per il cambio di stato di un ordine (solo admin).
 * 
 * REGOLE DI TRANSIZIONE:
 * 
 * 1. NON si può mai tornare a "pending"
 *    - pending è solo lo stato iniziale
 * 
 * 2. NON si può uscire da "rejected"
 *    - rejected è uno stato finale
 * 
 * 3. Tutte le altre transizioni sono permesse
 *    - confirmed → ready ✔️
 *    - ready → picked_up ✔️
 *    - picked_up → confirmed ✔️ (rollback)
 *    - ready → confirmed ✔️ (rollback)
 *    - qualsiasi → rejected ✔️
 * 
 * NOTA:
 * La validazione delle transizioni specifiche è gestita dal Service
 * usando InvalidOrderStateTransitionError.
 * Qui validiamo solo che lo status sia nel dominio consentito.
 */
class UpdateOrderStatusRequest extends FormRequest
{
    /**
     * Solo admin possono cambiare lo stato.
     * Verificato dal middleware admin.
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
            // Status obbligatorio e deve essere uno dei valori consentiti
            'status' => [
                'required',
                'string',
                Rule::in(['pending', 'confirmed', 'ready', 'picked_up', 'rejected']),
            ],
        ];
    }

    /**
     * Messaggi di errore personalizzati.
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Lo stato è obbligatorio.',
            'status.in' => 'Lo stato selezionato non è valido. Stati consentiti: pending, confirmed, ready, picked_up, rejected.',
        ];
    }
}
