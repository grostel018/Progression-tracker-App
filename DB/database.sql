CREATE DATABASE IF NOT EXISTS progression_tracker;
USE progression_tracker;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- DREAMS
CREATE TABLE IF NOT EXISTS dreams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    estimated_finish_date DATE,
    current_progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('active','paused','completed','abandoned') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_dreams_user_status (user_id, status),
    INDEX idx_dreams_user_category (user_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOALS
CREATE TABLE IF NOT EXISTS goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    dream_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type ENUM('daily','weekly','monthly','yearly') NOT NULL,
    start_date DATE NOT NULL,
    estimated_finish_date DATE,
    current_progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
    goal_reached TINYINT(1) DEFAULT 0,
    status ENUM('active','paused','completed','failed') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE,
    INDEX idx_goals_user_status (user_id, status),
    INDEX idx_goals_user_dream (user_id, dream_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- HISTORY ENTRIES
CREATE TABLE IF NOT EXISTS history_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entity_type ENUM('goal','dream') NOT NULL,
    entity_id INT NOT NULL,
    entry_type ENUM('manual_log','task_completion','habit_action','system_event') NOT NULL DEFAULT 'manual_log',
    title VARCHAR(255) DEFAULT NULL,
    content TEXT,
    entry_date DATE NOT NULL,
    related_type ENUM('goal_task','goal_habit') DEFAULT NULL,
    related_id INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_history_user_date (user_id, entry_date),
    INDEX idx_history_entity_date (entity_type, entity_id, entry_date),
    INDEX idx_history_related (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- PROGRESS SNAPSHOTS
CREATE TABLE IF NOT EXISTS progress_snapshots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entity_type ENUM('goal','dream') NOT NULL,
    entity_id INT NOT NULL,
    history_entry_id INT DEFAULT NULL,
    progress_percent TINYINT UNSIGNED NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (history_entry_id) REFERENCES history_entries(id) ON DELETE SET NULL,
    INDEX idx_progress_entity_date (entity_type, entity_id, snapshot_date),
    INDEX idx_progress_user_date (user_id, snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOAL TASKS
CREATE TABLE IF NOT EXISTS goal_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    goal_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_completed TINYINT(1) NOT NULL DEFAULT 0,
    completed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    INDEX idx_goal_tasks_goal (goal_id, sort_order),
    INDEX idx_goal_tasks_user (user_id, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOAL HABITS
CREATE TABLE IF NOT EXISTS goal_habits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    goal_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    INDEX idx_goal_habits_goal (goal_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- GOAL HABIT LOGS
CREATE TABLE IF NOT EXISTS goal_habit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    habit_id INT NOT NULL,
    history_entry_id INT DEFAULT NULL,
    logged_on DATE NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (habit_id) REFERENCES goal_habits(id) ON DELETE CASCADE,
    FOREIGN KEY (history_entry_id) REFERENCES history_entries(id) ON DELETE SET NULL,
    INDEX idx_goal_habit_logs_habit_date (habit_id, logged_on),
    INDEX idx_goal_habit_logs_user_date (user_id, logged_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- AUDIT ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- STREAKS
CREATE TABLE IF NOT EXISTS streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    requested_ip VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(1000) DEFAULT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_password_reset_token_hash (token_hash),
    INDEX idx_password_reset_user_active (user_id, used_at, expires_at),
    INDEX idx_password_reset_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SCHEMA MIGRATIONS
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO schema_migrations (filename) VALUES
    ('20260324_progress_history_analytics.sql'),
    ('20260329_auth_security_hardening.sql'),
    ('20260329_remove_security_questions.sql');
