<?php /** @var string $token */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#040806">
    <title>Set New Password - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/auth.js')) ?>"></script>
</head>
<body data-page="reset" data-csrf-token="<?= safe_output(csrf_token_value()) ?>">
    <a class="skip-link" href="#auth-main">Skip to reset form</a>
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker reset">
            <div class="auth-copy">
                <p class="auth-kicker">credential rotation // secure handoff</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-console" aria-hidden="true">
                <div class="auth-console-bar">
                    <span>node://reset</span>
                    <span>token relay</span>
                </div>
                <ul class="auth-console-feed">
                    <li>
                        <span class="auth-console-index">01</span>
                        <span class="auth-console-text">validate one-time link</span>
                        <span class="auth-console-state">active</span>
                    </li>
                    <li>
                        <span class="auth-console-index">02</span>
                        <span class="auth-console-text">rotate account password</span>
                        <span class="auth-console-state">ready</span>
                    </li>
                </ul>
            </div>
        </section>
        <section class="auth-panel">
            <header class="auth-panel-header">
                <p class="auth-panel-label">Reset Console</p>
                <p class="auth-panel-copy">Choose a strong new password. The reset link can be used only once.</p>
            </header>
            <main class="auth-section" id="auth-main" tabindex="-1">
                <form action="api/auth/reset-password.php" method="POST" id="resetPasswordForm" novalidate>
                    <?= csrf_token_input() ?>
                    <input type="hidden" id="reset_token" name="token" value="<?= safe_output($token) ?>">
                    <div class="inputs">
                        <label for="password">New Password</label>
                        <input type="password" id="password" name="password" minlength="10" maxlength="72" autocomplete="new-password" aria-describedby="password-feedback" required>
                        <p class="input-feedback" id="password-feedback" aria-live="polite"></p>
                    </div>
                    <div class="inputs">
                        <label for="password_confirm">Repeat New Password</label>
                        <input type="password" id="password_confirm" name="password_confirm" minlength="10" maxlength="72" autocomplete="new-password" aria-describedby="password_confirm-feedback" required>
                        <p class="input-feedback" id="password_confirm-feedback" aria-live="polite"></p>
                    </div>
                    <div id="error" aria-live="polite"></div>
                    <div id="success" aria-live="polite"></div>
                    <button type="submit" class="btn-primary">&gt; Save New Password</button>
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
