{{--
    TopBar Component
    
    RESPONSABILITÀ:
    - Mostra logo + nome app
    - Bottone hamburger (mobile)
    - Emette evento semantico data-action="open-sidebar"
    
    COSA NON FA:
    - NON conosce lo stato sidebar
    - NON gestisce la logica di apertura
    - NON fa fetch
    
    PROPS:
    - Nessuna (legge da config/ui.php)
    
    UTILIZZO:
    @include('components.top-bar')
--}}

<header class="flex items-center bg-background-dark/80 backdrop-blur-md px-5 py-4 justify-between sticky top-0 z-50 border-b border-border-dark/50">
    
    {{-- Logo + Nome App --}}
    <div class="flex items-center gap-3">
        {{-- Logo Icon Container --}}
        <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <span class="material-symbols-outlined text-2xl">
                {{ config('ui.icons.logo') }}
            </span>
        </div>
        
        {{-- Testo App --}}
        <div>
            <h1 class="text-white text-base font-bold leading-tight">
                {{ config('ui.app_name') }}
            </h1>
            <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                {{ config('ui.app_tagline') }}
            </p>
        </div>
    </div>

    {{-- Actions (Hamburger Menu) --}}
    <div class="flex items-center gap-2">
        {{--
            Bottone Hamburger
            - data-action: evento semantico per JS
            - NON usa onclick
            - Accessibile (aria-label)
        --}}
        <button 
            type="button"
            data-action="open-sidebar"
            aria-label="Open menu"
            class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300 hover:bg-surface-dark/80 transition-colors active:scale-95"
        >
            <span class="material-symbols-outlined text-[22px]">
                {{ config('ui.icons.menu') }}
            </span>
        </button>
    </div>
</header>
