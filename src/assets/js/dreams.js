document.addEventListener('DOMContentLoaded', () => {
    const app = window.dashboardApp;
    if (!app) {
        return;
    }

    app.bindDeleteButtons('.delete-dream', 'api/dreams.php');
    initDreamComposer(app);
    initDreamWorkspace(app);
});

function initDreamComposer(app) {
    const addButton = document.getElementById('addDreamBtn');
    const cancelButton = document.getElementById('cancelDreamBtn');
    const composer = document.getElementById('dreamComposer');
    const form = document.getElementById('dreamForm');
    const titleField = document.getElementById('dreamTitle');
    const categoryField = document.getElementById('dreamCategory');
    const statusField = document.getElementById('dreamStatus');
    const startDateField = document.getElementById('dreamStartDate');
    const targetDateField = document.getElementById('dreamTargetDate');
    const progressField = document.getElementById('dreamProgress');
    const descriptionField = document.getElementById('dreamDescription');
    const message = document.getElementById('dreamFormMessage');
    const submitBtn = form?.querySelector('[type="submit"]');
    const editingIdField = document.getElementById('dreamEditingId');
    let categoriesLoaded = false;
    let editingId = null;

    if (!addButton || !cancelButton || !composer || !form || !titleField || !categoryField || !statusField || !startDateField || !targetDateField || !progressField || !descriptionField || !message || !submitBtn) {
        return;
    }

    async function ensureCategories() {
        if (categoriesLoaded) {
            return true;
        }

        const categories = await app.getCategories();
        if (categories.length === 0) {
            return false;
        }

        categoryField.innerHTML = '<option value="">Select category</option>';
        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = String(category.id);
            option.textContent = category.name;
            categoryField.appendChild(option);
        });

        categoriesLoaded = true;
        return true;
    }

    function resetComposerMode() {
        editingId = null;
        if (editingIdField) {
            editingIdField.value = '';
        }

        submitBtn.textContent = 'Save Dream';
    }

    function hydrateDefaultValues() {
        form.reset();
        statusField.value = 'active';
        startDateField.value = app.todayIso();
        targetDateField.value = '';
        progressField.value = '0';
    }

    addButton.addEventListener('click', async () => {
        app.clearPageMessage();
        app.setMessage(message, '');

        if (!(await ensureCategories())) {
            return;
        }

        resetComposerMode();
        hydrateDefaultValues();
        app.openCollapsible(composer, titleField);
    });

    cancelButton.addEventListener('click', () => {
        hydrateDefaultValues();
        resetComposerMode();
        app.setMessage(message, '');
        app.closeCollapsible(composer);
    });

    // Edit button handler (delegated)
    document.addEventListener('click', async (event) => {
        const editBtn = event.target.closest('.edit-dream');
        if (!editBtn) {
            return;
        }

        app.clearPageMessage();
        app.setMessage(message, '');

        const card = editBtn.closest('[data-id]');
        if (!card) {
            return;
        }

        if (!(await ensureCategories())) {
            return;
        }

        editingId = card.dataset.id;
        if (editingIdField) {
            editingIdField.value = editingId;
        }

        titleField.value = card.dataset.title || '';
        descriptionField.value = card.dataset.description || '';
        categoryField.value = card.dataset.categoryId || '';
        statusField.value = card.dataset.status || 'active';
        startDateField.value = card.dataset.startDate || '';
        targetDateField.value = card.dataset.targetDate || '';
        progressField.value = card.dataset.progress || '0';
        submitBtn.textContent = 'Update Dream';
        app.openCollapsible(composer, titleField);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        app.clearPageMessage();

        const title = titleField.value.trim();
        const categoryId = categoryField.value;
        const status = statusField.value;
        const startDate = startDateField.value;
        const targetDate = targetDateField.value;
        const progress = Number.parseInt(progressField.value || '0', 10);
        const description = descriptionField.value.trim();

        if (!title) {
            app.setMessage(message, 'Dream title is required.');
            return;
        }

        if (!categoryId) {
            app.setMessage(message, 'Select a category before saving the dream.');
            return;
        }

        if (Number.isNaN(progress) || progress < 0 || progress > 100) {
            app.setMessage(message, 'Current progress must be between 0 and 100.');
            return;
        }

        if (startDate && targetDate && targetDate < startDate) {
            app.setMessage(message, 'Target date must be the same as or later than the start date.');
            return;
        }

        const isEdit = Boolean(editingId);
        const url = isEdit ? `api/dreams.php?id=${editingId}` : 'api/dreams.php';
        const method = isEdit ? 'PUT' : 'POST';

        const result = await app.apiRequest(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                category_id: Number.parseInt(categoryId, 10),
                status,
                start_date: startDate || null,
                estimated_finish_date: targetDate || null,
                current_progress_percent: progress,
            }),
        });

        if (result?.success) {
            window.location.reload();
            return;
        }

        app.setMessage(message, result?.message || (isEdit ? 'Failed to update dream.' : 'Failed to create dream.'));
    });
}

function initDreamWorkspace(app) {
    const cards = Array.from(document.querySelectorAll('.dream-card.selectable-card'));
    const panel = document.getElementById('dreamHistoryPanel');
    const title = document.getElementById('dreamWorkspaceTitle');
    const meta = document.getElementById('dreamWorkspaceMeta');
    const progress = document.getElementById('dreamWorkspaceProgress');
    const entries = document.getElementById('dreamWorkspaceEntries');
    const addButton = panel?.querySelector('.history-log-trigger');

    if (!cards.length || !panel || !title || !meta || !progress || !entries || !addButton) {
        return;
    }

    function selectCard(card) {
        cards.forEach((item) => item.classList.toggle('is-selected', item === card));

        title.textContent = card.dataset.title || 'Selected dream';
        meta.textContent = buildDreamMeta(card, app);
        progress.textContent = `${card.dataset.progress || 0}%`;
        entries.textContent = card.dataset.logCount || '0';
        addButton.disabled = false;

        window.ProgressionHistory?.setEntity(panel, card.dataset.id);
        window.ProgressionHistory?.refreshPanel(panel);
    }

    panel.addEventListener('history:loaded', (event) => {
        const data = event.detail;
        if (!data || data.scope !== 'dream') {
            return;
        }

        progress.textContent = `${data.entity?.current_progress_percent ?? 0}%`;
        entries.textContent = String(data.summary?.total_entries ?? data.heatmap?.total_entries ?? 0);
    });

    cards.forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.delete-dream') || event.target.closest('.edit-dream')) {
                return;
            }

            selectCard(card);
        });

        card.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
                event.preventDefault();
                selectCard(card);
            }
        });
    });

    selectCard(cards[0]);
}

function buildDreamMeta(card, app) {
    const bits = [];

    if (card.dataset.status) {
        bits.push(app.humanizeLabel(card.dataset.status));
    }

    if (card.dataset.startDate) {
        bits.push(`Start ${card.dataset.startDate}`);
    }

    if (card.dataset.targetDate) {
        bits.push(`Target ${card.dataset.targetDate}`);
    }

    return bits.join(' • ');
}
