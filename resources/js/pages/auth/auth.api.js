// Backend calls for auth

// CSRF token helper
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// Normalize Laravel validation errors
function parseValidationErrors(errors) {
    const parsed = {};
    for (const field in errors) parsed[field] = errors[field][0];
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
        
        if (response.status === 422 && data.errors) return { success: false, errors: parseValidationErrors(data.errors) };
        if (response.status === 401) return { success: false, message: data.message || 'Invalid credentials' };
        if (response.ok) return { success: true, redirect: data.redirect || '/' };
        console.error('Login failed:', response.status);
        return { success: false, message: data.message || 'Login failed' };
        
    } catch (error) {
        console.error('Network error:', error);
        return { success: false, message: 'Network error. Please check your connection.' };
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

        if (response.status === 422 && data.errors) return { success: false, errors: parseValidationErrors(data.errors) };
        if (response.ok) return { success: true, redirect: data.redirect || '/' };
        console.error('Registration failed:', response.status);
        return { success: false, message: data.message || 'Registration failed' };

    } catch (error) {
        console.error('Network error:', error);
        return { success: false, message: 'Network error. Please check your connection.' };
    }
}
