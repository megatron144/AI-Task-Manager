/**
 * AI TASK MANAGER - PRODUCTIVITY ANALYTICS & SVG CHARTS
 */

class AnalyticsController {
  init() {
    this.container = document.getElementById('analytics-view');
  }

  async render() {
    if (!this.container) return;

    try {
      const stats = await window.api.getAnalytics();
      this.renderKPIs(stats);
      this.renderVelocityChart(stats);
      this.renderProjectBreakdown(stats.projectStats || []);
      this.renderAchievements(stats);
    } catch (err) {
      console.error('Error rendering analytics:', err);
    }
  }

  renderKPIs(stats) {
    const scoreVal = document.getElementById('stat-productivity-score');
    const compRate = document.getElementById('stat-completion-rate');
    const focusHours = document.getElementById('stat-focus-hours');
    const overdueCount = document.getElementById('stat-overdue-count');

    if (scoreVal) scoreVal.textContent = `${stats.productivityScore}/100`;
    if (compRate) compRate.textContent = `${stats.completionRate}%`;
    if (focusHours) focusHours.textContent = `${stats.totalSpentHours}h`;
    if (overdueCount) overdueCount.textContent = stats.overdue;
  }

  renderVelocityChart(stats) {
    const svgEl = document.getElementById('velocity-chart-svg');
    if (!svgEl) return;

    // Generate mock/real 7-day velocity series
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [2, 4, 3, 6, 5, 8, stats.completed || 7];
    const maxVal = Math.max(...values, 10);

    const width = 500;
    const height = 180;
    const padding = 30;

    const points = values.map((val, idx) => {
      const x = padding + (idx * (width - 2 * padding) / (days.length - 1));
      const y = height - padding - (val / maxVal * (height - 2 * padding));
      return { x, y, val, day: days[idx] };
    });

    const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    svgEl.innerHTML = `
      <defs>
        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--border-subtle)" stroke-width="1" />
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="4" />

      <!-- Area fill -->
      <path d="${areaD}" fill="url(#chartGrad)" />

      <!-- Line stroke -->
      <path d="${pathD}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />

      <!-- Data Dots & Labels -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#8b5cf6" stroke="#ffffff" stroke-width="2" />
        <text x="${p.x}" y="${height - 10}" fill="var(--text-muted)" font-size="10" font-family="Inter" text-anchor="middle">${p.day}</text>
      `).join('')}
    `;
  }

  renderProjectBreakdown(projectStats) {
    const listEl = document.getElementById('project-progress-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (projectStats.length === 0) {
      listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No projects created yet.</div>';
      return;
    }

    projectStats.forEach(p => {
      const item = document.createElement('div');
      item.className = 'project-progress-item';
      item.innerHTML = `
        <div class="project-progress-meta">
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="project-dot" style="background: ${p.color}; color: ${p.color};"></span>
            ${this.escapeHtml(p.name)}
          </span>
          <span style="color: var(--text-secondary); font-size: 0.78rem;">${p.completed}/${p.total} (${p.percentage}%)</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${p.percentage}%; background: ${p.color};"></div>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  renderAchievements(stats) {
    const gridEl = document.getElementById('achievements-grid');
    if (!gridEl) return;

    const badges = [
      { icon: '🚀', title: 'Momentum Builder', desc: 'Completed initial tasks and projects', unlocked: stats.completed > 0 },
      { icon: '🧠', title: 'Neural Flow', desc: 'Decomposed goals with AI assistance', unlocked: true },
      { icon: '⚡', title: 'Focus Champion', desc: 'Dedicated focus blocks with Pomodoro', unlocked: stats.totalSpentHours > 0 },
      { icon: '🛡️', title: 'Zero Overdue', desc: 'Maintained clean on-time schedule', unlocked: stats.overdue === 0 }
    ];

    gridEl.innerHTML = badges.map(b => `
      <div class="achievement-badge-card" style="${b.unlocked ? '' : 'opacity: 0.5; filter: grayscale(1);'}">
        <div class="badge-icon-box">${b.icon}</div>
        <div>
          <div class="badge-title">${b.title}</div>
          <div class="badge-subtitle">${b.desc}</div>
        </div>
      </div>
    `).join('');
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.analyticsController = new AnalyticsController();
