<?php
require "config.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $email = $_POST["email"];

    // Check user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        die("EMAIL_NOT_FOUND");
    }

    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = date("Y-m-d H:i:s", strtotime("+1 hour"));

    // Save token
    $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)")
        ->execute([$email, $token, $expires]);

    // In real SaaS: send email
    echo "RESET_LINK: http://localhost/reset.php?token=$token";
}
