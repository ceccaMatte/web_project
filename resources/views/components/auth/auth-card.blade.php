<div class="w-full max-w-sm bg-card-dark/50 border border-border-dark p-6 rounded-3xl backdrop-blur-sm">

    <div class="bg-background-dark/80 p-1 rounded-xl flex mb-8 border border-border-dark" role="tablist" aria-label="Authentication mode">
        <button type="button"
                class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                role="tab"
                aria-selected="true"
                aria-controls="login-form"
                data-action="switch-to-login"
                data-tab="login">
            {{ config('ui.auth.login') }}
        </button>

        <button type="button"
                class="flex-1 py-2 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-all duration-200 rounded-lg"
                role="tab"
                aria-selected="false"
                aria-controls="signup-form"
                data-action="switch-to-signup"
                data-tab="signup">
            {{ config('ui.auth.signup') }}
        </button>
    </div>

    <div id="auth-form-container" role="tabpanel" aria-labelledby="auth-tabs">
    </div>

</div>
