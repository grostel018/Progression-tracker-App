USE progression_tracker;

ALTER TABLE dreams
    ADD COLUMN current_progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER estimated_finish_date;

ALTER TABLE goals
    ADD COLUMN current_progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER estimated_finish_date;

CREATE TABLE history_entries (
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

CREATE TABLE progress_snapshots (
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

CREATE TABLE goal_tasks (
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

CREATE TABLE goal_habits (
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

CREATE TABLE goal_habit_logs (
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

INSERT INTO history_entries (user_id, entity_type, entity_id, entry_type, title, content, entry_date, created_at)
SELECT
    g.user_id,
    'goal',
    gl.goal_id,
    'manual_log',
    'Imported goal log',
    gl.note,
    gl.log_date,
    gl.created_at
FROM goal_logs gl
JOIN goals g ON g.id = gl.goal_id;

INSERT INTO progress_snapshots (user_id, entity_type, entity_id, history_entry_id, progress_percent, snapshot_date, created_at)
SELECT
    g.user_id,
    'goal',
    gl.goal_id,
    he.id,
    COALESCE(gl.progress_percent, 0),
    gl.log_date,
    gl.created_at
FROM goal_logs gl
JOIN goals g ON g.id = gl.goal_id
JOIN history_entries he
    ON he.entity_type = 'goal'
   AND he.entity_id = gl.goal_id
   AND he.entry_date = gl.log_date
   AND he.created_at = gl.created_at
WHERE gl.progress_percent IS NOT NULL;

UPDATE goals g
LEFT JOIN (
    SELECT ps.entity_id, ps.progress_percent
    FROM progress_snapshots ps
    INNER JOIN (
        SELECT entity_id, MAX(CONCAT(snapshot_date, ' ', LPAD(id, 10, '0'))) AS latest_marker
        FROM progress_snapshots
        WHERE entity_type = 'goal'
        GROUP BY entity_id
    ) latest
        ON latest.entity_id = ps.entity_id
       AND CONCAT(ps.snapshot_date, ' ', LPAD(ps.id, 10, '0')) = latest.latest_marker
    WHERE ps.entity_type = 'goal'
) current_progress ON current_progress.entity_id = g.id
SET g.current_progress_percent = COALESCE(current_progress.progress_percent, IF(g.goal_reached = 1 OR g.status = 'completed', 100, 0));

UPDATE dreams
SET current_progress_percent = CASE
    WHEN status = 'completed' THEN 100
    ELSE 0
END;

DROP TABLE goal_logs;
