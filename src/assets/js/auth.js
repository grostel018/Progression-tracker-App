const pages = {
    login: {
        title: 'Progression Tracker',
        subtitle: 'Authenticate your node and resume the latest checkpoint.',
    },
    register: {
        title: 'Progression Tracker',
        subtitle: 'Provision a secure node and start logging visible progress.',
    },
    forgot: {
        title: 'Progression Tracker',
        subtitle: 'Request a one-time reset link to rotate your password securely.',
    },
    reset: {
        title: 'Progression Tracker',
        subtitle: 'Validate the reset link and commit a strong new password.',
    },
};

const EMAIL_MAX_LENGTH = 254;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 10;

const formRules = {
    loginForm: {
        email: (value) => validateEmail(value),
        password: (value) => validateRequired(value, 'Password'),
    },
    registerForm: {
        email: (value) => validateEmail(value),
        username: (value) => validateUsername(value),
        password: (value) => validatePassword(value),
        password2: (value, form) => validatePasswordConfirmation(value, form.elements.password?.value ?? ''),
    },
    forgotForm: {
        email: (value) => validateEmail(value),
    },
    resetPasswordForm: {
        password: (value) => validatePassword(value),
        password_confirm: (value, form) => validatePasswordConfirmation(value, form.elements.password?.value ?? ''),
    },
};

function getCsrfToken() {
    return document.body?.dataset.csrfToken || '';
}

function typeText(element, text, speed, callback) {
    element.textContent = '';
    let i = 0;

    function typing() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i += 1;
            setTimeout(typing, speed);
        } else if (callback) {
            callback();
        }
    }

    typing();
}

function validateRequired(value, label) {
    return value.trim() === '' ? `${label} is required` : '';
}

function validateEmail(value) {
    const trimmed = value.trim();

    if (trimmed === '') {
        return 'Email is required';
    }

    if (trimmed.length > EMAIL_MAX_LENGTH) {
        return 'Email is too long';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(trimmed) ? '' : 'Enter a valid email address';
}

function validateUsername(value) {
    const trimmed = value.trim();

    if (trimmed === '') {
        return 'Username is required';
    }

    if (trimmed.length < USERNAME_MIN_LENGTH) {
        return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    }

    if (trimmed.length > USERNAME_MAX_LENGTH) {
        return `Username must be ${USERNAME_MAX_LENGTH} characters or fewer`;
    }

    return /^[A-Za-z0-9_-]+$/.test(trimmed)
        ? ''
        : 'Use only letters, numbers, underscores, and hyphens';
}

function validatePassword(value) {
    if (value === '') {
        return 'Password is required';
    }

    if (value.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }

    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        return 'Password must include at least one letter and one number';
    }

    return '';
}

function validatePasswordConfirmation(value, passwordValue) {
    if (value === '') {
        return 'Please repeat your password';
    }

    return value === passwordValue ? '' : 'Passwords do not match';
}

function setMessage(element, message) {
    if (element) {
        element.textContent = message;
    }
}

function normalizeFormValues(form) {
    for (const fieldName of ['email', 'username']) {
        const field = form.elements[fieldName];
        if (field) {
            field.value = field.value.trim();
        }
    }
}

function getFieldWrapper(field) {
    return field.closest('.inputs');
}

function getFieldFeedback(field) {
    return getFieldWrapper(field)?.querySelector('.input-feedback') ?? null;
}

function setFieldError(field, message) {
    const wrapper = getFieldWrapper(field);
    const feedback = getFieldFeedback(field);
    const hasError = Boolean(message);

    if (wrapper) {
        wrapper.classList.toggle('has-error', hasError);
    }

    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');

    if (feedback) {
        feedback.textContent = message;
    }
}

function clearFormFieldErrors(form) {
    form.querySelectorAll('.inputs input, .inputs select, .inputs textarea')
        .forEach((field) => setFieldError(field, ''));
}

function getRule(form, fieldName) {
    return formRules[form.id]?.[fieldName] ?? null;
}

function validateField(field) {
    const form = field.form;
    if (!form) {
        return '';
    }

    const rule = getRule(form, field.id) ?? getRule(form, field.name);
    if (!rule) {
        return '';
    }

    const message = rule(field.value, form);
    setFieldError(field, message);
    return message;
}

function validateForm(form) {
    const rules = formRules[form.id] ?? {};
    const errors = {};

    normalizeFormValues(form);

    for (const fieldName of Object.keys(rules)) {
        const field = form.elements[fieldName];
        if (!field) {
            continue;
        }

        const message = validateField(field);
        if (message) {
            errors[fieldName] = message;
        }
    }

    return errors;
}

function applyServerErrors(form, errors = {}) {
    for (const [fieldName, message] of Object.entries(errors)) {
        const field = form.elements[fieldName];
        if (field) {
            setFieldError(field, message);
        }
    }
}

function setupRealtimeValidation(form) {
    form.querySelectorAll('.inputs input, .inputs select, .inputs textarea').forEach((field) => {
        field.addEventListener('blur', () => {
            field.dataset.touched = 'true';
            validateField(field);

            if (field.name === 'password') {
                const confirmField = form.elements.password2 || form.elements.password_confirm;
                if (confirmField?.dataset.touched === 'true') {
                    validateField(confirmField);
                }
            }
        });

        const updateEvent = field.tagName === 'SELECT' ? 'change' : 'input';

        field.addEventListener(updateEvent, () => {
            if (field.name === 'email' || field.name === 'username') {
                field.value = field.value.replace(/^\s+/, '');
            }

            if (field.dataset.touched === 'true' || field.getAttribute('aria-invalid') === 'true') {
                validateField(field);
            }

            if (field.name === 'password') {
                const confirmField = form.elements.password2 || form.elements.password_confirm;
                if (confirmField?.dataset.touched === 'true') {
                    validateField(confirmField);
                }
            }
        });
    });
}

async function submitAuthForm(url, form) {
    const formData = new FormData(form);
    const csrfToken = getCsrfToken();
    const headers = {
        Accept: 'application/json',
    };

    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
    });

    const data = await response.json();
    return { response, data };
}

function setupAsyncAuthForm(formId, options) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    setupRealtimeValidation(form);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const errorBox = document.getElementById('error');
        const successBox = document.getElementById('success');

        setMessage(errorBox, '');
        setMessage(successBox, '');
        clearFormFieldErrors(form);

        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) {
            setMessage(errorBox, Object.values(errors)[0]);
            return;
        }

        try {
            const { response, data } = await submitAuthForm(options.url, form);

            if (data.success) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess({ form, response, data, successBox, errorBox });
                    return;
                }

                if (options.onSuccessRedirect) {
                    window.location.href = options.onSuccessRedirect;
                    return;
                }

                setMessage(successBox, data.message || options.successMessage || '');
                return;
            }

            applyServerErrors(form, data.errors);
            setMessage(errorBox, data.message || options.errorMessage);
        } catch (error) {
            console.error(error);
            setMessage(errorBox, options.errorMessage);
        }
    });
}

function setupForgotPasswordFlow() {
    setupAsyncAuthForm('forgotForm', {
        url: 'api/auth/forgot.php',
        successMessage: 'If the address is registered, a password reset link will be sent shortly.',
        errorMessage: 'Password reset request failed. Try again.',
        onSuccess: ({ form, data, successBox }) => {
            form.reset();
            clearFormFieldErrors(form);
            setMessage(successBox, data.message || 'If the address is registered, a password reset link will be sent shortly.');
        },
    });
}

function setupResetPasswordFlow() {
    setupAsyncAuthForm('resetPasswordForm', {
        url: 'api/auth/reset-password.php',
        errorMessage: 'Password reset failed. Try the reset link again.',
        onSuccess: ({ form, data, successBox, errorBox }) => {
            setMessage(errorBox, '');
            setMessage(successBox, data.message || 'Password reset successful.');
            form.querySelector('[type="submit"]')?.setAttribute('disabled', 'disabled');
            window.setTimeout(() => {
                window.location.href = 'login.php';
            }, 1200);
        },
    });
}

window.addEventListener('load', () => {
    const page = document.body.dataset.page;
    document.body.classList.add('is-ready');

    if (!page || !pages[page]) {
        return;
    }

    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');

    if (!title || !subtitle) {
        return;
    }

    typeText(title, pages[page].title, 80, () => {
        typeText(subtitle, pages[page].subtitle, 40);
    });
});

setupAsyncAuthForm('loginForm', {
    url: 'api/auth/login.php',
    onSuccessRedirect: 'dashboard.php',
    errorMessage: 'Login failed. Try again.',
});

setupAsyncAuthForm('registerForm', {
    url: 'api/auth/register.php',
    onSuccessRedirect: 'login.php',
    errorMessage: 'Registration failed. Try again.',
});

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    if (page === 'forgot') {
        setupForgotPasswordFlow();
        return;
    }

    if (page === 'reset') {
        setupResetPasswordFlow();
    }
});
