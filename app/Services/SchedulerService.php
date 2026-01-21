<?php

namespace App\Services;

use App\Models\WorkingDay;

/**
 * SchedulerService
 *
 * Centralizza la logica di costruzione dello scheduler settimanale
 * in modo che Home, OrdersPage e OrderForm possano riutilizzarla.
 */
class SchedulerService
{
    /**
     * Costruisce la struttura settimana per lo scheduler.
     *
     * @param string|null $selectedDate Data selezionata (YYYY-MM-DD) opzionale
     * @return array
     */
    public function buildWeekScheduler(?string $selectedDate = null): array
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

            $isActive = $workingDay !== null && (bool) ($workingDay->is_active ?? false);
            $isDisabled = $workingDay === null || !$isActive || ($currentDay->isPast() && !$currentDay->isToday());

            $weekDays[] = [
                'id' => $dateString,
                'weekday' => strtoupper($currentDay->format('D')),
                'dayNumber' => $currentDay->format('j'),
                'isToday' => $currentDay->isToday(),
                'isActive' => $isActive,
                'isDisabled' => $isDisabled,
                'isSelected' => $selectedDate ? ($dateString === $selectedDate) : $currentDay->isToday(),
            ];

            $currentDay->addDay();
        }

        // Se è stata richiesta una specifica selectedDate e corrisponde a un giorno attivo, usala
        if ($selectedDate) {
            $selectedDay = collect($weekDays)->firstWhere('id', $selectedDate);
            if ($selectedDay && !$selectedDay['isDisabled'] && $selectedDay['isActive']) {
                $selectedDayId = $selectedDate;
            } else {
                $todayActive = collect($weekDays)->firstWhere(function ($day) {
                    return $day['isToday'] && $day['isActive'];
                });
                $firstActiveDay = $todayActive ?: collect($weekDays)->firstWhere('isActive');
                $selectedDayId = $firstActiveDay ? $firstActiveDay['id'] : $today->toDateString();
            }
        } else {
            $todayActive = collect($weekDays)->firstWhere(function ($day) {
                return $day['isToday'] && $day['isActive'];
            });
            $firstActiveDay = $todayActive ?: collect($weekDays)->firstWhere('isActive');
            $selectedDayId = $firstActiveDay ? $firstActiveDay['id'] : $today->toDateString();
        }

        return [
            'selectedDayId' => $selectedDayId,
            'monthLabel' => $today->format('F Y'),
            // 'days' is the key expected by server-rendered templates and hydration
            'days' => $weekDays,
            // keep 'weekDays' for backward compatibility with some API docs
            'weekDays' => $weekDays,
        ];
    }
}
