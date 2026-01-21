<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\WorkingDay;
use Illuminate\Support\Facades\Auth;

/**
 * Service per la pagina Order Form (Create / Modify).
 * 
 * RESPONSABILITÀ:
 * - Preparare payload per init pagina
 * - Fornire disponibilità ingredienti
 * - Fornire time slots disponibili (solo create)
 * - Verificare stato ordine per modify
 * 
 * FONTE DI VERITÀ:
 * - Il backend decide sempre cosa è disponibile
 * - Il frontend reagisce ai dati
 */
class OrderFormService
{
    /**
     * Costruisce payload per CREATE mode.
     * 
     * @param string $date Data selezionata (YYYY-MM-DD)
     * @return array
     */
    public function buildCreatePayload(string $date): array
    {
        $user = Auth::user();
        $scheduler = $this->buildSchedulerSection($date);
        
        return [
            'mode' => 'create',
            'order' => null,
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
            ],
            'availability' => [
                'ingredients' => $this->getIngredientsWithAvailability(),
                'timeSlots' => $this->getTimeSlotsForDate($date),
            ],
            'scheduler' => $scheduler,
            'selectedDate' => $date,
        ];
    }

    /**
     * Costruisce payload per MODIFY mode.
     * 
     * @param Order $order Ordine da modificare
     * @return array
     */
    public function buildModifyPayload(Order $order): array
    {
        $user = Auth::user();
        
        // Carica relazioni necessarie
        $order->load(['ingredients', 'workingDay', 'timeSlot']);
        
        // IMPORTANTE: OrderIngredient sono SNAPSHOT (name, category)
        // NON hanno riferimento all'Ingredient.id originale.
        // Dobbiamo matchare per nome per ottenere gli ID corretti.
        $ingredientNames = $order->ingredients->pluck('name')->toArray();
        
        // Trova ingredienti attuali per nome (come fa REORDER)
        $matchedIngredients = Ingredient::whereIn('name', $ingredientNames)->get();
        
        $selectedIngredients = $matchedIngredients->map(fn($i) => [
            'id' => $i->id,  // Ingredient.id (corretto!)
            'name' => $i->name,
            'category' => $i->category,
        ])->toArray();
        
        return [
            'mode' => 'modify',
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'date' => $order->workingDay->day->toDateString(),
                'timeSlot' => $order->timeSlot->start_time,
                'selectedIngredients' => $selectedIngredients,
            ],
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
            ],
            'availability' => [
                'ingredients' => $this->getIngredientsWithAvailability(),
                // In modify, time slots non servono
                'timeSlots' => [],
            ],
        ];
    }

    /**
     * Ottiene tutti gli ingredienti con stato disponibilità.
     * 
     * @return array Ingredienti raggruppati per categoria
     */
    public function getIngredientsWithAvailability(): array
    {
        $ingredients = Ingredient::orderBy('category')
            ->orderBy('name')
            ->get();
        
        $grouped = [];
        
        foreach ($ingredients as $ingredient) {
            $category = $ingredient->category;
            
            if (!isset($grouped[$category])) {
                $grouped[$category] = [
                    'category' => $category,
                    'label' => $this->getCategoryLabel($category),
                    'icon' => $this->getCategoryIcon($category),
                    'items' => [],
                ];
            }
            
            $grouped[$category]['items'][] = [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'category' => $category,
                'available' => $ingredient->is_available,
            ];
        }
        
        // Ordina le categorie
        $orderedCategories = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];
        $result = [];
        
        foreach ($orderedCategories as $cat) {
            if (isset($grouped[$cat])) {
                $result[] = $grouped[$cat];
            }
        }
        
        return $result;
    }

    /**
     * Ottiene time slots disponibili per una data.
     * 
     * @param string $date Data (YYYY-MM-DD)
     * @return array
     */
    public function getTimeSlotsForDate(string $date): array
    {
        // Time slots sono collegati a working_day tramite working_day_id
        // Dobbiamo fare il join con working_days per filtrare per data
        $slots = TimeSlot::whereHas('workingDay', function ($query) use ($date) {
                $query->where('day', $date);
            })
            ->with('workingDay')
            ->orderBy('start_time')
            ->get();
        
        return $slots->map(function ($slot) {
            $currentOrders = Order::where('time_slot_id', $slot->id)
                ->whereNotIn('status', ['rejected'])
                ->count();
            
            // max_orders è sul workingDay
            $maxOrders = $slot->workingDay->max_orders ?? 5;
            $slotsLeft = max(0, $maxOrders - $currentOrders);
            
            return [
                'id' => $slot->id,
                'timeLabel' => $slot->start_time, // start_time è già string
                'slotsLeft' => $slotsLeft,
                'available' => $slotsLeft > 0,
            ];
        })->toArray();
    }

    /**
     * Ottiene disponibilità aggiornata per polling.
     * 
     * @param string|null $date Data per time slots (null = solo ingredienti)
     * @return array
     */
    public function getAvailabilityForPolling(?string $date = null): array
    {
        $result = [
            'ingredients' => $this->getIngredientsWithAvailability(),
        ];
        
        if ($date) {
            $result['timeSlots'] = $this->getTimeSlotsForDate($date);
        }
        
        return $result;
    }

    /**
     * Mappa categoria → label UI.
     */
    private function getCategoryLabel(string $category): string
    {
        return match($category) {
            'bread' => 'Bread & Base',
            'meat' => 'Protein',
            'cheese' => 'Cheese',
            'vegetable' => 'Veggies',
            'sauce' => 'Sauce',
            'other' => 'Extras',
            default => ucfirst($category),
        };
    }

    /**
     * Mappa categoria → icona Material Symbols.
     */
    private function getCategoryIcon(string $category): string
    {
        return match($category) {
            'bread' => 'bakery_dining',
            'meat' => 'kebab_dining',
            'cheese' => 'lunch_dining',
            'vegetable' => 'eco',
            'sauce' => 'water_drop',
            'other' => 'add_circle',
            default => 'restaurant',
        };
    }

    /**
     * Costruisce la sezione scheduler per la settimana corrente.
     * 
     * @param string $selectedDate Data selezionata (YYYY-MM-DD)
     * @return array
     */
    private function buildSchedulerSection(string $selectedDate): array
    {
        $today = now();
        $startOfWeek = $today->copy()->startOfWeek(); // Lunedì
        $endOfWeek = $today->copy()->endOfWeek(); // Domenica

        // Carichiamo tutti i working_days della settimana
        $workingDays = WorkingDay::where('day', '>=', $startOfWeek->toDateString())
            ->where('day', '<=', $endOfWeek->toDateString())
            ->get()
            ->keyBy(function ($workingDay) {
                return $workingDay->day->toDateString();
            });

        $weekDays = [];
        $currentDay = $startOfWeek->copy();

        while ($currentDay <= $endOfWeek) {
            $dateString = $currentDay->toDateString();
            $workingDay = $workingDays->get($dateString);

            $weekDays[] = [
                'id' => $dateString,
                'weekday' => strtoupper($currentDay->format('D')),
                'dayNumber' => $currentDay->format('j'),
                'isToday' => $currentDay->isToday(),
                'isActive' => $workingDay !== null,
                'isDisabled' => $workingDay === null || ($currentDay->isPast() && !$currentDay->isToday()),
                'isSelected' => $dateString === $selectedDate,
            ];

            $currentDay->addDay();
        }

        return [
            'selectedDayId' => $selectedDate,
            'monthLabel' => $today->format('F Y'),
            'weekDays' => $weekDays,
        ];
    }
}
