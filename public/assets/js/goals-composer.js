(function () {
    function initGoalComposer(app) {
        const addButton = document.getElementById('addGoalBtn');
        const cancelButton = document.getElementById('cancelGoalBtn');
        const composer = document.getElementById('goalComposer');
        const form = document.getElementById('goalForm');
        const titleField = document.getElementById('goalTitle');
        const dreamField = document.getElementById('goalDream');
        const typeField = document.getElementById('goalType');
        const statusField = document.getElementById('goalStatus');
        const startDateField = document.getElementById('goalStartDate');
        const targetDateField = document.getElementById('goalTargetDate');
        const progressField = document.getElementById('goalProgress');
        const descriptionField = document.getElementById('goalDescription');
        const message = document.getElementById('goalFormMessage');
        const submitBtn = form?.querySelector('[type="submit"]');
        const editingIdField = document.getElementById('goalEditingId');
        let dreamsLoaded = false;
        let editingId = null;

        if (!addButton || !cancelButton || !composer || !form || !titleField || !dreamField || !typeField || !statusField || !startDateField || !targetDateField || !progressField || !descriptionField || !message || !submitBtn) {
            return;
        }

        async function ensureDreams() {
            if (dreamsLoaded) {
                return true;
            }

            const dreams = await app.getDreams();
            if (dreams.length === 0) {
                return false;
            }

            dreamField.innerHTML = '<option value="">Select dream</option>';
            dreams.forEach((dream) => {
                const option = document.createElement('option');
                option.value = String(dream.id);
                option.textContent = dream.title;
                dreamField.appendChild(option);
            });

            dreamsLoaded = true;
            return true;
        }

        function resetComposerMode() {
            editingId = null;
            if (editingIdField) {
                editingIdField.value = '';
            }

            submitBtn.textContent = 'Save Goal';
        }

        function hydrateDefaultValues() {
            form.reset();
            typeField.value = 'daily';
            statusField.value = 'active';
            startDateField.value = app.todayIso();
            targetDateField.value = '';
            progressField.value = '0';
        }

        addButton.addEventListener('click', async () => {
            app.clearPageMessage();
            app.setMessage(message, '');

            if (!(await ensureDreams())) {
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

        document.addEventListener('click', async (event) => {
            const editBtn = event.target.closest('.edit-goal');
            if (!editBtn) {
                return;
            }

            app.clearPageMessage();
            app.setMessage(message, '');

            const card = editBtn.closest('[data-id]');
            if (!card) {
                return;
            }

            if (!(await ensureDreams())) {
                return;
            }

            editingId = card.dataset.id;
            if (editingIdField) {
                editingIdField.value = editingId;
            }

            titleField.value = card.dataset.title || '';
            descriptionField.value = card.dataset.description || '';
            dreamField.value = card.dataset.dreamId || '';
            typeField.value = card.dataset.goalType || 'daily';
            statusField.value = card.dataset.status || 'active';
            startDateField.value = card.dataset.startDate || app.todayIso();
            targetDateField.value = card.dataset.targetDate || '';
            progressField.value = card.dataset.progress || '0';
            submitBtn.textContent = 'Update Goal';
            app.openCollapsible(composer, titleField);
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            app.clearPageMessage();

            const title = titleField.value.trim();
            const dreamId = dreamField.value;
            const goalType = typeField.value;
            const status = statusField.value;
            const startDate = startDateField.value;
            const targetDate = targetDateField.value;
            const progress = Number.parseInt(progressField.value || '0', 10);
            const description = descriptionField.value.trim();

            if (!title) {
                app.setMessage(message, 'Goal title is required.');
                return;
            }

            if (!dreamId) {
                app.setMessage(message, 'Select a dream before saving the goal.');
                return;
            }

            if (!startDate) {
                app.setMessage(message, 'Start date is required.');
                return;
            }

            if (Number.isNaN(progress) || progress < 0 || progress > 100) {
                app.setMessage(message, 'Current progress must be between 0 and 100.');
                return;
            }

            if (targetDate && targetDate < startDate) {
                app.setMessage(message, 'Target date must be the same as or later than the start date.');
                return;
            }

            const isEdit = Boolean(editingId);
            const url = isEdit ? `api/goals.php?id=${editingId}` : 'api/goals.php';
            const method = isEdit ? 'PUT' : 'POST';
            const body = {
                title,
                dream_id: Number.parseInt(dreamId, 10),
                description,
                goal_type: goalType,
                status,
                start_date: startDate,
                estimated_finish_date: targetDate || null,
                current_progress_percent: progress,
            };

            const result = await app.apiRequest(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (result?.success) {
                window.location.reload();
                return;
            }

            app.setMessage(message, result?.message || (isEdit ? 'Failed to update goal.' : 'Failed to create goal.'));
        });
    }

    window.ProgressionGoalsComposer = {
        init: initGoalComposer,
    };
})();
