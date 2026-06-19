@extends('layouts.app')

@section('title', 'Statistics')

@section('content')
<div data-page="admin-statistics" class="min-h-screen bg-[#0a0e1a]">
    @include('components.admin-sidebar', [
        'menu' => config('ui.admin_work_service.sidebar.menu'),
        'user' => $user,
        'sidebarTitle' => config('ui.admin_work_service.sidebar.title'),
    ])

    <script type="application/json" data-statistics-defaults>
        @json(['from' => $defaultFrom, 'to' => $defaultTo])
    </script>

    <header class="sticky top-0 z-30 bg-background-dark/90 backdrop-blur-md border-b border-border-dark px-5 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-xl">monitoring</span>
            </div>
            <div>
                <h1 class="text-white text-base font-bold">Statistics</h1>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Service analytics</p>
            </div>
        </div>
        <button type="button" data-action="open-sidebar" class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300">
            <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
    </header>

    <main class="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-border-dark flex items-center justify-between gap-4">
                <div>
                    <h2 class="text-white text-sm font-bold">Analytics dashboard</h2>
                    <p class="text-xs text-slate-500 mt-1">Orders, customers, slots and ingredient demand.</p>
                </div>
                <div class="hidden sm:flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <span class="material-symbols-outlined text-[22px]">query_stats</span>
                </div>
            </div>
            <div class="p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label class="block">
                    <span class="block mb-2 text-[10px] font-bold uppercase text-slate-500">From</span>
                    <input type="date" data-stats-from class="w-full bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm font-semibold text-white outline-none focus:border-primary/70">
                </label>
                <label class="block">
                    <span class="block mb-2 text-[10px] font-bold uppercase text-slate-500">To</span>
                    <input type="date" data-stats-to class="w-full bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm font-semibold text-white outline-none focus:border-primary/70">
                </label>
                <button type="button" data-action="refresh-statistics" class="rounded-xl bg-primary text-white text-xs font-bold uppercase px-5 py-3 flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh
                </button>
            </div>
            <p data-statistics-status class="px-4 pb-4 text-xs text-slate-500">Loading...</p>
        </section>

        <div data-statistics-content class="space-y-4"></div>
    </main>
</div>
@endsection
