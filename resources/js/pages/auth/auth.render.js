/**
 * AUTH RENDER - UI as Function of State
 * 
 * RESPONSABILITÀ:
 * - Renderizza UI basandosi su authState
 * - Inietta HTML form (login o signup)
 * - Aggiorna stili tab (active/inactive)
 * - Mostra/nasconde errori validation
 * - Aggiorna stato submit button
 * 
 * COSA NON FA:
 * - NON gestisce eventi (lo fa auth.actions.js)
 * - NON muta stato (legge solo)
 * - NON fa fetch
 * 
 * UTILIZZO:
 * import { render } from './auth.render.js';
 */

import { authState } from './auth.state.js';
import { authView, updateFormRefs, getFieldInput, getFieldError } from './auth.view.js';

/**
 * RENDER PRINCIPALE
 * 
 * Chiama tutti i sub-render in sequenza.
 * Chiamata da auth.actions.js dopo ogni mutation.
 */
export function render() {
    console.log('[AuthRender] Rendering...', authState.mode);
    
    renderTabs();
    renderForm();
    renderValidation();
    renderSubmitButton();
}

/**
 * Render tabs (segmented control)
 * 
 * Aggiorna classi CSS e aria-selected
 */
function renderTabs() {
    const { mode } = authState;
    
    // Login tab
    if (authView.loginTab) {
        if (mode === 'login') {
            authView.loginTab.classList.add('segmented-control-active');
            authView.loginTab.classList.remove('text-slate-500', 'hover:text-slate-300');
            authView.loginTab.setAttribute('aria-selected', 'true');
        } else {
            authView.loginTab.classList.remove('segmented-control-active');
            authView.loginTab.classList.add('text-slate-500', 'hover:text-slate-300');
            authView.loginTab.setAttribute('aria-selected', 'false');
        }
    }
    
    // Signup tab
    if (authView.signupTab) {
        if (mode === 'signup') {
            authView.signupTab.classList.add('segmented-control-active');
            authView.signupTab.classList.remove('text-slate-500', 'hover:text-slate-300');
            authView.signupTab.setAttribute('aria-selected', 'true');
        } else {
            authView.signupTab.classList.remove('segmented-control-active');
            authView.signupTab.classList.add('text-slate-500', 'hover:text-slate-300');
            authView.signupTab.setAttribute('aria-selected', 'false');
        }
    }
}

/**
 * Render form
 * 
 * Inietta HTML form (login o signup) importando componenti in-memory
 */
function renderForm() {
    const { mode } = authState;
    
    if (!authView.formContainer) {
        console.error('[AuthRender] Form container not found');
        return;
    }
    
    // Render form HTML inline (semplice, no fetch necessario)
    if (mode === 'login') {
        authView.formContainer.innerHTML = renderLoginFormHTML();
    } else {
        authView.formContainer.innerHTML = renderSignupFormHTML();
    }
    
    // Aggiorna riferimenti form in authView
    updateFormRefs();
    
    console.log('[AuthRender] Form rendered:', mode);
}

/**
 * Helper: genera HTML form login
 */
function renderLoginFormHTML() {
    return `
        <form id="login-form" class="space-y-5" data-form="login" novalidate>
            <!-- Campo Email -->
            <div class="space-y-1.5">
                <label for="login-email" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    University Email
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
                           placeholder="name@university.edu"
                           aria-required="true"
                           aria-invalid="false"
                           aria-describedby="login-email-error"
                           data-field="email">
                </div>
                <p id="login-email-error" 
                   class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
                   role="alert"
                   data-error="email">
                </p>
            </div>
            
            <!-- Campo Password -->
            <div class="space-y-1.5">
                <label for="login-password" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Password
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
                           placeholder="••••••••"
                           aria-required="true"
                           aria-invalid="false"
                           aria-describedby="login-password-error"
                           data-field="password">
                    <button type="button" 
                            class="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                            aria-label="Toggle password visibility"
                            data-action="toggle-password"
                            data-target="login-password">
                        <span class="material-symbols-outlined text-xl" aria-hidden="true">visibility</span>
                    </button>
                </div>
                <p id="login-password-error" 
                   class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
                   role="alert"
                   data-error="password">
                </p>
            </div>
            
            <!-- Submit Button -->
            <div class="pt-4">
                <button type="submit"
                        class="w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg bg-primary/40 text-white/50 cursor-not-allowed"
                        data-submit="login"
                        disabled
                        aria-live="polite">
                    <span data-button-text>LOGIN</span>
                </button>
            </div>
        </form>
    `;
}

/**
 * Helper: genera HTML form signup
 */
function renderSignupFormHTML() {
    return `
        <form id="signup-form" class="space-y-5" data-form="signup" novalidate>
            <!-- Campo Nickname -->
            <div class="space-y-1.5">
                <label for="signup-nickname" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Nickname
                </label>
                <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
                    <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">
                        person
                    </span>
                    <input id="signup-nickname"
                           name="name"
                           type="text"
                           autocomplete="name"
                           class="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm focus:ring-0 placeholder:text-slate-600"
                           placeholder="Your preferred name"
                           aria-required="true"
                           aria-invalid="false"
                           aria-describedby="signup-nickname-error"
                           data-field="nickname">
                </div>
                <p id="signup-nickname-error" 
                   class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
                   role="alert"
                   data-error="nickname">
                </p>
            </div>
            
            <!-- Campo Email -->
            <div class="space-y-1.5">
                <label for="signup-email" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    University Email
                </label>
                <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
                    <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">
                        alternate_email
                    </span>
                    <input id="signup-email"
                           name="email"
                           type="email"
                           autocomplete="email"
                           class="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm focus:ring-0 placeholder:text-slate-600"
                           placeholder="name@university.edu"
                           aria-required="true"
                           aria-invalid="false"
                           aria-describedby="signup-email-error"
                           data-field="email">
                </div>
                <p id="signup-email-error" 
                   class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
                   role="alert"
                   data-error="email">
                </p>
            </div>
            
            <!-- Campo Password -->
            <div class="space-y-1.5">
                <label for="signup-password" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Password
                </label>
                <div class="relative flex items-center group rounded-xl border border-border-dark bg-input-bg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 focus-within:border-primary">
                    <span class="material-symbols-outlined absolute left-4 text-slate-500 text-xl group-focus-within:text-primary" aria-hidden="true">
                        lock
                    </span>
                    <input id="signup-password"
                           name="password"
                           type="password"
                           autocomplete="new-password"
                           class="w-full bg-transparent border-none py-3.5 pl-12 pr-12 text-sm focus:ring-0 placeholder:text-slate-600"
                           placeholder="••••••••"
                           aria-required="true"
                           aria-invalid="false"
                           aria-describedby="signup-password-error"
                           data-field="password">
                    <button type="button" 
                            class="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                            aria-label="Toggle password visibility"
                            data-action="toggle-password"
                            data-target="signup-password">
                        <span class="material-symbols-outlined text-xl" aria-hidden="true">visibility</span>
                    </button>
                </div>
                <p id="signup-password-error" 
                   class="text-[10px] text-danger font-medium ml-1 h-3 opacity-0" 
                   role="alert"
                   data-error="password">
                </p>
            </div>
            
            <!-- Submit Button -->
            <div class="pt-4">
                <button type="submit"
                        class="w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg bg-primary/40 text-white/50 cursor-not-allowed"
                        data-submit="signup"
                        disabled
                        aria-live="polite">
                    <span data-button-text>CREATE ACCOUNT</span>
                </button>
            </div>
        </form>
    `;
}

/**
 * Render validation errors
 * 
 * Mostra/nasconde messaggi errore per ogni campo
 */
function renderValidation() {
    const { validation } = authState;
    
    // Per ogni campo possibile
    ['nickname', 'email', 'password'].forEach(field => {
        const input = getFieldInput(field);
        const errorEl = getFieldError(field);
        
        if (!input || !errorEl) return;
        
        const error = validation[field];
        
        if (error) {
            // Mostra errore
            errorEl.textContent = error;
            errorEl.classList.remove('opacity-0');
            errorEl.classList.add('opacity-100');
            input.setAttribute('aria-invalid', 'true');
            input.classList.add('border-danger', 'focus:border-danger', 'focus:ring-danger');
        } else {
            // Nascondi errore
            errorEl.textContent = '';
            errorEl.classList.remove('opacity-100');
            errorEl.classList.add('opacity-0');
            input.setAttribute('aria-invalid', 'false');
            input.classList.remove('border-danger', 'focus:border-danger', 'focus:ring-danger');
        }
    });
}

/**
 * Render submit button
 * 
 * Aggiorna stato loading e disabled
 */
function renderSubmitButton() {
    const { mode, submit, validation } = authState;
    const btn = mode === 'login' ? authView.loginSubmitBtn : authView.signupSubmitBtn;
    
    if (!btn) return;
    
    const textEl = btn.querySelector('[data-button-text]');
    
    // Loading state
    if (submit.loading) {
        btn.disabled = true;
        btn.classList.add('cursor-not-allowed', 'opacity-50');
        if (textEl) textEl.textContent = 'Loading...';
    } else {
        // Enabled/disabled based on validation
        if (validation.isValid) {
            btn.disabled = false;
            btn.classList.remove('cursor-not-allowed', 'opacity-50', 'bg-primary/40', 'text-white/50');
            btn.classList.add('bg-primary', 'text-white', 'hover:bg-primary/90', 'shadow-primary/20');
        } else {
            btn.disabled = true;
            btn.classList.add('cursor-not-allowed', 'opacity-50', 'bg-primary/40', 'text-white/50');
            btn.classList.remove('bg-primary', 'text-white', 'hover:bg-primary/90', 'shadow-primary/20');
        }
        
        // Reset text
        if (textEl) {
            const originalText = mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT';
            textEl.textContent = originalText;
        }
    }
    
    // Server error message
    if (submit.error) {
        // TODO: mostrare errore server sopra il form
        console.error('[AuthRender] Server error:', submit.error);
    }
}

/**
 * Helper: render initial (first time)
 * 
 * Chiamata da auth.js dopo hydration
 */
export function renderInitial() {
    console.log('[AuthRender] Initial render');
    renderForm(); // Render sincrono (no await)
    render(); // Poi aggiorna tutto
}
