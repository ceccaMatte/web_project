@extends('layouts.app')

@section('title', 'Ingredients')

@section('content')
<div data-page="admin-ingredients" class="min-h-screen bg-[#0a0e1a]">
    @include('components.admin-sidebar', [
        'menu' => config('ui.admin_work_service.sidebar.menu'),
        'user' => $user,
        'sidebarTitle' => config('ui.admin_work_service.sidebar.title'),
    ])

    <header class="sticky top-0 z-30 bg-background-dark/90 backdrop-blur-md border-b border-border-dark px-5 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-xl">restaurant_menu</span>
            </div>
            <div>
                <h1 class="text-white text-base font-bold">Ingredients</h1>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Catalog and daily availability</p>
            </div>
        </div>
        <button type="button" data-action="open-sidebar" class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300">
            <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
    </header>

    <main class="max-w-6xl mx-auto p-4 space-y-4">
        <section class="bg-card-dark border border-border-dark rounded-2xl p-4">
            <div class="grid md:grid-cols-[1fr_220px_180px_120px] gap-3">
                <input data-ingredient-name class="bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm text-white" placeholder="Name">
                <input data-ingredient-code class="bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm text-white" placeholder="Code">
                <select data-ingredient-category class="bg-input-bg border border-border-dark rounded-xl px-3 py-3 text-sm text-white"></select>
                <button type="button" data-action="create-ingredient" class="rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-3">Add</button>
            </div>
            <p data-ingredients-message class="mt-3 text-xs text-slate-500"></p>
        </section>

        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border-dark flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Catalog</h2>
                    <p data-selected-day-label class="text-xs text-slate-500 mt-1">Loading...</p>
                </div>
                <select data-working-day-select class="bg-input-bg border border-border-dark rounded-xl px-3 py-2 text-sm text-white min-w-64"></select>
            </div>
            <div data-ingredients-list class="divide-y divide-border-dark">
                <div class="p-6 text-sm text-slate-500">Loading ingredients...</div>
            </div>
        </section>
    </main>
</div>
@endsection
