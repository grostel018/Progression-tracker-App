<?php

declare(strict_types=1);

/**
 * Helper Functions
 * Global utility functions for the application
 */

// Load all config files on first load
if (!isset($GLOBALS['config_loaded'])) {
    $GLOBALS['config'] = [];
    $configDir = defined('BASE_PATH')
        ? BASE_PATH . '/config/'
        : dirname(__DIR__, 2) . '/config/';
    if (file_exists($configDir . 'database.php')) {
        $GLOBALS['config']['database'] = require $configDir . 'database.php';
    }
    if (file_exists($configDir . 'app.php')) {
        $GLOBALS['config']['app'] = require $configDir . 'app.php';
    }
    $GLOBALS['config_loaded'] = true;
}

if (!function_exists('config')) {
    /**
     * Get configuration value
     */
    function config(string $key, $default = null)
    {
        $parts = explode('.', $key);
        $config = $GLOBALS['config'] ?? [];

        $current = $config;

        foreach ($parts as $part) {
            if (isset($current[$part])) {
                $current = $current[$part];
            } else {
                return $default;
            }
        }

        return $current;
    }
}

if (!function_exists('view')) {
    /**
     * Render a view template
     */
    function view(string $template, array $data = []): void
    {
        $path = __DIR__ . '/../views/' . $template . '.php';

        if (!file_exists($path)) {
            http_response_code(404);
            echo "View not found: " . htmlspecialchars($template);
            return;
        }

        apply_no_cache_headers();

        extract($data);
        include $path;
    }
}

if (!function_exists('redirect')) {
    /**
     * Redirect to a URL
     */
    function redirect(string $url, int $code = 302): void
    {
        apply_no_cache_headers();
        header('Location: ' . $url, true, $code);
        exit;
    }
}

if (!function_exists('safe_output')) {
    /**
     * Escape output for HTML
     */
    function safe_output(string $string): string
    {
        return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('humanize_label')) {
    /**
     * Convert enum-like values into readable labels.
     */
    function humanize_label(?string $value): string
    {
        $normalized = trim((string) $value);

        if ($normalized === '') {
            return '';
        }

        $normalized = str_replace(['_', '-'], ' ', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        return ucwords($normalized);
    }
}

if (!function_exists('is_post')) {
    /**
     * Check if request method is POST
     */
    function is_post(): bool
    {
        return $_SERVER['REQUEST_METHOD'] === 'POST';
    }
}

if (!function_exists('is_ajax')) {
    /**
     * Check if request is AJAX
     */
    function is_ajax(): bool
    {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
}

if (!function_exists('wants_json')) {
    /**
     * Check if request expects a JSON response
     */
    function wants_json(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';

        return str_contains($accept, 'application/json') ||
            is_ajax() ||
            str_contains($requestUri, '/api/');
    }
}

if (!function_exists('boot_database')) {
    /**
     * Initialize the shared PDO connection.
     */
    function boot_database(): void
    {
        \src\lib\Database::init(config('database'));
    }
}

if (!function_exists('is_secure_request')) {
    /**
     * Determine whether the current request is using HTTPS.
     */
    function is_secure_request(): bool
    {
        if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
            return true;
        }

        if (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) {
            return true;
        }

        $forwardedProto = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
        if ($forwardedProto === 'https') {
            return true;
        }

        return false;
    }
}

if (!function_exists('session_cookie_settings')) {
    /**
     * Build normalized session cookie settings from config and request context.
     *
     * @return array{name:string,lifetime:int,path:string,domain:string,secure:bool,httponly:bool,samesite:string}
     */
    function session_cookie_settings(): array
    {
        $sessionConfig = config('app.session', []);
        $secureSetting = $sessionConfig['secure'] ?? 'auto';

        return [
            'name' => (string) ($sessionConfig['name'] ?? 'pt_session'),
            'lifetime' => (int) ($sessionConfig['lifetime'] ?? 2592000),
            'path' => (string) ($sessionConfig['path'] ?? '/'),
            'domain' => (string) ($sessionConfig['domain'] ?? ''),
            'secure' => $secureSetting === 'auto' ? is_secure_request() : (bool) $secureSetting,
            'httponly' => (bool) ($sessionConfig['httponly'] ?? true),
            'samesite' => (string) ($sessionConfig['samesite'] ?? 'Lax'),
        ];
    }
}

if (!function_exists('apply_no_cache_headers')) {
    /**
     * Prevent caching for dynamic authenticated and auth-sensitive responses.
     */
    function apply_no_cache_headers(): void
    {
        header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        header('Vary: Cookie, Accept-Encoding');
    }
}

if (!function_exists('start_app_session')) {
    /**
     * Start the session if it is not already active.
     */
    function start_app_session(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $settings = session_cookie_settings();

            session_name($settings['name']);
            session_cache_limiter('');
            ini_set('session.use_only_cookies', '1');
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_trans_sid', '0');
            ini_set('session.gc_maxlifetime', (string) $settings['lifetime']);
            ini_set('session.cookie_httponly', $settings['httponly'] ? '1' : '0');
            ini_set('session.cookie_secure', $settings['secure'] ? '1' : '0');

            session_set_cookie_params([
                'lifetime' => $settings['lifetime'],
                'path' => $settings['path'],
                'domain' => $settings['domain'],
                'secure' => $settings['secure'],
                'httponly' => $settings['httponly'],
                'samesite' => $settings['samesite'],
            ]);

            session_start();
        }
    }
}

if (!function_exists('auth_manager')) {
    /**
     * Get the per-request auth manager.
     */
    function auth_manager(): \src\lib\Auth
    {
        static $auth = null;

        if ($auth instanceof \src\lib\Auth) {
            return $auth;
        }

        boot_database();
        start_app_session();

        $auth = new \src\lib\Auth(\src\lib\Database::getConnection(), config('app'));
        return $auth;
    }
}

if (!function_exists('redirect_if_authenticated')) {
    /**
     * Redirect authenticated users away from guest-only pages.
     */
    function redirect_if_authenticated(string $url = 'dashboard.php'): void
    {
        start_app_session();

        if (isset($_SESSION['user_id'])) {
            redirect($url);
        }
    }
}

if (!function_exists('require_auth_user')) {
    /**
     * Require an authenticated user and return their record.
     */
    function require_auth_user(): array
    {
        $auth = auth_manager();
        $auth->requireAuth();

        $user = $auth->user();

        if (!$user) {
            redirect('login.php');
        }

        return $user;
    }
}

if (!function_exists('logout_current_user')) {
    /**
     * Logout the active user.
     */
    function logout_current_user(): void
    {
        auth_manager()->logout();
    }
}

if (!function_exists('asset_url')) {
    /**
     * Build a public asset URL with a filemtime version for cache busting.
     */
    function asset_url(string $path): string
    {
        $normalizedPath = ltrim(str_replace('\\', '/', $path), '/');
        $basePath = defined('BASE_PATH') ? BASE_PATH : dirname(__DIR__, 2);
        $publicPath = $basePath . '/public/' . str_replace('/', DIRECTORY_SEPARATOR, $normalizedPath);

        if (!is_file($publicPath)) {
            return $normalizedPath;
        }

        return sprintf('%s?v=%d', $normalizedPath, filemtime($publicPath));
    }
}

if (!function_exists('request_method')) {
    /**
     * Get the current HTTP method in uppercase.
     */
    function request_method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }
}

if (!function_exists('is_state_changing_request')) {
    /**
     * Determine whether the current request mutates server state.
     */
    function is_state_changing_request(): bool
    {
        return in_array(request_method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
    }
}

if (!function_exists('request_input')) {
    /**
     * Parse JSON or form input into an array.
     */
    function request_input(): array
    {
        static $cachedInput = null;

        if (is_array($cachedInput)) {
            return $cachedInput;
        }

        $raw = file_get_contents('php://input');
        $method = request_method();

        if ($raw !== false && $raw !== '') {
            $decoded = json_decode($raw, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $cachedInput = $decoded;
                return $cachedInput;
            }

            if (in_array($method, ['PUT', 'PATCH', 'DELETE'], true)) {
                parse_str($raw, $parsed);
                $cachedInput = is_array($parsed) ? $parsed : [];
                return $cachedInput;
            }
        }

        $cachedInput = is_array($_POST) ? $_POST : [];
        return $cachedInput;
    }
}

if (!function_exists('request_ip')) {
    /**
     * Read the client IP from the direct connection.
     */
    function request_ip(): string
    {
        return trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown')) ?: 'unknown';
    }
}

if (!function_exists('request_query_int')) {
    /**
     * Read an integer query parameter.
     */
    function request_query_int(string $key, int $default = 0): int
    {
        return isset($_GET[$key]) ? (int) $_GET[$key] : $default;
    }
}

if (!function_exists('json_response')) {
    /**
     * Send a JSON response.
     */
    function json_response($data, int $statusCode = 200): void
    {
        apply_no_cache_headers();
        http_response_code($statusCode);
        header('Content-Type: application/json');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data);
    }
}

if (!function_exists('csrf_token_value')) {
    /**
     * Get or create the per-session CSRF token.
     */
    function csrf_token_value(): string
    {
        start_app_session();

        if (empty($_SESSION['_csrf_token']) || !is_string($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['_csrf_token'];
    }
}

if (!function_exists('csrf_token_input')) {
    /**
     * Render a hidden CSRF input.
     */
    function csrf_token_input(): string
    {
        return '<input type="hidden" name="_csrf" value="' . safe_output(csrf_token_value()) . '">';
    }
}

if (!function_exists('request_csrf_token')) {
    /**
     * Read the CSRF token from the header or parsed request body.
     */
    function request_csrf_token(): string
    {
        $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (is_string($headerToken) && trim($headerToken) !== '') {
            return trim($headerToken);
        }

        $input = request_input();
        $bodyToken = $input['_csrf'] ?? '';
        return is_string($bodyToken) ? trim($bodyToken) : '';
    }
}

if (!function_exists('is_valid_csrf_token')) {
    /**
     * Validate a supplied CSRF token against the session token.
     */
    function is_valid_csrf_token(?string $token): bool
    {
        if (!is_string($token) || $token === '') {
            return false;
        }

        return hash_equals(csrf_token_value(), $token);
    }
}

if (!function_exists('require_csrf_token')) {
    /**
     * Reject state-changing requests without a valid CSRF token.
     */
    function require_csrf_token(): void
    {
        if (!is_state_changing_request()) {
            return;
        }

        if (is_valid_csrf_token(request_csrf_token())) {
            return;
        }

        if (wants_json()) {
            json_response([
                'success' => false,
                'message' => 'Security token mismatch. Refresh the page and try again.',
            ], 419);
            exit;
        }

        http_response_code(419);
        echo 'Security token mismatch. Refresh the page and try again.';
        exit;
    }
}

if (!function_exists('boot_api')) {
    /**
     * Prepare database and session state for API endpoints.
     */
    function boot_api(): void
    {
        boot_database();
        start_app_session();
        require_csrf_token();
    }
}

if (!function_exists('dispatch_resource_controller')) {
    /**
     * Dispatch a standard CRUD controller for GET/POST/PUT/DELETE APIs.
     */
    function dispatch_resource_controller(object $controller): void
    {
        $id = request_query_int('id');
        $input = request_input();

        switch (request_method()) {
            case 'GET':
                json_response($id > 0 ? $controller->show($id) : $controller->index());
                return;

            case 'POST':
                json_response($controller->store($input));
                return;

            case 'PUT':
                json_response($controller->update($id, $input));
                return;

            case 'DELETE':
                json_response($controller->delete($id));
                return;

            default:
                json_response(['error' => 'Method not allowed'], 405);
        }
    }
}
