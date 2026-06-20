<?php

namespace App\Services;

use App\Models\WorkingDay;
use Carbon\Carbon;

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
        $todayDate = $today->toDateString();
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
        $selectedDayId = $this->resolveSelectedDayId($selectedDate, $todayDate, $startOfWeek, $endOfWeek);

        while ($currentDay <= $endOfWeek) {
            $dateString = $currentDay->toDateString();
            $workingDay = $workingDays->get($dateString);

            $isActive = $workingDay !== null && (bool) ($workingDay->is_active ?? false);
            $isDisabled = $currentDay->isBefore($today->copy()->startOfDay());

            $weekDays[] = [
                'id' => $dateString,
                'weekday' => strtoupper($currentDay->format('D')),
                'dayNumber' => $currentDay->format('j'),
                'isToday' => $currentDay->isToday(),
                'isActive' => $isActive,
                'isDisabled' => $isDisabled,
                'isSelected' => $dateString === $selectedDayId,
            ];

            $currentDay->addDay();
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

    private function resolveSelectedDayId(?string $selectedDate, string $todayDate, Carbon $startOfWeek, Carbon $endOfWeek): string
    {
        if (!$selectedDate) {
            return $todayDate;
        }

        try {
            $requestedDate = Carbon::createFromFormat('Y-m-d', $selectedDate)->startOfDay();
        } catch (\Throwable) {
            return $todayDate;
        }

        $isInsideCurrentWeek = $requestedDate->betweenIncluded(
            $startOfWeek->copy()->startOfDay(),
            $endOfWeek->copy()->startOfDay()
        );
        $isPast = $requestedDate->isBefore(now()->copy()->startOfDay());

        return $isInsideCurrentWeek && !$isPast
            ? $requestedDate->toDateString()
            : $todayDate;
    }
}
