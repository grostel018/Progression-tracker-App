async function apiRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        credentials: 'include',
        ...options,
        headers: {
            Accept: 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        window.location.href = 'login.php';
        return null;
    }

    return response.json();
}

function bindDeleteButtons(selector, endpoint) {
    document.querySelectorAll(selector).forEach((button) => {
        button.addEventListener('click', async (event) => {
            const card = event.target.closest('[data-id]');
            const id = card?.dataset.id;

            if (!id) {
                return;
            }

            const result = await apiRequest(`${endpoint}?id=${id}`, {
                method: 'DELETE',
            });

            if (result?.success) {
                card.remove();
                return;
            }

            alert(result?.message || 'Delete failed');
        });
    });
}

async function getFirstCategoryId() {
    const categories = await apiRequest('api/categories.php');

    if (!Array.isArray(categories) || categories.length === 0) {
        alert('Create a category first.');
        return null;
    }

    return categories[0].id;
}

async function getFirstDreamId() {
    const dreams = await apiRequest('api/dreams.php');

    if (!Array.isArray(dreams) || dreams.length === 0) {
        alert('Create a dream first.');
        return null;
    }

    return dreams[0].id;
}

document.addEventListener('DOMContentLoaded', () => {
    bindDeleteButtons('.delete-dream', 'api/dreams.php');
    bindDeleteButtons('.delete-goal', 'api/goals.php');
    bindDeleteButtons('.delete-category', 'api/categories.php');

    document.getElementById('addCategoryBtn')?.addEventListener('click', async () => {
        const name = prompt('Category name:');

        if (!name) {
            return;
        }

        const result = await apiRequest('api/categories.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (result?.success) {
            window.location.reload();
            return;
        }

        alert(result?.message || 'Failed to create category');
    });

    document.getElementById('addDreamBtn')?.addEventListener('click', async () => {
        const title = prompt('Dream title:');

        if (!title) {
            return;
        }

        const categoryId = await getFirstCategoryId();

        if (!categoryId) {
            return;
        }

        const description = prompt('Optional description:') || '';

        const result = await apiRequest('api/dreams.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                category_id: categoryId,
            }),
        });

        if (result?.success) {
            window.location.reload();
            return;
        }

        alert(result?.message || 'Failed to create dream');
    });

    document.getElementById('addGoalBtn')?.addEventListener('click', async () => {
        const title = prompt('Goal title:');

        if (!title) {
            return;
        }

        const dreamId = await getFirstDreamId();

        if (!dreamId) {
            return;
        }

        const goalType = (prompt('Goal type: daily, weekly, monthly, yearly', 'daily') || 'daily').toLowerCase();
        const validTypes = ['daily', 'weekly', 'monthly', 'yearly'];

        if (!validTypes.includes(goalType)) {
            alert('Invalid goal type');
            return;
        }

        const result = await apiRequest('api/goals.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                dream_id: dreamId,
                goal_type: goalType,
                start_date: new Date().toISOString().split('T')[0],
            }),
        });

        if (result?.success) {
            window.location.reload();
            return;
        }

        alert(result?.message || 'Failed to create goal');
    });
});
