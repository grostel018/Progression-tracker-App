<?php
$pageId = 'goals';
$pageTitle = 'My Goals';
$activePage = 'goals';
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <h1 id="title">My Goals</h1>
    <button class="btn-primary add-btn" id="addGoalBtn">+ New Goal</button>
</header>
<section class="goals-list">
    <?php if (empty($goals)): ?>
        <div class="empty-state">
            <p>No goals yet. Create a goal to track your progress!</p>
        </div>
    <?php else: ?>
        <?php foreach ($goals as $goal): ?>
            <div class="goal-card" data-id="<?= (int) $goal['id'] ?>">
                <div class="goal-header">
                    <h3><?= safe_output($goal['title']) ?></h3>
                    <div class="goal-info">
                        <span class="goal-type"><?= safe_output($goal['goal_type']) ?></span>
                        <span class="status-badge status-<?= safe_output($goal['status']) ?>"><?= safe_output($goal['status']) ?></span>
                    </div>
                </div>
                <p class="goal-dream">in <?= safe_output($goal['dream_title']) ?></p>
                <?php if (!empty($goal['description'])): ?>
                    <p class="goal-description"><?= safe_output($goal['description']) ?></p>
                <?php endif; ?>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: <?= (int) ($goal['progress_percent'] ?? 0) ?>%"></div>
                </div>
                <div class="goal-meta">
                    <span class="meta-item">Start: <?= safe_output($goal['start_date']) ?></span>
                    <?php if (!empty($goal['estimated_finish_date'])): ?>
                        <span class="meta-item">Target: <?= safe_output($goal['estimated_finish_date']) ?></span>
                    <?php endif; ?>
                </div>
                <div class="goal-actions">
                    <button class="btn-action delete-goal">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
