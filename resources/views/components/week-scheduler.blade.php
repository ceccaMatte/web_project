{{--
    COMPONENTE PRESENTATIONAL: Week Scheduler
    
    DESIGN: "Calendar strip" - UN contenitore con 7 giorni allineati orizzontalmente
    - NON card individuali per giorno
    - NON padding/border per singolo giorno
    - Solo l'unico contenitore visivo (bg + border + p-3)
    
    LOGICA: Mantenuta invariata
    - Stati: disabled, active, selected, today
    - Event delegation: data-day-id
    - WCAG AAA: aria-*, buttons/divs, focus, keyboard nav
    
    PROPS:
    - monthLabel: "October 2023"
    - days: [{ id, weekday, dayNumber, isToday, isDisabled, isSelected }, ...]
--}}

@php
    $labels = config('ui.labels.scheduler');
@endphp

<section class="py-6 px-5" aria-label="{{ $labels['title'] ?? 'Schedule' }}">
    {{-- Header: Label + Mese --}}
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {{ $labels['title'] ?? 'Schedule' }}
        </h2>
        <span class="text-xs font-medium text-primary">
            {{ $monthLabel }}
        </span>
    </div>

    {{-- Container unico: 7 giorni allineati (NIENTE card individuali) --}}
    <div 
        class="flex justify-between items-center bg-surface-dark p-3 rounded-2xl border border-border-dark"
        role="group"
        aria-label="{{ $labels['week_selector'] ?? 'Week day selector' }}"
    >
        @foreach($days as $day)
            @php
                $dayId = $day['id'];
                $weekday = $day['weekday'];
                $dayNumber = $day['dayNumber'];
                $isToday = $day['isToday'];
                $isDisabled = $day['isDisabled'];
                $isSelected = $day['isSelected'];
            @endphp
            
            @if($isDisabled)
                {{-- STATO: Disabled (opacity-40, non selezionabile) --}}
                <div 
                    class="flex flex-col items-center opacity-40"
                    aria-disabled="true"
                    @if($isToday) aria-current="date" @endif
                >
                    <span class="text-[10px] font-bold mb-2">{{ $weekday }}</span>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full text-sm">
                        {{ $dayNumber }}
                    </div>
                </div>
            @elseif($isSelected)
                {{-- STATO: Selected (cerchio primary, testo bianco, shadow) --}}
                <button 
                    type="button"
                    class="flex flex-col items-center"
                    data-day-id="{{ $dayId }}"
                    aria-pressed="true"
                    @if($isToday) aria-current="date" @endif
                >
                    <span class="text-[10px] font-bold mb-2 text-primary">{{ $weekday }}</span>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">
                        {{ $dayNumber }}
                    </div>
                </button>
            @elseif($isToday)
                {{-- STATO: Today non selezionato (label primary) --}}
                <button 
                    type="button"
                    class="flex flex-col items-center"
                    data-day-id="{{ $dayId }}"
                    aria-pressed="false"
                    aria-current="date"
                >
                    <span class="text-[10px] font-bold mb-2 text-primary">{{ $weekday }}</span>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full text-sm">
                        {{ $dayNumber }}
                    </div>
                </button>
            @else
                {{-- STATO: Active (selezionabile, default) --}}
                <button 
                    type="button"
                    class="flex flex-col items-center"
                    data-day-id="{{ $dayId }}"
                    aria-pressed="false"
                >
                    <span class="text-[10px] font-bold mb-2">{{ $weekday }}</span>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full text-sm">
                        {{ $dayNumber }}
                    </div>
                </button>
            @endif
        @endforeach
    </div>
</section>
