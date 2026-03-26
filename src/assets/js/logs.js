document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('logSearch');
    const actionFilter = document.getElementById('logActionFilter');
    const targetFilter = document.getElementById('logTargetFilter');
    const clearButton = document.getElementById('logClearFilters');
    const summary = document.getElementById('logFilterSummary');
    const emptyState = document.getElementById('logFilterEmpty');
    const logCards = Array.from(document.querySelectorAll('.log-card'));

    if (!searchInput || !actionFilter || !targetFilter || !clearButton || logCards.length === 0) {
        return;
    }

    const totalCount = logCards.length;

    function normalizeValue(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function syncFiltersFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const action = normalizeValue(params.get('action'));
        const target = normalizeValue(params.get('target'));

        if (typeof query === 'string') {
            searchInput.value = query.trim();
        }

        if (action && Array.from(actionFilter.options).some((option) => option.value === action)) {
            actionFilter.value = action;
        }

        if (target && Array.from(targetFilter.options).some((option) => option.value === target)) {
            targetFilter.value = target;
        }
    }

    function syncQueryString(query, action, target) {
        const params = new URLSearchParams(window.location.search);

        if (query) {
            params.set('q', query);
        } else {
            params.delete('q');
        }

        if (action) {
            params.set('action', action);
        } else {
            params.delete('action');
        }

        if (target) {
            params.set('target', target);
        } else {
            params.delete('target');
        }

        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
        window.history.replaceState({}, '', nextUrl);
    }

    function filterLogs() {
        const query = normalizeValue(searchInput.value);
        const selectedAction = normalizeValue(actionFilter.value);
        const selectedTarget = normalizeValue(targetFilter.value);
        let visibleCount = 0;

        logCards.forEach((card) => {
            const action = normalizeValue(card.dataset.logAction);
            const targetType = normalizeValue(card.dataset.logTargetType);
            const searchIndex = normalizeValue(card.dataset.logSearchIndex);

            const matchesAction = !selectedAction || action === selectedAction;
            const matchesTarget = !selectedTarget || targetType === selectedTarget;
            const matchesQuery = !query || searchIndex.includes(query);

            const isVisible = matchesAction && matchesTarget && matchesQuery;
            card.hidden = !isVisible;

            if (isVisible) {
                visibleCount += 1;
            }
        });

        const hasActiveFilters = Boolean(query || selectedAction || selectedTarget);

        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }

        if (summary) {
            summary.textContent = !hasActiveFilters
                ? `Showing all ${visibleCount} logs`
                : `Showing ${visibleCount} of ${totalCount} logs`;
        }

        clearButton.disabled = !hasActiveFilters;
        syncQueryString(query, selectedAction, selectedTarget);
    }

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        actionFilter.value = '';
        targetFilter.value = '';
        filterLogs();
        searchInput.focus();
    });

    searchInput.addEventListener('input', filterLogs);
    actionFilter.addEventListener('change', filterLogs);
    targetFilter.addEventListener('change', filterLogs);

    syncFiltersFromQuery();
    filterLogs();
});
