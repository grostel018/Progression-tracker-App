<?php /** @var string|null $error */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Progression Tracker</title>
    <link rel="stylesheet" href="<?= safe_output(asset_url('assets/css/style.css')) ?>">
    <script defer src="<?= safe_output(asset_url('assets/js/auth.js')) ?>"></script>
</head>
<body data-page="forgot">
    <div class="container auth-shell">
        <section class="auth-intro" aria-label="Progression Tracker recovery">
            <div class="auth-copy">
                <p class="auth-kicker">recovery tunnel // credential reset</p>
                <h1 id="title" class="auth-title"></h1>
                <p id="subtitle" class="auth-subtitle"></p>
            </div>
            <div class="auth-console" aria-hidden="true">
                <div class="auth-console-bar">
                    <span>node://recovery</span>
                    <span>guided reset</span>
                </div>
                <ul class="auth-console-feed">
                    <li>
                        <span class="auth-console-index">01</span>
                        <span class="auth-console-text">enter account email</span>
                        <span class="auth-console-state">check</span>
                    </li>
                    <li>
                        <span class="auth-console-index">02</span>
                        <span class="auth-console-text">verify recovery answers</span>
                        <span class="auth-console-state">pending</span>
                    </li>
                    <li>
                        <span class="auth-console-index">03</span>
                        <span class="auth-console-text">set new password</span>
                        <span class="auth-console-state">prepared</span>
                    </li>
                </ul>
            </div>
            <div class="auth-status-grid" aria-hidden="true">
                <div class="auth-status-item">
                    <span class="auth-status-label">Recovery</span>
                    <strong>Three-Step Reset</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Route</span>
                    <strong>Email + Answers</strong>
                </div>
                <div class="auth-status-item">
                    <span class="auth-status-label">Access</span>
                    <strong>New Password</strong>
                </div>
            </div>
        </section>
        <section class="auth-panel">
            <header class="auth-panel-header">
                <p class="auth-panel-label">Recovery Console</p>
                <p class="auth-panel-copy">Start with the account email, verify the saved recovery answers, then create a new password.</p>
            </header>
            <main class="auth-section">
                <form action="api/auth/forgot.php" method="POST" id="forgotForm" novalidate>
                    <ol class="recovery-steps" id="recoverySteps" aria-label="Password recovery steps">
                        <li class="recovery-step is-active" data-stage="email">
                            <span class="recovery-step-index">01</span>
                            <div class="recovery-step-copy">
                                <strong>Account</strong>
                                <span>Enter the email tied to the account.</span>
                            </div>
                        </li>
                        <li class="recovery-step" data-stage="questions">
                            <span class="recovery-step-index">02</span>
                            <div class="recovery-step-copy">
                                <strong>Verification</strong>
                                <span>Answer the recovery questions exactly as saved.</span>
                            </div>
                        </li>
                        <li class="recovery-step" data-stage="reset">
                            <span class="recovery-step-index">03</span>
                            <div class="recovery-step-copy">
                                <strong>Password</strong>
                                <span>Choose and confirm a new password.</span>
                            </div>
                        </li>
                    </ol>
                    <p class="forgot-description" id="forgotDescription">
                        Enter the account email to begin recovery.
                    </p>
                    <div class="inputs">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="example@mail.com" autocomplete="email" inputmode="email" maxlength="254" aria-describedby="email-feedback" required>
                        <p class="input-feedback" id="email-feedback" data-feedback-for="email" aria-live="polite"></p>
                    </div>
                    <section class="forgot-step forgot-step-hidden" id="securityChallengeStep" aria-live="polite" hidden>
                        <p class="security-note">Answer both questions exactly as you set them during registration.</p>
                        <div id="securityChallengeFields"></div>
                    </section>
                    <section class="forgot-step forgot-step-hidden" id="resetPasswordStep" aria-live="polite" hidden>
                        <div class="inputs">
                            <label for="reset_password">New Password</label>
                            <input type="password" id="reset_password" name="reset_password" minlength="6" maxlength="72" autocomplete="new-password" aria-describedby="reset_password-feedback" disabled>
                            <p class="input-feedback" id="reset_password-feedback" aria-live="polite"></p>
                        </div>
                        <div class="inputs">
                            <label for="reset_password_confirm">Repeat New Password</label>
                            <input type="password" id="reset_password_confirm" name="reset_password_confirm" minlength="6" maxlength="72" autocomplete="new-password" aria-describedby="reset_password_confirm-feedback" disabled>
                            <p class="input-feedback" id="reset_password_confirm-feedback" aria-live="polite"></p>
                        </div>
                    </section>
                    <div id="error" aria-live="polite"><?= isset($error) ? safe_output($error) : '' ?></div>
                    <div id="success" aria-live="polite"></div>
                    <div class="auth-actions">
                        <button type="button" class="btn-action btn-secondary step-back-btn" id="forgotBackButton" hidden>&gt; Change Email</button>
                        <button type="submit" class="btn-primary" id="forgotSubmitButton">&gt; Continue</button>
                    </div>
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
