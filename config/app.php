<?php
/**
 * Application Configuration
 */

$appEnv = getenv('APP_ENV') ?: 'development';
$appUrl = getenv('APP_URL') ?: 'http://localhost';
$sessionSecure = getenv('SESSION_SECURE');
$mailTransport = getenv('MAIL_TRANSPORT') ?: ($appEnv === 'production' ? 'mail' : 'log');
$mailFrom = getenv('MAIL_FROM') ?: 'no-reply@progression-tracker.local';
$mailFromName = getenv('MAIL_FROM_NAME') ?: 'Progression Tracker';

if ($sessionSecure === false || $sessionSecure === '') {
    $sessionSecure = $appEnv === 'production' ? true : 'auto';
} else {
    $normalizedSessionSecure = filter_var($sessionSecure, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    $sessionSecure = $normalizedSessionSecure ?? 'auto';
}

return [
    'env' => $appEnv,
    'app_name' => 'Progression Tracker',
    'app_url' => rtrim($appUrl, '/'),
    'timezone' => 'UTC',

    // Session settings
    'session' => [
        'name' => 'pt_session',
        'lifetime' => 2592000,  // 30 days
        'path' => '/',
        'domain' => '',
        'secure' => $sessionSecure,
        'httponly' => true,
        'samesite' => 'Lax',
    ],

    // Password settings
    'password' => [
        'min_length' => 10,
        'algorithm' => PASSWORD_ARGON2ID,
    ],

    'mail' => [
        'transport' => $mailTransport,
        'from_address' => $mailFrom,
        'from_name' => $mailFromName,
        'log_path' => BASE_PATH . '/var/logs/password-reset.log',
    ],

    // Upload settings
    'uploads' => [
        'max_size' => 5242880,  // 5MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif'],
    ],
];
