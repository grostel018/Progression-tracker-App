<?php
session_start();
require "config.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $email = $_POST["email"];
    $password = $_POST["password"];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user["password_hash"])) {
        die("INVALID_LOGIN");
    }

    // Create session
    $_SESSION["user_id"] = $user["id"];
    $_SESSION["username"] = $user["username"];

    echo "LOGIN_SUCCESS";
}
