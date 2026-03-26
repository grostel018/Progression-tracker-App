<?php
$pageId = 'logs';
$pageTitle = 'Weekly Review';
$activePage = 'logs';
$pageScripts = ['weekly-review.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Weekly Review</p>
        <h1 id="title">Last 7 Days</h1>
        <p class="page-summary">Review what moved this week, where momentum showed up, and which goals or dreams need attention before the next cycle starts.</p>
    </div>
    <div class="page-header-actions">
        <a href="dreams.php" class="btn-action btn-secondary">Open Dreams</a>
        <a href="goals.php" class="btn-primary">Open Goals</a>
    </div>
</header>
<section class="stats-grid">
    <div class="stat-card stat-card-streak">
        <span class="stat-icon" aria-hidden="true">◼</span>
        <span class="stat-label">Active Days</span>
        <div class="stat-value-row">
            <span class="stat-value" id="weeklyReviewActiveDays">--</span>
            <span class="stat-meta">of 7</span>
        </div>
        <p class="stat-copy">Days this week with at least one visible entry in your history.</p>
    </div>
    <div class="stat-card stat-card-goals">
        <span class="stat-icon" aria-hidden="true">◆</span>
        <span class="stat-label">Entries Logged</span>
        <div class="stat-value-row">
            <span class="stat-value" id="weeklyReviewEntries">--</span>
            <span class="stat-meta">Events</span>
        </div>
        <p class="stat-copy">All tracked task completions, habit actions, and manual updates recorded in the last week.</p>
    </div>
    <div class="stat-card stat-card-achievements">
        <span class="stat-icon" aria-hidden="true">✓</span>
        <span class="stat-label">Task Wins</span>
        <div class="stat-value-row">
            <span class="stat-value" id="weeklyReviewTaskWins">--</span>
            <span class="stat-meta">Completed</span>
        </div>
        <p class="stat-copy">Concrete tasks finished this week across your tracked goals.</p>
    </div>
    <div class="stat-card stat-card-dreams">
        <span class="stat-icon" aria-hidden="true">◈</span>
        <span class="stat-label">Habit Check-Ins</span>
        <div class="stat-value-row">
            <span class="stat-value" id="weeklyReviewHabitWins">--</span>
            <span class="stat-meta">Actions</span>
        </div>
        <p class="stat-copy">Repeatable actions recorded across the habits that are currently in motion.</p>
    </div>
    <div class="stat-card stat-card-goals">
        <span class="stat-icon" aria-hidden="true">↗</span>
        <span class="stat-label">Progress Shift</span>
        <div class="stat-value-row">
            <span class="stat-value" id="weeklyReviewProgressShift">--</span>
            <span class="stat-meta">Net</span>
        </div>
        <p class="stat-copy">Change across recorded progress snapshots during the current 7-day review window.</p>
    </div>
</section>
<section class="dashboard-content">
    <div class="panel analytics-shell dashboard-history-shell" id="weeklyReviewHistory" data-history-scope="dashboard" data-default-range="week">
        <div class="analytics-head">
            <div class="analytics-head-copy">
                <p class="section-kicker">Review Window</p>
                <h2>Weekly Activity</h2>
                <p id="weeklyReviewRangeCopy">Loading the last seven days of movement…</p>
            </div>
            <button type="button" class="btn-action btn-secondary history-log-trigger">Add Entry</button>
        </div>
        <div class="analytics-grid">
            <section class="analytics-panel">
                <div class="analytics-panel-head">
                    <div class="analytics-panel-copy">
                        <h3>Weekly Calendar</h3>
                        <span class="analytics-caption">Day-by-day density across goals and dreams.</span>
                    </div>
                </div>
                <div class="heatmap-mount" data-role="heatmap">
                    <p class="panel-empty-copy">Loading weekly activity…</p>
                </div>
            </section>
            <section class="analytics-panel">
                <div class="analytics-panel-head">
                    <div class="analytics-panel-copy">
                        <h3>Progress Trend</h3>
                        <span class="analytics-caption">Average recorded progress snapshots during this review cycle.</span>
                    </div>
                </div>
                <div class="chart-mount" data-role="chart">
                    <p class="panel-empty-copy">Loading weekly progress trend…</p>
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
<section class="weekly-review-grid">
    <article class="tracking-card weekly-review-card">
        <div class="tracking-card-head">
            <div class="tracking-card-copy">
                <p class="section-kicker">Wins</p>
                <h4>Top Movers</h4>
            </div>
        </div>
        <div class="history-feed-list" id="weeklyReviewWins">
            <p class="panel-empty-copy">Loading the strongest moves from this week…</p>
        </div>
    </article>
    <article class="tracking-card weekly-review-card">
        <div class="tracking-card-head">
            <div class="tracking-card-copy">
                <p class="section-kicker">Misses</p>
                <h4>Needs Attention</h4>
            </div>
        </div>
        <div class="history-feed-list" id="weeklyReviewMisses">
            <p class="panel-empty-copy">Checking which items went quiet this week…</p>
        </div>
    </article>
    <article class="tracking-card weekly-review-card">
        <div class="tracking-card-head">
            <div class="tracking-card-copy">
                <p class="section-kicker">Readout</p>
                <h4>Momentum Notes</h4>
            </div>
        </div>
        <div class="weekly-review-notes" id="weeklyReviewNotes">
            <p class="panel-empty-copy">Building the weekly readout…</p>
        </div>
    </article>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
