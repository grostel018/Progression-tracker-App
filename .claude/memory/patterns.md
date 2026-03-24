# Coding Patterns

## File Structure Pattern

```
public/
├── [page].php      # Main pages (standalone)
├── [entity].php    # API endpoints (GET/POST/PUT/DELETE)
└── [action].php    # Special actions (logout, upload, etc.)
```

## API Endpoint Pattern

```php
// public/login.php
$host = "localhost";
$dbname = "progression_tracker";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

session_start();

// Handle request
// Return JSON for AJAX calls
echo json_encode(['success' => true, 'message' => '...']);
```

## View Pattern

```php
<?php session_start(); ?>
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="style.css">
    <script defer src="script.js"></script>
</head>
<body data-page="[page-name]">
    <!-- Content -->
</body>
</html>
```

## JavaScript Pattern

```javascript
document.getElementById("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const res = await fetch("[endpoint].php", { method: "POST", body: form });
    const data = await res.json();
    // Handle response
});
```
