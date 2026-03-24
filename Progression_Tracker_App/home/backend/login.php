<?php

require "session.php";
require "config.php";


if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("INVALID_REQUEST");
}

// Normalize inputs
$email = strtolower(trim($_POST["email"] ?? ""));
$password = $_POST["password"] ?? "";

// Validate input
if (!$email || !$password) {
    die("All fields required");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Invalid email");
}

// Fetch user
$stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user["password_hash"])) {
    die("INVALID_LOGIN");
}

// 🔒 Prevent session fixation attacks
session_regenerate_id(true);

// Create session
$_SESSION["user_id"] = $user["id"];
$_SESSION["username"] = $user["username"];
$_SESSION["logged_in"] = true;

echo "LOGIN_SUCCESS";
