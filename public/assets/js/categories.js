document.addEventListener('DOMContentLoaded', () => {
    const app = window.dashboardApp;
    if (!app) {
        return;
    }

    app.bindDeleteButtons('.delete-category', 'api/categories.php');

    const addButton = document.getElementById('addCategoryBtn');
    const cancelButton = document.getElementById('cancelCategoryBtn');
    const composer = document.getElementById('categoryComposer');
    const form = document.getElementById('categoryForm');
    const nameField = document.getElementById('categoryName');
    const message = document.getElementById('categoryFormMessage');
    const submitBtn = form?.querySelector('[type="submit"]');
    const editingIdField = document.getElementById('categoryEditingId');
    let editingId = null;

    if (!addButton || !cancelButton || !composer || !form || !nameField || !message || !submitBtn) {
        return;
    }

    function resetComposerMode() {
        editingId = null;
        if (editingIdField) editingIdField.value = '';
        submitBtn.textContent = 'Save Category';
    }

    addButton.addEventListener('click', () => {
        app.clearPageMessage();
        app.setMessage(message, '');
        resetComposerMode();
        form.reset();
        app.openCollapsible(composer, nameField);
    });

    cancelButton.addEventListener('click', () => {
        form.reset();
        resetComposerMode();
        app.setMessage(message, '');
        app.closeCollapsible(composer);
    });

    // Edit button handler (delegated)
    document.addEventListener('click', (event) => {
        const editBtn = event.target.closest('.edit-category');
        if (!editBtn) return;

        app.clearPageMessage();
        app.setMessage(message, '');

        const card = editBtn.closest('[data-id]');
        if (!card) return;

        editingId = card.dataset.id;
        if (editingIdField) editingIdField.value = editingId;

        nameField.value = card.dataset.name || card.querySelector('h3')?.textContent?.trim() || '';
        submitBtn.textContent = 'Update Category';
        app.openCollapsible(composer, nameField);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        app.clearPageMessage();

        const name = nameField.value.trim();
        if (!name) {
            app.setMessage(message, 'Category name is required.');
            return;
        }

        const isEdit = Boolean(editingId);
        const url = isEdit ? `api/categories.php?id=${editingId}` : 'api/categories.php';
        const method = isEdit ? 'PUT' : 'POST';

        const result = await app.apiRequest(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        if (result?.success) {
            window.location.reload();
            return;
        }

        app.setMessage(message, result?.message || (isEdit ? 'Failed to update category.' : 'Failed to create category.'));
    });
});
