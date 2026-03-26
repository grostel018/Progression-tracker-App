document.addEventListener('DOMContentLoaded', () => {
    const app = window.dashboardApp;
    const panel = document.getElementById('weeklyReviewHistory');

    if (!app || !panel) {
        return;
    }

    let requestToken = 0;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(date, includeYear = false) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: includeYear ? 'numeric' : undefined,
            timeZone: app.getAppTimeZone?.() || 'UTC',
        }).format(new Date(`${date}T00:00:00`));
    }

    function formatSignedNumber(value) {
        const number = Number(value || 0);

        if (number > 0) {
            return `+${number}%`;
        }

        if (number < 0) {
            return `${number}%`;
        }

        return '0%';
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    function renderWins(items) {
        const mount = document.getElementById('weeklyReviewWins');
        if (!mount) {
            return;
        }

        if (!Array.isArray(items) || items.length === 0) {
            mount.innerHTML = '<p class="panel-empty-copy">No standout wins yet this week. Add a task completion, habit action, or progress update to create momentum.</p>';
            return;
        }

        mount.innerHTML = items.map((item) => `
            <article class="history-feed-item">
                <div>
                    <p class="history-feed-title">${escapeHtml(item.title)}</p>
                    <p class="history-feed-meta">${escapeHtml(item.entity_type)} • ${escapeHtml(String(item.entry_count))} entries • ${escapeHtml(String(item.current_progress_percent))}% progress</p>
                </div>
                <span class="history-feed-date">${escapeHtml(item.last_entry_date ? formatDate(item.last_entry_date) : 'This week')}</span>
            </article>
        `).join('');
    }

    function renderMisses(items) {
        const mount = document.getElementById('weeklyReviewMisses');
        if (!mount) {
            return;
        }

        if (!Array.isArray(items) || items.length === 0) {
            mount.innerHTML = '<p class="panel-empty-copy">Nothing stalled this week. Every active item has at least one visible touchpoint.</p>';
            return;
        }

        mount.innerHTML = items.map((item) => `
            <article class="history-feed-item">
                <div>
                    <p class="history-feed-title">${escapeHtml(item.title)}</p>
                    <p class="history-feed-meta">${escapeHtml(item.entity_type)} • ${escapeHtml(item.status)} • ${escapeHtml(String(item.current_progress_percent))}% progress</p>
                </div>
                <span class="history-feed-date">No activity</span>
            </article>
        `).join('');
    }

    function renderNotes(summary, staleItems, topItems) {
        const mount = document.getElementById('weeklyReviewNotes');
        if (!mount) {
            return;
        }

        const notes = [];

        if (summary.busiest_day) {
            notes.push(`${formatDate(summary.busiest_day.date)} was the busiest day with ${summary.busiest_day.count} logged entries.`);
        }

        notes.push(`${summary.active_item_count} tracked item${summary.active_item_count === 1 ? '' : 's'} received activity this week.`);

        if (summary.progress_shift > 0) {
            notes.push(`Progress snapshots trended upward by ${formatSignedNumber(summary.progress_shift)} across the week.`);
        } else if (summary.progress_shift < 0) {
            notes.push(`Progress snapshots trended down by ${formatSignedNumber(summary.progress_shift)} across the week.`);
        } else {
            notes.push('Progress snapshots stayed flat across the visible review window.');
        }

        if (staleItems.length > 0) {
            notes.push(`${staleItems.length} active item${staleItems.length === 1 ? '' : 's'} did not receive any activity this week.`);
        } else if (topItems.length > 0) {
            notes.push('No active goals or dreams were left untouched during this review cycle.');
        }

        mount.innerHTML = `
            <div class="weekly-review-note-list">
                ${notes.map((note) => `<p>${escapeHtml(note)}</p>`).join('')}
            </div>
        `;
    }

    async function loadWeeklyReview() {
        requestToken += 1;
        const currentToken = requestToken;
        const data = await app.apiRequest('api/history.php?mode=weekly-review');

        if (currentToken !== requestToken) {
            return;
        }

        if (!data || data.success === false) {
            app.showPageMessage(data?.message || 'Failed to load weekly review.');
            return;
        }

        setText('weeklyReviewActiveDays', String(data.summary?.active_days ?? 0));
        setText('weeklyReviewEntries', String(data.summary?.total_entries ?? 0));
        setText('weeklyReviewTaskWins', String(data.summary?.task_completions ?? 0));
        setText('weeklyReviewHabitWins', String(data.summary?.habit_actions ?? 0));
        setText('weeklyReviewProgressShift', formatSignedNumber(data.summary?.progress_shift ?? 0));

        const rangeCopy = document.getElementById('weeklyReviewRangeCopy');
        if (rangeCopy && data.range?.start && data.range?.end) {
            rangeCopy.textContent = `${formatDate(data.range.start)} to ${formatDate(data.range.end, true)} across goals and dreams.`;
        }

        const wins = Array.isArray(data.wins) ? data.wins : [];
        const staleEntities = Array.isArray(data.stale_entities) ? data.stale_entities : [];

        renderWins(wins);
        renderMisses(staleEntities);
        renderNotes(data.summary || {}, staleEntities, wins);
    }

    panel.addEventListener('history:loaded', () => {
        loadWeeklyReview();
    });

    window.ProgressionHistory?.initDashboard('#weeklyReviewHistory');
});
