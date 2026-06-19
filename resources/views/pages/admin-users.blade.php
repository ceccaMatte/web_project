@extends('layouts.app')

@section('title', 'Users')

@section('content')
<div data-page="admin-users" class="min-h-screen bg-[#0a0e1a]">
    @include('components.admin-sidebar', [
        'menu' => config('ui.admin_work_service.sidebar.menu'),
        'user' => $user,
        'sidebarTitle' => config('ui.admin_work_service.sidebar.title'),
    ])

    <header class="sticky top-0 z-30 bg-background-dark/90 backdrop-blur-md border-b border-border-dark px-5 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-xl">group</span>
            </div>
            <div>
                <h1 class="text-white text-base font-bold">Users</h1>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Blocklist management</p>
            </div>
        </div>
        <button type="button" data-action="open-sidebar" class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300">
            <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
    </header>

    <main class="max-w-5xl mx-auto p-4 space-y-4">
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border-dark flex items-center justify-between">
                <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Customers</h2>
                <span data-users-status class="text-xs text-slate-500">Loading...</span>
            </div>
            <div data-users-list class="divide-y divide-border-dark">
                <div class="p-6 text-sm text-slate-500">Loading users...</div>
            </div>
        </section>
    </main>
</div>
@endsection
