<?php
require "config.php";

header("Content-Type: text/plain");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit("INVALID_METHOD");
}

$email = trim($_POST["email"] ?? "");

// Basic validation
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit("INVALID_EMAIL");
}

try {
    // Check user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        exit("EMAIL_NOT_FOUND");
    }

    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = date("Y-m-d H:i:s", time() + 3600);

    // Save token
    $stmt = $pdo->prepare("
        INSERT INTO password_resets (email, token, expires_at)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$email, $token, $expires]);

    // For dev only (do NOT do this in real apps)
    echo "SUCCESS|http://localhost/reset.php?token=$token";

} catch (PDOException $e) {
    error_log("DB ERROR: " . $e->getMessage());
    exit("ERROR_DB");
}
