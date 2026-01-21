@props([
    'variant' => 'login-cta',
    'orderId' => null,
    'status' => null,
    'statusLabel' => null,
    'ordersCount' => 0,
])

@php
    $labels = config('ui.labels.order_preview');
    $statusLabels = config('ui.labels.order_status');
    $icons = config('ui.order_preview_icons');
    $statusColors = config('ui.order_status_colors');

    $ariaLabel = match($variant) {
        'login-cta' => $labels['aria_login'],
        'empty' => $labels['aria_empty'],
        'single', 'multi' => $labels['aria_orders'],
        default => $labels['aria_orders'],
    };

    $href = match($variant) {
        'login-cta' => route('login'),
        'empty' => route('orders.store'), // TODO: sostituire con route creazione ordine quando disponibile
        'single', 'multi' => route('orders.index'),
        default => route('orders.index'),
    };

    $colors = $status ? ($statusColors[$status] ?? $statusColors['pending']) : null;
@endphp
@if($variant === 'login-cta')
    <a href="{{ $href }}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl" aria-label="{{ $ariaLabel }}">
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <div class="size-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary" aria-hidden="true">{{ $icons['login'] }}</span>
                </div>
                <div>
                    <p class="text-white text-sm font-bold">{{ $labels['login_cta'] }}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">{{ $icons['chevron_right'] }}</span>
            </div>
        </div>
    </a>

@elseif($variant === 'empty')
    <a href="{{ $href }}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl" aria-label="{{ $ariaLabel }}">
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <div class="size-11 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-slate-400" aria-hidden="true">{{ $icons['add_circle'] }}</span>
                </div>
                <div>
                    <p class="text-slate-400 text-sm font-medium">{{ $labels['no_orders'] }}</p>
                    <p class="text-primary text-xs font-bold mt-0.5">{{ $labels['book_sandwich'] }}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">{{ $icons['chevron_right'] }}</span>
            </div>
        </div>
    </a>

@elseif($variant === 'single')
    <a href="{{ $href }}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl" aria-label="{{ $ariaLabel }}">
        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="size-11 rounded-lg {{ $colors['bg'] ?? 'bg-emerald-500/10' }} flex items-center justify-center">
                        <span class="material-symbols-outlined {{ $colors['text'] ?? 'text-emerald-500' }}" aria-hidden="true">{{ $icons['receipt'] }}</span>
                    </div>
                </div>
                <div>
                    <p class="text-white text-sm font-bold">#{{ $orderId }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="size-1.5 rounded-full {{ $colors['dot'] ?? 'bg-emerald-500' }} {{ $status === 'ready' ? 'animate-pulse' : '' }}" aria-hidden="true"></span>
                        <p class="{{ $colors['text'] ?? 'text-emerald-500' }} text-[10px] font-bold uppercase tracking-wider">{{ $statusLabel }}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">{{ $icons['chevron_right'] }}</span>
            </div>
        </div>
    </a>

@elseif($variant === 'multi')
    <a href="{{ $href }}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl" aria-label="{{ $ariaLabel }}">
        <span class="sr-only">{{ str_replace(':count', $ordersCount, $labels['aria_orders_count']) }}</span>
        <div class="absolute inset-0 top-4 mx-4 h-full rounded-xl border border-border-dark/30 bg-surface-dark/40 scale-[0.92] opacity-40 z-0" aria-hidden="true"></div>
        <div class="absolute inset-0 top-2 mx-2 h-full rounded-xl border border-border-dark/60 bg-surface-dark/80 scale-[0.96] opacity-70 z-10" aria-hidden="true"></div>

        <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="size-11 rounded-lg {{ $colors['bg'] ?? 'bg-emerald-500/10' }} flex items-center justify-center">
                        <span class="material-symbols-outlined {{ $colors['text'] ?? 'text-emerald-500' }}" aria-hidden="true">{{ $icons['receipt'] }}</span>
                    </div>
                    <div class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface-dark shadow-lg min-w-[20px] text-center" aria-hidden="true">{{ $ordersCount }}</div>
                </div>
                <div>
                    <p class="text-white text-sm font-bold">#{{ $orderId }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="size-1.5 rounded-full {{ $colors['dot'] ?? 'bg-emerald-500' }} {{ $status === 'ready' ? 'animate-pulse' : '' }}" aria-hidden="true"></span>
                        <p class="{{ $colors['text'] ?? 'text-emerald-500' }} text-[10px] font-bold uppercase tracking-wider">{{ $statusLabel }}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="h-8 w-px bg-border-dark/50"></div>
                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">{{ $icons['chevron_right'] }}</span>
            </div>
        </div>
    </a>
@endif
