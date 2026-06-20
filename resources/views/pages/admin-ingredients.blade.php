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
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Daily catalog</p>
            </div>
        </div>
        <button type="button" data-action="open-sidebar" class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300">
            <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
    </header>

    <main class="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div class="space-y-4 min-w-0">
                <div class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
                    <div class="p-4 border-b border-border-dark flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Service day</p>
                            <h2 data-selected-day-label class="mt-1 text-lg font-black text-white">Loading...</h2>
                        </div>
                        <label class="block min-w-0 sm:w-56">
                            <span class="block mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</span>
                            <input type="date" data-ingredient-date class="w-full rounded-xl bg-input-bg border border-border-dark px-3 py-3 text-sm font-semibold text-white outline-none focus:border-primary/70">
                        </label>
                    </div>

                </div>

                <div data-ingredients-list class="space-y-4">
                    <div class="bg-card-dark border border-border-dark rounded-2xl p-6 text-sm text-slate-500">Loading ingredients...</div>
                </div>
            </div>

            <aside class="bg-card-dark border border-border-dark rounded-2xl overflow-visible lg:sticky lg:top-24">
                <div class="p-4 border-b border-border-dark">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Editor</p>
                    <h2 data-form-title class="mt-1 text-lg font-black text-white">New ingredient</h2>
                    <p data-form-hint class="mt-1 text-xs text-slate-500">Select a category or an ingredient to edit it.</p>
                </div>

                <form data-ingredient-form action="javascript:void(0)" method="dialog" class="p-4 space-y-4">
                    <input type="hidden" data-ingredient-id>

                    <label class="block">
                        <span class="block mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</span>
                        <input data-ingredient-name class="w-full rounded-xl bg-input-bg border border-border-dark px-3 py-3 text-sm font-semibold text-white outline-none focus:border-primary/70" placeholder="Mozzarella">
                    </label>

                    <label class="block">
                        <span class="block mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Code</span>
                        <input data-ingredient-code class="w-full rounded-xl bg-input-bg border border-border-dark px-3 py-3 text-sm font-semibold text-white outline-none focus:border-primary/70" placeholder="CHEESE_MOZ">
                    </label>

                    <div class="relative" data-category-dropdown>
                        <span class="block mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</span>
                        <input type="hidden" data-ingredient-category value="other">
                        <button type="button" data-action="toggle-category-dropdown" class="w-full rounded-xl bg-input-bg border border-border-dark px-3 py-3 text-left text-sm font-semibold text-white outline-none focus:border-primary/70 flex items-center justify-between gap-3">
                            <span class="flex items-center gap-2 min-w-0">
                                <span data-selected-category-icon class="material-symbols-outlined text-primary text-[20px]">category</span>
                                <span data-selected-category-label class="truncate">Other</span>
                            </span>
                            <span class="material-symbols-outlined text-slate-500 text-[20px]">expand_more</span>
                        </button>
                        <div data-category-menu class="hidden absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border-dark bg-[#111827] shadow-2xl">
                            <div data-category-options class="p-1"></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-[1fr_auto] gap-2">
                        <button type="button" data-action="submit-ingredient" class="rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-3">
                            Create
                        </button>
                        <button type="button" data-action="reset-ingredient-form" class="rounded-xl border border-border-dark bg-surface-dark px-4 py-3 text-slate-300" aria-label="Reset form">
                            <span class="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>

                    <button type="button" data-action="delete-ingredient" class="hidden w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-300">
                        Delete ingredient
                    </button>

                    <p data-ingredients-message class="text-xs text-slate-500 min-h-5"></p>
                </form>
            </aside>
        </section>
    </main>
</div>
@endsection
