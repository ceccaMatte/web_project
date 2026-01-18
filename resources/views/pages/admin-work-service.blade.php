@extends('layouts.app')

@section('title', config('ui.admin_work_service.page_title'))

@section('content')
{{--
    ADMIN WORK SERVICE PAGE
    
    RESPONSABILITÀ:
    - Dashboard gestione operativa ordini in tempo reale
    - Scheduler per navigazione date
    - Time slot selector per filtrare ordini
    - Pipeline ordini: confirmed → ready → picked_up
    - Recap card sticky per dettagli ordine selezionato
    
    PATTERN:
    - data-page="admin-work-service" per inizializzazione JS
    - Polling ogni 5s senza reset selezioni
    - Componenti agnostici (work*) non role-specific
    
    DATI RICEVUTI DAL CONTROLLER:
    - $user: { authenticated, name, nickname, role }
    
    ACCESSIBILITÀ (WCAG 2.1 AAA):
    - Navigazione via tastiera completa
    - ARIA labels su tutti gli elementi interattivi
    - Focus visibile su tutti i bottoni
    - Stati non comunicati solo via colore
--}}

{{-- Wrapper con data-page per JS --}}
<div data-page="admin-work-service" class="flex min-h-screen">

    {{--
        User State per JavaScript
        - Passa stato user dal backend a JS
    --}}
    <script type="application/json" data-user-state>
        @json($user)
    </script>

    {{-- ========================================
         SIDEBAR ADMIN (FIXED LEFT)
         ======================================== --}}
    <aside 
        data-admin-sidebar
        class="fixed top-0 left-0 h-full w-64 bg-[#0d1117] border-r border-slate-800 flex flex-col z-40"
    >
        {{-- Logo + Titolo --}}
        <div class="p-6 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined text-2xl">
                        {{ config('ui.icons.logo') }}
                    </span>
                </div>
                <div>
                    <h1 class="text-white text-base font-bold leading-tight">
                        {{ config('ui.app_name') }}
                    </h1>
                    <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                        {{ config('ui.admin_work_service.sidebar.title') }}
                    </p>
                </div>
            </div>
        </div>

        {{-- Navigation Menu --}}
        <nav class="flex-1 p-4">
            <ul class="space-y-1">
                @foreach(config('ui.admin_work_service.sidebar.menu') as $item)
                    @php
                        $isCurrent = isset($item['route']) && Route::currentRouteName() === $item['route'];
                        $isDisabled = $item['disabled'] ?? false;
                    @endphp
                    <li>
                        @if($isDisabled)
                            {{-- Disabled menu item (placeholder) --}}
                            <div class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 cursor-not-allowed opacity-50">
                                <span class="material-symbols-outlined text-xl">
                                    {{ $item['icon'] }}
                                </span>
                                <span class="font-medium text-sm">{{ $item['label'] }}</span>
                                <span class="ml-auto text-[9px] uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                                    Soon
                                </span>
                            </div>
                        @else
                            <a 
                                href="{{ route($item['route']) }}"
                                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors {{ $isCurrent ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300' }}"
                            >
                                <span class="material-symbols-outlined text-xl" style="{{ $isCurrent ? 'font-variation-settings: \'FILL\' 1' : '' }}">
                                    {{ $item['icon'] }}
                                </span>
                                <span class="font-medium text-sm">{{ $item['label'] }}</span>
                            </a>
                        @endif
                    </li>
                @endforeach
            </ul>
        </nav>

        {{-- Footer: User Info + Logout --}}
        <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3 mb-4">
                <div class="size-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <span class="text-white font-bold text-sm">
                        {{ strtoupper(substr($user['nickname'] ?? $user['name'], 0, 2)) }}
                    </span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">
                        {{ $user['nickname'] ?? $user['name'] }}
                    </p>
                    <p class="text-xs text-slate-500 uppercase tracking-wider">
                        {{ $user['role'] }}
                    </p>
                </div>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button 
                    type="submit"
                    class="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                    <span class="material-symbols-outlined text-lg">logout</span>
                    <span class="text-sm font-medium">Logout</span>
                </button>
            </form>
        </div>
    </aside>

    {{-- ========================================
         MAIN CONTENT (con offset per sidebar)
         ======================================== --}}
    <main class="flex-1 ml-64 min-h-screen">

        {{-- ========================================
             HEADER CON SCHEDULER
             ======================================== --}}
        <header class="sticky top-0 z-30 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-slate-800">
            <div class="px-6 py-4">
                {{-- Titolo pagina --}}
                <div class="flex items-center justify-between mb-4">
                    <h1 class="text-xl font-bold text-white">
                        {{ config('ui.admin_work_service.page_title') }}
                    </h1>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                        <span class="material-symbols-outlined text-lg">schedule</span>
                        <span data-current-time>--:--</span>
                    </div>
                </div>
                
                {{-- Scheduler Week Container --}}
                <section 
                    class="py-2" 
                    data-scheduler-section
                    aria-label="{{ config('ui.admin_work_service.aria.scheduler_section') }}"
                >
                    {{-- Popolato da JS renderScheduler() --}}
                    <div class="flex items-center justify-center">
                        <div class="h-16 w-full max-w-2xl bg-slate-900/50 rounded-xl animate-pulse"></div>
                    </div>
                </section>
            </div>
        </header>

        {{-- ========================================
             CONTENT AREA (2 column on desktop)
             ======================================== --}}
        <div class="flex">

            {{-- ========================================
                 LEFT COLUMN: Time Slots + Pipeline
                 ======================================== --}}
            <div class="flex-1 p-6">

                {{-- Time Slot Selector --}}
                <section 
                    class="mb-6"
                    data-time-slots-section
                    aria-label="{{ config('ui.admin_work_service.aria.time_slots_section') }}"
                >
                    {{-- Popolato da JS renderTimeSlotSelector() --}}
                    <div class="h-20 bg-slate-900/50 rounded-xl animate-pulse"></div>
                </section>

                {{-- Orders Pipeline --}}
                <section 
                    data-orders-pipeline
                    aria-label="{{ config('ui.admin_work_service.aria.orders_pipeline') }}"
                    class="space-y-6"
                >
                    {{-- Status Row: Confirmed --}}
                    <div 
                        data-status-row="confirmed"
                        class="bg-slate-900/30 rounded-2xl p-4"
                    >
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-blue-500">schedule</span>
                            <h3 class="font-semibold text-blue-500">
                                {{ config('ui.admin_work_service.status_rows.confirmed.label') }}
                            </h3>
                            <span 
                                data-status-count="confirmed"
                                class="ml-auto text-sm text-slate-500"
                            >0</span>
                        </div>
                        <div 
                            data-status-orders="confirmed"
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                        >
                            {{-- Ordini confirmed popolati da JS --}}
                            <div class="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>
                        </div>
                    </div>

                    {{-- Status Row: Ready --}}
                    <div 
                        data-status-row="ready"
                        class="bg-slate-900/30 rounded-2xl p-4"
                    >
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-emerald-500">check_circle</span>
                            <h3 class="font-semibold text-emerald-500">
                                {{ config('ui.admin_work_service.status_rows.ready.label') }}
                            </h3>
                            <span 
                                data-status-count="ready"
                                class="ml-auto text-sm text-slate-500"
                            >0</span>
                        </div>
                        <div 
                            data-status-orders="ready"
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                        >
                            {{-- Ordini ready popolati da JS --}}
                            <div class="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>
                        </div>
                    </div>

                    {{-- Status Row: Picked Up --}}
                    <div 
                        data-status-row="picked_up"
                        class="bg-slate-900/30 rounded-2xl p-4"
                    >
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-slate-400">verified</span>
                            <h3 class="font-semibold text-slate-400">
                                {{ config('ui.admin_work_service.status_rows.picked_up.label') }}
                            </h3>
                            <span 
                                data-status-count="picked_up"
                                class="ml-auto text-sm text-slate-500"
                            >0</span>
                        </div>
                        <div 
                            data-status-orders="picked_up"
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                        >
                            {{-- Ordini picked_up popolati da JS --}}
                            <div class="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </section>

            </div>

            {{-- ========================================
                 RIGHT COLUMN: Order Recap Card (Sticky)
                 ======================================== --}}
            <aside 
                data-recap-sidebar
                class="hidden lg:block w-96 border-l border-slate-800 bg-[#0d1117]/50"
            >
                <div class="sticky top-[140px] p-6">
                    <div 
                        data-recap-card
                        class="bg-slate-900/50 rounded-2xl p-6"
                    >
                        {{-- Empty state iniziale --}}
                        <div class="text-center py-12" data-recap-empty>
                            <span class="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                                touch_app
                            </span>
                            <p class="text-slate-500 text-sm">
                                Select an order to see details
                            </p>
                        </div>
                        {{-- Contenuto ordine (nascosto inizialmente) --}}
                        <div data-recap-content class="hidden">
                            {{-- Popolato da JS renderRecapCard() --}}
                        </div>
                    </div>
                </div>
            </aside>

        </div>

    </main>

    {{-- ========================================
         MOBILE RECAP MODAL (visible on < lg)
         ======================================== --}}
    <div 
        data-recap-modal
        class="fixed inset-0 z-50 hidden lg:hidden"
    >
        {{-- Overlay --}}
        <div 
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            data-action="close-recap"
        ></div>
        
        {{-- Modal content --}}
        <div class="absolute bottom-0 left-0 right-0 bg-[#0d1117] rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                {{-- Header con close --}}
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-white">
                        {{ config('ui.admin_work_service.recap_card.title') }}
                    </h3>
                    <button 
                        type="button"
                        data-action="close-recap"
                        class="size-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        aria-label="{{ config('ui.admin_work_service.aria.close_recap') }}"
                    >
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                {{-- Contenuto ordine --}}
                <div data-recap-modal-content>
                    {{-- Popolato da JS --}}
                </div>
            </div>
        </div>
    </div>

</div>
@endsection
