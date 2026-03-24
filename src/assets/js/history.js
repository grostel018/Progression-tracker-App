(function () {
    let resizeBound = false;

    function getApp() {
        return window.dashboardApp;
    }

    function getPanelScope(panel) {
        return panel?.dataset.historyScope || 'dashboard';
    }

    function getPanelEntityId(panel) {
        const raw = panel?.dataset.entityId;
        return raw ? Number.parseInt(raw, 10) : null;
    }

    function todayIso() {
        return new Date().toISOString().split('T')[0];
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(date, options = {}) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: options.includeYear === false ? undefined : 'numeric',
        }).format(new Date(`${date}T00:00:00`));
    }

    function formatEntryDateTime(createdAt) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(createdAt));
    }

    function intensityLabel(intensity) {
        return ['No activity', 'Very light', 'Light', 'Medium', 'Dark'][intensity] || 'No activity';
    }

    function getModalElements() {
        const root = document.getElementById('historyModal');
        const body = document.getElementById('historyModalBody');
        return { root, body };
    }

    function closeModal() {
        const { root, body } = getModalElements();
        if (!root || !body) {
            return;
        }

        root.hidden = true;
        root.removeAttribute('data-date');
        root.removeAttribute('data-scope');
        root.removeAttribute('data-entity-id');
        body.innerHTML = '';
    }

    function setModalContext(panel, date) {
        const { root } = getModalElements();
        if (!root) {
            return;
        }

        root.dataset.date = date;
        root.dataset.scope = getPanelScope(panel);
        const entityId = getPanelEntityId(panel);

        if (entityId) {
            root.dataset.entityId = String(entityId);
        } else {
            root.removeAttribute('data-entity-id');
        }
    }

    function buildOverviewUrl(panel, range) {
        const params = new URLSearchParams({
            scope: getPanelScope(panel),
            range,
        });

        const entityId = getPanelEntityId(panel);
        if (entityId) {
            params.set('id', String(entityId));
        }

        return `api/history.php?${params.toString()}`;
    }

    function buildDayUrl(panel, date) {
        const params = new URLSearchParams({
            mode: 'day',
            scope: getPanelScope(panel),
            date,
        });

        const entityId = getPanelEntityId(panel);
        if (entityId) {
            params.set('id', String(entityId));
        }

        return `api/history.php?${params.toString()}`;
    }

    async function loadPanel(panel, range = null) {
        const app = getApp();
        if (!panel || !app) {
            return;
        }

        if (getPanelScope(panel) !== 'dashboard' && !getPanelEntityId(panel)) {
            renderIdlePanel(panel);
            return;
        }

        const nextRange = range || panel.dataset.activeRange || panel.dataset.defaultRange || '30d';
        const data = await app.apiRequest(buildOverviewUrl(panel, nextRange));

        if (!data || data.success === false) {
            app.showPageMessage(data?.message || 'Failed to load activity history.');
            return;
        }

        panel.dataset.activeRange = data.range_key;
        panel.__historyOverview = data;
        renderOverview(panel, data);
    }

    function renderOverview(panel, data) {
        const heatmapMount = panel.querySelector('[data-role="heatmap"]');
        const chartMount = panel.querySelector('[data-role="chart"]');
        const recentFeed = panel.querySelector('[data-role="recent-feed"]');

        updateRangeSwitch(panel, data.range_key);
        renderHeatmap(heatmapMount, data.heatmap, data.range_key, panel);
        renderChart(chartMount, data.progress);

        if (panel.dataset.historyScope === 'dashboard') {
            renderDashboardSummaries(panel, data);
        } else {
            renderRecentFeed(recentFeed, data.recent_entries, false);
        }

        panel.dispatchEvent(new CustomEvent('history:loaded', { detail: data }));
    }

    function renderIdlePanel(panel) {
        const heatmapMount = panel.querySelector('[data-role="heatmap"]');
        const chartMount = panel.querySelector('[data-role="chart"]');
        const recentFeed = panel.querySelector('[data-role="recent-feed"]');
        const label = panel.dataset.entityLabel || 'item';

        if (heatmapMount) {
            heatmapMount.innerHTML = `<p class="panel-empty-copy">Select a ${escapeHtml(label)} to load its activity.</p>`;
        }

        if (chartMount) {
            chartMount.innerHTML = `<p class="panel-empty-copy">Select a ${escapeHtml(label)} to load its progress timeline.</p>`;
        }

        if (recentFeed) {
            recentFeed.innerHTML = `<p class="panel-empty-copy">Recent ${escapeHtml(label)} history will appear here once one is selected.</p>`;
        }
    }

    function updateRangeSwitch(panel, activeRange) {
        panel.querySelectorAll('[data-range-switch] .range-chip').forEach((button) => {
            const isActive = button.dataset.range === activeRange;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function getCalendarLayout(rangeKey, weekCount, containerWidth) {
        const configs = {
            year: { maxCell: 10, minCell: 6, gap: 3, weekdayWidth: 28 },
            month: { maxCell: 16, minCell: 9, gap: 4, weekdayWidth: 34 },
            '30d': { maxCell: 16, minCell: 9, gap: 4, weekdayWidth: 34 },
        };

        const config = configs[rangeKey] || configs.month;
        const width = Math.max(containerWidth || 0, 240);
        const gapsWidth = Math.max(weekCount - 1, 0) * config.gap;
        const availableWidth = Math.max(width - config.weekdayWidth - gapsWidth, weekCount);
        const fittedCellSize = Math.floor(availableWidth / Math.max(weekCount, 1));
        const cellSize = Math.min(config.maxCell, Math.max(config.minCell, fittedCellSize));
        const contentWidth = (weekCount * cellSize) + gapsWidth;

        return {
            cellSize,
            contentWidth,
            gap: config.gap,
            weekdayWidth: config.weekdayWidth,
        };
    }

    function buildMonthMarkers(cells, layout) {
        const labelWidth = 28;
        const minGap = 6;
        let lastEnd = -Infinity;

        return cells
            .filter((cell, index) => cell.day_of_month === '1' || index === 0)
            .map((cell) => {
                const weekIndex = Number(cell.week_index);
                const idealLeft = weekIndex * (layout.cellSize + layout.gap);
                const maxLeft = Math.max(layout.contentWidth - labelWidth, 0);
                const left = Math.max(0, Math.min(maxLeft, Math.max(idealLeft, lastEnd + minGap)));
                lastEnd = left + labelWidth;

                return {
                    label: cell.month_label,
                    left,
                };
            });
    }

    function renderDashboardSummaries(panel, data) {
        const goalSummary = panel.querySelector('[data-role="goals-summary"]');
        const dreamSummary = panel.querySelector('[data-role="dreams-summary"]');
        const feedCard = panel.querySelector('[data-role="recent-feed"]');

        if (goalSummary) {
            goalSummary.innerHTML = `
                <p class="section-kicker">Goals</p>
                <h3>${escapeHtml(String(data.breakdown.goals.tracked_items))} tracked goals</h3>
                <p>${escapeHtml(String(data.breakdown.goals.total_entries))} entries across ${escapeHtml(String(data.breakdown.goals.active_days))} active days.</p>
                <p class="analytics-caption">Last entry: ${escapeHtml(data.breakdown.goals.last_entry_date ? formatDate(data.breakdown.goals.last_entry_date) : 'No activity yet')}</p>
            `;
        }

        if (dreamSummary) {
            dreamSummary.innerHTML = `
                <p class="section-kicker">Dreams</p>
                <h3>${escapeHtml(String(data.breakdown.dreams.tracked_items))} tracked dreams</h3>
                <p>${escapeHtml(String(data.breakdown.dreams.total_entries))} entries across ${escapeHtml(String(data.breakdown.dreams.active_days))} active days.</p>
                <p class="analytics-caption">Last entry: ${escapeHtml(data.breakdown.dreams.last_entry_date ? formatDate(data.breakdown.dreams.last_entry_date) : 'No activity yet')}</p>
            `;
        }

        renderRecentFeed(feedCard, data.recent_entries, true);
        panel.__availableEntities = data.available_entities || { goals: [], dreams: [] };
    }

    function renderRecentFeed(container, entries, dashboardMode) {
        if (!container) {
            return;
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            container.innerHTML = `
                <p class="section-kicker">Recent Activity</p>
                <h3>No history yet</h3>
                <p class="panel-empty-copy">Start logging progress, tasks, or habit actions to build a visible timeline.</p>
            `;
            return;
        }

        const items = entries.map((entry) => `
            <article class="history-feed-item">
                <div>
                    <p class="history-feed-title">${escapeHtml(entry.entity_title || 'Tracked item')}</p>
                    <p class="history-feed-meta">${escapeHtml(entry.entry_type_label)}${entry.progress_percent !== null ? ` • ${escapeHtml(String(entry.progress_percent))}%` : ''}</p>
                </div>
                <span class="history-feed-date">${escapeHtml(formatDate(entry.entry_date, { includeYear: false }))}</span>
            </article>
        `).join('');

        container.innerHTML = `
            <p class="section-kicker">Recent Activity</p>
            <h3>${dashboardMode ? 'Latest entries across your workspace' : 'Latest entries for this item'}</h3>
            <div class="history-feed-list">${items}</div>
        `;
    }

    function renderHeatmap(container, heatmap, rangeKey, panel) {
        if (!container) {
            return;
        }

        const cells = Array.isArray(heatmap?.cells) ? heatmap.cells : [];
        const activeDays = Number(heatmap?.active_days || 0);
        const totalEntries = Number(heatmap?.total_entries || 0);

        if (cells.length === 0 || activeDays === 0) {
            container.innerHTML = `
                <div class="panel-empty-state">
                    <p class="panel-empty-copy">No tracked activity yet for this range.</p>
                    <p class="analytics-caption">Add a manual log, complete a task, or record a habit action to start the calendar.</p>
                </div>
            `;
            return;
        }

        const summary = `
            <div class="heatmap-summary-row">
                <span>${escapeHtml(String(totalEntries))} total entries</span>
                <span>${escapeHtml(String(activeDays))} active days</span>
            </div>
        `;

        if (rangeKey === 'week') {
            const cards = cells.map((cell) => `
                <button type="button" class="week-activity-card intensity-${cell.intensity}" data-history-date="${cell.date}" title="${escapeHtml(cell.long_label)} • ${escapeHtml(String(cell.count))} entries">
                    <span class="week-activity-day">${escapeHtml(cell.weekday_label)}</span>
                    <span class="week-activity-date">${escapeHtml(cell.month_label)} ${escapeHtml(String(cell.day_of_month))}</span>
                    <span class="week-activity-count">${escapeHtml(String(cell.count))}</span>
                    <span class="week-activity-meter"><span style="width:${Math.min(100, cell.count * 20)}%"></span></span>
                </button>
            `).join('');

            container.innerHTML = `
                ${summary}
                <div class="week-activity-grid">${cards}</div>
                ${buildLegend()}
            `;
            return;
        }

        const weekCount = Math.max(...cells.map((cell) => Number(cell.week_index)), 0) + 1;
        const layout = getCalendarLayout(rangeKey, weekCount, container.clientWidth);
        const monthMarkers = buildMonthMarkers(cells, layout)
            .map((marker) => `<span class="heatmap-month-marker" style="position:absolute; left:${marker.left}px; top:0;">${escapeHtml(marker.label)}</span>`)
            .join('');
        const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            .map((label) => `<span>${label}</span>`)
            .join('');
        const buttons = cells.map((cell) => `
            <button type="button" class="heatmap-day intensity-${cell.intensity}${cell.is_today ? ' is-today' : ''}" data-history-date="${cell.date}" title="${escapeHtml(cell.long_label)} • ${escapeHtml(String(cell.count))} entries">
                <span class="sr-only">${escapeHtml(cell.long_label)}: ${escapeHtml(String(cell.count))} entries</span>
            </button>
        `).join('');

        container.innerHTML = `
            ${summary}
            <div
                class="heatmap-calendar-shell"
                data-range="${escapeHtml(rangeKey)}"
                style="--heatmap-cell-size:${layout.cellSize}px; --heatmap-gap:${layout.gap}px; --heatmap-weekday-width:${layout.weekdayWidth}px; --heatmap-content-width:${layout.contentWidth}px;"
            >
                <div class="heatmap-month-row">
                    <div class="heatmap-month-spacer" aria-hidden="true"></div>
                    <div class="heatmap-month-markers">${monthMarkers}</div>
                </div>
                <div class="heatmap-frame-grid">
                    <div class="heatmap-weekday-labels">${weekdayLabels}</div>
                    <div class="heatmap-grid" style="grid-template-columns: repeat(${weekCount}, var(--heatmap-cell-size));">${buttons}</div>
                </div>
            </div>
            ${buildLegend()}
        `;
    }

    function buildLegend() {
        return `
            <div class="heatmap-legend">
                <span>Less</span>
                <i class="legend-chip intensity-0"></i>
                <i class="legend-chip intensity-1"></i>
                <i class="legend-chip intensity-2"></i>
                <i class="legend-chip intensity-3"></i>
                <i class="legend-chip intensity-4"></i>
                <span>More</span>
            </div>
        `;
    }

    function renderChart(container, progress) {
        if (!container) {
            return;
        }

        const points = Array.isArray(progress?.points) ? progress.points : [];
        if (points.length === 0) {
            container.innerHTML = `
                <div class="panel-empty-state">
                    <p class="panel-empty-copy">No progress snapshots yet.</p>
                    <p class="analytics-caption">Add a log with an optional progress percentage to build the line chart.</p>
                </div>
            `;
            return;
        }

        const width = 640;
        const height = 220;
        const padding = { top: 18, right: 18, bottom: 28, left: 34 };
        const xStep = points.length === 1 ? 0 : (width - padding.left - padding.right) / (points.length - 1);
        const yFor = (value) => padding.top + ((100 - value) / 100) * (height - padding.top - padding.bottom);
        const linePoints = points.map((point, index) => `${padding.left + (index * xStep)},${yFor(point.progress_percent)}`);
        const dots = points.map((point, index) => {
            const x = padding.left + (index * xStep);
            const y = yFor(point.progress_percent);
            return `<circle cx="${x}" cy="${y}" r="4" class="history-chart-dot"><title>${escapeHtml(formatDate(point.date))} • ${escapeHtml(String(point.progress_percent))}%</title></circle>`;
        }).join('');
        const yLabels = [0, 25, 50, 75, 100].map((value) => {
            const y = yFor(value);
            return `<g class="history-chart-axis"><line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line><text x="0" y="${y + 4}">${value}</text></g>`;
        }).join('');
        const footer = `
            <div class="chart-caption-row">
                <span>${escapeHtml(formatDate(points[0].date, { includeYear: false }))}</span>
                <span>${escapeHtml(formatDate(points[points.length - 1].date, { includeYear: false }))}</span>
            </div>
        `;

        container.innerHTML = `
            <div class="history-chart-shell">
                <svg viewBox="0 0 ${width} ${height}" class="history-chart" aria-label="Progress over time">
                    ${yLabels}
                    <polyline class="history-chart-line" points="${linePoints.join(' ')}"></polyline>
                    ${dots}
                </svg>
                ${footer}
            </div>
        `;
    }

    async function openDayModal(panel, date) {
        const app = getApp();
        const { root, body } = getModalElements();
        if (!app || !root || !body) {
            return;
        }

        setModalContext(panel, date);
        root.hidden = false;
        body.innerHTML = '<div class="panel-empty-state"><p class="panel-empty-copy">Loading day details…</p></div>';

        const data = await app.apiRequest(buildDayUrl(panel, date));
        if (!data || data.success === false) {
            body.innerHTML = `<div class="panel-empty-state"><p class="panel-empty-copy">${escapeHtml(data?.message || 'Failed to load day details.')}</p></div>`;
            return;
        }

        renderDayModal(panel, data);
    }

    function renderDayModal(panel, data) {
        const { body } = getModalElements();
        if (!body) {
            return;
        }

        const entries = Array.isArray(data.entries) ? data.entries : [];
        const entriesHtml = entries.length > 0
            ? entries.map((entry) => `
                <article class="day-entry-card">
                    <div class="day-entry-head">
                        <div>
                            <p class="day-entry-type">${escapeHtml(entry.entry_type_label)}</p>
                            <h3>${escapeHtml(entry.entity_title || 'Tracked item')}</h3>
                        </div>
                        <span class="day-entry-time">${escapeHtml(formatEntryDateTime(entry.created_at))}</span>
                    </div>
                    ${entry.related_label ? `<p class="analytics-caption">${escapeHtml(entry.related_label)}</p>` : ''}
                    ${entry.content ? `<p class="day-entry-content">${escapeHtml(entry.content)}</p>` : ''}
                    ${entry.progress_percent !== null ? `<p class="day-entry-progress">Progress snapshot: ${escapeHtml(String(entry.progress_percent))}%</p>` : ''}
                </article>
            `).join('')
            : '<div class="panel-empty-state"><p class="panel-empty-copy">No entries for this day yet.</p><p class="analytics-caption">Use the form below to backfill the timeline.</p></div>';

        body.innerHTML = `
            <div class="history-modal-section">
                <p class="section-kicker">${escapeHtml(formatDate(data.date))}</p>
                <h3>${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</h3>
                <div class="day-entry-list">${entriesHtml}</div>
            </div>
            ${buildDayForm(panel, data)}
        `;
    }

    function buildDayForm(panel, data) {
        const scope = getPanelScope(panel);
        const entityId = getPanelEntityId(panel);
        const targetSelect = scope === 'dashboard'
            ? buildTargetSelect(data.form_defaults?.available_entities || { goals: [], dreams: [] })
            : `<input type="hidden" name="entity_type" value="${escapeHtml(scope)}"><input type="hidden" name="entity_id" value="${escapeHtml(String(entityId))}">`;
        const title = scope === 'dashboard'
            ? 'Add Entry For This Date'
            : `Add Entry For ${escapeHtml(data.form_defaults?.entity_title || 'This Item')}`;

        return `
            <section class="history-modal-section history-modal-form-section">
                <p class="section-kicker">New Activity</p>
                <h3>${title}</h3>
                <form class="history-entry-form" data-history-entry-form>
                    <input type="hidden" name="entry_date" value="${escapeHtml(data.date)}">
                    ${targetSelect}
                    <div class="inputs composer-span-full">
                        <label for="history-note">Note</label>
                        <textarea id="history-note" name="note" rows="4" placeholder="Describe the progress, outcome, or context."></textarea>
                    </div>
                    <div class="inputs history-progress-input-wrap">
                        <label for="history-progress">Progress %</label>
                        <input type="number" id="history-progress" name="progress_percent" min="0" max="100" step="1" placeholder="Optional">
                    </div>
                    <div class="composer-actions">
                        <button type="submit" class="btn-primary">Save Entry</button>
                    </div>
                    <p class="form-message" data-history-entry-message hidden aria-live="polite"></p>
                </form>
            </section>
        `;
    }

    function buildTargetSelect(availableEntities) {
        const goalOptions = (availableEntities.goals || []).map((goal) => `<option value="goal:${goal.id}">Goal / ${escapeHtml(goal.title)}</option>`).join('');
        const dreamOptions = (availableEntities.dreams || []).map((dream) => `<option value="dream:${dream.id}">Dream / ${escapeHtml(dream.title)}</option>`).join('');

        return `
            <div class="inputs composer-span-full">
                <label for="history-target">Target item</label>
                <select id="history-target" name="target_entity" required>
                    <option value="">Select goal or dream</option>
                    ${goalOptions}
                    ${dreamOptions}
                </select>
            </div>
        `;
    }

    async function handleDayEntrySubmit(event) {
        const app = getApp();
        if (!app) {
            return;
        }

        const form = event.target.closest('[data-history-entry-form]');
        if (!form) {
            return;
        }

        event.preventDefault();
        const message = form.querySelector('[data-history-entry-message]');
        app.setMessage(message, '');

        const formData = new FormData(form);
        let entityType = formData.get('entity_type');
        let entityId = formData.get('entity_id');

        if (!entityType || !entityId) {
            const targetEntity = String(formData.get('target_entity') || '');
            const [targetType, targetId] = targetEntity.split(':');
            entityType = targetType;
            entityId = targetId;
        }

        const result = await app.apiRequest('api/history.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                entity_type: entityType,
                entity_id: Number(entityId),
                entry_date: formData.get('entry_date'),
                note: formData.get('note'),
                progress_percent: formData.get('progress_percent'),
            }),
        });

        if (!result || result.success === false) {
            app.setMessage(message, result?.message || 'Failed to save history entry.');
            return;
        }

        app.setMessage(message, result.message || 'History entry saved.', 'success');
        const { root } = getModalElements();
        const scope = root?.dataset.scope || 'dashboard';
        const entityIdValue = root?.dataset.entityId ? Number(root.dataset.entityId) : null;
        const panel = document.querySelector(
            scope === 'dashboard'
                ? '[data-history-scope="dashboard"]'
                : `[data-history-scope="${scope}"][data-entity-id="${entityIdValue}"]`
        );

        if (panel) {
            await loadPanel(panel, panel.dataset.activeRange || panel.dataset.defaultRange || '30d');
            await openDayModal(panel, String(formData.get('entry_date')));
        }
    }

    function bindPanel(panel) {
        if (!panel || panel.dataset.historyBound === 'true') {
            return;
        }

        panel.dataset.historyBound = 'true';

        panel.addEventListener('click', (event) => {
            const rangeButton = event.target.closest('.range-chip');
            if (rangeButton && panel.contains(rangeButton)) {
                loadPanel(panel, rangeButton.dataset.range);
                return;
            }

            const dayButton = event.target.closest('[data-history-date]');
            if (dayButton && panel.contains(dayButton)) {
                openDayModal(panel, dayButton.dataset.historyDate);
                return;
            }

            const addButton = event.target.closest('.history-log-trigger');
            if (addButton && panel.contains(addButton)) {
                if (getPanelScope(panel) !== 'dashboard' && !getPanelEntityId(panel)) {
                    return;
                }
                openDayModal(panel, todayIso());
            }
        });
    }

    function bindWindowResize() {
        if (resizeBound) {
            return;
        }

        resizeBound = true;
        let frame = 0;

        window.addEventListener('resize', () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                document.querySelectorAll('[data-history-bound="true"]').forEach((panel) => {
                    if (panel.__historyOverview) {
                        renderOverview(panel, panel.__historyOverview);
                    }
                });
            });
        });
    }

    function ensurePanelReady(panel) {
        if (!panel) {
            return false;
        }

        bindPanel(panel);
        bindModal();
        bindWindowResize();
        return true;
    }

    function bindModal() {
        const { root, body } = getModalElements();
        if (!root || root.dataset.bound === 'true') {
            return;
        }

        root.dataset.bound = 'true';

        root.addEventListener('click', (event) => {
            if (event.target.closest('[data-history-close]')) {
                closeModal();
            }
        });

        body?.addEventListener('submit', handleDayEntrySubmit);
    }

    function initPanelSet(selector) {
        document.querySelectorAll(selector).forEach((panel) => {
            ensurePanelReady(panel);
            loadPanel(panel);
        });
    }

    window.ProgressionHistory = {
        initDashboard(selector = '#dashboardHistory') {
            initPanelSet(selector);
        },
        initEntityPanels(selector) {
            initPanelSet(selector);
        },
        refreshPanel(panel) {
            if (!ensurePanelReady(panel)) {
                return Promise.resolve();
            }
            return loadPanel(panel);
        },
        setEntity(panel, entityId) {
            if (!ensurePanelReady(panel)) {
                return;
            }

            if (entityId) {
                panel.dataset.entityId = String(entityId);
            } else {
                delete panel.dataset.entityId;
            }
        },
    };
})();
