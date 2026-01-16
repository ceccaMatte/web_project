{{--
    Login Form Component
    
    RESPONSABILITÀ:
    - Form per login con email + password
    - Struttura HTML pura, logica in JS
    
    COSA NON FA:
    - NON gestisce submit (controllato da JS)
    - NON valida (JS + backend)
    - NON mostra errori (JS inietta dinamicamente)
    
    PROPS:
    - Nessuna (legge da config)
    
    ACCESSIBILITÀ:
    - Label esplicite con for
    - aria-invalid su errori
    - aria-describedby per messaggi errore
    - Focus visibile custom
    - Icone decorative aria-hidden
    
    UTILIZZO:
    Renderizzato da auth.render.js
--}}

<form id="login-form" class="space-y-5" data-form="login" novalidate>
    
    {{-- Campo Email --}}
    <div class="space-y-1.5">
        <label for="login-email" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
            {{ config('ui.auth.email_label') }}
        </label>
        <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
            <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">
                alternate_email
            </span>
            <input id="login-email"
                   name="email"
                   type="email"
                   autocomplete="email"
                   class="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm focus:ring-0 placeholder:text-slate-600"
                   placeholder="{{ config('ui.auth.email_placeholder') }}"
                   aria-required="true"
                   aria-invalid="false"
                   aria-describedby="login-email-error"
                   data-field="email">
        </div>
        {{-- Messaggio errore email (hidden by default) --}}
        <p id="login-email-error" 
           class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
           role="alert"
           data-error="email">
        </p>
    </div>
    
    {{-- Campo Password --}}
    <div class="space-y-1.5">
        <label for="login-password" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
            {{ config('ui.auth.password_label') }}
        </label>
        <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
            <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">
                lock
            </span>
            <input id="login-password"
                   name="password"
                   type="password"
                   autocomplete="current-password"
                   class="w-full bg-transparent border-none py-3.5 pl-12 pr-12 text-sm focus:ring-0 placeholder:text-slate-600"
                   placeholder="{{ config('ui.auth.password_placeholder') }}"
                   aria-required="true"
                   aria-invalid="false"
                   aria-describedby="login-password-error"
                   data-field="password">
            {{-- Toggle password visibility --}}
            <button type="button" 
                    class="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                    aria-label="Toggle password visibility"
                    data-action="toggle-password"
                    data-target="login-password">
                <span class="material-symbols-outlined text-xl" aria-hidden="true">visibility</span>
            </button>
        </div>
        {{-- Messaggio errore password --}}
        <p id="login-password-error" 
           class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
           role="alert"
           data-error="password">
        </p>
    </div>
    
    {{-- Submit Button --}}
    <div class="pt-4">
        <button type="submit"
                class="w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                data-submit="login"
                aria-live="polite">
            <span data-button-text>{{ config('ui.auth.submit_login') }}</span>
        </button>
    </div>
    
</form>
