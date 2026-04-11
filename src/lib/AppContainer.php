<?php

declare(strict_types=1);

namespace src\lib;

use PDO;
use src\api\achievements\AchievementRepository;
use src\api\auth\AuthInputValidator;
use src\api\auth\ForgotPasswordHandler;
use src\api\auth\LoginHandler;
use src\api\auth\PasswordResetTokenRepository;
use src\api\auth\RegisterHandler;
use src\api\auth\ResetPasswordHandler;
use src\api\categories\CategoryController;
use src\api\categories\CategoryRepository;
use src\api\dashboard\DashboardRepository;
use src\api\dreams\DreamController;
use src\api\dreams\DreamRepository;
use src\api\goals\GoalController;
use src\api\goals\GoalHabitController;
use src\api\goals\GoalHabitLogController;
use src\api\goals\GoalHabitRepository;
use src\api\goals\GoalLogController;
use src\api\goals\GoalRepository;
use src\api\goals\GoalTaskController;
use src\api\goals\GoalTaskRepository;
use src\api\goals\GoalTrackingService;
use src\api\history\HistoryController;
use src\api\history\HistoryRepository;
use src\api\history\HistoryService;
use src\api\history\TrackableRepository;
use src\api\logs\ActivityLogRepository;

final class AppContainer
{
    /** @var array<string, mixed> */
    private array $instances = [];

    public function db(): PDO
    {
        return $this->singleton('db', function (): PDO {
            Database::init(config('database'));
            return Database::getConnection();
        });
    }

    public function auth(): Auth
    {
        return $this->singleton('auth', fn (): Auth => new Auth($this->db(), config('app')));
    }

    public function authInputValidator(): AuthInputValidator
    {
        return $this->singleton('auth_input_validator', fn (): AuthInputValidator => new AuthInputValidator(config('app')));
    }

    public function rateLimiter(): RateLimiter
    {
        return $this->singleton('rate_limiter', fn (): RateLimiter => new RateLimiter());
    }

    public function passwordResetTokens(): PasswordResetTokenRepository
    {
        return $this->singleton('password_reset_tokens', fn (): PasswordResetTokenRepository => new PasswordResetTokenRepository());
    }

    public function activityLogs(): ActivityLogRepository
    {
        return $this->singleton('activity_logs', fn (): ActivityLogRepository => new ActivityLogRepository($this->db()));
    }

    public function dashboardRepository(): DashboardRepository
    {
        return $this->singleton('dashboard_repository', fn (): DashboardRepository => new DashboardRepository());
    }

    public function achievementRepository(): AchievementRepository
    {
        return $this->singleton('achievement_repository', fn (): AchievementRepository => new AchievementRepository());
    }

    public function categoryRepository(): CategoryRepository
    {
        return $this->singleton('category_repository', fn (): CategoryRepository => new CategoryRepository());
    }

    public function dreamRepository(): DreamRepository
    {
        return $this->singleton('dream_repository', fn (): DreamRepository => new DreamRepository());
    }

    public function goalRepository(): GoalRepository
    {
        return $this->singleton('goal_repository', fn (): GoalRepository => new GoalRepository());
    }

    public function goalTaskRepository(): GoalTaskRepository
    {
        return $this->singleton('goal_task_repository', fn (): GoalTaskRepository => new GoalTaskRepository());
    }

    public function goalHabitRepository(): GoalHabitRepository
    {
        return $this->singleton('goal_habit_repository', fn (): GoalHabitRepository => new GoalHabitRepository());
    }

    public function historyRepository(): HistoryRepository
    {
        return $this->singleton('history_repository', fn (): HistoryRepository => new HistoryRepository());
    }

    public function trackableRepository(): TrackableRepository
    {
        return $this->singleton('trackable_repository', fn (): TrackableRepository => new TrackableRepository());
    }

    public function historyService(): HistoryService
    {
        return $this->singleton('history_service', fn (): HistoryService => new HistoryService(
            $this->historyRepository(),
            $this->trackableRepository()
        ));
    }

    public function goalTrackingService(): GoalTrackingService
    {
        return $this->singleton('goal_tracking_service', fn (): GoalTrackingService => new GoalTrackingService(
            $this->goalRepository(),
            $this->goalTaskRepository(),
            $this->goalHabitRepository(),
            $this->historyRepository()
        ));
    }

    public function loginHandler(): LoginHandler
    {
        return $this->singleton('login_handler', fn (): LoginHandler => new LoginHandler(
            $this->db(),
            $this->auth(),
            $this->authInputValidator(),
            $this->rateLimiter(),
            $this->activityLogs()
        ));
    }

    public function registerHandler(): RegisterHandler
    {
        return $this->singleton('register_handler', fn (): RegisterHandler => new RegisterHandler(
            $this->db(),
            $this->auth(),
            $this->authInputValidator(),
            $this->rateLimiter(),
            $this->activityLogs()
        ));
    }

    public function forgotPasswordHandler(): ForgotPasswordHandler
    {
        return $this->singleton('forgot_password_handler', fn (): ForgotPasswordHandler => new ForgotPasswordHandler(
            $this->db(),
            $this->authInputValidator(),
            $this->rateLimiter(),
            $this->passwordResetTokens()
        ));
    }

    public function resetPasswordHandler(): ResetPasswordHandler
    {
        return $this->singleton('reset_password_handler', fn (): ResetPasswordHandler => new ResetPasswordHandler(
            $this->db(),
            $this->passwordResetTokens(),
            $this->rateLimiter()
        ));
    }

    public function categoryController(): CategoryController
    {
        return $this->singleton('category_controller', fn (): CategoryController => new CategoryController(
            $this->auth(),
            $this->categoryRepository(),
            $this->activityLogs()
        ));
    }

    public function dreamController(): DreamController
    {
        return $this->singleton('dream_controller', fn (): DreamController => new DreamController(
            $this->auth(),
            $this->dreamRepository(),
            $this->categoryRepository(),
            $this->activityLogs()
        ));
    }

    public function goalController(): GoalController
    {
        return $this->singleton('goal_controller', fn (): GoalController => new GoalController(
            $this->auth(),
            $this->goalRepository(),
            $this->dreamRepository(),
            $this->activityLogs()
        ));
    }

    public function goalTaskController(): GoalTaskController
    {
        return $this->singleton('goal_task_controller', fn (): GoalTaskController => new GoalTaskController(
            $this->auth(),
            $this->goalTrackingService()
        ));
    }

    public function goalHabitController(): GoalHabitController
    {
        return $this->singleton('goal_habit_controller', fn (): GoalHabitController => new GoalHabitController(
            $this->auth(),
            $this->goalTrackingService()
        ));
    }

    public function goalHabitLogController(): GoalHabitLogController
    {
        return $this->singleton('goal_habit_log_controller', fn (): GoalHabitLogController => new GoalHabitLogController(
            $this->auth(),
            $this->goalTrackingService()
        ));
    }

    public function goalLogController(): GoalLogController
    {
        return $this->singleton('goal_log_controller', fn (): GoalLogController => new GoalLogController(
            $this->auth(),
            $this->goalRepository(),
            $this->historyRepository(),
            $this->historyService()
        ));
    }

    public function historyController(): HistoryController
    {
        return $this->singleton('history_controller', fn (): HistoryController => new HistoryController(
            $this->auth(),
            $this->historyService()
        ));
    }

    /**
     * @template T
     * @param callable():T $factory
     * @return T
     */
    private function singleton(string $key, callable $factory)
    {
        if (array_key_exists($key, $this->instances)) {
            return $this->instances[$key];
        }

        $this->instances[$key] = $factory();
        return $this->instances[$key];
    }
}
