{{--
    ORDER PREVIEW CARD - Componente Presentazionale
    
    RESPONSABILITÀ:
    - Renderizzare UI in base alle props ricevute
    - Applicare stili e accessibilità WCAG AAA
    
    COSA NON FA:
    - NON filtra ordini
    - NON sceglie la priorità degli stati
    - NON costruisce label di stato
    - NON accede ad Auth
    - NON fa fetch
    
    VARIANTI (mutuamente esclusive):
    - login-cta: utente non loggato, mostra CTA login
    - empty: utente loggato senza ordini, mostra CTA "Book sandwich"
    - single: utente loggato con 1 ordine, card singola senza stack
    - multi: utente loggato con 2+ ordini, card con stack effect e badge
    
    PROPS:
    - $variant (string, obbligatorio): 'login-cta' | 'empty' | 'single' | 'multi'
    - $orderId (int|string): ID ordine (solo per single/multi)
    - $status (string): stato ordine (solo per single/multi)
    - $statusLabel (string): label formattata dello stato (solo per single/multi)
    - $ordersCount (int): numero totale ordini (solo per multi)
    
    ACCESSIBILITÀ:
    - aria-label diversificato per variant
    - focus ring visibile
    - contrasto AAA
    - sr-only per badge numerico
--}}

@props([
    'variant' => 'login-cta',
    'orderId' => null,
    'status' => null,
    'statusLabel' => null,
    'ordersCount' => 0,
])

@php
    // Recupera configurazioni centralizzate
    $labels = config('ui.labels.order_preview');
    $statusLabels = config('ui.labels.order_status');
    $icons = config('ui.order_preview_icons');
    $statusColors = config('ui.order_status_colors');
    
    // Determina aria-label in base alla variant
    $ariaLabel = match($variant) {
        'login-cta' => $labels['aria_login'],
        'empty' => $labels['aria_empty'],
        'single', 'multi' => $labels['aria_orders'],
        default => $labels['aria_orders'],
    };
    
    // Determina URL destinazione in base alla variant
    $href = match($variant) {
        'login-cta' => route('login'),
        'empty' => route('orders.store'), // TODO: sostituire con route creazione ordine quando disponibile
        'single', 'multi' => route('orders.index'),
        default => route('orders.index'),
    };
    
    // Colori per lo stato (se presente)
    $colors = $status ? ($statusColors[$status] ?? $statusColors['pending']) : null;
@endphp

{{-- 
    VARIANT: LOGIN-CTA
    Card per utenti non loggati con CTA login
--}}
@if($variant === 'login-cta')
    <a 
        href="{{ $href }}"
        class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
        aria-label="{{ $ariaLabel }}"
    >
        {{-- Card principale --}}
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                {{-- Icona login --}}
                <div class="size-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary" aria-hidden="true">
                        {{ $icons['login'] }}
                    </span>
                </div>
                {{-- Testo CTA --}}
                <div>
                    <p class="text-white text-sm font-bold">{{ $labels['login_cta'] }}</p>
                </div>
            </div>
            {{-- Chevron destro --}}
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                    {{ $icons['chevron_right'] }}
                </span>
            </div>
        </div>
    </a>

{{-- 
    VARIANT: EMPTY
    Card per utenti loggati senza ordini con CTA "Book sandwich"
--}}
@elseif($variant === 'empty')
    <a 
        href="{{ $href }}"
        class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
        aria-label="{{ $ariaLabel }}"
    >
        {{-- Card principale --}}
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                {{-- Icona aggiungi --}}
                <div class="size-11 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                        {{ $icons['add_circle'] }}
                    </span>
                </div>
                {{-- Testo --}}
                <div>
                    <p class="text-slate-400 text-sm font-medium">{{ $labels['no_orders'] }}</p>
                    <p class="text-primary text-xs font-bold mt-0.5">{{ $labels['book_sandwich'] }}</p>
                </div>
            </div>
            {{-- Chevron destro --}}
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                    {{ $icons['chevron_right'] }}
                </span>
            </div>
        </div>
    </a>

{{-- 
    VARIANT: SINGLE
    Card per utenti con 1 solo ordine (no stack, no badge)
--}}
@elseif($variant === 'single')
    <a 
        href="{{ $href }}"
        class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
        aria-label="{{ $ariaLabel }}"
    >
        {{-- Card principale (senza layers di stack) --}}
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                {{-- Icona receipt --}}
                <div class="relative">
                    <div class="size-11 rounded-lg {{ $colors['bg'] ?? 'bg-emerald-500/10' }} flex items-center justify-center">
                        <span class="material-symbols-outlined {{ $colors['text'] ?? 'text-emerald-500' }}" aria-hidden="true">
                            {{ $icons['receipt'] }}
                        </span>
                    </div>
                    {{-- NO badge numerico per single --}}
                </div>
                {{-- Info ordine --}}
                <div>
                    <p class="text-white text-sm font-bold">#{{ $orderId }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="size-1.5 rounded-full {{ $colors['dot'] ?? 'bg-emerald-500' }} {{ $status === 'ready' ? 'animate-pulse' : '' }}" aria-hidden="true"></span>
                        <p class="{{ $colors['text'] ?? 'text-emerald-500' }} text-[10px] font-bold uppercase tracking-wider">
                            {{ $statusLabel }}
                        </p>
                    </div>
                </div>
            </div>
            {{-- Divider + Chevron --}}
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                    {{ $icons['chevron_right'] }}
                </span>
            </div>
        </div>
    </a>

{{-- 
    VARIANT: MULTI
    Card per utenti con 2+ ordini (stack effect + badge numerico)
--}}
@elseif($variant === 'multi')
    <a 
        href="{{ $href }}"
        class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
        aria-label="{{ $ariaLabel }}"
    >
        {{-- Testo nascosto per screen reader con conteggio ordini --}}
        <span class="sr-only">{{ str_replace(':count', $ordersCount, $labels['aria_orders_count']) }}</span>
        
        {{-- Layer 1: shadow card più lontana --}}
        <div class="absolute inset-0 top-4 mx-4 h-full rounded-xl border border-border-dark/30 bg-surface-dark/40 scale-[0.92] opacity-40 z-0" aria-hidden="true"></div>
        
        {{-- Layer 2: shadow card intermedia --}}
        <div class="absolute inset-0 top-2 mx-2 h-full rounded-xl border border-border-dark/60 bg-surface-dark/80 scale-[0.96] opacity-70 z-10" aria-hidden="true"></div>
        
        {{-- Card principale --}}
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                {{-- Icona receipt con badge numerico --}}
                <div class="relative">
                    <div class="size-11 rounded-lg {{ $colors['bg'] ?? 'bg-emerald-500/10' }} flex items-center justify-center">
                        <span class="material-symbols-outlined {{ $colors['text'] ?? 'text-emerald-500' }}" aria-hidden="true">
                            {{ $icons['receipt'] }}
                        </span>
                    </div>
                    {{-- Badge numerico ordini --}}
                    <div 
                        class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface-dark shadow-lg min-w-[20px] text-center"
                        aria-hidden="true"
                    >
                        {{ $ordersCount }}
                    </div>
                </div>
                {{-- Info ordine più rilevante --}}
                <div>
                    <p class="text-white text-sm font-bold">#{{ $orderId }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="size-1.5 rounded-full {{ $colors['dot'] ?? 'bg-emerald-500' }} {{ $status === 'ready' ? 'animate-pulse' : '' }}" aria-hidden="true"></span>
                        <p class="{{ $colors['text'] ?? 'text-emerald-500' }} text-[10px] font-bold uppercase tracking-wider">
                            {{ $statusLabel }}
                        </p>
                    </div>
                </div>
            </div>
            {{-- Divider + Chevron --}}
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                    {{ $icons['chevron_right'] }}
                </span>
            </div>
        </div>
    </a>
@endif
