/**
 * AUTH API - Backend Communication
 * 
 * RESPONSABILITÀ:
 * - Fetch POST /login
 * - Fetch POST /register
 * - Gestione CSRF token
 * - Parsing errori Laravel
 * 
 * COSA NON FA:
 * - NON muta authState direttamente
 * - NON gestisce UI
 * - NON valida input (fatto da backend)
 * 
 * UTILIZZO:
 * import { loginUser, registerUser } from './auth.api.js';
 */

/**
 * Helper: ottieni CSRF token da meta tag
 */
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

/**
 * Helper: parse errori Laravel 422 validation
 * 
 * Laravel ritorna:
 * {
 *   "message": "The email field is required...",
 *   "errors": {
 *     "email": ["The email field is required."],
 *     "password": ["The password must be at least 8 characters."]
 *   }
 * }
 * 
 * Noi ritorniamo:
 * {
 *   email: "The email field is required.",
 *   password: "The password must be at least 8 characters."
 * }
 */
function parseValidationErrors(errors) {
    const parsed = {};
    
    for (const field in errors) {
        // Prendi primo errore dell'array
        parsed[field] = errors[field][0];
    }
    
    return parsed;
}

/**
 * LOGIN
 * 
 * POST /login
 * Body: { email, password }
 * 
 * Returns:
 * - success: { success: true, redirect: '/home' }
 * - validation error: { success: false, errors: { email: '...', password: '...' } }
 * - auth error: { success: false, message: 'Invalid credentials' }
 * - server error: { success: false, message: 'Server error' }
 */
export async function loginUser(email, password) {
    console.log('[AuthAPI] Login attempt:', { email });
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        // Validation errors (422)
        if (response.status === 422 && data.errors) {
            console.warn('[AuthAPI] Validation errors:', data.errors);
            return {
                success: false,
                errors: parseValidationErrors(data.errors),
            };
        }
        
        // Auth failed (401)
        if (response.status === 401) {
            console.warn('[AuthAPI] Authentication failed');
            return {
                success: false,
                message: data.message || 'Invalid credentials',
            };
        }
        
        // Success (200)
        if (response.ok) {
            console.log('[AuthAPI] Login successful');
            return {
                success: true,
                redirect: data.redirect || '/',
            };
        }
        
        // Altri errori
        console.error('[AuthAPI] Login failed:', response.status);
        return {
            success: false,
            message: data.message || 'Login failed',
        };
        
    } catch (error) {
        console.error('[AuthAPI] Network error:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.',
        };
    }
}

/**
 * REGISTER
 * 
 * POST /register
 * Body: { nickname, email, password, password_confirmation }
 * 
 * Returns: stesso formato di loginUser()
 */
export async function registerUser(nickname, email, password) {
    console.log('[AuthAPI] Register attempt:', { nickname, email });
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                nickname: nickname, 
                email, 
                password,
                password_confirmation: password, // Laravel richiede conferma
            }),
        });
        
        const data = await response.json();
        
        // Validation errors (422)
        if (response.status === 422 && data.errors) {
            console.warn('[AuthAPI] Validation errors:', data.errors);
            return {
                success: false,
                errors: parseValidationErrors(data.errors),
            };
        }
        
        // Success (200/201)
        if (response.ok) {
            console.log('[AuthAPI] Registration successful');
            return {
                success: true,
                redirect: data.redirect || '/',
            };
        }
        
        // Altri errori
        console.error('[AuthAPI] Registration failed:', response.status);
        return {
            success: false,
            message: data.message || 'Registration failed',
        };
        
    } catch (error) {
        console.error('[AuthAPI] Network error:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.',
        };
    }
}
