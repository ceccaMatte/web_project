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

    {{--
        Booking Slots Data per JavaScript
        - Dati per la sezione "Pre-book for Tomorrow"
        - Contiene data, location e array di slot disponibili
        - Letto da home.js e salvato in homeState.booking
    --}}
    @php
        $defaultBookingData = [
            'dateLabel' => now()->addDay()->format('l, F d'),
            'locationLabel' => 'Engineering Hub',
            'slots' => []
        ];
    @endphp
    <script type="application/json" data-booking-slots>
        @json($bookingSlotsData ?? $defaultBookingData)
    </script>

    {{-- TopBar Container --}}
    <div data-top-bar>
        {{-- Popolato da JavaScript: renderTopBar() --}}
        @include('components.top-bar')
    </div>

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
    <main class="flex flex-col gap-6 pb-12 md:max-w-5xl md:mx-auto md:px-6">
        
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
            {{-- Header sezione (popolato dinamicamente da JS in base a isAuthenticated) --}}
            <div class="flex items-center justify-between mb-4" data-order-preview-header>
                {{-- Il contenuto viene popolato da renderOrderPreviewHeader() in home.js --}}
            </div>
            
            {{-- Container per la card dinamica --}}
            <div data-order-preview-container>
                {{-- Il contenuto viene popolato da renderOrderPreview() in home.js --}}
            </div>
        </section>

        {{--
            SEZIONE 4: Time Slots Giorno Selezionato
            - Mostra time slots del giorno selezionato nello scheduler  
            - PRINCIPIO: I time slots DEVONO SEMPRE corrispondere al selectedDate
            - Header mostra giorno selezionato + location
            - Container dinamico popolato da home.actions.js
            - ERRORE PRECEDENTE: Questa sezione mostrava "slot futuri" invece
              dei time slots del selectedDate. Ora è stata corretta.
        --}}
        <section class="flex flex-col gap-4" data-booking-section>
            {{-- Header sezione: giorno selezionato + location (popolato dinamicamente da JS) --}}
            <div class="px-5" data-booking-header>
                {{-- Il contenuto viene popolato da renderBookingHeader() per mostrare selectedDate --}}
            </div>

            {{-- Time Slots del giorno selezionato (popolato da renderTimeSlots) --}}
            <div 
                class="px-5"
                data-booking-slots-container
                role="list"
                aria-label="Available time slots for selected day"
            >
                {{-- Il contenuto viene popolato da renderTimeSlots() in home.actions.js --}}
            </div>
        </section>

    </main>

</div>
@endsection
