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
            'session_secure' => false,
            'session_httponly' => true,
            'password_min_length' => 6,
            'password_algorithm' => PASSWORD_ARGON2ID,
        ], [
            'session_name' => $sessionConfig['name'] ?? 'pt_session',
            'session_lifetime' => $sessionConfig['lifetime'] ?? 2592000,
            'session_path' => $sessionConfig['path'] ?? '/',
            'session_domain' => $sessionConfig['domain'] ?? '',
            'session_secure' => $sessionConfig['secure'] ?? false,
            'session_httponly' => $sessionConfig['httponly'] ?? true,
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

        if ($user['password_hash'] && password_needs_rehash($user['password_hash'], $this->config['password_algorithm'] ?? PASSWORD_DEFAULT)) {
            $this->updatePasswordHash($user['id'], $password);
        }

        $this->login($user['id']);
        return true;
    }

    /**
     * Login user by user ID
     */
    public function login(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['login_time'] = time();
    }

    /**
     * Logout current user
     */
    public function logout(): void
    {
        unset($_SESSION['user_id']);
        unset($_SESSION['login_time']);
        session_destroy();
        session_start();
    }

    /**
     * Register new user
     */
    public function register(string $username, string $email, string $password): bool|string
    {
        if (strlen($password) < $this->config['password_min_length']) {
            return sprintf('Password must be at least %d characters', $this->config['password_min_length']);
        }

        // Check if email exists
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            return 'Email already registered';
        }

        // Check if username exists
        $stmt = $this->db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            return 'Username already taken';
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
        $config = $this->config;
        session_name($config['session_name']);
        session_set_cookie_params([
            'lifetime' => $config['session_lifetime'],
            'path' => $config['session_path'] ?? '/',
            'domain' => $config['session_domain'] ?? '',
            'secure' => $config['session_secure'] ?? false,
            'httponly' => $config['session_httponly'] ?? true,
        ]);

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
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
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        header('Location: login.php');
        exit;
    }

    // Private helper methods
    private function updatePasswordHash(int $userId, string $password): void
    {
        $hash = password_hash($password, PASSWORD_ARGON2ID);
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $userId]);
    }
}
