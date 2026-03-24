async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            credentials: 'include',
            ...options,
            headers: {
                Accept: 'application/json',
                ...options.headers,
            },
        });

        if (response.status === 401) {
            window.location.href = 'login.php';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: 'Request failed. Check your connection and try again.',
        };
    }
}

function getPageFeedback() {
    return document.getElementById('pageFeedback');
}

function setMessage(element, message, type = 'error') {
    if (!element) {
        return;
    }

    const hasMessage = Boolean(message);
    element.textContent = message || '';
    element.hidden = !hasMessage;
    element.classList.remove('is-error', 'is-success', 'is-info');

    if (hasMessage) {
        element.classList.add(`is-${type}`);
    }
}

function showPageMessage(message, type = 'error') {
    setMessage(getPageFeedback(), message, type);
}

function clearPageMessage() {
    setMessage(getPageFeedback(), '');
}

function todayIso() {
    return new Date().toISOString().split('T')[0];
}

function humanizeLabel(value) {
    return String(value ?? '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function openCollapsible(panel, focusEl) {
    if (!panel) {
        return;
    }

    panel.removeAttribute('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panel.classList.add('is-open');
            focusEl?.focus();
        });
    });
}

function closeCollapsible(panel) {
    if (!panel) {
        return;
    }

    panel.classList.remove('is-open');
    panel.addEventListener('transitionend', () => {
        if (!panel.classList.contains('is-open')) {
            panel.setAttribute('hidden', '');
        }
    }, { once: true });
}

function requestInlineConfirmation(button, onConfirm, options = {}) {
    if (!button) {
        return;
    }

    const confirmLabel = options.confirmLabel || 'Confirm?';
    const cancelLabel = options.cancelLabel || 'Cancel';
    const timeoutMs = options.timeoutMs || 6000;

    if (!button.dataset.confirming) {
        button.dataset.confirming = 'true';
        button.dataset.originalText = button.textContent.trim();
        button.textContent = confirmLabel;
        button.classList.add('is-confirming');

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-action btn-secondary';
        cancelBtn.type = 'button';
        cancelBtn.textContent = cancelLabel;
        button.insertAdjacentElement('afterend', cancelBtn);

        const resetConfirmation = () => {
            delete button.dataset.confirming;
            button.textContent = button.dataset.originalText || 'Delete';
            button.classList.remove('is-confirming');
            cancelBtn.remove();
        };

        cancelBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            resetConfirmation();
        }, { once: true });

        setTimeout(() => {
            if (button.dataset.confirming) {
                resetConfirmation();
            }
        }, timeoutMs);

        return;
    }

    const cancelSibling = button.nextElementSibling;
    if (cancelSibling?.textContent === cancelLabel) {
        cancelSibling.remove();
    }

    delete button.dataset.confirming;
    button.textContent = button.dataset.originalText || 'Delete';
    button.classList.remove('is-confirming');
    onConfirm();
}

function reloadOnSuccess(result, fallbackMessage) {
    if (result?.success) {
        window.location.reload();
        return true;
    }

    showPageMessage(result?.message || fallbackMessage);
    return false;
}

function renderEmptyState(container) {
    if (!container || container.querySelector('[data-id]')) {
        return;
    }

    const emptyMessage = container.dataset.emptyMessage;
    if (!emptyMessage || container.querySelector('.empty-state')) {
        return;
    }

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const text = document.createElement('p');
    text.textContent = emptyMessage;
    emptyState.appendChild(text);

    // Add CTA button if container specifies a trigger button id
    const createBtnId = container.dataset.createBtn;
    const createLabel = container.dataset.createLabel;
    if (createBtnId && createLabel) {
        const cta = document.createElement('button');
        cta.className = 'btn-action empty-cta-btn';
        cta.textContent = createLabel;
        cta.type = 'button';
        cta.addEventListener('click', () => {
            document.getElementById(createBtnId)?.click();
        });
        emptyState.appendChild(cta);
    }

    container.appendChild(emptyState);
}

// Global handler for [data-trigger] CTA buttons (e.g. in PHP-rendered empty states)
document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-trigger]');
    if (!trigger) {
        return;
    }

    event.preventDefault();
    document.getElementById(trigger.dataset.trigger)?.click();
});

function bindDeleteButtons(selector, endpoint) {
    document.querySelectorAll(selector).forEach((button) => {
        button.addEventListener('click', async (event) => {
            clearPageMessage();

            const card = event.currentTarget.closest('[data-id]');
            const id = card?.dataset.id;

            if (!id) {
                return;
            }
            requestInlineConfirmation(button, async () => {
                const result = await apiRequest(`${endpoint}?id=${id}`, {
                    method: 'DELETE',
                });

                if (result?.success) {
                    card.remove();
                    renderEmptyState(card.parentElement);
                    showPageMessage(result.message || 'Item deleted.', 'success');
                    return;
                }

                showPageMessage(result?.message || 'Delete failed');
            });
        });
    });
}

async function fetchCollection(endpoint, emptyMessage) {
    const items = await apiRequest(endpoint);

    if (!Array.isArray(items) || items.length === 0) {
        showPageMessage(emptyMessage);
        return [];
    }

    return items;
}

window.dashboardApp = {
    apiRequest,
    bindDeleteButtons,
    clearPageMessage,
    closeCollapsible,
    humanizeLabel,
    openCollapsible,
    reloadOnSuccess,
    requestInlineConfirmation,
    setMessage,
    showPageMessage,
    todayIso,
    getCategories() {
        return fetchCollection('api/categories.php', 'Create a category before adding a dream.');
    },
    getDreams() {
        return fetchCollection('api/dreams.php', 'Create a dream before adding a goal.');
    },
};
