document.addEventListener('DOMContentLoaded', () => {
    const app = window.dashboardApp;
    if (!app) {
        return;
    }

    app.bindDeleteButtons('.delete-goal', 'api/goals.php');
    window.ProgressionGoalsComposer?.init(app);
    window.ProgressionGoalsWorkspace?.init(app);
});
