{{--
    Sidebar Component
    
    RESPONSABILITÀ:
    - Mostra menu laterale
    - Pulsante ❌ per chiudere
    - Disabilita voci menu in base allo stato user
    
    COSA NON FA:
    - NON decide quando è aperta (stato gestito da JS)
    - NON fa fetch
    - NON modifica lo stato direttamente
    
    PROPS:
    @param array $user - Stato utente { authenticated, enabled, name }
    
    UTILIZZO:
    @include('components.sidebar', ['user' => $user])
--}}

@php
    /**
     * Recupera menu da config.
     * Ogni voce ha requires_auth e requires_enabled per filtrare.
     */
    $menuItems = config('ui.sidebar_menu', []);
@endphp

{{--
    Container Sidebar
    - Inizialmente chiusa: translate-x-full (DESTRA)
    - JS aggiunge/rimuove questa classe
    - Transizione smooth: transition-transform duration-300
    - z-50: sopra l'overlay
--}}
<aside 
    data-sidebar
    class="fixed top-0 right-0 h-full w-[80%] max-w-[320px] bg-[#141925] border-l border-[#1e2536] flex flex-col p-6 shadow-2xl z-50 translate-x-full transition-transform duration-300 ease-out"
>
    
    {{-- Header Sidebar --}}
    <div class="flex items-center justify-between mb-10">
        
        {{-- Logo + Nome (stesso della TopBar) --}}
        <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-2xl">
                    {{ config('ui.icons.logo') }}
                </span>
            </div>
            <div>
                <h1 class="text-white text-base font-bold leading-tight">
                    {{ config('ui.app_name') }}
                </h1>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                    {{ config('ui.app_tagline') }}
                </p>
            </div>
        </div>

        {{--
            Bottone Chiusura
            - data-action: evento semantico per JS
            - Accessibile
        --}}
        <button 
            type="button"
            data-action="close-sidebar"
            aria-label="Close menu"
            class="flex items-center justify-center size-10 rounded-full bg-background-dark border border-border-dark text-slate-400 hover:text-slate-300 transition-colors active:scale-95"
        >
            <span class="material-symbols-outlined">
                {{ config('ui.icons.close') }}
            </span>
        </button>
    </div>

    {{-- Navigation Menu --}}
    <nav class="flex flex-col gap-2 flex-grow">
        @foreach($menuItems as $item)
            @php
                /**
                 * Determina se la voce è accessibile.
                 * - requires_auth: visibile solo se autenticato
                 * - requires_enabled: visibile solo se utente abilitato
                 */
                $isAccessible = true;
                
                if ($item['requires_auth'] && !$user['authenticated']) {
                    $isAccessible = false;
                }
                
                if ($item['requires_enabled'] && (!$user['authenticated'] || !$user['enabled'])) {
                    $isAccessible = false;
                }

                /**
                 * Determina se è la pagina corrente.
                 * Route::currentRouteName() === $item['route']
                 */
                $isCurrent = Route::currentRouteName() === $item['route'];
            @endphp

            {{-- Mostra sempre l'icona per ogni voce menu, sia accessibile che disabilitata --}}
            @if($isAccessible)
                <a 
                    href="{{ route($item['route']) }}"
                    class="flex items-center gap-4 p-4 rounded-xl {{ $isCurrent ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-white/5' }} transition-colors"
                    data-sidebar-item="{{ $item['route'] }}"
                >
                    <span class="material-symbols-outlined" style="{{ $isCurrent ? 'font-variation-settings: \'FILL\' 1' : '' }}">
                        {{ config('ui.icons.' . $item['icon'], $item['icon']) }}
                    </span>
                    <span class="font-bold">{{ $item['label'] }}</span>
                </a>
                    @if($item['route'] === 'orders')
                    <!-- Voce Create sotto Orders -->
                    <a 
                        href="{{ route('create') }}"
                        class="flex items-center gap-4 p-4 rounded-xl text-slate-400 hover:bg-white/5 transition-colors"
                        data-sidebar-item="create"
                    >
                        <span class="material-symbols-outlined">
                            add_circle
                        </span>
                        <span class="font-bold">Create</span>
                    </a>
                    @endif
            @else
                <div class="flex items-center gap-4 p-4 rounded-xl text-slate-600 opacity-50 cursor-not-allowed" data-sidebar-item="{{ $item['route'] }}">
                    <span class="material-symbols-outlined">
                        {{ config('ui.icons.' . $item['icon'], $item['icon']) }}
                    </span>
                    <span class="font-bold">{{ $item['label'] }}</span>
                    <span class="ml-auto text-[9px] uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                        @if(!$user['authenticated'])
                            Login required
                        @elseif(!$user['enabled'])
                            Disabled
                        @endif
                    </span>
                </div>
            @endif
        @endforeach
    </nav>

    {{-- Footer Sidebar (Logout) --}}
    @if($user['authenticated'])
        <div class="mt-auto border-t border-border-dark pt-6">
            {{--
                Form Logout (CSRF protected)
                - POST a route('logout')
                - data-action per gestione JS (se necessario)
            --}}
            <form method="POST" action="{{ route('logout') }}" data-action="logout">
                @csrf
                <button 
                    type="submit"
                    class="flex items-center gap-4 p-4 w-full rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                >
                    <span class="material-symbols-outlined">
                        {{ config('ui.icons.logout') }}
                    </span>
                    <span class="font-bold text-sm">Logout</span>
                </button>
            </form>
        </div>
    @else
        {{-- CTA Login per Guest --}}
        <div class="mt-auto border-t border-border-dark pt-6">
            <a 
                href="{{ route('login') }}"
                class="flex items-center justify-center gap-2 p-4 w-full rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
            >
                <span class="material-symbols-outlined text-lg">login</span>
                <span>Login</span>
            </a>
        </div>
    @endif
</aside>
