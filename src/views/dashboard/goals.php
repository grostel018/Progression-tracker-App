<?php
$pageId = 'goals';
$pageTitle = 'My Goals';
$activePage = 'goals';
$pageScripts = ['goals-composer.js', 'goals-workspace.js', 'goals.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Execution Surface</p>
        <h1 id="title">My Goals</h1>
        <p class="page-summary">Manage active targets, attach tasks and habits, and watch how each goal changes over time.</p>
    </div>
    <button class="btn-primary add-btn" id="addGoalBtn">+ New Goal</button>
</header>
<section class="inline-composer" id="goalComposer" hidden aria-label="Goal form">
    <form class="composer-form" id="goalForm">
        <input type="hidden" id="goalEditingId" name="editing_id" value="">
        <div class="composer-grid">
            <div class="inputs">
                <label for="goalTitle">Goal title</label>
                <input type="text" id="goalTitle" name="title" maxlength="255" required>
            </div>
            <div class="inputs">
                <label for="goalDream">Dream</label>
                <select id="goalDream" name="dream_id" required>
                    <option value="">Select dream</option>
                </select>
            </div>
            <div class="inputs">
                <label for="goalType">Goal type</label>
                <select id="goalType" name="goal_type" required>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
            <div class="inputs">
                <label for="goalStatus">Status</label>
                <select id="goalStatus" name="status" required>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
            <div class="inputs">
                <label for="goalStartDate">Start date</label>
                <input type="date" id="goalStartDate" name="start_date" required>
            </div>
            <div class="inputs">
                <label for="goalTargetDate">Target date</label>
                <input type="date" id="goalTargetDate" name="estimated_finish_date">
            </div>
            <div class="inputs">
                <label for="goalProgress">Current progress %</label>
                <input type="number" id="goalProgress" name="current_progress_percent" min="0" max="100" step="1" value="0">
            </div>
            <div class="inputs composer-span-full">
                <label for="goalDescription">Description</label>
                <textarea id="goalDescription" name="description" rows="4" placeholder="Optional details for this goal."></textarea>
            </div>
        </div>
        <div class="composer-actions">
            <button type="submit" class="btn-primary">Save Goal</button>
            <button type="button" class="btn-action btn-secondary" id="cancelGoalBtn">Cancel</button>
        </div>
        <p class="form-message" id="goalFormMessage" hidden aria-live="polite"></p>
    </form>
</section>
<section class="goals-list" data-empty-message="No goals yet. Create a goal to track your progress!" data-create-btn="addGoalBtn" data-create-label="+ New Goal">
    <?php if (empty($goals)): ?>
        <div class="empty-state">
            <p>No goals yet. Create a goal to track your progress!</p>
            <button class="btn-action empty-cta-btn" data-trigger="addGoalBtn">+ New Goal</button>
        </div>
    <?php else: ?>
        <?php foreach ($goals as $goal): ?>
            <div
                class="goal-card selectable-card"
                tabindex="0"
                role="button"
                aria-label="Inspect <?= safe_output($goal['title']) ?>"
                data-id="<?= (int) $goal['id'] ?>"
                data-title="<?= safe_output($goal['title']) ?>"
                data-status="<?= safe_output($goal['status']) ?>"
                data-progress="<?= (int) ($goal['current_progress_percent'] ?? 0) ?>"
                data-log-count="<?= (int) ($goal['log_count'] ?? 0) ?>"
                data-dream-title="<?= safe_output($goal['dream_title']) ?>"
                data-dream-id="<?= (int) ($goal['dream_id'] ?? 0) ?>"
                data-goal-type="<?= safe_output($goal['goal_type']) ?>"
                data-start-date="<?= safe_output($goal['start_date']) ?>"
                data-target-date="<?= safe_output((string) ($goal['estimated_finish_date'] ?? '')) ?>"
                data-task-count="<?= (int) ($goal['task_count'] ?? 0) ?>"
                data-completed-task-count="<?= (int) ($goal['completed_task_count'] ?? 0) ?>"
                data-habit-count="<?= (int) ($goal['habit_count'] ?? 0) ?>"
                data-description="<?= safe_output((string) ($goal['description'] ?? '')) ?>"
            >
                <div class="goal-header">
                    <div>
                        <h3><?= safe_output($goal['title']) ?></h3>
                        <p class="entity-progress-label"><?= (int) ($goal['current_progress_percent'] ?? 0) ?>% current progress</p>
                    </div>
                    <div class="goal-info">
                        <span class="goal-type"><?= safe_output(humanize_label($goal['goal_type'])) ?></span>
                        <span class="status-badge status-<?= safe_output($goal['status']) ?>"><?= safe_output(humanize_label($goal['status'])) ?></span>
                    </div>
                </div>
                <p class="goal-dream">in <?= safe_output($goal['dream_title']) ?></p>
                <?php if (!empty($goal['description'])): ?>
                    <p class="goal-description"><?= safe_output($goal['description']) ?></p>
                <?php endif; ?>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: <?= (int) ($goal['current_progress_percent'] ?? 0) ?>%"></div>
                </div>
                <p class="goal-progress-summary">
                    Progress: <?= (int) ($goal['current_progress_percent'] ?? 0) ?>%
                    <?php if (!empty($goal['log_count'])): ?>
                        • <?= (int) $goal['log_count'] ?> update<?= (int) $goal['log_count'] === 1 ? '' : 's' ?>
                    <?php endif; ?>
                </p>
                <div class="goal-meta">
                    <span class="meta-item">Start: <?= safe_output($goal['start_date']) ?></span>
                    <?php if (!empty($goal['estimated_finish_date'])): ?>
                        <span class="meta-item">Target: <?= safe_output($goal['estimated_finish_date']) ?></span>
                    <?php endif; ?>
                    <span class="meta-item">Tasks: <?= (int) ($goal['completed_task_count'] ?? 0) ?>/<?= (int) ($goal['task_count'] ?? 0) ?></span>
                    <span class="meta-item">Habits: <?= (int) ($goal['habit_count'] ?? 0) ?></span>
                </div>
                <div class="goal-actions">
                    <button class="btn-action edit-goal">Edit</button>
                    <button class="btn-action btn-secondary delete-goal">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php if (!empty($goals)): ?>
    <section class="workspace-panel entity-workspace" id="goalWorkspace">
        <div class="workspace-head">
            <div class="workspace-head-copy">
                <p class="section-kicker">Selected Goal</p>
                <h2 id="goalWorkspaceTitle">Select a goal</h2>
                <p class="workspace-copy" id="goalWorkspaceMeta">Choose a goal card to manage its tasks, habits, and activity history.</p>
            </div>
            <div class="workspace-metrics">
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Progress</span>
                    <strong id="goalWorkspaceProgress">--</strong>
                </div>
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Entries</span>
                    <strong id="goalWorkspaceEntries">--</strong>
                </div>
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Tasks</span>
                    <strong id="goalWorkspaceTasks">--</strong>
                </div>
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Habits</span>
                    <strong id="goalWorkspaceHabits">--</strong>
                </div>
            </div>
        </div>
        <section class="entity-history-panel" id="goalHistoryPanel" data-history-scope="goal" data-default-range="30d" data-entity-label="goal">
            <div class="entity-history-head">
                <div class="analytics-head-copy">
                    <p class="section-kicker">History</p>
                    <h4>Activity And Progress</h4>
                </div>
                <div class="history-range-switch" data-range-switch role="group" aria-label="Activity time range">
                    <button type="button" class="range-chip is-active" data-range="30d">30D</button>
                    <button type="button" class="range-chip" data-range="week">Week</button>
                    <button type="button" class="range-chip" data-range="month">Month</button>
                    <button type="button" class="range-chip" data-range="year">Year</button>
                </div>
            </div>
            <div class="entity-history-grid">
                <section class="analytics-panel">
                    <div class="analytics-panel-head">
                        <div class="analytics-panel-copy">
                            <h5>Calendar</h5>
                        </div>
                        <button type="button" class="btn-action btn-secondary history-log-trigger" disabled>Add Log</button>
                    </div>
                    <div class="heatmap-mount" data-role="heatmap">
                        <p class="panel-empty-copy">Select a goal to load its activity.</p>
                    </div>
                </section>
                <section class="analytics-panel">
                    <div class="analytics-panel-head">
                        <div class="analytics-panel-copy">
                            <h5>Progress</h5>
                            <span class="analytics-caption">Snapshots from manual updates.</span>
                        </div>
                    </div>
                    <div class="chart-mount" data-role="chart">
                        <p class="panel-empty-copy">Select a goal to load its progress timeline.</p>
                    </div>
                </section>
            </div>
            <div class="entity-history-feed" data-role="recent-feed">
                <p class="panel-empty-copy">Recent goal history will appear here once a goal is selected.</p>
            </div>
        </section>
        <section class="goal-tracking-grid">
            <article class="tracking-card">
                <div class="tracking-card-head">
                    <div class="tracking-card-copy">
                        <h4>Tasks</h4>
                        <span class="analytics-caption">Completed tasks add history automatically.</span>
                    </div>
                    <div class="tracking-card-actions">
                        <button
                            type="button"
                            class="btn-action tracking-toggle-btn"
                            id="goalWorkspaceTaskToggle"
                            aria-controls="goalWorkspaceTaskComposer"
                            aria-expanded="false"
                            aria-label="Open task form"
                            disabled
                        >
                            <span class="tracking-toggle-icon" aria-hidden="true">+</span>
                            <span>New Task</span>
                        </button>
                    </div>
                </div>
                <div class="tracking-composer" id="goalWorkspaceTaskComposer" hidden>
                    <form class="tracking-inline-form goal-task-form" id="goalWorkspaceTaskForm">
                        <input type="hidden" id="goalWorkspaceTaskEditingId" value="">
                        <div class="inputs">
                            <label for="goalWorkspaceTaskTitle">Task title</label>
                            <input type="text" id="goalWorkspaceTaskTitle" class="goal-task-title" maxlength="255" placeholder="Add a concrete task" disabled>
                        </div>
                        <div class="tracking-form-actions">
                            <button type="submit" class="btn-primary" id="goalWorkspaceTaskSubmit" disabled>Save Task</button>
                            <button type="button" class="btn-action btn-secondary" id="goalWorkspaceTaskCancel" hidden>Cancel</button>
                        </div>
                    </form>
                </div>
                <div class="tracking-message goal-task-message" id="goalWorkspaceTaskMessage" hidden aria-live="polite"></div>
                <div class="tracking-list goal-task-list" id="goalWorkspaceTaskList">
                    <p class="panel-empty-copy">Select a goal to load its tasks.</p>
                </div>
            </article>
            <article class="tracking-card">
                <div class="tracking-card-head">
                    <div class="tracking-card-copy">
                        <h4>Habits</h4>
                        <span class="analytics-caption">Record repeatable actions when they happen.</span>
                    </div>
                    <div class="tracking-card-actions">
                        <button
                            type="button"
                            class="btn-action tracking-toggle-btn"
                            id="goalWorkspaceHabitToggle"
                            aria-controls="goalWorkspaceHabitComposer"
                            aria-expanded="false"
                            aria-label="Open habit form"
                            disabled
                        >
                            <span class="tracking-toggle-icon" aria-hidden="true">+</span>
                            <span>New Habit</span>
                        </button>
                    </div>
                </div>
                <div class="tracking-composer" id="goalWorkspaceHabitComposer" hidden>
                    <form class="tracking-inline-form goal-habit-form" id="goalWorkspaceHabitForm">
                        <input type="hidden" id="goalWorkspaceHabitEditingId" value="">
                        <div class="inputs">
                            <label for="goalWorkspaceHabitTitle">Habit title</label>
                            <input type="text" id="goalWorkspaceHabitTitle" class="goal-habit-title" maxlength="255" placeholder="Add a repeatable action" disabled>
                        </div>
                        <div class="tracking-form-actions">
                            <button type="submit" class="btn-primary" id="goalWorkspaceHabitSubmit" disabled>Save Habit</button>
                            <button type="button" class="btn-action btn-secondary" id="goalWorkspaceHabitCancel" hidden>Cancel</button>
                        </div>
                    </form>
                </div>
                <div class="tracking-message goal-habit-message" id="goalWorkspaceHabitMessage" hidden aria-live="polite"></div>
                <div class="tracking-list goal-habit-list" id="goalWorkspaceHabitList">
                    <p class="panel-empty-copy">Select a goal to load its habits.</p>
                </div>
            </article>
        </section>
    </section>
<?php endif; ?>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
