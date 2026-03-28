USE progression_tracker;

CREATE TABLE password_reset_tokens (
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
