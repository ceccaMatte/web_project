@extends('layouts.app')

@section('title', config('ui.orders.page_title'))

@section('content')
{{--
    ORDERS PAGE - Utente Autenticato
    
    RESPONSABILITÀ:
    - Mostra TopBar + Sidebar
    - Header con back button
    - Scheduler settimanale
    - Sezioni: Active Orders + Recently Ordered
    
    PATTERN:
    - data-page="orders" per inizializzazione JS
    - Overlay mobile per sidebar
    - Nessuna logica inline
    
    DATI RICEVUTI DAL CONTROLLER:
    - $user: { authenticated, enabled, name }
    - $scheduler: { selectedDayId, monthLabel, weekDays }
    - $activeOrders: ordini attivi per oggi
    - $recentOrders: storico ordini recenti
    
    ACCESSIBILITÀ (WCAG 2.1 AAA):
    - Navigazione via tastiera completa
    - ARIA labels su tutti gli elementi interattivi
    - Focus visibile su tutti i bottoni
    - Stati non comunicati solo via colore
--}}

{{-- Wrapper con data-page per JS --}}
<div data-page="orders">

    {{--
        User State per JavaScript
        - Passa stato user dal backend a JS
        - JSON inline letto da orders/index.js
    --}}
    <script type="application/json" data-user-state>
        @json($user)
    </script>

    {{--
        Week Days Data per JavaScript
        - Dati per week-scheduler
        - Letto da orders/index.js e salvato in ordersState
    --}}
    <script type="application/json" data-week-days>
        @json($scheduler)
    </script>

    {{-- TopBar Container (popolato da JavaScript) --}}
    <div data-top-bar>
        @include('components.top-bar')
    </div>

    {{--
        Overlay Mobile
        - Visibile solo su mobile (md:hidden)
        - Click chiude la sidebar (data-action)
        - z-40: sotto la sidebar (z-50)
        - Inizialmente nascosto (JS gestisce visibility)
        
        ACCESSIBILITÀ: L'overlay è decorativo, non necessita di aria-label
    --}}
    <div 
        data-overlay
        class="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 hidden md:hidden"
        data-action="close-sidebar"
    ></div>

    {{-- Sidebar --}}
    @include('components.sidebar', ['user' => $user])

    {{-- Main Content --}}
    <main class="pb-32 md:max-w-6xl md:mx-auto md:px-6">

        {{--
            HEADER SEZIONE
            - Minimal: back button + titolo centrato + spacer
            - Renderizzato da JS via renderOrdersHeader()
            
            ACCESSIBILITÀ:
            - aria-label sul back button per screen reader
        --}}
        <header 
            class="border-b border-slate-800"
            data-orders-header
        >
            {{-- Popolato da renderOrdersHeader() in orders.render.js --}}
            {{-- Placeholder iniziale --}}
            <div class="px-5 py-2 flex items-center justify-between">
                <div class="w-8 h-8"></div>
                <h1 class="text-sm font-bold tracking-tight text-slate-800 dark:text-white">{{ config('ui.orders.page_title') }}</h1>
                <div class="w-8"></div>
            </div>
        </header>

        {{--
            DESKTOP GRID WRAPPER
            - Su mobile: block (ordine verticale)
            - Su desktop: 2 colonne [380px_1fr] con gap
        --}}
        <div class="md:grid md:grid-cols-[380px_1fr] md:gap-6">

            {{-- ========================================
                 COLONNA SINISTRA: Scheduler + Active Orders
                 ======================================== --}}
            <div class="md:flex md:flex-col md:gap-8">

                {{--
                    SEZIONE 1: Week Scheduler
                    - Container renderizzato dinamicamente da JS
                    - Riusa componente week-scheduler esistente
                --}}
                <section class="py-6 px-5" aria-label="Schedule selector">
                    <div data-scheduler-section>
                        {{-- Popolato da renderScheduler() in orders.render.js --}}
                    </div>
                </section>

                {{--
                    SEZIONE 2: Active Orders
                    - Mostra ordini attivi per il giorno selezionato
                    - Se vuoto: empty state con CTA "Order Now"
                    - Se popolato: carosello orizzontale
                    
                    ACCESSIBILITÀ:
                    - aria-label sulla sezione per contesto
                    - role="region" per landmark navigation
                --}}
                <section 
                    class="px-5 mb-8 md:mb-0" 
                    data-active-orders-section
                    aria-label="{{ config('ui.orders.aria.active_orders_section') }}"
                    role="region"
                >
                    {{-- Titolo sezione con indicatore --}}
                    <h2 
                        class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center"
                        data-active-orders-title
                    >
                        {{ config('ui.orders.active_orders.title') }}
                        <span class="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true"></span>
                    </h2>
                    
                    {{-- Container per carosello o empty state (popolato da JS) --}}
                    <div data-active-orders-container>
                        {{-- Popolato da renderActiveOrdersSection() in orders.render.js --}}
                        {{-- Loading skeleton iniziale --}}
                        <div class="h-[180px] w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl animate-pulse flex items-center justify-center">
                            <span class="material-symbols-outlined text-slate-400 text-4xl">hourglass_empty</span>
                        </div>
                    </div>
                </section>

            </div>

            {{-- ========================================
                 COLONNA DESTRA: Recently Ordered (scrollabile)
                 ======================================== --}}
            <div class="md:max-h-[calc(100vh-200px)] md:overflow-y-auto">

                {{--
                    SEZIONE 3: Recently Ordered
                    - Storico ordini passati
                    - Toggle per filtrare solo preferiti
                    - Lista verticale di card
                    
                    ACCESSIBILITÀ:
                    - aria-label sulla sezione
                    - Toggle preferiti con aria-pressed
                --}}
                <section 
                    class="px-5" 
                    data-recent-orders-section
                    aria-label="{{ config('ui.orders.aria.recent_orders_section') }}"
                    role="region"
                >
                    {{-- Header con titolo e toggle preferiti (popolato da JS) --}}
                    <div class="mb-4" data-recent-orders-header>
                        {{-- Popolato da renderRecentOrdersSection() in orders.render.js --}}
                        <div class="flex justify-between items-center">
                            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {{ config('ui.orders.recent_orders.title') }}
                            </h2>
                        </div>
                    </div>
                    
                    {{-- Lista ordini recenti (popolato da JS) --}}
                    <div data-recent-orders-list>
                        {{-- Popolato da renderRecentOrdersSection() in orders.render.js --}}
                        {{-- Loading skeleton iniziale --}}
                        <div class="space-y-4">
                            @for ($i = 0; $i < 2; $i++)
                            <div class="bg-slate-100 dark:bg-slate-900/50 rounded-2xl h-28 animate-pulse"></div>
                            @endfor
                        </div>
                    </div>
                </section>

            </div>

        </div>

    </main>

</div>
@endsection
