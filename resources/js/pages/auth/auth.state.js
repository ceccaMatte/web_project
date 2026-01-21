export const authState = {
    mode: 'login',

    form: {
        nickname: '',
        email: '',
        password: '',
    },

    validation: {
        nickname: null, // string errore o null
        email: null,
        password: null,
        isValid: false,
    },

    submit: {
        loading: false,
        error: null,
    },
};
export function mutateMode(newMode) {
    if (newMode !== 'login' && newMode !== 'signup') {
        console.error('Invalid auth mode:', newMode);
        return;
    }
    
    authState.mode = newMode;
    
    // reset form and validation when switching mode
    authState.form.nickname = '';
    authState.form.email = '';
    authState.form.password = '';
    authState.validation.nickname = null;
    authState.validation.email = null;
    authState.validation.password = null;
    authState.validation.isValid = false;
    authState.submit.error = null;
}
export function mutateFormField(field, value) {
    if (!(field in authState.form)) {
        console.error('Invalid auth field:', field);
        return;
    }
    
    authState.form[field] = value;
}
export function mutateValidationError(field, error) {
    if (!(field in authState.validation)) {
        console.error('Invalid validation field:', field);
        return;
    }
    
    authState.validation[field] = error;
}
export function mutateIsValid(isValid) {
    authState.validation.isValid = isValid;
}
export function mutateSubmitState(loading, error = null) {
    authState.submit.loading = loading;
    authState.submit.error = error;
}
export function resetValidation() {
    authState.validation.nickname = null;
    authState.validation.email = null;
    authState.validation.password = null;
    authState.validation.isValid = false;
}
export function resetForm() {
    authState.form.nickname = '';
    authState.form.email = '';
    authState.form.password = '';
    resetValidation();
}
export function logAuthState() {
    console.debug(JSON.parse(JSON.stringify(authState)));
}
