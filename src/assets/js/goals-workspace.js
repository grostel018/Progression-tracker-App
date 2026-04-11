(function () {
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
        const taskToggle = document.getElementById('goalWorkspaceTaskToggle');
        const taskComposer = document.getElementById('goalWorkspaceTaskComposer');
        const taskMessage = document.getElementById('goalWorkspaceTaskMessage');
        const taskList = document.getElementById('goalWorkspaceTaskList');
        const habitForm = document.getElementById('goalWorkspaceHabitForm');
        const habitTitleField = document.getElementById('goalWorkspaceHabitTitle');
        const habitEditingIdField = document.getElementById('goalWorkspaceHabitEditingId');
        const habitSubmit = document.getElementById('goalWorkspaceHabitSubmit');
        const habitCancel = document.getElementById('goalWorkspaceHabitCancel');
        const habitToggle = document.getElementById('goalWorkspaceHabitToggle');
        const habitComposer = document.getElementById('goalWorkspaceHabitComposer');
        const habitMessage = document.getElementById('goalWorkspaceHabitMessage');
        const habitList = document.getElementById('goalWorkspaceHabitList');

        if (!cards.length || !panel || !title || !meta || !progress || !entries || !tasksMetric || !habitsMetric || !addLogButton || !taskForm || !taskTitleField || !taskEditingIdField || !taskSubmit || !taskCancel || !taskToggle || !taskComposer || !taskMessage || !taskList || !habitForm || !habitTitleField || !habitEditingIdField || !habitSubmit || !habitCancel || !habitToggle || !habitComposer || !habitMessage || !habitList) {
            return;
        }

        let selectedGoalId = null;

        function setWorkspaceEnabled(enabled) {
            addLogButton.disabled = !enabled;
            taskToggle.disabled = !enabled;
            taskTitleField.disabled = !enabled;
            taskSubmit.disabled = !enabled;
            habitToggle.disabled = !enabled;
            habitTitleField.disabled = !enabled;
            habitSubmit.disabled = !enabled;
            taskCancel.disabled = !enabled;
            habitCancel.disabled = !enabled;
        }

        function setComposerState(toggle, composer, isOpen, focusEl = null) {
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            toggle.classList.toggle('is-open', isOpen);

            if (isOpen) {
                app.openCollapsible(composer, focusEl);
                return;
            }

            if (composer.hidden) {
                return;
            }

            app.closeCollapsible(composer);
        }

        function openTaskComposer(focusEl = taskTitleField) {
            taskToggle.setAttribute('aria-label', 'Close task form');
            setComposerState(taskToggle, taskComposer, true, focusEl);
        }

        function closeTaskComposer() {
            setComposerState(taskToggle, taskComposer, false);
        }

        function openHabitComposer(focusEl = habitTitleField) {
            habitToggle.setAttribute('aria-label', 'Close habit form');
            setComposerState(habitToggle, habitComposer, true, focusEl);
        }

        function closeHabitComposer() {
            setComposerState(habitToggle, habitComposer, false);
        }

        function resetTaskForm(closeComposer = true) {
            taskForm.reset();
            taskEditingIdField.value = '';
            taskSubmit.textContent = 'Save Task';
            taskCancel.hidden = true;
            taskToggle.setAttribute('aria-label', 'Open task form');
            if (closeComposer) {
                closeTaskComposer();
            }
        }

        function resetHabitForm(closeComposer = true) {
            habitForm.reset();
            habitEditingIdField.value = '';
            habitSubmit.textContent = 'Save Habit';
            habitCancel.hidden = true;
            habitToggle.setAttribute('aria-label', 'Open habit form');
            if (closeComposer) {
                closeHabitComposer();
            }
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

        taskToggle.addEventListener('click', () => {
            if (taskToggle.disabled) {
                return;
            }

            if (taskToggle.getAttribute('aria-expanded') === 'true') {
                resetTaskForm();
                app.setMessage(taskMessage, '');
                return;
            }

            resetTaskForm(false);
            openTaskComposer();
            app.setMessage(taskMessage, '');
        });

        habitToggle.addEventListener('click', () => {
            if (habitToggle.disabled) {
                return;
            }

            if (habitToggle.getAttribute('aria-expanded') === 'true') {
                resetHabitForm();
                app.setMessage(habitMessage, '');
                return;
            }

            resetHabitForm(false);
            openHabitComposer();
            app.setMessage(habitMessage, '');
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
                openTaskComposer(taskTitleField);
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
                openHabitComposer(habitTitleField);
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

    window.ProgressionGoalsWorkspace = {
        init: initGoalWorkspace,
    };
})();
