{{--
    COMPONENTE PRESENTATIONAL: Week Scheduler
    - Mostra 7 giorni della settimana con stati visivi
    - NON contiene logica, NON calcola date, NON gestisce click
    - Tutte le stringhe sono lette da config/ui.php
    - Rispetta WCAG 2.1 AAA: aria-*, keyboard navigation, focus states
    
    PROPS RICHIESTE:
    - monthLabel: string (es. "October 2023")
    - days: array di 7 oggetti con struttura:
      {
        id: "2023-10-09",
        weekday: "MON",
        dayNumber: "09",
        isToday: bool,
        isActive: bool,
        isDisabled: bool,
        isSelected: bool
      }
    
    STATI VISIVI (priorità: selected > today > disabled > active):
    - disabled: non selezionabile, opacità ridotta
    - selected: attualmente visualizzato, bg primary
    - today: giorno corrente, badge sotto
    - active: selezionabile, stato base
    
    EVENTI:
    - Click su giorno: data-day-id="YYYY-MM-DD"
    - La pagina decide cosa fare (NO logica qui)
--}}

@php
    $labels = config('ui.labels.scheduler');
@endphp

<section class="flex flex-col gap-3" aria-label="{{ $labels['title'] ?? 'Schedule' }}">
    {{-- Header: Label + Mese --}}
    <div class="flex items-center justify-between">
        <h2 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {{ $labels['title'] ?? 'Schedule' }}
        </h2>
        <span class="text-primary text-[10px] font-bold uppercase tracking-widest">
            {{ $monthLabel }}
        </span>
    </div>

    {{-- Day Selector: 7 giorni --}}
    <div 
        class="bg-surface-dark border border-border-dark rounded-2xl p-2"
        role="group"
        aria-label="{{ $labels['week_selector'] ?? 'Week day selector' }}"
    >
        <div class="flex justify-between gap-1">
            @foreach($days as $day)
                @php
                    // Estrai dati giorno
                    $dayId = $day['id'];
                    $weekday = $day['weekday'];
                    $dayNumber = $day['dayNumber'];
                    $isToday = $day['isToday'];
                    $isActive = $day['isActive'];
                    $isDisabled = $day['isDisabled'];
                    $isSelected = $day['isSelected'];
                    
                    // Calcola classi CSS (priorità: selected > today > disabled > active)
                    $baseClasses = 'flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all';
                    $stateClasses = '';
                    
                    if ($isDisabled) {
                        // Disabled: opacità ridotta, non cliccabile
                        $stateClasses = 'opacity-30 cursor-not-allowed';
                        $weekdayColor = 'text-slate-500';
                        $numberColor = 'text-slate-400';
                    } elseif ($isSelected) {
                        // Selected: bg primary, testo bianco, ombra
                        $stateClasses = 'border border-primary bg-primary/10 shadow-lg shadow-primary/20';
                        $weekdayColor = 'text-primary';
                        $numberColor = 'text-white';
                    } elseif ($isActive) {
                        // Active: selezionabile, hover
                        $stateClasses = 'hover:bg-slate-800 active:scale-95';
                        $weekdayColor = 'text-slate-400';
                        $numberColor = 'text-slate-300';
                    } else {
                        // Fallback (non dovrebbe accadere)
                        $stateClasses = 'opacity-30';
                        $weekdayColor = 'text-slate-500';
                        $numberColor = 'text-slate-400';
                    }
                    
                    $allClasses = $baseClasses . ' ' . $stateClasses;
                @endphp
                
                @if($isDisabled)
                    {{-- Giorno disabled: <div> non cliccabile --}}
                    <div 
                        class="{{ $allClasses }}"
                        aria-disabled="true"
                        @if($isToday) aria-current="date" @endif
                    >
                        <span class="text-[9px] font-medium uppercase mb-1 {{ $weekdayColor }}">
                            {{ $weekday }}
                        </span>
                        <span class="text-base font-bold {{ $numberColor }}">
                            {{ $dayNumber }}
                        </span>
                        @if($isToday)
                            <div class="mt-1 size-1 rounded-full bg-slate-700"></div>
                        @endif
                    </div>
                @else
                    {{-- Giorno selezionabile: <button> --}}
                    <button 
                        type="button"
                        class="{{ $allClasses }}"
                        data-day-id="{{ $dayId }}"
                        aria-pressed="{{ $isSelected ? 'true' : 'false' }}"
                        @if($isToday) aria-current="date" @endif
                    >
                        <span class="text-[9px] font-medium uppercase mb-1 {{ $weekdayColor }}">
                            {{ $weekday }}
                        </span>
                        <span class="text-base font-bold {{ $numberColor }}">
                            {{ $dayNumber }}
                        </span>
                        @if($isToday && !$isSelected)
                            <div class="mt-1 size-1 rounded-full bg-primary"></div>
                        @elseif($isToday && $isSelected)
                            <div class="mt-1 size-1 rounded-full bg-white"></div>
                        @endif
                    </button>
                @endif
            @endforeach
        </div>
    </div>
</section>
