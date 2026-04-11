<?php
$pageId = 'logs';
$pageTitle = 'Activity Logs';
$activePage = 'logs';
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <h1 id="title">Activity Logs</h1>
</header>
<section class="logs-list">
    <?php if (empty($logs)): ?>
        <div class="empty-state">
            <p>No activity logs yet. This page will populate after you create the `activity_logs` table or start recording actions.</p>
        </div>
    <?php else: ?>
        <?php foreach ($logs as $log): ?>
            <div class="log-card">
                <div class="log-header">
                    <span class="log-action"><?= safe_output($log['action']) ?></span>
                    <span class="log-time"><?= safe_output($log['created_at']) ?></span>
                </div>
                <?php if (!empty($log['target_type'])): ?>
                    <p class="log-target">
                        Target: <span><?= safe_output($log['target_type']) ?></span>
                        <?php if (!empty($log['target_id'])): ?>
                            (ID: <?= (int) $log['target_id'] ?>)
                        <?php endif; ?>
                    </p>
                <?php endif; ?>
                <?php if (!empty($log['details'])): ?>
                    <pre class="log-details"><?= safe_output($log['details']) ?></pre>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
