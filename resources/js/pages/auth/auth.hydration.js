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

// No network fetch required for auth page state
export async function hydrateAuthState() {
    return true;
}
