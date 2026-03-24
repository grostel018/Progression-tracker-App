<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#040806">
    <title>Register - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/auth.js')) ?>"></script>
</head>
<body data-page="register">
    <a class="skip-link" href="#auth-main">Skip to registration form</a>
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker overview">
            <div class="auth-copy">
                <p class="auth-kicker">bootstrap // new node</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-console" aria-hidden="true">
                <div class="auth-console-bar">
                    <span>node://provision</span>
                    <span>init stream</span>
                </div>
                <ul class="auth-console-feed">
                    <li>
                        <span class="auth-console-index">01</span>
                        <span class="auth-console-text">identity scaffold</span>
                        <span class="auth-console-state">pending</span>
                    </li>
                    <li>
                        <span class="auth-console-index">02</span>
                        <span class="auth-console-text">tracker modules</span>
                        <span class="auth-console-state">online</span>
                    </li>
                    <li>
                        <span class="auth-console-index">03</span>
                        <span class="auth-console-text">profile encryption</span>
                        <span class="auth-console-state">ready</span>
                    </li>
                    <li>
                        <span class="auth-console-index">04</span>
                        <span class="auth-console-text">first session launch</span>
                        <span class="auth-console-state">standby</span>
                    </li>
                </ul>
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
                <p class="auth-panel-label">Provision Console</p>
                <p class="auth-panel-copy">Create your workspace, secure the node, and start logging measurable progress from day one.</p>
            </header>
            <main class="auth-section" id="auth-main" tabindex="-1">
                <form action="api/auth/register.php" method="POST" id="registerForm" novalidate>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" inputmode="email" maxlength="254" aria-describedby="email-feedback" required>
                        <p class="input-feedback" id="email-feedback" data-feedback-for="email" aria-live="polite"></p>
                    </div>
                    <div class="inputs">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" placeholder="RostelG" minlength="3" maxlength="32" pattern="[A-Za-z0-9_-]+" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="username-feedback" required>
                        <p class="input-feedback" id="username-feedback" data-feedback-for="username" aria-live="polite"></p>
                    </div>
                    <div class="inputs">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" minlength="6" maxlength="72" autocomplete="new-password" aria-describedby="password-feedback" required>
                        <p class="input-feedback" id="password-feedback" data-feedback-for="password" aria-live="polite"></p>
                    </div>
                    <div class="inputs">
                        <label for="password2">Repeat Password</label>
                        <input type="password" id="password2" name="password2" minlength="6" maxlength="72" autocomplete="new-password" aria-describedby="password2-feedback" required>
                        <p class="input-feedback" id="password2-feedback" data-feedback-for="password2" aria-live="polite"></p>
                    </div>
                    <section class="security-questions" aria-label="Security questions for password recovery">
                        <h3>Security Questions (Optional)</h3>
                        <p class="security-note">Set up 2 security questions to recover your password without email verification.</p>
                        <div class="security-question-group">
                            <label for="security_question_1">Question 1</label>
                            <select id="security_question_1" name="security_questions[]" aria-describedby="security_question_1-feedback">
                                <option value="">-- Select a question --</option>
                            </select>
                            <input type="text" id="security_answer_1" name="security_answers[]" placeholder="Your answer" maxlength="255" autocomplete="off">
                            <p class="input-feedback" id="security_question_1-feedback" aria-live="polite"></p>
                        </div>
                        <div class="security-question-group">
                            <label for="security_question_2">Question 2</label>
                            <select id="security_question_2" name="security_questions[]" aria-describedby="security_question_2-feedback">
                                <option value="">-- Select a question --</option>
                            </select>
                            <input type="text" id="security_answer_2" name="security_answers[]" placeholder="Your answer" maxlength="255" autocomplete="off">
                            <p class="input-feedback" id="security_question_2-feedback" aria-live="polite"></p>
                        </div>
                    </section>
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
