<?php
require "config.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $email = strtolower(trim($_POST["email"] ?? ""));

    $username = trim($_POST["username"] ?? "");

    $username = strtolower($username);

    $password = $_POST["password"] ?? "";

    $password2 = $_POST["password2"] ?? "";


    if (!$email || !$username || !$password || !$password2) {
    die("All fields required");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Invalid email format");
    }


    if (!preg_match("/^[a-zA-Z0-9_]{3,20}$/", $username)) {
    die("Invalid username (3–20 chars, letters/numbers/_ only)");
    }


    if (strlen($password) < 8) {
    die("Password must be at least 8 characters");
    }


    if ($password !== $password2) {
    die("Passwords do not match");
    }

    // Hash password securely
    $hash = password_hash($password, PASSWORD_ARGON2ID);

    // Insert user
    try {
    $stmt = $pdo->prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$email, $username, $hash]);
    echo "REGISTER_SUCCESS";
    } catch (PDOException $e) {
    if ($e->errorInfo[1] == 1062) {
        die("Email or username already exists");
    } else {
        die("Database error");
    }

    }

}
