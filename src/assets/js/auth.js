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
        subtitle: 'Recover access in three steps: account email, recovery answers, then a new password.',
    },
};

const EMAIL_MAX_LENGTH = 254;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 6;

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
        security_question_1: (value, form) => validateSecurityQuestionPair(form),
        security_question_2: (value, form) => validateSecurityQuestionPair(form),
        security_answer_1: (value, form) => validateSecurityQuestionPair(form),
        security_answer_2: (value, form) => validateSecurityQuestionPair(form),
    },
    forgotForm: {
        email: (value) => validateEmail(value),
    },
};

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

    return value.length < PASSWORD_MIN_LENGTH
        ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
        : '';
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

function validateSecurityQuestionPair(form) {
    const q1 = form.elements.security_question_1?.value ?? '';
    const q2 = form.elements.security_question_2?.value ?? '';
    const a1 = form.elements.security_answer_1?.value.trim() ?? '';
    const a2 = form.elements.security_answer_2?.value.trim() ?? '';

    if (q1 === '' && q2 === '' && a1 === '' && a2 === '') {
        return '';
    }

    if ((q1 !== '' && a1 === '') || (q2 !== '' && a2 === '')) {
        return 'Answer every selected security question';
    }

    if ((a1 !== '' && q1 === '') || (a2 !== '' && q2 === '')) {
        return 'Select a question for each provided answer';
    }

    if (q1 !== '' && q1 === q2) {
        return 'Please choose two different security questions';
    }

    return '';
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
    return field.closest('.inputs, .security-question-group');
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
    form.querySelectorAll('.inputs input, .inputs select, .security-question-group input, .security-question-group select')
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
    form.querySelectorAll('.inputs input, .inputs select, .security-question-group input, .security-question-group select').forEach((field) => {
        field.addEventListener('blur', () => {
            field.dataset.touched = 'true';
            validateField(field);

            if (field.name === 'password' && form.elements.password2?.dataset.touched === 'true') {
                validateField(form.elements.password2);
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

            if (field.name === 'password' && form.elements.password2?.dataset.touched === 'true') {
                validateField(form.elements.password2);
            }
        });
    });
}

async function submitAuthForm(url, form) {
    const formData = new FormData(form);
    const securityQuestions = form.querySelectorAll('[name="security_questions[]"]');
    const securityAnswers = form.querySelectorAll('[name="security_answers[]"]');

    formData.delete('security_questions[]');
    formData.delete('security_answers[]');

    const securityQuestionMap = {};

    securityQuestions.forEach((questionField, index) => {
        const answer = securityAnswers[index]?.value.trim() ?? '';

        if (questionField.value !== '' && answer !== '') {
            securityQuestionMap[questionField.value] = answer;
        }
    });

    if (Object.keys(securityQuestionMap).length > 0) {
        formData.append('security_questions', JSON.stringify(securityQuestionMap));
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    return response.json();
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

        if (errorBox) {
            errorBox.textContent = '';
        }

        if (successBox) {
            successBox.textContent = '';
        }

        clearFormFieldErrors(form);

        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) {
            if (errorBox) {
                errorBox.textContent = Object.values(errors)[0];
            }
            return;
        }

        try {
            const data = await submitAuthForm(options.url, form);

            if (data.success) {
                if (options.onSuccessRedirect) {
                    window.location.href = options.onSuccessRedirect;
                    return;
                }

                if (successBox) {
                    successBox.textContent = data.message || options.successMessage || '';
                }
                return;
            }

            applyServerErrors(form, data.errors);

            if (errorBox) {
                errorBox.textContent = data.message || options.errorMessage;
            }
        } catch (error) {
            if (errorBox) {
                errorBox.textContent = options.errorMessage;
            }
            console.error(error);
        }
    });
}

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

function createSecurityQuestionField(question, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'security-question-card';

    const prompt = document.createElement('p');
    prompt.className = 'security-question-prompt';
    prompt.textContent = question.question;

    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'inputs';

    const label = document.createElement('label');
    label.htmlFor = `recovery_answer_${index}`;
    label.textContent = `Answer ${index + 1}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `recovery_answer_${index}`;
    input.name = `recovery_answer_${question.id}`;
    input.autocomplete = 'off';
    input.maxLength = 255;
    input.dataset.questionId = String(question.id);
    input.setAttribute('aria-describedby', `recovery_answer_${index}_feedback`);

    const feedback = document.createElement('p');
    feedback.className = 'input-feedback';
    feedback.id = `recovery_answer_${index}_feedback`;
    feedback.setAttribute('aria-live', 'polite');

    fieldWrapper.append(label, input, feedback);
    wrapper.append(prompt, fieldWrapper);

    return wrapper;
}

function setupForgotPasswordFlow() {
    const form = document.getElementById('forgotForm');
    if (!form) {
        return;
    }

    const emailField = form.elements.email;
    const description = document.getElementById('forgotDescription');
    const challengeStep = document.getElementById('securityChallengeStep');
    const challengeFields = document.getElementById('securityChallengeFields');
    const resetStep = document.getElementById('resetPasswordStep');
    const submitButton = document.getElementById('forgotSubmitButton');
    const backButton = document.getElementById('forgotBackButton');
    const stepItems = Array.from(document.querySelectorAll('#recoverySteps .recovery-step'));
    const errorBox = document.getElementById('error');
    const successBox = document.getElementById('success');
    const resetPasswordField = document.getElementById('reset_password');
    const resetPasswordConfirmField = document.getElementById('reset_password_confirm');

    if (!emailField || !description || !challengeStep || !challengeFields || !resetStep || !submitButton || !backButton || !resetPasswordField || !resetPasswordConfirmField) {
        return;
    }

    let stage = 'email';
    let resetToken = '';

    setupRealtimeValidation(form);

    const setStage = (nextStage) => {
        stage = nextStage;
        challengeStep.classList.toggle('forgot-step-hidden', stage === 'email' || stage === 'reset');
        resetStep.classList.toggle('forgot-step-hidden', stage !== 'reset');
        challengeStep.hidden = stage === 'email' || stage === 'reset';
        resetStep.hidden = stage !== 'reset';
        backButton.hidden = stage === 'email';
        resetPasswordField.disabled = stage !== 'reset';
        resetPasswordConfirmField.disabled = stage !== 'reset';

        stepItems.forEach((item) => {
            const itemStage = item.dataset.stage;
            const order = ['email', 'questions', 'reset'];
            const currentIndex = order.indexOf(stage);
            const itemIndex = order.indexOf(itemStage);

            item.classList.toggle('is-active', itemStage === stage);
            item.classList.toggle('is-complete', itemIndex > -1 && itemIndex < currentIndex);
        });

        if (stage === 'email') {
            description.textContent = 'Enter the account email to begin recovery.';
            submitButton.textContent = '> Continue';
            emailField.readOnly = false;
            challengeFields.innerHTML = '';
            resetPasswordField.value = '';
            resetPasswordConfirmField.value = '';
            resetToken = '';
            return;
        }

        if (stage === 'questions') {
            description.textContent = 'Answer the saved recovery questions for this account.';
            submitButton.textContent = '> Verify Answers';
            emailField.readOnly = true;
            return;
        }

        description.textContent = 'Verification passed. Set and confirm the new password.';
        submitButton.textContent = '> Save New Password';
        emailField.readOnly = true;
    };

    const collectRecoveryAnswers = () => {
        const inputs = challengeFields.querySelectorAll('input[data-question-id]');
        const answers = {};
        let hasError = false;

        inputs.forEach((input) => {
            const value = input.value.trim();
            const message = value === '' ? 'Answer is required' : '';

            setFieldError(input, message);

            if (message) {
                hasError = true;
                return;
            }

            answers[input.dataset.questionId] = value;
        });

        return hasError ? null : answers;
    };

    const validateResetFields = () => {
        const passwordMessage = validatePassword(resetPasswordField.value);
        const confirmMessage = validatePasswordConfirmation(resetPasswordConfirmField.value, resetPasswordField.value);

        setFieldError(resetPasswordField, passwordMessage);
        setFieldError(resetPasswordConfirmField, confirmMessage);

        return passwordMessage === '' && confirmMessage === '';
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setMessage(errorBox, '');
        setMessage(successBox, '');

        if (stage === 'email') {
            const emailMessage = validateEmail(emailField.value);
            setFieldError(emailField, emailMessage);

            if (emailMessage !== '') {
                setMessage(errorBox, '');
                return;
            }

            try {
                const data = await submitAuthForm('api/auth/forgot.php', form);

                if (!data.success) {
                    applyServerErrors(form, data.errors);
                    const hasFieldErrors = Boolean(data.errors && Object.keys(data.errors).length > 0);
                    setMessage(errorBox, hasFieldErrors ? '' : (data.message || 'Failed to load security questions'));
                    return;
                }

                challengeFields.innerHTML = '';

                if (!Array.isArray(data.questions) || data.questions.length < 2) {
                    setMessage(errorBox, 'This account does not have enough security questions configured.');
                    return;
                }

                data.questions.forEach((question, index) => {
                    challengeFields.appendChild(createSecurityQuestionField(question, index));
                });

                setupRealtimeValidation(form);
                setStage('questions');
                setMessage(successBox, data.message || 'Security questions loaded.');
            } catch (error) {
                console.error(error);
                setMessage(errorBox, 'Failed to load security questions');
            }

            return;
        }

        if (stage === 'questions') {
            const answers = collectRecoveryAnswers();

            if (!answers) {
                setMessage(errorBox, 'Answer both security questions to continue.');
                return;
            }

            try {
                const response = await fetch('api/auth/verify-security.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: emailField.value.trim(),
                        answers,
                    }),
                });
                const data = await response.json();

                if (!data.success) {
                    setMessage(errorBox, data.message || 'Security verification failed');
                    return;
                }

                resetToken = data.token || '';
                setStage('reset');
                setMessage(successBox, data.message || 'Security answers verified.');
            } catch (error) {
                console.error(error);
                setMessage(errorBox, 'Security verification failed');
            }

            return;
        }

        if (!validateResetFields()) {
            setMessage(errorBox, 'Enter a valid new password and confirm it.');
            return;
        }

        try {
            const response = await fetch('api/auth/reset-password.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: resetToken,
                    password: resetPasswordField.value,
                    password_confirm: resetPasswordConfirmField.value,
                }),
            });
            const data = await response.json();

            if (!data.success) {
                setMessage(errorBox, data.message || 'Password reset failed');
                return;
            }

            setMessage(successBox, data.message || 'Password reset successful');
            submitButton.disabled = true;
            window.setTimeout(() => {
                window.location.href = 'login.php';
            }, 1200);
        } catch (error) {
            console.error(error);
            setMessage(errorBox, 'Password reset failed');
        }
    });

    backButton.addEventListener('click', () => {
        setMessage(errorBox, '');
        setMessage(successBox, '');
        clearFormFieldErrors(form);
        setStage('email');
        emailField.focus();
    });

    setStage('email');
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

document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;

    if (page === 'forgot') {
        setupForgotPasswordFlow();
        return;
    }

    if (page !== 'register') {
        return;
    }

    const q1Select = document.getElementById('security_question_1');
    const q2Select = document.getElementById('security_question_2');
    const securityNote = document.querySelector('.security-note');

    if (!q1Select || !q2Select) {
        return;
    }

    try {
        const response = await fetch('api/auth/security-questions.php', {
            headers: {
                Accept: 'application/json',
            },
        });
        const data = await response.json();

        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
            data.questions.forEach((question) => {
                const option1 = document.createElement('option');
                option1.value = question.id;
                option1.textContent = question.question;

                const option2 = document.createElement('option');
                option2.value = question.id;
                option2.textContent = question.question;

                q1Select.appendChild(option1);
                q2Select.appendChild(option2);
            });
        } else if (securityNote) {
            securityNote.textContent = 'No security questions are available yet. Import the updated database seed data first.';
        }
    } catch (error) {
        console.error('Failed to load security questions:', error);
        if (securityNote) {
            securityNote.textContent = 'Failed to load security questions. Check the database seed data and API response.';
        }
    }

    const syncQuestionOptions = () => {
        const selectedQuestionOne = q1Select.value;
        const selectedQuestionTwo = q2Select.value;

        Array.from(q1Select.options).forEach((option) => {
            option.disabled = option.value !== '' && option.value === selectedQuestionTwo;
        });

        Array.from(q2Select.options).forEach((option) => {
            option.disabled = option.value !== '' && option.value === selectedQuestionOne;
        });
    };

    q1Select.addEventListener('change', syncQuestionOptions);
    q2Select.addEventListener('change', syncQuestionOptions);
    syncQuestionOptions();
});
