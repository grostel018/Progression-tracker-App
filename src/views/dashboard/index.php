<?php
$pageId = 'dashboard';
$pageTitle = 'Dashboard';
$activePage = 'dashboard';
$pageScripts = ['dashboard.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Command Center</p>
        <h1 id="title">Dashboard</h1>
        <p class="page-summary">Monitor activity density, current momentum, and the next parts of the workspace that need attention.</p>
    </div>
    <div class="page-header-actions">
        <a href="dreams.php" class="btn-action btn-secondary">Review Dreams</a>
        <a href="goals.php" class="btn-primary">Open Goals</a>
    </div>
</header>
<section class="stats-grid">
    <div class="stat-card stat-card-dreams">
        <span class="stat-icon" aria-hidden="true">◈</span>
        <span class="stat-label">Total Dreams</span>
        <div class="stat-value-row">
            <span class="stat-value" id="total-dreams"><?= (int) $stats['total_dreams'] ?></span>
            <span class="stat-meta">Vision Backlog</span>
        </div>
        <p class="stat-copy">Long-range ambitions currently tracked across the workspace.</p>
    </div>
    <div class="stat-card stat-card-goals">
        <span class="stat-icon" aria-hidden="true">◆</span>
        <span class="stat-label">Active Goals</span>
        <div class="stat-value-row">
            <span class="stat-value" id="active-goals"><?= (int) $stats['active_goals'] ?></span>
            <span class="stat-meta">In Motion</span>
        </div>
        <p class="stat-copy">Operational targets with live tasks, habits, or recent updates.</p>
    </div>
    <div class="stat-card stat-card-streak">
        <span class="stat-icon" aria-hidden="true">▲</span>
        <span class="stat-label">Current Streak</span>
        <div class="stat-value-row">
            <span class="stat-value" id="current-streak"><?= (int) $stats['current_streak'] ?></span>
            <span class="stat-meta">Days</span>
        </div>
        <p class="stat-copy">Continuous days with visible progress recorded in the system.</p>
    </div>
    <div class="stat-card stat-card-achievements">
        <span class="stat-icon" aria-hidden="true">★</span>
        <span class="stat-label">Achievements</span>
        <div class="stat-value-row">
            <span class="stat-value" id="achievements"><?= (int) $stats['achievements'] ?></span>
            <span class="stat-meta">Milestones</span>
        </div>
        <p class="stat-copy">Completed moments the workspace has already converted into proof.</p>
    </div>
</section>
<section class="dashboard-content">
    <div class="panel analytics-shell dashboard-history-shell" id="dashboardHistory" data-history-scope="dashboard" data-default-range="year">
        <div class="analytics-head">
            <div class="analytics-head-copy">
                <p class="section-kicker">History</p>
                <h2>Activity Overview</h2>
                <p>Daily activity across goals and dreams, with progress snapshots over time.</p>
            </div>
            <div class="history-range-switch" data-range-switch role="group" aria-label="Activity time range">
                <button type="button" class="range-chip" data-range="week">Week</button>
                <button type="button" class="range-chip" data-range="month">Month</button>
                <button type="button" class="range-chip is-active" data-range="year">Year</button>
            </div>
        </div>
        <div class="analytics-grid">
            <section class="analytics-panel">
                <div class="analytics-panel-head">
                    <div class="analytics-panel-copy">
                        <h3>Activity Calendar</h3>
                    </div>
                    <button type="button" class="btn-action btn-secondary history-log-trigger">Add Entry</button>
                </div>
                <div class="heatmap-mount" data-role="heatmap">
                    <p class="panel-empty-copy">Loading activity density…</p>
                </div>
            </section>
            <section class="analytics-panel">
                <div class="analytics-panel-head">
                    <div class="analytics-panel-copy">
                        <h3>Progress Trend</h3>
                        <span class="analytics-caption">Average snapshot trend across tracked items.</span>
                    </div>
                </div>
                <div class="chart-mount" data-role="chart">
                    <p class="panel-empty-copy">Loading progress trend…</p>
                </div>
            </section>
        </div>
        <div class="analytics-summary-grid">
            <article class="analytics-summary-card" data-role="goals-summary"></article>
            <article class="analytics-summary-card" data-role="dreams-summary"></article>
            <article class="analytics-summary-card analytics-feed-card" data-role="recent-feed"></article>
        </div>
    </div>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
