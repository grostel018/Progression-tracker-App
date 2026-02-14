CREATE DATABASE progression_tracker;
USE progression_tracker;

-- USERS
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CATEGORIES
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- DREAMS
CREATE TABLE dreams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    estimated_finish_date DATE,
    status ENUM('active','paused','completed','abandoned') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOALS
CREATE TABLE goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    dream_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type ENUM('daily','weekly','monthly','yearly') NOT NULL,
    start_date DATE NOT NULL,
    estimated_finish_date DATE,
    goal_reached TINYINT(1) DEFAULT 0,
    status ENUM('active','paused','completed','failed') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOAL LOGS
CREATE TABLE goal_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    goal_id INT NOT NULL,
    log_date DATE NOT NULL,
    progress_percent TINYINT UNSIGNED,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- STREAKS
CREATE TABLE streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ACHIEVEMENTS
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- USER ACHIEVEMENTS
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- SESSIONS
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
