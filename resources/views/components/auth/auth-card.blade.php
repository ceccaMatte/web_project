{{--
    Auth Card Component
    
    RESPONSABILITÀ:
    - Container glassmorphism per form autenticazione
    - Switch Login/Sign Up (segmented control)
    - Slot per form dinamico
    
    COSA NON FA:
    - NON gestisce lo stato (controllato da JS)
    - NON fa submit
    - NON valida
    
    PROPS:
    - Nessuna (struttura presentational)
    
    ACCESSIBILITÀ:
    - role="tablist" per switch
    - role="tab" per bottoni
    - aria-selected per stato attivo
    - aria-controls per collegare tab → panel
    
    UTILIZZO:
    @include('components.auth.auth-card')
--}}

<div class="w-full max-w-sm bg-card-dark/50 border border-border-dark p-6 rounded-3xl backdrop-blur-sm">
    
    {{-- Segmented Control: Login / Sign Up --}}
    <div class="bg-background-dark/80 p-1 rounded-xl flex mb-8 border border-border-dark" role="tablist" aria-label="Authentication mode">
        
        {{-- Tab Login --}}
        <button type="button"
                class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                role="tab"
                aria-selected="true"
                aria-controls="login-form"
                data-action="switch-to-login"
                data-tab="login">
            {{ config('ui.auth.login') }}
        </button>
        
        {{-- Tab Sign Up --}}
        <button type="button"
                class="flex-1 py-2 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-all duration-200"
                role="tab"
                aria-selected="false"
                aria-controls="signup-form"
                data-action="switch-to-signup"
                data-tab="signup">
            {{ config('ui.auth.signup') }}
        </button>
    </div>
    
    {{-- Form Container (popolato da JS) --}}
    <div id="auth-form-container" role="tabpanel" aria-labelledby="auth-tabs">
        {{-- Verrà renderizzato il form Login o Sign Up da JS --}}
    </div>
    
</div>
