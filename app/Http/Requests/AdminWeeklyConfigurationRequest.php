<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validazione richiesta per la configurazione settimanale admin
class AdminWeeklyConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Numero massimo di ordini per slot (deve essere intero positivo)
            'max_orders' => 'required|integer|min:1',

            // Minuti limite per modifiche ordini (può essere 0)
            'max_time' => 'required|integer|min:0',

            // Luogo del servizio (stringa obbligatoria)
            'location' => 'required|string|max:255',

            // Array dei giorni della settimana
            'days' => 'required|array',

            // Validazione per ogni giorno dell'array
            'days.monday' => 'required|array',
            'days.monday.enabled' => 'required|boolean',
            'days.monday.start_time' => 'required_if:days.monday.enabled,true|date_format:H:i',
            'days.monday.end_time' => 'required_if:days.monday.enabled,true|date_format:H:i|after:days.monday.start_time',

            'days.tuesday' => 'required|array',
            'days.tuesday.enabled' => 'required|boolean',
            'days.tuesday.start_time' => 'required_if:days.tuesday.enabled,true|date_format:H:i',
            'days.tuesday.end_time' => 'required_if:days.tuesday.enabled,true|date_format:H:i|after:days.tuesday.start_time',

            'days.wednesday' => 'required|array',
            'days.wednesday.enabled' => 'required|boolean',
            'days.wednesday.start_time' => 'required_if:days.wednesday.enabled,true|date_format:H:i',
            'days.wednesday.end_time' => 'required_if:days.wednesday.enabled,true|date_format:H:i|after:days.wednesday.start_time',

            'days.thursday' => 'required|array',
            'days.thursday.enabled' => 'required|boolean',
            'days.thursday.start_time' => 'required_if:days.thursday.enabled,true|date_format:H:i',
            'days.thursday.end_time' => 'required_if:days.thursday.enabled,true|date_format:H:i|after:days.thursday.start_time',

            'days.friday' => 'required|array',
            'days.friday.enabled' => 'required|boolean',
            'days.friday.start_time' => 'required_if:days.friday.enabled,true|date_format:H:i',
            'days.friday.end_time' => 'required_if:days.friday.enabled,true|date_format:H:i|after:days.friday.start_time',

            'days.saturday' => 'required|array',
            'days.saturday.enabled' => 'required|boolean',
            'days.saturday.start_time' => 'required_if:days.saturday.enabled,true|date_format:H:i',
            'days.saturday.end_time' => 'required_if:days.saturday.enabled,true|date_format:H:i|after:days.saturday.start_time',

            'days.sunday' => 'required|array',
            'days.sunday.enabled' => 'required|boolean',
            'days.sunday.start_time' => 'required_if:days.sunday.enabled,true|date_format:H:i',
            'days.sunday.end_time' => 'required_if:days.sunday.enabled,true|date_format:H:i|after:days.sunday.start_time',
        ];
    }

    public function messages(): array
    {
        return [
            'max_orders.required' => 'Il numero massimo di ordini è obbligatorio.',
            'max_orders.integer' => 'Il numero massimo di ordini deve essere un numero intero.',
            'max_orders.min' => 'Il numero massimo di ordini deve essere almeno 1.',

            'max_time.required' => 'Il limite di tempo per le modifiche è obbligatorio.',
            'max_time.integer' => 'Il limite di tempo deve essere un numero intero.',
            'max_time.min' => 'Il limite di tempo non può essere negativo.',

            'location.required' => 'Il luogo del servizio è obbligatorio.',
            'location.string' => 'Il luogo deve essere una stringa di testo.',

            'days.required' => 'La configurazione dei giorni è obbligatoria.',
            'days.array' => 'I giorni devono essere forniti come array.',

            // Messaggi generici per i giorni
            '*.enabled.required' => 'Lo stato abilitato è obbligatorio per ogni giorno.',
            '*.enabled.boolean' => 'Lo stato abilitato deve essere vero o falso.',

            '*.start_time.required_if' => 'L\'ora di inizio è obbligatoria se il giorno è abilitato.',
            '*.start_time.date_format' => 'L\'ora di inizio deve essere nel formato HH:MM.',

            '*.end_time.required_if' => 'L\'ora di fine è obbligatoria se il giorno è abilitato.',
            '*.end_time.date_format' => 'L\'ora di fine deve essere nel formato HH:MM.',
            '*.end_time.after' => 'L\'ora di fine deve essere successiva all\'ora di inizio.',
        ];
    }
}
