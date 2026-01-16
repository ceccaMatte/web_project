/**
 * AUTH PAGE - Entry Point
 * 
 * RESPONSABILITÀ:
 * - Inizializza pagina auth
 * - Coordina view, state, hydration, render, actions
 * - Registra event listeners
 * 
 * ARCHITETTURA:
 * - Importato da app.js via dynamic import
 * - Esegue init sequence completa
 * 
 * FLOW:
 * 1. initAuthView() → cache DOM refs
 * 2. hydrateAuthState() → stato iniziale
 * 3. renderInitial() → primo render
 * 4. registerEventListeners() → eventi
 * 
 * UTILIZZO:
 * import { initAuthPage } from './pages/auth/auth.js';
 */

import { authState } from './auth.state.js';
import { authView, initAuthView } from './auth.view.js';
import { hydrateAuthState } from './auth.hydration.js';
import { renderInitial, render } from './auth.render.js';
import { 
    switchToLogin, 
    switchToSignup, 
    togglePasswordVisibility,
    handleInputChange,
    handleSubmit 
} from './auth.actions.js';

/**
 * INIT AUTH PAGE
 * 
 * Entry point chiamato da app.js
 */
export async function initAuthPage() {
    console.log('[Auth] Initializing auth page...');
    
    // 1. Inizializza view (cache DOM refs)
    const viewReady = initAuthView();
    if (!viewReady) {
        console.error('[Auth] Failed to initialize view');
        return;
    }
    
    // 2. Idrata stato (per auth, no fetch necessario)
    await hydrateAuthState();
    
    // 3. Render iniziale
    renderInitial();
    
    // 4. Registra event listeners
    registerEventListeners();
    
    console.log('[Auth] Auth page initialized successfully');
}

/**
 * REGISTER EVENT LISTENERS
 * 
 * Event delegation globale per gestire tutti gli eventi
 */
function registerEventListeners() {
    console.log('[Auth] Registering event listeners...');
    
    // Event delegation: click globale
    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch (action) {
            case 'switch-to-login':
                event.preventDefault();
                switchToLogin();
                break;
                
            case 'switch-to-signup':
                event.preventDefault();
                switchToSignup();
                break;
                
            case 'toggle-password':
                event.preventDefault();
                const targetId = target.dataset.target;
                togglePasswordVisibility(targetId);
                break;
        }
    });
    
    // Event delegation: input globale
    document.addEventListener('input', (event) => {
        const target = event.target.closest('[data-field]');
        if (!target) return;
        
        const field = target.dataset.field;
        const value = target.value;
        
        handleInputChange(field, value);
    });
    
    // Event delegation: submit globale
    document.addEventListener('submit', (event) => {
        const target = event.target.closest('[data-form]');
        if (!target) return;
        
        event.preventDefault();
        handleSubmit(event);
    });
    
    console.log('[Auth] Event listeners registered');
}
