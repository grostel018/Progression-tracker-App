<?php
$pageId = 'dreams';
$pageTitle = 'My Dreams';
$activePage = 'dreams';
$pageScripts = ['dreams.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Dream Registry</p>
        <h1 id="title">My Dreams</h1>
        <p class="page-summary">Track the longer arcs you care about, then inspect each dream’s activity and progress history below.</p>
    </div>
    <button class="btn-primary add-btn" id="addDreamBtn">+ New Dream</button>
</header>
<section class="inline-composer" id="dreamComposer" hidden aria-label="Dream form">
    <form class="composer-form" id="dreamForm">
        <input type="hidden" id="dreamEditingId" name="editing_id" value="">
        <div class="composer-grid">
            <div class="inputs">
                <label for="dreamTitle">Dream title</label>
                <input type="text" id="dreamTitle" name="title" maxlength="255" required>
            </div>
            <div class="inputs">
                <label for="dreamCategory">Category</label>
                <select id="dreamCategory" name="category_id" required>
                    <option value="">Select category</option>
                </select>
            </div>
            <div class="inputs">
                <label for="dreamStatus">Status</label>
                <select id="dreamStatus" name="status" required>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="abandoned">Abandoned</option>
                </select>
            </div>
            <div class="inputs">
                <label for="dreamStartDate">Start date</label>
                <input type="date" id="dreamStartDate" name="start_date">
            </div>
            <div class="inputs">
                <label for="dreamTargetDate">Target date</label>
                <input type="date" id="dreamTargetDate" name="estimated_finish_date">
            </div>
            <div class="inputs">
                <label for="dreamProgress">Current progress %</label>
                <input type="number" id="dreamProgress" name="current_progress_percent" min="0" max="100" step="1" value="0">
            </div>
            <div class="inputs composer-span-full">
                <label for="dreamDescription">Description</label>
                <textarea id="dreamDescription" name="description" rows="4" placeholder="Optional context, scope, or outcome."></textarea>
            </div>
        </div>
        <div class="composer-actions">
            <button type="submit" class="btn-primary">Save Dream</button>
            <button type="button" class="btn-action btn-secondary" id="cancelDreamBtn">Cancel</button>
        </div>
        <p class="form-message" id="dreamFormMessage" hidden aria-live="polite"></p>
    </form>
</section>
<section class="dreams-grid" data-empty-message="No dreams yet. Start by creating your first dream!" data-create-btn="addDreamBtn" data-create-label="+ New Dream">
    <?php if (empty($dreams)): ?>
        <div class="empty-state">
            <p>No dreams yet. Start by creating your first dream!</p>
            <button class="btn-action empty-cta-btn" data-trigger="addDreamBtn">+ New Dream</button>
        </div>
    <?php else: ?>
        <?php foreach ($dreams as $dream): ?>
            <div
                class="dream-card selectable-card"
                tabindex="0"
                role="button"
                aria-label="Inspect <?= safe_output($dream['title']) ?>"
                data-id="<?= (int) $dream['id'] ?>"
                data-title="<?= safe_output($dream['title']) ?>"
                data-status="<?= safe_output($dream['status']) ?>"
                data-progress="<?= (int) ($dream['current_progress_percent'] ?? 0) ?>"
                data-log-count="<?= (int) ($dream['log_count'] ?? 0) ?>"
                data-start-date="<?= safe_output((string) ($dream['start_date'] ?? '')) ?>"
                data-target-date="<?= safe_output((string) ($dream['estimated_finish_date'] ?? '')) ?>"
                data-description="<?= safe_output((string) ($dream['description'] ?? '')) ?>"
                data-category-id="<?= (int) ($dream['category_id'] ?? 0) ?>"
            >
                <div class="dream-header">
                    <div>
                        <h3><?= safe_output($dream['title']) ?></h3>
                        <p class="entity-progress-label"><?= (int) ($dream['current_progress_percent'] ?? 0) ?>% current progress</p>
                    </div>
                    <span class="status-badge status-<?= safe_output($dream['status']) ?>"><?= safe_output(humanize_label($dream['status'])) ?></span>
                </div>
                <?php if (!empty($dream['description'])): ?>
                    <p class="dream-description"><?= safe_output($dream['description']) ?></p>
                <?php endif; ?>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: <?= (int) ($dream['current_progress_percent'] ?? 0) ?>%"></div>
                </div>
                <p class="goal-progress-summary">
                    History Entries: <?= (int) ($dream['log_count'] ?? 0) ?>
                </p>
                <div class="dream-meta">
                    <span class="meta-item">Start: <?= safe_output((string) ($dream['start_date'] ?? '')) ?></span>
                    <?php if (!empty($dream['estimated_finish_date'])): ?>
                        <span class="meta-item">Target: <?= safe_output($dream['estimated_finish_date']) ?></span>
                    <?php endif; ?>
                </div>
                <div class="dream-actions">
                    <button class="btn-action edit-dream">Edit</button>
                    <button class="btn-action btn-secondary delete-dream">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php if (!empty($dreams)): ?>
    <section class="workspace-panel entity-workspace" id="dreamWorkspace">
        <div class="workspace-head">
            <div>
                <p class="section-kicker">Selected Dream</p>
                <h2 id="dreamWorkspaceTitle">Select a dream</h2>
                <p class="workspace-copy" id="dreamWorkspaceMeta">Choose a dream card to inspect its history and progress trend.</p>
            </div>
            <div class="workspace-metrics">
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Progress</span>
                    <strong id="dreamWorkspaceProgress">--</strong>
                </div>
                <div class="workspace-metric">
                    <span class="workspace-metric-label">Entries</span>
                    <strong id="dreamWorkspaceEntries">--</strong>
                </div>
            </div>
        </div>
        <section class="entity-history-panel" id="dreamHistoryPanel" data-history-scope="dream" data-default-range="30d" data-entity-label="dream">
            <div class="entity-history-head">
                <div>
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
                        <h5>Calendar</h5>
                        <button type="button" class="btn-action btn-secondary history-log-trigger" disabled>Add Log</button>
                    </div>
                    <div class="heatmap-mount" data-role="heatmap">
                        <p class="panel-empty-copy">Select a dream to load its activity.</p>
                    </div>
                </section>
                <section class="analytics-panel">
                    <div class="analytics-panel-head">
                        <h5>Progress</h5>
                        <span class="analytics-caption">Manual progress snapshots.</span>
                    </div>
                    <div class="chart-mount" data-role="chart">
                        <p class="panel-empty-copy">Select a dream to load its progress timeline.</p>
                    </div>
                </section>
            </div>
            <div class="entity-history-feed" data-role="recent-feed">
                <p class="panel-empty-copy">Recent dream history will appear here once a dream is selected.</p>
            </div>
        </section>
    </section>
<?php endif; ?>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
