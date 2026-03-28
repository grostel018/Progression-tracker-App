<?php
/** @var array $user */
/** @var string $pageId */
/** @var string $pageTitle */
/** @var string $activePage */
/** @var array<int, string> $pageScripts */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#040806">
    <title><?= safe_output($pageTitle) ?> - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/app.js')) ?>"></script>
    <script defer src="<?= safe_output(asset_url('assets/js/history.js')) ?>"></script>
    <?php foreach ($pageScripts ?? [] as $script): ?>
        <script defer src="<?= safe_output(asset_url('assets/js/' . $script)) ?>"></script>
    <?php endforeach; ?>
</head>
<body data-page="<?= safe_output($pageId) ?>" data-app-timezone="<?= safe_output((string) config('app.timezone', 'UTC')) ?>" data-csrf-token="<?= safe_output(csrf_token_value()) ?>">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="dashboard-container">
        <aside class="sidebar" aria-label="Workspace">
            <nav class="nav-menu" aria-label="Primary">
                <div class="user-info">
                    <span class="brand-mark">Progression Tracker</span>
                    <span class="username">Welcome, <?= safe_output($user['username']) ?></span>
                    <span class="user-presence">tracking node active</span>
                    <form action="logout.php" method="POST" class="logout-form">
                        <?= csrf_token_input() ?>
                        <button type="submit" class="mobile-logout-link">Exit Node</button>
                    </form>
                </div>
                <ul class="nav-list">
                    <li><a href="dashboard.php" class="nav-link<?= $activePage === 'dashboard' ? ' active' : '' ?>"<?= $activePage === 'dashboard' ? ' aria-current="page"' : '' ?>>Dashboard</a></li>
                    <li><a href="dreams.php" class="nav-link<?= $activePage === 'dreams' ? ' active' : '' ?>"<?= $activePage === 'dreams' ? ' aria-current="page"' : '' ?>>Dreams</a></li>
                    <li><a href="goals.php" class="nav-link<?= $activePage === 'goals' ? ' active' : '' ?>"<?= $activePage === 'goals' ? ' aria-current="page"' : '' ?>>Goals</a></li>
                    <li><a href="categories.php" class="nav-link<?= $activePage === 'categories' ? ' active' : '' ?>"<?= $activePage === 'categories' ? ' aria-current="page"' : '' ?>>Categories</a></li>
                    <li><a href="logs.php" class="nav-link<?= $activePage === 'logs' ? ' active' : '' ?>"<?= $activePage === 'logs' ? ' aria-current="page"' : '' ?>>Weekly Review</a></li>
                </ul>
                <div class="nav-bottom">
                    <form action="logout.php" method="POST" class="logout-form">
                        <?= csrf_token_input() ?>
                        <button type="submit" class="nav-link logout">Exit Node</button>
                    </form>
                </div>
            </nav>
        </aside>
        <main class="main-content" id="main-content" tabindex="-1">
            <div class="page-feedback" id="pageFeedback" role="status" hidden aria-live="polite"></div>

