<?php
$pageId = 'dreams';
$pageTitle = 'My Dreams';
$activePage = 'dreams';
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <h1 id="title">My Dreams</h1>
    <button class="btn-primary add-btn" id="addDreamBtn">+ New Dream</button>
</header>
<section class="dreams-grid">
    <?php if (empty($dreams)): ?>
        <div class="empty-state">
            <p>No dreams yet. Start by creating your first dream!</p>
        </div>
    <?php else: ?>
        <?php foreach ($dreams as $dream): ?>
            <div class="dream-card" data-id="<?= (int) $dream['id'] ?>">
                <div class="dream-header">
                    <h3><?= safe_output($dream['title']) ?></h3>
                    <span class="status-badge status-<?= safe_output($dream['status']) ?>"><?= safe_output($dream['status']) ?></span>
                </div>
                <?php if (!empty($dream['description'])): ?>
                    <p class="dream-description"><?= safe_output($dream['description']) ?></p>
                <?php endif; ?>
                <div class="dream-meta">
                    <span class="meta-item">Start: <?= safe_output((string) ($dream['start_date'] ?? '')) ?></span>
                    <?php if (!empty($dream['estimated_finish_date'])): ?>
                        <span class="meta-item">Target: <?= safe_output($dream['estimated_finish_date']) ?></span>
                    <?php endif; ?>
                </div>
                <div class="dream-actions">
                    <button class="btn-action delete-dream">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
