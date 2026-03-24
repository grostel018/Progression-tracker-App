<?php
/**
 * Application Configuration
 */

return [
    'app_name' => 'Progression Tracker',
    'app_url' => getenv('APP_URL') ?: 'http://localhost:8000',
    'timezone' => 'UTC',

    // Session settings
    'session' => [
        'name' => 'pt_session',
        'lifetime' => 2592000,  // 30 days
        'path' => '/',
        'domain' => '',
        'secure' => 'auto',
        'httponly' => true,
        'samesite' => 'Lax',
    ],

    // Password settings
    'password' => [
        'min_length' => 6,
        'algorithm' => PASSWORD_ARGON2ID,
    ],

    // Upload settings
    'uploads' => [
        'max_size' => 5242880,  // 5MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif'],
    ],
];
