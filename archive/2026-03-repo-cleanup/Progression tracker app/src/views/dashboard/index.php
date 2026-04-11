<?php
$pageId = 'dashboard';
$pageTitle = 'Dashboard';
$activePage = 'dashboard';
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <h1 id="title">Dashboard</h1>
</header>
<section class="stats-grid">
    <div class="stat-card">
        <span class="stat-label">Total Dreams</span>
        <span class="stat-value" id="total-dreams"><?= (int) $stats['total_dreams'] ?></span>
    </div>
    <div class="stat-card">
        <span class="stat-label">Active Goals</span>
        <span class="stat-value" id="active-goals"><?= (int) $stats['active_goals'] ?></span>
    </div>
    <div class="stat-card">
        <span class="stat-label">Current Streak</span>
        <span class="stat-value" id="current-streak"><?= (int) $stats['current_streak'] ?></span>
        <span class="stat-unit">days</span>
    </div>
    <div class="stat-card">
        <span class="stat-label">Achievements</span>
        <span class="stat-value" id="achievements"><?= (int) $stats['achievements'] ?></span>
    </div>
</section>
<section class="dashboard-content">
    <div class="panel">
        <h2>Your Progress Overview</h2>
        <div id="progress-chart">
            <p>Use the navigation to manage categories, dreams, and goals.</p>
        </div>
    </div>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
