@php
    $labels = config('ui.labels');
    $icons = config('ui.icons');
@endphp

<section class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" aria-labelledby="truck-status-title">
    @if($status === 'active')
        <header class="flex justify-between items-start mb-4">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="relative flex h-2 w-2" aria-hidden="true">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span class="text-emerald-500 text-[10px] font-bold uppercase tracking-widest" role="status">{{ $labels['live_now'] ?? 'LIVE NOW (TODAY)' }}</span>
                </div>
                <h2 id="truck-status-title" class="text-white text-lg font-bold">{{ $location }}</h2>
                <p class="text-slate-400 text-xs"><time datetime="{{ $startTime }}">{{ $startTime }}</time> – <time datetime="{{ $endTime }}">{{ $endTime }}</time></p>
            </div>
            <div class="size-20 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center text-slate-500">
                <span class="material-symbols-outlined text-4xl" aria-label="{{ $labels['truck_icon'] ?? 'Truck' }}">{{ $icons['truck'] ?? 'local_shipping' }}</span>
            </div>
        </header>

        <div class="flex items-center justify-between p-3 rounded-xl border border-border-dark/60 bg-background-dark/40 mt-2">
            <div class="flex items-center gap-3">
                <div class="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <span class="material-symbols-outlined text-lg" aria-label="{{ $labels['queue_icon'] ?? 'Physical Queue' }}">{{ $icons['queue'] ?? 'person_pin_circle' }}</span>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">{{ $labels['physical_queue'] ?? 'Physical Queue' }}</p>
                    <p class="text-xs font-medium text-slate-400">{{ $labels['queue_wait_time'] ?? 'Walk-up wait time' }}</p>
                </div>
            </div>
            <div class="text-xl font-bold text-slate-300" aria-label="{{ $queueTime }} minutes wait">{{ $queueTime }} min</div>
        </div>
    @elseif($status === 'inactive')
        <header class="flex items-center gap-3 mb-4">
            <span class="material-symbols-outlined text-2xl text-slate-500" aria-label="{{ $labels['status_unavailable_icon'] ?? 'Service Unavailable' }}">{{ $icons['status_unavailable'] ?? 'block' }}</span>
            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-widest" role="status">{{ $labels['service_unavailable'] ?? 'SERVICE NOT AVAILABLE' }}</span>
        </header>
        <div class="flex flex-col items-center justify-center py-10">
            <p class="text-slate-400 text-base font-bold mb-2">{{ $labels['coming_soon'] ?? 'Coming soon' }}</p>
        </div>
    @endif
</section>
