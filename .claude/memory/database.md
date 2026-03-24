# Database Schema

## Tables

### users
```sql
id INT PK AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
username VARCHAR(100) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
last_login DATETIME
```

### categories
```sql
id INT PK AUTO_INCREMENT
user_id INT NOT NULL
name VARCHAR(100) NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id)
```

### dreams
```sql
id INT PK AUTO_INCREMENT
user_id INT NOT NULL
category_id INT NOT NULL
title VARCHAR(255) NOT NULL
description TEXT
start_date DATE
estimated_finish_date DATE
status ENUM('active','paused','completed','abandoned') DEFAULT 'active'
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (category_id) REFERENCES categories(id)
```

### goals
```sql
id INT PK AUTO_INCREMENT
user_id INT NOT NULL
dream_id INT NOT NULL
title VARCHAR(255) NOT NULL
description TEXT
goal_type ENUM('daily','weekly','monthly','yearly') NOT NULL
start_date DATE
estimated_finish_date DATE
status ENUM('active','paused','completed','failed') DEFAULT 'active'
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (dream_id) REFERENCES dreams(id)
```

### goal_logs
```sql
id INT PK AUTO_INCREMENT
goal_id INT NOT NULL
log_date DATE NOT NULL
progress_percent TINYINT UNSIGNED
note TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (goal_id) REFERENCES goals(id)
```

### streaks
```sql
id INT PK AUTO_INCREMENT
user_id INT NOT NULL
current_streak INT DEFAULT 0
longest_streak INT DEFAULT 0
last_activity_date DATE
FOREIGN KEY (user_id) REFERENCES users(id)
```

### achievements
```sql
id INT PK AUTO_INCREMENT
name VARCHAR(255) NOT NULL
description TEXT
icon VARCHAR(255)
```

### user_achievements
```sql
id INT PK AUTO_INCREMENT
user_id INT NOT NULL
achievement_id INT NOT NULL
earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (achievement_id) REFERENCES achievements(id)
```
