<header class="flex items-center bg-background-dark/80 backdrop-blur-md px-5 py-4 justify-between sticky top-0 z-50 border-b border-border-dark/50">

    <div class="flex items-center gap-3">
        <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <span class="material-symbols-outlined text-2xl">{{ config('ui.icons.logo') }}</span>
        </div>

        <div>
            <h1 class="text-white text-base font-bold leading-tight">{{ config('ui.app_name') }}</h1>
            <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{{ config('ui.app_tagline') }}</p>
        </div>
    </div>

    <div class="flex items-center gap-2">
        <button type="button" data-action="open-sidebar" aria-label="Open menu" class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300 hover:bg-surface-dark/80 transition-colors active:scale-95">
            <span class="material-symbols-outlined text-[22px]">{{ config('ui.icons.menu') }}</span>
        </button>
    </div>
</header>
