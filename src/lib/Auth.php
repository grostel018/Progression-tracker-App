<?php

declare(strict_types=1);

namespace src\lib;

use PDO;
use PDOException;

/**
 * Authentication Manager
 * Handles user authentication, sessions, and authorization
 */
class Auth
{
    private PDO $db;
    private array $config;

    public function __construct(PDO $db, array $config = [])
    {
        $this->db = $db;
        $sessionConfig = $config['session'] ?? [];
        $passwordConfig = $config['password'] ?? [];

        $this->config = array_merge([
            'session_name' => 'pt_session',
            'session_lifetime' => 2592000,
            'session_path' => '/',
            'session_domain' => '',
            'session_secure' => 'auto',
            'session_httponly' => true,
            'session_samesite' => 'Lax',
            'password_min_length' => 6,
            'password_algorithm' => PASSWORD_ARGON2ID,
        ], [
            'session_name' => $sessionConfig['name'] ?? 'pt_session',
            'session_lifetime' => $sessionConfig['lifetime'] ?? 2592000,
            'session_path' => $sessionConfig['path'] ?? '/',
            'session_domain' => $sessionConfig['domain'] ?? '',
            'session_secure' => $sessionConfig['secure'] ?? 'auto',
            'session_httponly' => $sessionConfig['httponly'] ?? true,
            'session_samesite' => $sessionConfig['samesite'] ?? 'Lax',
            'password_min_length' => $passwordConfig['min_length'] ?? 6,
            'password_algorithm' => $passwordConfig['algorithm'] ?? PASSWORD_ARGON2ID,
        ]);
    }

    /**
     * Check if user is authenticated
     */
    public function check(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * Get current user ID
     */
    public function id(): ?int
    {
        return $this->check() ? (int) $_SESSION['user_id'] : null;
    }

    /**
     * Get current user data
     */
    public function user(): ?array
    {
        if (!$this->check()) {
            return null;
        }

        $stmt = $this->db->prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
        $stmt->execute([$this->id()]);
        return $stmt->fetch();
    }

    /**
     * Authenticate user with email and password
     * Returns true on success, error message on failure
     */
    public function attempt(string $email, string $password): bool|string
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return 'Invalid credentials';
        }

        $userId = (int) $user['id'];

        if ($user['password_hash'] && password_needs_rehash($user['password_hash'], $this->config['password_algorithm'] ?? PASSWORD_DEFAULT)) {
            $this->updatePasswordHash($userId, $password);
        }

        $this->login($userId);
        return true;
    }

    /**
     * Login user by user ID
     */
    public function login(int $userId): void
    {
        $this->startSession();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['login_time'] = time();
    }

    /**
     * Logout current user
     */
    public function logout(): void
    {
        $this->startSession();
        $_SESSION = [];
        session_unset();

        if (ini_get('session.use_cookies')) {
            $settings = \session_cookie_settings();

            setcookie(session_name(), '', [
                'expires' => time() - 3600,
                'path' => $settings['path'],
                'domain' => $settings['domain'],
                'secure' => $settings['secure'],
                'httponly' => $settings['httponly'],
                'samesite' => $settings['samesite'],
            ]);
        }

        session_destroy();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            \start_app_session();
            session_regenerate_id(true);
        }
    }

    /**
     * Register new user
     */
    public function register(string $username, string $email, string $password): bool|array|string
    {
        if (strlen($password) < $this->config['password_min_length']) {
            return sprintf('Password must be at least %d characters', $this->config['password_min_length']);
        }

        // Check if email exists
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            return [
                'message' => 'Email already registered',
                'errors' => [
                    'email' => 'Email already registered',
                ],
            ];
        }

        // Check if username exists
        $stmt = $this->db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            return [
                'message' => 'Username already taken',
                'errors' => [
                    'username' => 'Username already taken',
                ],
            ];
        }

        // Insert user
        $hash = password_hash($password, $this->config['password_algorithm']);
        $stmt = $this->db->prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        );

        try {
            $stmt->execute([$username, $email, $hash]);
            return true;
        } catch (PDOException $e) {
            return 'Registration failed';
        }
    }

    /**
     * Initialize session
     */
    public function startSession(): void
    {
        \start_app_session();
    }

    /**
     * Require authentication and redirect or return JSON on failure
     */
    public function requireAuth(): void
    {
        if ($this->check()) {
            return;
        }

        if (\wants_json()) {
            \json_response(['error' => 'Unauthorized'], 401);
            exit;
        }

        \redirect('login.php');
    }

    // Private helper methods
    private function updatePasswordHash(int $userId, string $password): void
    {
        $hash = password_hash($password, PASSWORD_ARGON2ID);
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $userId]);
    }
}
