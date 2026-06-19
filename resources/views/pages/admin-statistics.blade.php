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

    <main class="max-w-6xl mx-auto p-4 space-y-4">
        <section class="bg-card-dark border border-border-dark rounded-2xl p-4">
            <div class="grid md:grid-cols-[1fr_1fr_140px] gap-3">
                <input type="date" data-stats-from class="bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm text-white">
                <input type="date" data-stats-to class="bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm text-white">
                <button type="button" data-action="refresh-statistics" class="rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-3">Refresh</button>
            </div>
            <p data-statistics-status class="mt-3 text-xs text-slate-500">Loading...</p>
        </section>

        <div data-statistics-content class="space-y-4"></div>
    </main>
</div>
@endsection
