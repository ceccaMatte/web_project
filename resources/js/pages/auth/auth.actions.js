/**
 * AUTH ACTIONS - User Event Handlers
 * 
 * RESPONSABILITÀ:
 * - Gestisce eventi utente (click, submit, input)
 * - Muta authState
 * - Chiama render() dopo ogni mutation
 * - Chiama API per login/register
 * 
 * COSA NON FA:
 * - NON fa query DOM dirette (usa authView)
 * - NON renderizza direttamente (chiama render)
 * 
 * UTILIZZO:
 * import { switchToLogin, switchToSignup, handleSubmit } from './auth.actions.js';
 */

import { authState, mutateMode, mutateFormField, mutateValidationError, mutateIsValid, mutateSubmitState, resetValidation } from './auth.state.js';
import { render, renderValidation, renderSubmitButton } from './auth.render.js';
import { loginUser, registerUser } from './auth.api.js';

/**
 * Switch to Login mode
 */
export function switchToLogin() {
    console.log('[AuthActions] Switching to login');
    mutateMode('login');
    render();
}

/**
 * Switch to Signup mode
 */
export function switchToSignup() {
    console.log('[AuthActions] Switching to signup');
    mutateMode('signup');
    render();
}

/**
 * Toggle password visibility
 */
export function togglePasswordVisibility(targetId) {
    const input = document.getElementById(targetId);
    if (!input) return;
    
    const icon = input.nextElementSibling?.querySelector('.material-symbols-outlined');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        if (icon) icon.textContent = 'visibility';
    }
}

/**
 * Handle input change
 * 
 * Aggiorna authState.form SENZA validare (validazione al blur)
 */
export function handleInputChange(field, value) {
    console.log('[AuthActions] Input change:', field, value);
    
    // Aggiorna form state
    mutateFormField(field, value);
    
    // Valida form completo (per abilitare/disabilitare submit)
    validateForm();
    
    // Re-render SOLO submit button (non tutto il form)
    renderSubmitButton();
}

/**
 * Handle input blur
 * 
 * Valida campo quando l'utente esce dall'input
 */
export function handleInputBlur(field) {
    console.log('[AuthActions] Input blur:', field);
    
    const { form } = authState;
    const value = form[field];
    
    // Valida campo
    validateField(field, value);
    
    // Re-render validation errors
    renderValidation();
}

/**
 * Valida singolo campo
 */
function validateField(field, value) {
    const { mode } = authState;
    
    let error = null;
    
    switch (field) {
        case 'nickname':
            if (mode === 'signup' && value.length < 3) {
                error = 'Nickname must be at least 3 characters';
            }
            break;
            
        case 'email':
            if (!value.includes('@')) {
                error = 'Please enter a valid email';
            }
            break;
            
        case 'password':
            if (value.length < 8) {
                error = 'Password must be at least 8 characters';
            }
            break;
    }
    
    mutateValidationError(field, error);
}

/**
 * Valida form completo
 * 
 * Aggiorna authState.validation.isValid
 */
function validateForm() {
    const { mode, form, validation } = authState;
    
    let isValid = true;
    
    // Login: email + password
    if (mode === 'login') {
        if (!form.email || !form.password) {
            isValid = false;
        }
        if (validation.email || validation.password) {
            isValid = false;
        }
    }
    
    // Signup: nickname + email + password
    if (mode === 'signup') {
        if (!form.nickname || !form.email || !form.password) {
            isValid = false;
        }
        if (validation.nickname || validation.email || validation.password) {
            isValid = false;
        }
    }
    
    mutateIsValid(isValid);
}

/**
 * Handle form submit
 * 
 * Chiama API e gestisce risposta
 */
export async function handleSubmit(event) {
    event.preventDefault();
    
    const { mode, form, validation } = authState;
    
    console.log('[AuthActions] Submit:', mode, form);
    
    // Verifica validità
    if (!validation.isValid) {
        console.warn('[AuthActions] Form not valid, submit blocked');
        return;
    }
    
    // Set loading
    mutateSubmitState(true);
    render();
    
    try {
        let result;
        
        if (mode === 'login') {
            // Login
            result = await loginUser(form.email, form.password);
        } else {
            // Signup
            result = await registerUser(form.nickname, form.email, form.password);
        }
        
        console.log('[AuthActions] API result:', result);
        
        // Gestisci risposta
        if (result.success) {
            // Redirect con replace per forzare refresh completo (no cache)
            console.log('[AuthActions] Success, redirecting to:', result.redirect);
            window.location.replace(result.redirect);
        } else if (result.errors) {
            // Validation errors dal backend
            console.warn('[AuthActions] Validation errors from backend:', result.errors);
            
            // Inietta errori in authState
            for (const field in result.errors) {
                mutateValidationError(field, result.errors[field]);
            }
            
            mutateSubmitState(false);
            render();
        } else {
            // Errore generico
            console.error('[AuthActions] Submit failed:', result.message);
            mutateSubmitState(false, result.message);
            render();
        }
        
    } catch (error) {
        console.error('[AuthActions] Submit error:', error);
        mutateSubmitState(false, 'An error occurred. Please try again.');
        render();
    }
}

/**
 * Export tutte le actions
 */
export default {
    switchToLogin,
    switchToSignup,
    togglePasswordVisibility,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
};
