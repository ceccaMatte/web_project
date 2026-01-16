/**
 * AUTH HYDRATION
 * 
 * RESPONSABILITÀ:
 * - Idratazione iniziale dello stato (se necessario)
 * - Per auth page, non serve fetch iniziale
 * 
 * COSA NON FA:
 * - NON renderizza (chiamato prima di render)
 * - NON gestisce eventi
 * 
 * UTILIZZO:
 * import { hydrateAuthState } from './auth.hydration.js';
 */

import { authState } from './auth.state.js';

/**
 * Idrata stato iniziale auth page
 * 
 * Per la pagina auth non serve fetch iniziale,
 * lo stato parte con mode: 'login' di default.
 * 
 * Questa funzione esiste per uniformità architetturale con Home.
 */
export async function hydrateAuthState() {
    console.log('[AuthHydration] Hydrating auth state...');
    
    // Per auth page, lo stato iniziale è già corretto
    // Nessun fetch necessario
    
    console.log('[AuthHydration] Auth state hydrated:', authState);
    return true;
}
