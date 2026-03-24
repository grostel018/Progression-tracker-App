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
    <title><?= safe_output($pageTitle) ?> - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/app.js')) ?>"></script>
    <script defer src="<?= safe_output(asset_url('assets/js/history.js')) ?>"></script>
    <?php foreach ($pageScripts ?? [] as $script): ?>
        <script defer src="<?= safe_output(asset_url('assets/js/' . $script)) ?>"></script>
    <?php endforeach; ?>
</head>
<body data-page="<?= safe_output($pageId) ?>">
    <div class="dashboard-container">
        <aside class="sidebar">
            <nav class="nav-menu">
                <div class="user-info">
                    <span class="brand-mark">Progression Tracker</span>
                    <span class="username">Welcome, <?= safe_output($user['username']) ?></span>
                    <span class="user-presence">tracking node active</span>
                    <a href="logout.php" class="mobile-logout-link">Exit Node</a>
                </div>
                <ul class="nav-list">
                    <li><a href="dashboard.php" class="nav-link<?= $activePage === 'dashboard' ? ' active' : '' ?>">Dashboard</a></li>
                    <li><a href="dreams.php" class="nav-link<?= $activePage === 'dreams' ? ' active' : '' ?>">Dreams</a></li>
                    <li><a href="goals.php" class="nav-link<?= $activePage === 'goals' ? ' active' : '' ?>">Goals</a></li>
                    <li><a href="categories.php" class="nav-link<?= $activePage === 'categories' ? ' active' : '' ?>">Categories</a></li>
                    <li><a href="logs.php" class="nav-link<?= $activePage === 'logs' ? ' active' : '' ?>">Logs</a></li>
                </ul>
                <div class="nav-bottom">
                    <a href="logout.php" class="nav-link logout">Exit Node</a>
                </div>
            </nav>
        </aside>
        <main class="main-content">
            <div class="page-feedback" id="pageFeedback" hidden aria-live="polite"></div>
