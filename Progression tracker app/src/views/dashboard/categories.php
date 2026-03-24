<?php
$pageId = 'categories';
$pageTitle = 'Categories';
$activePage = 'categories';
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <h1 id="title">Categories</h1>
    <button class="btn-primary add-btn" id="addCategoryBtn">+ New Category</button>
</header>
<section class="categories-grid">
    <?php if (empty($categories)): ?>
        <div class="empty-state">
            <p>No categories yet. Create a category to organize your dreams!</p>
        </div>
    <?php else: ?>
        <?php foreach ($categories as $category): ?>
            <div class="category-card" data-id="<?= (int) $category['id'] ?>">
                <h3><?= safe_output($category['name']) ?></h3>
                <p class="category-meta">
                    <span>Created: <?= safe_output($category['created_at']) ?></span>
                </p>
                <p class="category-meta">
                    <span>Dreams: <?= (int) ($category['dream_count'] ?? 0) ?></span>
                </p>
                <div class="category-actions">
                    <button class="btn-action delete-category">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
