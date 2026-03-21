<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Progression Tracker</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script defer src="assets/js/auth.js"></script>
</head>
<body data-page="forgot">
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker recovery">
            <div class="auth-copy">
                <p class="auth-kicker">secure node // recovery</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-status-grid" aria-hidden="true">
                <div class="auth-status-item">
                    <span class="auth-status-label">Recovery</span>
                    <strong>Mail Link</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Route</span>
                    <strong>Verified Inbox</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Access</span>
                    <strong>Restore Session</strong>
                </div>
            </div>
        </section>
        <section class="auth-panel">
            <header class="auth-panel-header">
                <p class="auth-panel-label">Recovery Access</p>
                <p class="auth-panel-copy">Request a reset link and restore access to your progress workspace.</p>
            </header>
            <main class="auth-section">
                <form action="api/auth/forgot.php" method="POST" id="forgotForm" novalidate>
                    <p class="forgot-description">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" required>
                    </div>
                    <div id="error" aria-live="polite"><?= isset($error) ? safe_output($error) : '' ?></div>
                    <div id="success" aria-live="polite"></div>
                    <button type="submit" class="btn-primary">&gt; Send Reset Link</button>
                    <p class="register-text">
                        <a href="login.php">Back to login</a>
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
