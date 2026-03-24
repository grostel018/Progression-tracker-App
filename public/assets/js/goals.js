document.addEventListener('DOMContentLoaded', () => {
    const app = window.dashboardApp;
    if (!app) {
        return;
    }

    app.bindDeleteButtons('.delete-goal', 'api/goals.php');
    initGoalComposer(app);
    initGoalWorkspace(app);
});

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

    // Edit button handler (delegated)
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

function initGoalWorkspace(app) {
    const cards = Array.from(document.querySelectorAll('.goal-card.selectable-card'));
    const panel = document.getElementById('goalHistoryPanel');
    const title = document.getElementById('goalWorkspaceTitle');
    const meta = document.getElementById('goalWorkspaceMeta');
    const progress = document.getElementById('goalWorkspaceProgress');
    const entries = document.getElementById('goalWorkspaceEntries');
    const tasksMetric = document.getElementById('goalWorkspaceTasks');
    const habitsMetric = document.getElementById('goalWorkspaceHabits');
    const addLogButton = panel?.querySelector('.history-log-trigger');
    const taskForm = document.getElementById('goalWorkspaceTaskForm');
    const taskTitleField = document.getElementById('goalWorkspaceTaskTitle');
    const taskEditingIdField = document.getElementById('goalWorkspaceTaskEditingId');
    const taskSubmit = document.getElementById('goalWorkspaceTaskSubmit');
    const taskCancel = document.getElementById('goalWorkspaceTaskCancel');
    const taskMessage = document.getElementById('goalWorkspaceTaskMessage');
    const taskList = document.getElementById('goalWorkspaceTaskList');
    const habitForm = document.getElementById('goalWorkspaceHabitForm');
    const habitTitleField = document.getElementById('goalWorkspaceHabitTitle');
    const habitEditingIdField = document.getElementById('goalWorkspaceHabitEditingId');
    const habitSubmit = document.getElementById('goalWorkspaceHabitSubmit');
    const habitCancel = document.getElementById('goalWorkspaceHabitCancel');
    const habitMessage = document.getElementById('goalWorkspaceHabitMessage');
    const habitList = document.getElementById('goalWorkspaceHabitList');

    if (!cards.length || !panel || !title || !meta || !progress || !entries || !tasksMetric || !habitsMetric || !addLogButton || !taskForm || !taskTitleField || !taskEditingIdField || !taskSubmit || !taskCancel || !taskMessage || !taskList || !habitForm || !habitTitleField || !habitEditingIdField || !habitSubmit || !habitCancel || !habitMessage || !habitList) {
        return;
    }

    let selectedGoalId = null;

    function setWorkspaceEnabled(enabled) {
        addLogButton.disabled = !enabled;
        taskTitleField.disabled = !enabled;
        taskSubmit.disabled = !enabled;
        habitTitleField.disabled = !enabled;
        habitSubmit.disabled = !enabled;
        taskCancel.disabled = !enabled;
        habitCancel.disabled = !enabled;
    }

    function resetTaskForm() {
        taskForm.reset();
        taskEditingIdField.value = '';
        taskSubmit.textContent = 'Add Task';
        taskCancel.hidden = true;
    }

    function resetHabitForm() {
        habitForm.reset();
        habitEditingIdField.value = '';
        habitSubmit.textContent = 'Add Habit';
        habitCancel.hidden = true;
    }

    function setMetricsFromCard(card) {
        title.textContent = card.dataset.title || 'Selected goal';
        meta.textContent = buildGoalMeta(card, app);
        progress.textContent = `${card.dataset.progress || 0}%`;
        entries.textContent = card.dataset.logCount || '0';
        tasksMetric.textContent = `${card.dataset.completedTaskCount || 0}/${card.dataset.taskCount || 0}`;
        habitsMetric.textContent = card.dataset.habitCount || '0';
    }

    async function loadTasks() {
        const tasks = await app.apiRequest(`api/goal-tasks.php?goal_id=${selectedGoalId}`);
        if (tasks?.success === false) {
            app.setMessage(taskMessage, tasks.message || 'Failed to load tasks.');
            taskList.innerHTML = '<p class="panel-empty-copy">Tasks could not be loaded right now.</p>';
            return;
        }

        if (!Array.isArray(tasks) || tasks.length === 0) {
            tasksMetric.textContent = '0/0';
            taskList.innerHTML = '<p class="panel-empty-copy">No tasks yet. Add a concrete step to make progress measurable.</p>';
            return;
        }

        const completedTasks = tasks.filter((task) => task.is_completed).length;
        tasksMetric.textContent = `${completedTasks}/${tasks.length}`;

        taskList.innerHTML = tasks.map((task) => `
            <article class="tracking-row${task.is_completed ? ' is-complete' : ''}" data-task-id="${task.id}">
                <label class="tracking-check">
                    <input type="checkbox" ${task.is_completed ? 'checked' : ''}>
                    <span></span>
                </label>
                <div class="tracking-copy">
                    <strong>${escapeHtml(task.title)}</strong>
                    ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
                </div>
                <div class="tracking-actions-stack">
                    <button type="button" class="btn-action tracking-edit" data-edit-task="${task.id}" data-task-title="${escapeHtml(task.title)}" data-task-description="${escapeHtml(task.description || '')}">Edit</button>
                    <button type="button" class="btn-action btn-secondary tracking-delete" data-delete-task="${task.id}">Delete</button>
                </div>
            </article>
        `).join('');
    }

    async function loadHabits() {
        const habits = await app.apiRequest(`api/goal-habits.php?goal_id=${selectedGoalId}`);
        if (habits?.success === false) {
            app.setMessage(habitMessage, habits.message || 'Failed to load habits.');
            habitList.innerHTML = '<p class="panel-empty-copy">Habits could not be loaded right now.</p>';
            return;
        }

        if (!Array.isArray(habits) || habits.length === 0) {
            habitsMetric.textContent = '0';
            habitList.innerHTML = '<p class="panel-empty-copy">No habits yet. Add one repeatable action to start building rhythm.</p>';
            return;
        }

        habitsMetric.textContent = String(habits.length);

        habitList.innerHTML = habits.map((habit) => `
            <article class="tracking-row tracking-habit-row" data-habit-id="${habit.id}">
                <div class="tracking-copy">
                    <strong>${escapeHtml(habit.title)}</strong>
                    ${habit.description ? `<p>${escapeHtml(habit.description)}</p>` : ''}
                    <p class="analytics-caption">Today: ${habit.today_actions} • Total: ${habit.total_actions}</p>
                </div>
                <div class="tracking-actions-stack">
                    <button type="button" class="btn-action tracking-edit" data-edit-habit="${habit.id}" data-habit-title="${escapeHtml(habit.title)}" data-habit-description="${escapeHtml(habit.description || '')}">Edit</button>
                    <button type="button" class="btn-action tracking-record" data-record-habit="${habit.id}">Record Action</button>
                    <button type="button" class="btn-action btn-secondary tracking-delete" data-delete-habit="${habit.id}">Delete</button>
                </div>
            </article>
        `).join('');
    }

    async function refreshWorkspace() {
        if (!selectedGoalId) {
            return;
        }

        await Promise.all([
            loadTasks(),
            loadHabits(),
            window.ProgressionHistory?.refreshPanel(panel),
        ]);
    }

    function selectCard(card) {
        cards.forEach((item) => item.classList.toggle('is-selected', item === card));
        selectedGoalId = Number.parseInt(card.dataset.id || '', 10);
        setMetricsFromCard(card);
        setWorkspaceEnabled(true);
        resetTaskForm();
        resetHabitForm();
        window.ProgressionHistory?.setEntity(panel, selectedGoalId);
        refreshWorkspace();
    }

    panel.addEventListener('history:loaded', (event) => {
        const data = event.detail;
        if (!data || data.scope !== 'goal') {
            return;
        }

        progress.textContent = `${data.entity?.current_progress_percent ?? 0}%`;
        entries.textContent = String(data.summary?.total_entries ?? data.heatmap?.total_entries ?? 0);
    });

    cards.forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.delete-goal') || event.target.closest('.edit-goal')) {
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

    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        app.setMessage(taskMessage, '');

        const titleValue = taskTitleField.value.trim();
        if (!titleValue || !selectedGoalId) {
            app.setMessage(taskMessage, 'Select a goal and enter a task title.');
            return;
        }

        const editingTaskId = taskEditingIdField.value.trim();
        const result = await app.apiRequest(editingTaskId ? `api/goal-tasks.php?id=${editingTaskId}` : `api/goal-tasks.php?goal_id=${selectedGoalId}`, {
            method: editingTaskId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleValue }),
        });

        if (!result?.success) {
            app.setMessage(taskMessage, result?.message || (editingTaskId ? 'Failed to update task.' : 'Failed to add task.'));
            return;
        }

        resetTaskForm();
        app.setMessage(taskMessage, result.message || (editingTaskId ? 'Task updated.' : 'Task added.'), 'success');
        await loadTasks();
    });

    habitForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        app.setMessage(habitMessage, '');

        const titleValue = habitTitleField.value.trim();
        if (!titleValue || !selectedGoalId) {
            app.setMessage(habitMessage, 'Select a goal and enter a habit title.');
            return;
        }

        const editingHabitId = habitEditingIdField.value.trim();
        const result = await app.apiRequest(editingHabitId ? `api/goal-habits.php?id=${editingHabitId}` : `api/goal-habits.php?goal_id=${selectedGoalId}`, {
            method: editingHabitId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleValue }),
        });

        if (!result?.success) {
            app.setMessage(habitMessage, result?.message || (editingHabitId ? 'Failed to update habit.' : 'Failed to add habit.'));
            return;
        }

        resetHabitForm();
        app.setMessage(habitMessage, result.message || (editingHabitId ? 'Habit updated.' : 'Habit added.'), 'success');
        await loadHabits();
    });

    taskCancel.addEventListener('click', () => {
        resetTaskForm();
        app.setMessage(taskMessage, '');
    });

    habitCancel.addEventListener('click', () => {
        resetHabitForm();
        app.setMessage(habitMessage, '');
    });

    taskList.addEventListener('change', async (event) => {
        const checkbox = event.target.closest('input[type="checkbox"]');
        if (!checkbox) {
            return;
        }

        const row = checkbox.closest('[data-task-id]');
        const taskId = row?.dataset.taskId;
        if (!taskId) {
            return;
        }

        const result = await app.apiRequest(`api/goal-tasks.php?id=${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: checkbox.checked, completed_on: app.todayIso() }),
        });

        if (!result?.success) {
            checkbox.checked = !checkbox.checked;
            app.setMessage(taskMessage, result?.message || 'Failed to update task state.');
            return;
        }

        await loadTasks();
        await window.ProgressionHistory?.refreshPanel(panel);
    });

    taskList.addEventListener('click', async (event) => {
        const editButton = event.target.closest('[data-edit-task]');
        if (editButton) {
            taskEditingIdField.value = editButton.dataset.editTask || '';
            taskTitleField.value = editButton.dataset.taskTitle || '';
            taskSubmit.textContent = 'Update Task';
            taskCancel.hidden = false;
            taskTitleField.focus();
            return;
        }

        const deleteButton = event.target.closest('[data-delete-task]');
        if (!deleteButton) {
            return;
        }

        const taskId = deleteButton.dataset.deleteTask;
        app.requestInlineConfirmation(deleteButton, async () => {
            const result = await app.apiRequest(`api/goal-tasks.php?id=${taskId}`, { method: 'DELETE' });

            if (!result?.success) {
                app.setMessage(taskMessage, result?.message || 'Failed to delete task.');
                return;
            }

            if (taskEditingIdField.value === taskId) {
                resetTaskForm();
            }

            app.setMessage(taskMessage, result.message || 'Task deleted.', 'success');
            await loadTasks();
        });
    });

    habitList.addEventListener('click', async (event) => {
        const editButton = event.target.closest('[data-edit-habit]');
        if (editButton) {
            habitEditingIdField.value = editButton.dataset.editHabit || '';
            habitTitleField.value = editButton.dataset.habitTitle || '';
            habitSubmit.textContent = 'Update Habit';
            habitCancel.hidden = false;
            habitTitleField.focus();
            return;
        }

        const recordButton = event.target.closest('[data-record-habit]');
        if (recordButton) {
            const habitId = recordButton.dataset.recordHabit;
            const result = await app.apiRequest('api/goal-habit-logs.php?habit_id=' + habitId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logged_on: app.todayIso() }),
            });

            if (!result?.success) {
                app.setMessage(habitMessage, result?.message || 'Failed to record habit action.');
                return;
            }

            app.setMessage(habitMessage, result.message || 'Habit action recorded.', 'success');
            await loadHabits();
            await window.ProgressionHistory?.refreshPanel(panel);
            return;
        }

        const deleteButton = event.target.closest('[data-delete-habit]');
        if (!deleteButton) {
            return;
        }

        const habitId = deleteButton.dataset.deleteHabit;
        app.requestInlineConfirmation(deleteButton, async () => {
            const result = await app.apiRequest('api/goal-habits.php?id=' + habitId, { method: 'DELETE' });

            if (!result?.success) {
                app.setMessage(habitMessage, result?.message || 'Failed to delete habit.');
                return;
            }

            if (habitEditingIdField.value === habitId) {
                resetHabitForm();
            }

            app.setMessage(habitMessage, result.message || 'Habit deleted.', 'success');
            await loadHabits();
        });
    });

    setWorkspaceEnabled(false);
    resetTaskForm();
    resetHabitForm();
    selectCard(cards[0]);
}

function buildGoalMeta(card, app) {
    const bits = [];

    if (card.dataset.goalType) {
        bits.push(app.humanizeLabel(card.dataset.goalType));
    }

    if (card.dataset.status) {
        bits.push(app.humanizeLabel(card.dataset.status));
    }

    if (card.dataset.dreamTitle) {
        bits.push('in ' + card.dataset.dreamTitle);
    }

    if (card.dataset.startDate) {
        bits.push('Start ' + card.dataset.startDate);
    }

    if (card.dataset.targetDate) {
        bits.push('Target ' + card.dataset.targetDate);
    }

    return bits.join(' • ');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
