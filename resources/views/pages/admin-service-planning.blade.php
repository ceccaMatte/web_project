@extends('layouts.app')

@section('title', config('ui.admin_service_planning.page_title'))

@section('content')
{{--
    ADMIN SERVICE PLANNING PAGE - MOBILE FIRST
    
    LAYOUT:
    - Top bar sticky (titolo + hamburger)
    - Week selector (navigazione settimane)
    - Global constraints card
    - Daily availability list (7 giorni)
    - Save button sticky bottom
    
    SIDEBAR:
    - Hidden di default
    - Overlay da DESTRA
    - Si apre con hamburger
--}}

{{-- Wrapper con data-page per JS --}}
<div data-page="service-planning" class="min-h-screen" style="background-color: #0a0e1a;">

    {{-- User State per JavaScript --}}
    <script type="application/json" data-user-state>
        @json($user)
    </script>

    {{-- Config defaults per JavaScript --}}
    <script type="application/json" data-config-defaults>
        {!! json_encode([
            'maxOrdersPerSlot' => config('service_planning.default_max_orders_per_slot'),
            'minMaxOrdersPerSlot' => config('service_planning.min_max_orders_per_slot'),
            'maxMaxOrdersPerSlot' => config('service_planning.max_max_orders_per_slot'),
            'maxPendingTime' => config('service_planning.default_max_pending_time'),
            'location' => config('service_planning.default_location'),
            'dayStartTime' => config('service_planning.default_day_start_time'),
            'dayEndTime' => config('service_planning.default_day_end_time'),
            'timeSlotDuration' => config('service_planning.time_slot_duration'),
        ]) !!}
    </script>

    {{-- Reusable admin sidebar --}}
    @include('components.admin-sidebar', [
        'menu' => config('ui.admin_service_planning.sidebar.menu'),
        'user' => $user,
        'sidebarTitle' => config('ui.admin_service_planning.sidebar.title'),
    ])

    {{-- ========================================
         TOPBAR ADMIN - STICKY
         ======================================== --}}
    <header class="sticky top-0 z-30 backdrop-blur-sm border-b border-slate-800" style="background-color: rgba(13, 17, 23, 0.95);">
        <div class="flex items-center justify-between p-4">
            {{-- Titolo pagina --}}
            <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined text-xl">calendar_month</span>
                </div>
                <div>
                    <h1 class="text-white text-sm font-bold">
                        {{ config('ui.admin_service_planning.page_title') }}
                    </h1>
                    <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                        Weekly Configuration
                    </p>
                </div>
            </div>

            {{-- Hamburger Menu --}}
            <button 
                type="button"
                data-action="open-sidebar"
                class="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Open menu"
            >
                <span class="material-symbols-outlined text-2xl">menu</span>
            </button>
        </div>
    </header>

    {{-- ========================================
         MAIN CONTENT
         ======================================== --}}
    <main class="p-4 pb-24 space-y-4 max-w-3xl mx-auto">

        {{-- Week Selector --}}
        <div data-week-selector-container>
            {{-- Rendered via JS --}}
            <div class="flex items-center justify-between bg-card-dark border border-border-dark p-2 rounded-2xl animate-pulse">
                <div class="p-2 w-10 h-10"></div>
                <div class="text-center">
                    <div class="h-3 w-20 bg-slate-700 rounded mx-auto mb-1"></div>
                    <div class="h-4 w-32 bg-slate-700 rounded mx-auto"></div>
                </div>
                <div class="p-2 w-10 h-10"></div>
            </div>
        </div>

        {{-- Global Constraints Card --}}
        <div data-global-constraints-container>
            {{-- Rendered via JS --}}
            <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-xl animate-pulse">
                <div class="px-4 py-3 border-b border-border-dark bg-white/5">
                    <div class="h-3 w-32 bg-slate-700 rounded"></div>
                </div>
                <div class="p-4 space-y-4">
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                    <div class="h-px bg-border-dark"></div>
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                    <div class="h-px bg-border-dark"></div>
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                </div>
            </section>
        </div>

        {{-- Daily Availability List --}}
        <section>
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {{ config('ui.admin_service_planning.daily_availability.title') }}
            </h2>
            <div data-daily-availability-container class="space-y-3">
                {{-- Rendered via JS - skeleton placeholders --}}
                @for($i = 0; $i < 7; $i++)
                <div class="bg-card-dark border border-border-dark rounded-2xl p-4 animate-pulse">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-slate-700"></div>
                            <div>
                                <div class="h-4 w-20 bg-slate-700 rounded mb-1"></div>
                                <div class="h-3 w-16 bg-slate-700 rounded"></div>
                            </div>
                        </div>
                        <div class="w-11 h-6 bg-slate-700 rounded-full"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="h-12 bg-slate-800 rounded-xl"></div>
                        <div class="h-12 bg-slate-800 rounded-xl"></div>
                    </div>
                </div>
                @endfor
            </div>
        </section>

    </main>

    {{-- ========================================
         SAVE BUTTON - STICKY BOTTOM
         ======================================== --}}
    <div class="fixed bottom-0 left-0 right-0 p-4 z-20 max-w-3xl mx-auto" style="background: linear-gradient(to top, #0a0e1a, #0a0e1a, transparent);">
        <button 
            type="button"
            data-action="save-changes"
            disabled
            class="w-full py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all
                   bg-primary text-white
                   disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            style="transform-origin: center;"
            onmousedown="this.style.transform='scale(0.98)'"
            onmouseup="this.style.transform='scale(1)'"
            onmouseleave="this.style.transform='scale(1)'"
            aria-label="{{ config('ui.admin_service_planning.aria.save_changes') }}"
        >
            <span data-save-label>{{ config('ui.admin_service_planning.save.disabled_label') }}</span>
        </button>
    </div>

</div>
@endsection
