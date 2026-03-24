<?php
$pageId = 'logs';
$pageTitle = 'Activity Logs';
$activePage = 'logs';
$pageScripts = ['logs.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Audit Trail</p>
        <h1 id="title">Activity Logs</h1>
        <p class="page-summary">Review the raw operational record of logins, changes, and tracking actions across the workspace.</p>
    </div>
</header>
<?php if (!empty($logs)): ?>
<div class="log-filter-bar">
    <input type="search" id="logSearch" placeholder="Search logs…" aria-label="Search logs">
    <select id="logActionFilter" aria-label="Filter by action type">
        <option value="">All action types</option>
    </select>
</div>
<p class="log-filter-summary" id="logFilterSummary" aria-live="polite"></p>
<?php endif; ?>
<section class="logs-list">
    <?php if (empty($logs)): ?>
        <div class="empty-state">
            <p>No activity logs yet. New logins and goal, dream, and category changes will appear here.</p>
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
                    <?php
                        $rawDetails = $log['details'];
                        $parsed = json_decode($rawDetails, true);
                        $isJson = json_last_error() === JSON_ERROR_NONE && is_array($parsed);
                    ?>
                    <?php if ($isJson): ?>
                        <dl class="log-details-list">
                            <?php foreach ($parsed as $key => $value): ?>
                                <div class="log-detail-row">
                                    <dt><?= safe_output($key) ?></dt>
                                    <dd><?= safe_output(is_array($value) ? json_encode($value) : (string) $value) ?></dd>
                                </div>
                            <?php endforeach; ?>
                        </dl>
                    <?php else: ?>
                        <pre class="log-details"><?= safe_output($rawDetails) ?></pre>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
