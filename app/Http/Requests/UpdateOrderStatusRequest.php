<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validazione cambio stato ordine (admin). Le regole di transizione sono gestite altrove.
class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

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

    public function messages(): array
    {
        return [
            'status.required' => 'Lo stato è obbligatorio.',
            'status.in' => 'Lo stato selezionato non è valido. Stati consentiti: pending, confirmed, ready, picked_up, rejected.',
        ];
    }
}
