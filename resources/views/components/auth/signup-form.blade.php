<form id="signup-form" class="space-y-5" data-form="signup" novalidate>

    <div class="space-y-1.5">
        <label for="signup-nickname" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{{ config('ui.auth.nickname_label') }}</label>
        <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
            <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">person</span>
            <input id="signup-nickname" name="name" type="text" autocomplete="name" class="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm focus:ring-0 placeholder:text-slate-600" placeholder="{{ config('ui.auth.nickname_placeholder') }}" aria-required="true" aria-invalid="false" aria-describedby="signup-nickname-error" data-field="nickname">
        </div>
        <p id="signup-nickname-error" class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" role="alert" data-error="nickname"></p>
    </div>

    <div class="space-y-1.5">
        <label for="signup-email" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{{ config('ui.auth.email_label') }}</label>
        <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
            <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">alternate_email</span>
            <input id="signup-email" name="email" type="email" autocomplete="email" class="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm focus:ring-0 placeholder:text-slate-600" placeholder="{{ config('ui.auth.email_placeholder') }}" aria-required="true" aria-invalid="false" aria-describedby="signup-email-error" data-field="email">
        </div>
        <p id="signup-email-error" class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" role="alert" data-error="email"></p>
    </div>

    <div class="space-y-1.5">
        <label for="signup-password" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{{ config('ui.auth.password_label') }}</label>
        <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
            <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">lock</span>
            <input id="signup-password" name="password" type="password" autocomplete="new-password" class="w-full bg-transparent border-none py-3.5 pl-12 pr-12 text-sm focus:ring-0 placeholder:text-slate-600" placeholder="{{ config('ui.auth.password_placeholder') }}" aria-required="true" aria-invalid="false" aria-describedby="signup-password-error" data-field="password">
            <button type="button" class="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors" aria-label="Toggle password visibility" data-action="toggle-password" data-target="signup-password">
                <span class="material-symbols-outlined text-xl" aria-hidden="true">visibility</span>
            </button>
        </div>
        <p id="signup-password-error" class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" role="alert" data-error="password"></p>
    </div>

    <div class="pt-4">
        <button type="submit" class="w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg" data-submit="signup" aria-live="polite">
            <span data-button-text>{{ config('ui.auth.submit_signup') }}</span>
        </button>
    </div>

</form>
