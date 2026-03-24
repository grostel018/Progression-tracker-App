<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#040806">
    <title>Login - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/auth.js')) ?>"></script>
</head>
<body data-page="login">
    <a class="skip-link" href="#auth-main">Skip to sign in form</a>
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker overview">
            <div class="auth-copy">
                <p class="auth-kicker">root access // active node</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-console" aria-hidden="true">
                <div class="auth-console-bar">
                    <span>node://access</span>
                    <span>live relay</span>
                </div>
                <ul class="auth-console-feed">
                    <li>
                        <span class="auth-console-index">01</span>
                        <span class="auth-console-text">checkpoint resume route</span>
                        <span class="auth-console-state">armed</span>
                    </li>
                    <li>
                        <span class="auth-console-index">02</span>
                        <span class="auth-console-text">dream and goal sync</span>
                        <span class="auth-console-state">clean</span>
                    </li>
                    <li>
                        <span class="auth-console-index">03</span>
                        <span class="auth-console-text">credential relay</span>
                        <span class="auth-console-state">await</span>
                    </li>
                    <li>
                        <span class="auth-console-index">04</span>
                        <span class="auth-console-text">session retention</span>
                        <span class="auth-console-state">30d opt</span>
                    </li>
                </ul>
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
                <p class="auth-panel-label">Access Console</p>
                <p class="auth-panel-copy">Authenticate once, restore the latest checkpoint, and continue tracking without breaking flow.</p>
            </header>
            <main class="auth-section" id="auth-main" tabindex="-1">
                <form action="api/auth/login.php" method="POST" id="loginForm" novalidate>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" inputmode="email" maxlength="254" aria-describedby="email-feedback" required>
                        <p class="input-feedback" id="email-feedback" data-feedback-for="email" aria-live="polite"></p>
                    </div>
                    <div class="inputs">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" minlength="6" maxlength="72" autocomplete="current-password" aria-describedby="password-feedback" required>
                        <p class="input-feedback" id="password-feedback" data-feedback-for="password" aria-live="polite"></p>
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
