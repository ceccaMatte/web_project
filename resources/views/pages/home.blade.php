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
            SEZIONE 3: Ordini Utente (se autenticato)
            - Stack di card ordini
            - Solo per utenti autenticati e abilitati
        --}}
        @if($user['authenticated'] && $user['enabled'])
            <section class="px-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-white text-sm font-bold">Your Orders for Today</h3>
                    <button class="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        View All
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                </div>

                {{-- Placeholder Order Stack --}}
                <div class="relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform">
                    {{-- Layers dietro (effetto stack) --}}
                    <div class="absolute inset-0 top-4 mx-4 h-full rounded-xl border border-border-dark/30 bg-surface-dark/40 scale-[0.92] opacity-40 z-0"></div>
                    <div class="absolute inset-0 top-2 mx-2 h-full rounded-xl border border-border-dark/60 bg-surface-dark/80 scale-[0.96] opacity-70 z-10"></div>
                    
                    {{-- Card principale --}}
                    <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <div class="size-11 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-emerald-500">receipt_long</span>
                                </div>
                                <div class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface-dark shadow-lg">
                                    3
                                </div>
                            </div>
                            <div>
                                <p class="text-white text-sm font-bold">Panino del Giorno</p>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                        Ready at 12:45 PM
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-px bg-border-dark/50"></div>
                            <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                        </div>
                    </div>
                </div>
            </section>
        @endif

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
