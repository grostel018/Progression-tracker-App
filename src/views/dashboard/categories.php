<?php
$pageId = 'categories';
$pageTitle = 'Categories';
$activePage = 'categories';
$pageScripts = ['categories.js'];
include __DIR__ . '/../partials/dashboard-start.php';
?>
<header class="page-header">
    <div class="page-header-copy">
        <p class="page-kicker">Organization Layer</p>
        <h1 id="title">Categories</h1>
        <p class="page-summary">Define the buckets that shape your dream system and keep the workspace easy to scan.</p>
    </div>
    <button class="btn-primary add-btn" id="addCategoryBtn">+ New Category</button>
</header>
<section class="inline-composer" id="categoryComposer" hidden aria-label="Category form">
    <form class="composer-form composer-form-compact" id="categoryForm">
        <input type="hidden" id="categoryEditingId" name="editing_id" value="">
        <div class="inputs">
            <label for="categoryName">Category name</label>
            <input type="text" id="categoryName" name="name" maxlength="255" required>
        </div>
        <div class="composer-actions">
            <button type="submit" class="btn-primary">Save Category</button>
            <button type="button" class="btn-action btn-secondary" id="cancelCategoryBtn">Cancel</button>
        </div>
        <p class="form-message" id="categoryFormMessage" hidden aria-live="polite"></p>
    </form>
</section>
<section class="categories-grid" data-empty-message="No categories yet. Create a category to organize your dreams!" data-create-btn="addCategoryBtn" data-create-label="+ New Category">
    <?php if (empty($categories)): ?>
        <div class="empty-state">
            <p>No categories yet. Create a category to organize your dreams!</p>
            <button class="btn-action empty-cta-btn" data-trigger="addCategoryBtn">+ New Category</button>
        </div>
    <?php else: ?>
        <?php foreach ($categories as $category): ?>
            <div class="category-card" data-id="<?= (int) $category['id'] ?>" data-name="<?= safe_output($category['name']) ?>">
                <h3><?= safe_output($category['name']) ?></h3>
                <p class="category-meta">
                    <span>Created: <?= safe_output($category['created_at']) ?></span>
                </p>
                <p class="category-meta">
                    <span>Dreams: <?= (int) ($category['dream_count'] ?? 0) ?></span>
                </p>
                <div class="category-actions">
                    <button class="btn-action edit-category">Edit</button>
                    <button class="btn-action btn-secondary delete-category">Delete</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/../partials/dashboard-end.php'; ?>
