<?php
require "config.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $email = trim($_POST["email"]);
    $username = trim($_POST["username"]);
    $password = $_POST["password"];

    if (!$email || !$username || !$password) {
        die("All fields required");
    }

    // Hash password securely
    $hash = password_hash($password, PASSWORD_ARGON2ID);

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$email, $username, $hash]);

    echo "REGISTER_SUCCESS";
}
