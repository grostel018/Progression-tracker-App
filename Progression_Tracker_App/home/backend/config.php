<?php
$host = "localhost";
$dbname = "progression_tracker";
$user = "root";   // default XAMPP
$pass = "";       // default XAMPP (empty)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
