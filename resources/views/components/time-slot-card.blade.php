{{--
    TIME SLOT CARD - Componente Riusabile
    
    RESPONSABILITÀ:
    - Renderizzare una singola card time slot
    - Supportare due varianti: home e order
    - Esporre data-slot-id per event delegation
    
    COSA NON FA:
    - NON contiene header di sezione ("Pre-book for Tomorrow" / "Pickup Time")
    - NON fa fetch o logica business
    - NON decide se è full/selected/available (riceve dalle props)
    - NON decide dove navigare (riceve href dalle props)
    
    VARIANTI:
    - variant="home": card con slotsLeft + bottone CTA "Book Slot"
    - variant="order": card compatta con status badge (selected/full/available)
    
    PROPS COMUNI:
    - $id (string|int): identificativo time slot
    - $timeLabel (string): orario formattato es. "11:00 AM"
    - $isDisabled (bool): true se non cliccabile
    - $variant (string): "home" | "order"
    
    PROPS PER variant="home":
    - $slotsLeft (int|null): numero posti rimanenti
    - $ctaLabel (string|null): testo bottone (default da config)
    - $href (string|null): URL destinazione click
    
    PROPS PER variant="order":
    - $status (string): "selected" | "available" | "full"
    - $isSelected (bool): true se selected (per aria-pressed)
    
    ACCESSIBILITÀ WCAG AAA:
    - aria-label descrittivo per ogni stato
    - aria-pressed per stato selected
    - aria-disabled per slot non cliccabili
    - Focus ring visibile
    - Nessuna informazione trasmessa solo via colore
--}}

@props([
    'id',
    'timeLabel',
    'isDisabled' => false,
    'variant' => 'home',
    // Props per variant="home"
    'slotsLeft' => null,
    'ctaLabel' => null,
    'href' => null,
    // Props per variant="order"
    'status' => 'available',
    'isSelected' => false,
])

@php
    // Recupera configurazioni centralizzate
    $config = config('ui.time_slot');
    $labels = $config['labels'];
    $ariaLabels = $config['aria'];
    $lowThreshold = $config['low_slots_threshold'];
    
    // Determina se slots sono bassi (per colore urgenza)
    $isLowSlots = $slotsLeft !== null && $slotsLeft > 0 && $slotsLeft <= $lowThreshold;
    $isFullyBooked = $slotsLeft === 0 || ($variant === 'order' && $status === 'full');
    
    // Label CTA (usa default se non fornita)
    $buttonLabel = $ctaLabel ?? $labels['book_cta'];
    
    // Costruisci aria-label in base a variant e stato
    if ($variant === 'home') {
        if ($isFullyBooked) {
            $ariaLabel = str_replace(':time', $timeLabel, $ariaLabels['fully_booked']);
        } else {
            $ariaLabel = str_replace([':time', ':slots'], [$timeLabel, $slotsLeft], $ariaLabels['book_slot']);
        }
    } else {
        // variant="order"
        $ariaLabel = str_replace(':time', $timeLabel, $ariaLabels[$status] ?? $ariaLabels['available']);
    }
@endphp

{{-- ============================================================
     VARIANT: HOME
     Card con slotsLeft + bottone CTA per prenotazione
     ============================================================ --}}
@if($variant === 'home')
    <div 
        class="min-w-[160px] p-4 rounded-2xl border border-border-dark flex flex-col gap-4 shadow-lg
            {{ $isFullyBooked ? 'bg-surface-dark/50 opacity-60' : 'bg-surface-dark' }}"
        data-slot-id="{{ $id }}"
    >
        {{-- Info orario e disponibilità --}}
        <div>
            <p class="text-base font-bold {{ $isFullyBooked ? 'text-slate-400' : 'text-white' }}">
                {{ $timeLabel }}
            </p>
            
            @if($isFullyBooked)
                {{-- Stato: Fully booked --}}
                <p class="text-rose-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                    {{ $labels['fully_booked'] }}
                </p>
            @elseif($isLowSlots)
                {{-- Stato: Pochi posti (urgenza) --}}
                <p class="text-amber-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                    {{ $slotsLeft }} {{ $labels['slots_left'] }}
                </p>
            @else
                {{-- Stato: Disponibile --}}
                <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                    {{ $slotsLeft }} {{ $labels['slots_left'] }}
                </p>
            @endif
        </div>
        
        {{-- CTA Button o Link --}}
        @if($isFullyBooked || $isDisabled)
            {{-- Bottone disabilitato --}}
            <button 
                type="button"
                class="w-full py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed"
                disabled
                aria-disabled="true"
                aria-label="{{ $ariaLabel }}"
            >
                {{ $labels['waitlist'] }}
            </button>
        @elseif($href)
            {{-- Link navigabile --}}
            <a 
                href="{{ $href }}"
                class="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg text-center
                       active:scale-95 transition-transform shadow-lg shadow-primary/20
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
                aria-label="{{ $ariaLabel }}"
            >
                {{ $buttonLabel }}
            </a>
        @else
            {{-- Bottone (per casi dove JS gestisce il click) --}}
            <button 
                type="button"
                class="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg
                       active:scale-95 transition-transform shadow-lg shadow-primary/20
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
                aria-label="{{ $ariaLabel }}"
            >
                {{ $buttonLabel }}
            </button>
        @endif
    </div>

{{-- ============================================================
     VARIANT: ORDER
     Card compatta per selezione pickup time (selected/full/available)
     ============================================================ --}}
@elseif($variant === 'order')
    @php
        // Classi base comuni
        $baseClasses = 'flex flex-col items-center justify-center min-w-[100px] h-24 rounded-xl transition-all';
        
        // Classi specifiche per stato
        $stateClasses = match($status) {
            'selected' => 'bg-primary/10 border-2 border-primary',
            'full' => 'bg-surface-dark/50 border border-border-dark opacity-50',
            'available' => 'bg-surface-dark border border-border-dark hover:border-primary/50 cursor-pointer',
            default => 'bg-surface-dark border border-border-dark',
        };
        
        // Colore testo orario
        $timeColor = match($status) {
            'selected' => 'text-white',
            'full' => 'text-slate-500',
            'available' => 'text-slate-300',
            default => 'text-slate-300',
        };
        
        // Colore label stato
        $labelColor = match($status) {
            'selected' => 'text-primary',
            'full' => 'text-rose-500',
            'available' => 'text-slate-500',
            default => 'text-slate-500',
        };
        
        // Testo label stato
        $statusLabel = match($status) {
            'selected' => $labels['selected'],
            'full' => $labels['full'],
            'available' => $labels['available'],
            default => $labels['available'],
        };
        
        // Focus ring classes
        $focusClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark';
    @endphp

    @if($status === 'full' || $isDisabled)
        {{-- Stato FULL: div non cliccabile --}}
        <div 
            class="{{ $baseClasses }} {{ $stateClasses }}"
            data-slot-id="{{ $id }}"
            aria-disabled="true"
            aria-label="{{ $ariaLabel }}"
            role="button"
        >
            <p class="text-[16px] font-bold {{ $timeColor }}">{{ $timeLabel }}</p>
            <p class="{{ $labelColor }} text-[10px] font-bold uppercase mt-1">{{ $statusLabel }}</p>
        </div>
    @else
        {{-- Stati SELECTED e AVAILABLE: button cliccabile --}}
        <button 
            type="button"
            class="{{ $baseClasses }} {{ $stateClasses }} {{ $focusClasses }}"
            data-slot-id="{{ $id }}"
            aria-pressed="{{ $isSelected ? 'true' : 'false' }}"
            aria-label="{{ $ariaLabel }}"
        >
            <p class="text-[16px] font-bold {{ $timeColor }}">{{ $timeLabel }}</p>
            <p class="{{ $labelColor }} text-[10px] font-bold uppercase mt-1">{{ $statusLabel }}</p>
        </button>
    @endif
@endif
