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
                <p class="auth-kicker">recovery tunnel // secure node</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-console" aria-hidden="true">
                <div class="auth-console-bar">
                    <span>node://recovery</span>
                    <span>mail route</span>
                </div>
                <ul class="auth-console-feed">
                    <li>
                        <span class="auth-console-index">01</span>
                        <span class="auth-console-text">verified inbox route</span>
                        <span class="auth-console-state">check</span>
                    </li>
                    <li>
                        <span class="auth-console-index">02</span>
                        <span class="auth-console-text">reset token handoff</span>
                        <span class="auth-console-state">pending</span>
                    </li>
                    <li>
                        <span class="auth-console-index">03</span>
                        <span class="auth-console-text">session locks</span>
                        <span class="auth-console-state">paused</span>
                    </li>
                    <li>
                        <span class="auth-console-index">04</span>
                        <span class="auth-console-text">return path</span>
                        <span class="auth-console-state">prepared</span>
                    </li>
                </ul>
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
                <p class="auth-panel-label">Recovery Console</p>
                <p class="auth-panel-copy">Request a reset route, verify the inbox, and restore access to your progress workspace.</p>
            </header>
            <main class="auth-section">
                <form action="api/auth/forgot.php" method="POST" id="forgotForm" novalidate>
                    <p class="forgot-description">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" inputmode="email" maxlength="254" aria-describedby="email-feedback" required>
                        <p class="input-feedback" id="email-feedback" data-feedback-for="email" aria-live="polite"></p>
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
