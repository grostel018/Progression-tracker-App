<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Progression Tracker</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script defer src="assets/js/auth.js"></script>
</head>
<body data-page="register">
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker overview">
            <div class="auth-copy">
                <p class="auth-kicker">secure node // onboarding</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-status-grid" aria-hidden="true">
                <div class="auth-status-item">
                    <span class="auth-status-label">Workspace</span>
                    <strong>Fresh Profile</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Modules</span>
                    <strong>Dreams / Goals / Logs</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Output</span>
                    <strong>Tracking Ready</strong>
                </div>
            </div>
        </section>
        <section class="auth-panel">
            <header class="auth-panel-header">
                <p class="auth-panel-label">Node Setup</p>
                <p class="auth-panel-copy">Create your workspace and start mapping dreams into measurable progress.</p>
            </header>
            <main class="auth-section">
                <form action="api/auth/register.php" method="POST" id="registerForm" novalidate>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" required>
                    </div>
                    <div class="inputs">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" placeholder="RostelG" required>
                    </div>
                    <div class="inputs">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" minlength="6" autocomplete="new-password" required>
                    </div>
                    <div class="inputs">
                        <label for="password2">Repeat Password</label>
                        <input type="password" id="password2" name="password2" minlength="6" autocomplete="new-password" required>
                    </div>
                    <div id="error" aria-live="polite"><?= isset($error) ? safe_output($error) : '' ?></div>
                    <button type="submit" class="btn-primary">&gt; Register</button>
                    <p class="register-text">
                        <strong>Already registered?</strong>
                        <a href="login.php">Return to login</a>
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
