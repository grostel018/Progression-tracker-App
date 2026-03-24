document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('logSearch');
    const actionFilter = document.getElementById('logActionFilter');
    const summary = document.getElementById('logFilterSummary');
    const logCards = Array.from(document.querySelectorAll('.log-card'));

    if (!searchInput || !actionFilter || logCards.length === 0) {
        return;
    }

    // Build action type options from rendered cards
    const actions = [...new Set(logCards.map((card) => {
        return card.querySelector('.log-action')?.textContent?.trim() || '';
    }).filter(Boolean))].sort();

    actions.forEach((action) => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = action;
        actionFilter.appendChild(option);
    });

    function filterLogs() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedAction = actionFilter.value;
        let visibleCount = 0;

        logCards.forEach((card) => {
            const action = card.querySelector('.log-action')?.textContent?.trim() || '';
            const target = card.querySelector('.log-target')?.textContent?.toLowerCase() || '';
            const details = card.querySelector('.log-details, .log-details-list')?.textContent?.toLowerCase() || '';

            const matchesAction = !selectedAction || action === selectedAction;
            const matchesQuery = !query || action.toLowerCase().includes(query) || target.includes(query) || details.includes(query);

            const isVisible = matchesAction && matchesQuery;
            card.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (summary) {
            summary.textContent = visibleCount === logCards.length
                ? `Showing all ${visibleCount} logs`
                : `Showing ${visibleCount} of ${logCards.length} logs`;
        }
    }

    searchInput.addEventListener('input', filterLogs);
    actionFilter.addEventListener('change', filterLogs);
    filterLogs();
});
