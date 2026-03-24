<?php
require "session.php";

if (!isset($_SESSION["user_id"]) || !$_SESSION["logged_in"]) {
    header("Location: ../login.html");
    exit;
}
