@extends('layouts.app')

@section('title', config('ui.admin_work_service.page_title'))

@section('content')
{{--
    ADMIN WORK SERVICE PAGE - MOBILE FIRST
    
    LAYOUT MOBILE (BASE):
    - Top bar sticky (titolo + hamburger)
    - Scheduler full width
    - Time slot selector horizontal scroll
    - Pipeline 3 sezioni verticali
    - Recap sticky bottom
    
    SIDEBAR:
    - Hidden di default
    - Overlay da DESTRA (non sinistra)
    - Si apre con hamburger
    - Fixed + backdrop
    
    DESKTOP:
    - Sidebar diventa fissa a sinistra
    - Recap diventa sidebar destra
    - Layout a colonne
--}}

{{-- Wrapper con data-page per JS --}}
<div data-page="admin-work-service" class="min-h-screen bg-[#0a0e1a]">

    {{-- User State per JavaScript --}}
    <script type="application/json" data-user-state>
        @json($user)
    </script>

    {{-- ========================================
         SIDEBAR ADMIN - OVERLAY DA DESTRA (mobile first)
         Hidden di default, si apre con hamburger
         ======================================== --}}
    {{-- Backdrop --}}
    <div 
        data-sidebar-backdrop
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 hidden"
        data-action="close-sidebar"
    ></div>

    {{-- Sidebar panel - da DESTRA --}}
    <aside 
        data-admin-sidebar
        class="fixed top-0 right-0 h-full w-80 bg-[#0d1117] border-l border-slate-800 flex flex-col z-50 transform translate-x-full transition-transform duration-300"
        id="sidebar-menu"
    >
        {{-- Header sidebar con close button --}}
        <div class="p-6 border-b border-slate-800">
            {{-- Close button (solo mobile) --}}
            <button 
                type="button"
                data-action="close-sidebar"
                class="lg:hidden mb-4 p-2 -ml-2 text-slate-400 hover:text-white"
                aria-label="Close menu"
            >
                <span class="material-symbols-outlined text-2xl">close</span>
            </button>
            
            {{-- Logo + Titolo --}}
            <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined text-2xl">
                        {{ config('ui.icons.logo') }}
                    </span>
                </div>
                <div>
                    <h2 class="text-white text-base font-bold leading-tight">
                        {{ config('ui.app_name') }}
                    </h2>
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
                                data-action="close-sidebar"
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
         MAIN CONTENT
         No offset su mobile, offset lg:ml-64 su desktop
         ======================================== --}}
    <main class="min-h-screen">

        {{-- ========================================
             TOP BAR - Logo + branding + menu
             ======================================== --}}
        <header class="flex items-center bg-background-dark/80 backdrop-blur-md px-5 py-4 justify-between sticky top-0 z-30 border-b border-border-dark/50">
            {{-- Logo + Brand --}}
            <div class="flex items-center gap-3">
                {{-- Logo Icon --}}
                <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined text-2xl">
                        local_shipping
                    </span>
                </div>
                {{-- Title --}}
                <div>
                    <h1 class="text-white text-base font-bold leading-tight">
                        {{ config('ui.admin_work_service.page_title') }}
                    </h1>
                </div>
            </div>

            {{-- Actions --}}
            <div class="flex items-center gap-2">
                <button 
                    type="button" 
                    data-action="open-sidebar"
                    class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300 hover:text-white active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                    aria-label="Apri menu di navigazione" 
                    aria-expanded="false" 
                    aria-controls="sidebar-menu"
                >
                    <span class="material-symbols-outlined text-[22px]">
                        menu
                    </span>
                </button>
            </div>
        </header>

        {{-- ========================================
             SCHEDULER - Sempre visibile sotto top bar
             ======================================== --}}
        <div class="px-4 py-4 border-b border-slate-800/50">
            <section 
                data-scheduler-container
                class="w-full"
                aria-label="{{ config('ui.admin_work_service.aria.scheduler_section') }}"
            >
                {{-- Popolato da JS: weekScheduler.component.js --}}
                <div data-scheduler-week></div>
            </section>
        </div>

        {{-- ========================================
             CONTENT AREA
             Mobile: single column
             Desktop: 2 columns (flex)
             ======================================== --}}
        <div class="lg:flex">

            {{-- ========================================
                 MAIN COLUMN: Time Slots + Pipeline
                 Mobile: full width
                 Desktop: flex-1
                 ======================================== --}}
            <div class="lg:flex-1">

                {{-- ========================================
                     TIME SLOT SELECTOR
                     Scroll orizzontale, card larghe ~240px
                     ======================================== --}}
                <section 
                    data-timeslot-selector-container
                    class="px-4 py-6 border-b border-slate-800/50"
                    aria-label="{{ config('ui.admin_work_service.aria.time_slots_section') }}"
                >
                    {{-- Popolato da JS: workTimeSlotSelector.component.js --}}
                    <div data-timeslot-selector class="overflow-x-auto"></div>
                </section>

                {{-- ========================================
                     ORDERS PIPELINE
                     3 sezioni verticali su mobile
                     ======================================== --}}
                <section 
                    data-orders-pipeline
                    class="px-4 py-6 space-y-6 mb-32 lg:mb-0"
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
                            class="overflow-x-auto"
                        >
                            {{-- Ordini confirmed popolati da JS --}}
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
                            class="overflow-x-auto"
                        >
                            {{-- Ordini ready popolati da JS --}}
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
                            class="overflow-x-auto"
                        >
                            {{-- Ordini picked_up popolati da JS --}}
                        </div>
                    </div>
                </section>

            </div>

            {{-- ========================================
                 DESKTOP RECAP SIDEBAR (solo lg+)
                 ======================================== --}}
            <aside 
                data-recap-sidebar
                class="hidden lg:block lg:w-96 lg:border-l lg:border-slate-800 lg:bg-[#0d1117]/50"
            >
                <div class="sticky top-[200px] p-6">
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
                            {{-- Popolato da JS: workOrderRecapCard.component.js --}}
                        </div>
                    </div>
                </div>
            </aside>

        </div>

    </main>

    {{-- ========================================
         MOBILE RECAP STICKY BOTTOM
         Sempre visibile, collassabile
         ======================================== --}}
    <div 
        data-recap-mobile
        class="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#0d1117] border-t border-slate-800 shadow-2xl transition-transform duration-300 translate-y-full"
    >
        {{-- Handle per collassare --}}
        <button 
            type="button"
            data-action="toggle-recap"
            class="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white border-b border-slate-800/50"
            aria-label="Toggle order details"
        >
            <div class="w-12 h-1 bg-slate-700 rounded-full"></div>
        </button>
        
        {{-- Contenuto recap --}}
        <div data-recap-mobile-content class="px-4 py-4 max-h-[60vh] overflow-y-auto">
            {{-- Popolato da JS: workOrderRecapCard.component.js --}}
            <div class="text-center py-8 text-slate-500 text-sm" data-recap-empty>
                Select an order to see details
            </div>
            <div data-recap-content class="hidden">
                {{-- Contenuto ordine --}}
            </div>
        </div>
    </div>

</div>
@endsection
