@extends('layouts.app')

@section('title', $mode === 'create' ? 'Create Order' : 'Modify Order')

@section('content')
{{--
    ORDER FORM PAGE - Create / Modify Order
    
    RESPONSABILITÀ:
    - Mostra form per creazione/modifica ordine
    - CREATE: scheduler + time slots + ingredienti
    - MODIFY: solo ingredienti (ordine esistente)
    
    PATTERN:
    - data-page="order-form" per inizializzazione JS
    - Inline JSON per hydration iniziale
    - Componenti renderizzati via JS
    
    DATI RICEVUTI DAL CONTROLLER:
    - $mode: 'create' | 'modify'
    - $orderId: number|null
    - $selectedDate: string (YYYY-MM-DD)
    - $user: { authenticated, name }
--}}

<div data-page="order-form" class="flex flex-col min-h-screen">

    {{-- ========================================
         TOP BAR
         ======================================== --}}
    <header 
        data-topbar
        class="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-xl border-b border-border-dark"
    >
        {{-- Rendered by JS --}}
    </header>

    {{-- ========================================
         SIDEBAR + OVERLAY
         ======================================== --}}
    <div 
        data-sidebar-overlay
        class="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 hidden"
        aria-hidden="true"
    ></div>

    {{-- Sidebar (usa stesso componente di Home/Orders) --}}
    @include('components.sidebar', ['user' => $user])

    {{-- ========================================
         MAIN CONTENT
         ======================================== --}}
    <main class="flex-1 overflow-y-auto pb-32 md:pb-8 md:max-w-6xl md:mx-auto md:px-6">

        {{-- Header con back button e titolo --}}
        <div data-header class="px-4 py-4">
            {{-- Rendered by JS --}}
        </div>

        {{-- Loader (mostrato durante caricamento) --}}
        <div data-loader class="hidden px-4 py-8">
            <div class="flex flex-col items-center justify-center gap-4">
                <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-slate-400 text-sm">Loading...</p>
            </div>
        </div>

        {{-- Content container (nascosto durante loading) --}}
        {{-- Desktop: 2-column grid layout --}}
        <div data-content class="hidden md:grid md:grid-cols-[1fr_360px] md:gap-6">

            {{-- ========================================
                 LEFT COLUMN: Scheduler + TimeSlots + Ingredients
                 ======================================== --}}
            <div class="flex flex-col">

                {{-- SCHEDULER SECTION (solo CREATE mode) --}}
                @if($mode === 'create')
                <section data-scheduler-section class="px-4 md:px-0 mb-6">
                    <h2 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Schedule
                    </h2>
                    <div data-scheduler-container>
                        {{-- Rendered by JS --}}
                    </div>
                </section>

                {{-- TIME SLOTS SECTION (solo CREATE mode) --}}
                <section data-timeslots-section class="px-4 md:px-0 mb-6">
                    <h2 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Pickup Time
                    </h2>
                    <div data-timeslots-container class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                        {{-- Rendered by JS --}}
                    </div>
                </section>
                @endif

                {{-- SELECTED INGREDIENTS SUMMARY (Mobile only - in left column) --}}
                <section data-summary-section class="px-4 md:hidden mb-6">
                    <h2 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Your Selection
                    </h2>
                    <div data-summary-container>
                        {{-- Rendered by JS --}}
                    </div>
                </section>

                {{-- ADD INGREDIENTS SECTION --}}
                <section data-ingredients-section class="px-4 md:px-0 mb-8">
                    <h2 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Add Ingredients
                    </h2>
                    <div data-ingredients-container class="space-y-2">
                        {{-- Rendered by JS --}}
                    </div>
                </section>

            </div>

            {{-- ========================================
                 RIGHT COLUMN: Your Selection + CTA (Desktop only)
                 ======================================== --}}
            <div class="hidden md:block">
                <div class="sticky top-24 space-y-4">

                    {{-- SELECTED INGREDIENTS SUMMARY (Desktop) --}}
                    <section data-summary-section-desktop>
                        <h2 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Your Selection
                        </h2>
                        <div data-summary-container-desktop>
                            {{-- Rendered by JS --}}
                        </div>
                    </section>

                    {{-- CTA BUTTON (Desktop) --}}
                    <div data-footer-actions-desktop class="flex gap-3">
                        {{-- Rendered by JS --}}
                    </div>

                </div>
            </div>

        </div>

    </main>

    {{-- ========================================
         FOOTER ACTIONS (Fixed bottom - Mobile only)
         ======================================== --}}
    <footer 
        data-footer
        class="fixed bottom-0 left-0 right-0 mx-auto bg-surface-dark/95 backdrop-blur-xl border-t border-border-dark p-4 z-30 md:hidden"
    >
        <div data-footer-actions class="flex gap-3">
            {{-- Rendered by JS --}}
        </div>
    </footer>

    {{-- ========================================
         INLINE DATA (per hydration iniziale)
         ======================================== --}}
    <script id="order-form-data" type="application/json">
        {!! json_encode([
            'mode' => $mode,
            'orderId' => $orderId ?? null,
            'selectedDate' => $selectedDate ?? now()->toDateString(),
            'user' => $user,
            'reorderIngredients' => $reorderIngredients ?? [],
        ]) !!}
    </script>

</div>

{{-- Entry point pagina --}}
@vite('resources/js/pages/order-form/index.js')

@endsection
