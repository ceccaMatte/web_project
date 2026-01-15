@extends('layouts.app')

@section('title', 'Home')

@section('content')
{{--
    HOME PAGE - Utente (Pubblico)
    
    RESPONSABILITÀ:
    - Mostra TopBar + Sidebar
    - Sezioni: working day attuale, calendario, slot prenotabili
    - Stato user determina cosa può fare
    
    PATTERN:
    - data-page="home" per inizializzazione JS
    - Overlay mobile per sidebar
    - Nessuna logica inline
    
    DATI RICEVUTI DAL CONTROLLER:
    - $user: { authenticated, enabled, name }
    - $todayWorkingDay: info giornata corrente (se esiste)
    - $futureWorkingDays: giorni futuri con slot
--}}

{{-- Wrapper con data-page per JS --}}
<div data-page="home">

    {{--
        User State per JavaScript
        - Passa stato user dal backend a JS
        - JSON inline letto da home.js
    --}}
    <script type="application/json" data-user-state>
        @json($user)
    </script>

    {{--
        Today Service Data per JavaScript
        - Dati per truck-status-card
        - Letto da home.js e salvato in homeState.todayService
    --}}
    <script type="application/json" data-today-service>
        @json($todayServiceData)
    </script>

    {{--
        Week Days Data per JavaScript
        - Dati per week-scheduler
        - Letto da home.js e salvato in homeState.weekDays + selectedDayId
    --}}
    <script type="application/json" data-week-days>
        @json($weekDaysData)
    </script>

    {{--
        Orders Preview Data per JavaScript
        - Dati per order-preview-card
        - Contiene array di ordini dell'utente per oggi
        - Letto da home.js e processato da computeOrdersPreviewState
    --}}
    <script type="application/json" data-orders-preview>
        @json($ordersPreviewData ?? ['orders' => []])
    </script>

    {{-- TopBar --}}
    @include('components.top-bar')

    {{--
        Overlay Mobile
        - Visibile solo su mobile (md:hidden)
        - Click chiude la sidebar (data-action)
        - z-40: sotto la sidebar (z-50)
        - Inizialmente nascosto (JS gestisce visibility)
    --}}
    <div 
        data-overlay
        class="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 hidden md:hidden"
        data-action="close-sidebar"
    ></div>

    {{-- Sidebar --}}
    @include('components.sidebar', ['user' => $user])

    {{-- Main Content --}}
    <main class="flex flex-col gap-6 pb-12">
        
        {{--
            SEZIONE 1: Truck Status Card
            - Container renderizzato dinamicamente da home.js
            - NON contiene dati hard-coded
            - Il rendering avviene dopo caricamento dati in homeState
        --}}
        <section class="px-5 pt-4">
            <div id="truck-status-section" data-truck-status-section>
                {{-- Il contenuto viene popolato da renderTruckStatus() in home.js --}}
            </div>
        </section>

        {{--
            SEZIONE 2: Week Scheduler
            - Container renderizzato dinamicamente da home.js
            - NON contiene dati hard-coded
            - Il rendering avviene dopo caricamento dati in homeState
        --}}
        <section class="px-5">
            <div id="scheduler-section" data-scheduler-section>
                {{-- Il contenuto viene popolato da renderScheduler() in home.js --}}
            </div>
        </section>

        {{--
            SEZIONE 3: Order Preview Card (dinamica)
            - Renderizzata dinamicamente da home.js in base a:
              - Utente loggato/non loggato
              - Numero ordini (0, 1, 2+)
            - Il container viene popolato da renderOrderPreview()
            - Header con titolo e bottone "View All"
        --}}
        <section class="px-5" data-order-preview-section>
            {{-- Header sezione --}}
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-white text-sm font-bold">
                    {{ config('ui.labels.order_preview.section_title') }}
                </h3>
                {{-- 
                    Bottone View All
                    - data-view-all-button: riferimento per JS
                    - href dinamico gestito da JS in base a isAuthenticated
                --}}
                <a 
                    href="{{ route('orders.index') }}"
                    data-view-all-button
                    class="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
                    aria-label="{{ config('ui.labels.order_preview.view_all') }}"
                >
                    {{ config('ui.labels.order_preview.view_all') }}
                    <span class="material-symbols-outlined text-xs" aria-hidden="true">
                        {{ config('ui.order_preview_icons.arrow_forward') }}
                    </span>
                </a>
            </div>
            
            {{-- Container per la card dinamica --}}
            <div data-order-preview-container>
                {{-- Il contenuto viene popolato da renderOrderPreview() in home.js --}}
            </div>
        </section>

        {{--
            SEZIONE 4: Pre-book Slots Futuri
            - Scroll orizzontale
            - Mostra slot disponibili per domani/prossimi giorni
        --}}
        <section class="flex flex-col gap-4">
            <div class="px-5">
                <h3 class="text-white text-sm font-bold mb-1">Pre-book for Tomorrow</h3>
                <p class="text-slate-500 text-xs">
                    {{ now()->addDay()->format('l, F d') }} • Engineering Hub
                </p>
            </div>

            {{-- Scroll Orizzontale Slot --}}
            <div class="flex overflow-x-auto no-scrollbar gap-4 px-5">
                {{-- Slot Disponibile --}}
                <div class="min-w-[160px] p-4 rounded-2xl border border-border-dark bg-surface-dark flex flex-col gap-4 shadow-lg">
                    <div>
                        <p class="text-white text-base font-bold">11:00 AM</p>
                        <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                            12 Slots left
                        </p>
                    </div>
                    <button class="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg active:scale-95 transition-transform shadow-lg shadow-primary/20">
                        Book Slot
                    </button>
                </div>

                {{-- Slot Quasi Pieno --}}
                <div class="min-w-[160px] p-4 rounded-2xl border border-border-dark bg-surface-dark flex flex-col gap-4 shadow-lg">
                    <div>
                        <p class="text-white text-base font-bold">11:30 AM</p>
                        <p class="text-amber-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                            4 Slots left
                        </p>
                    </div>
                    <button class="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg active:scale-95 transition-transform shadow-lg shadow-primary/20">
                        Book Slot
                    </button>
                </div>

                {{-- Slot Pieno --}}
                <div class="min-w-[160px] p-4 rounded-2xl border border-border-dark bg-surface-dark/50 flex flex-col gap-4 opacity-60">
                    <div>
                        <p class="text-slate-400 text-base font-bold">12:00 PM</p>
                        <p class="text-rose-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                            Fully Booked
                        </p>
                    </div>
                    <button class="w-full py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed" disabled>
                        Waitlist
                    </button>
                </div>
            </div>
        </section>

    </main>

</div>
@endsection
