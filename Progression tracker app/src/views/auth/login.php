<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Progression Tracker</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script defer src="assets/js/auth.js"></script>
</head>
<body data-page="login">
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker overview">
            <div class="auth-copy">
                <p class="auth-kicker">secure node // progress workspace</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-status-grid" aria-hidden="true">
                <div class="auth-status-item">
                    <span class="auth-status-label">Session</span>
                    <strong>Encrypted</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Sync</span>
                    <strong>Dreams / Goals</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Mode</span>
                    <strong>Checkpoint Resume</strong>
                </div>
            </div>
        </section>
        <section class="auth-panel">
            <header class="auth-panel-header">
                <p class="auth-panel-label">Auth Access</p>
                <p class="auth-panel-copy">Resume active tracking and continue from the latest checkpoint.</p>
            </header>
            <main class="auth-section">
                <form action="api/auth/login.php" method="POST" id="loginForm" novalidate>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" required>
                    </div>
                    <div class="inputs">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" minlength="6" autocomplete="current-password" required>
                    </div>
                    <div class="form-options">
                        <label class="terminal-checkbox">
                            <input type="checkbox" name="remember">
                            <span class="checkmark"></span>
                            Remember for 30 days
                        </label>
                        <a href="forgot.php" class="forgot-link">Forgot password?</a>
                    </div>
                    <div id="error" aria-live="polite"><?= isset($error) ? safe_output($error) : '' ?></div>
                    <button type="submit" class="btn-primary">&gt; Login</button>
                    <p class="register-text">
                        <strong>New user?</strong>
                        <a href="register.php">Create an account</a>
                    </p>
                </form>
            </main>
            <footer class="auth-footer">
                <p>&copy; 2026 Rostel Ebele GENI NDOUDI. All rights reserved.</p>
            </footer>
        </section>
    </div>
</body>
</html>
