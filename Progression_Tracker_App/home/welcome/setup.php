
<?php require "../backend/session_check.php"; ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        /* Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Segoe UI", Tahoma, sans-serif;
        }

        body {
            height: 100vh;
            background: linear-gradient(135deg, #0f172a, #111827);
            color: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            text-align: center;
            background: rgba(17, 24, 39, 0.9);
            padding: 40px 60px;
            border-radius: 16px;
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.7);
            border: 1px solid #1f2933;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #f9fafb;
        }

        p {
            font-size: 1.1rem;
            margin-bottom: 25px;
            color: #9ca3af;
        }

        .btn {
            display: inline-block;
            padding: 12px 28px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: 0.2s ease;
        }

        .btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Website</h1>
        <p>Your journey starts here. Explore and enjoy the experience.</p>
        <a href="../login.php" class="btn">Get Started</a>
    </div>
</body>
</html>
