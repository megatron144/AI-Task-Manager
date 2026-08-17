/**
 * AI TASK MANAGER - LIST, EISENHOWER MATRIX & CALENDAR VIEWS
 */

class ViewsController {
  constructor() {
    this.currentCalendarDate = new Date();
    this.draggedMatrixTaskId = null;
  }

  init() {
    this.bindEvents();

    window.state.on('tasks:changed', () => this.renderActiveView());
    window.state.on('filter:changed', () => this.renderActiveView());
    window.state.on('view:changed', () => this.renderActiveView());
  }

  bindEvents() {
    // Calendar Navigation
    const prevMonthBtn = document.getElementById('cal-prev-month');
    const nextMonthBtn = document.getElementById('cal-next-month');
    const todayBtn = document.getElementById('cal-today-btn');

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentCalendarDate = new Date();
        this.renderCalendar();
      });
    }

    // Eisenhower Matrix Drop Targets
    const quadrants = document.querySelectorAll('.matrix-quadrant');
    quadrants.forEach(q => {
      q.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        q.classList.add('drag-over');
      });

      q.addEventListener('dragleave', (e) => {
        if (!q.contains(e.relatedTarget)) {
          q.classList.remove('drag-over');
        }
      });

      q.addEventListener('drop', async (e) => {
        e.preventDefault();
        q.classList.remove('drag-over');
        const targetQuadrant = q.dataset.quadrant;
        if (this.draggedMatrixTaskId && targetQuadrant) {
          await this.handleMatrixDrop(this.draggedMatrixTaskId, targetQuadrant);
        }
      });
    });
  }

  renderActiveView() {
    const view = window.state.activeView;
    if (view === 'list') this.renderList();
    if (view === 'matrix') this.renderMatrix();
    if (view === 'calendar') this.renderCalendar();
    if (view === 'analytics' && window.analyticsController) window.analyticsController.render();
  }

  // ==========================================
  // 1. LIST VIEW RENDERER
  // ==========================================
  renderList() {
    const bodyEl = document.getElementById('list-table-body');
    if (!bodyEl) return;

    const tasks = window.state.getFilteredTasks();
    bodyEl.innerHTML = '';

    if (tasks.length === 0) {
      bodyEl.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.9rem;">
          No matching tasks found.
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const isDone = task.status === 'completed';
      const project = window.state.getProjectById(task.projectId);
      const row = document.createElement('div');
      row.className = `list-table-row ${isDone ? 'completed-row' : ''}`;

      row.innerHTML = `
        <div>
          <div class="custom-checkbox ${isDone ? 'checked' : ''}" data-task-id="${task.id}">
            ${isDone ? '✓' : ''}
          </div>
        </div>
        <div class="task-title-cell font-medium" style="font-weight: 600;">
          ${this.escapeHtml(task.title)}
          ${task.aiGenerated ? `<span class="ai-pill" style="margin-left: 0.5rem;">✨ AI</span>` : ''}
        </div>
        <div>
          <span class="badge badge-${task.priority}">${task.priority}</span>
        </div>
        <div>
          <span style="font-size: 0.78rem; text-transform: capitalize; color: var(--text-secondary); font-weight: 600;">
            ${task.status.replace('-', ' ')}
          </span>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.35rem;">
            <span class="project-dot" style="background: ${project ? project.color : '#9ca3af'}"></span>
            ${project ? this.escapeHtml(project.name) : 'General'}
          </span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${task.dueDate || '—'}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ⏱️ ${task.estimatedMinutes || 30}m
        </div>
        <div style="display: flex; gap: 0.25rem;">
          <button class="card-action-btn edit-row-btn" title="Edit">✏️</button>
          <button class="card-action-btn delete-row-btn" title="Delete">🗑️</button>
        </div>
      `;

      // Checkbox toggle
      const cb = row.querySelector('.custom-checkbox');
      cb.addEventListener('click', async (e) => {
        e.stopPropagation();
        window.soundEngine.playClick();
        const updated = await window.api.toggleTask(task.id);
        window.state.updateTaskInState(updated);
        if (updated.status === 'completed') {
          window.soundEngine.playComplete();
          window.showToast(`Completed "${task.title}"`, 'success');
        }
      });

      // Edit click
      row.addEventListener('click', () => {
        window.openTaskModal({ taskId: task.id });
      });

      // Delete action
      const delBtn = row.querySelector('.delete-row-btn');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete task "${task.title}"?`)) {
          await window.api.deleteTask(task.id);
          window.state.removeTaskFromState(task.id);
          window.showToast('Task deleted', 'info');
        }
      });

      bodyEl.appendChild(row);
    });
  }

  // ==========================================
  // 2. EISENHOWER MATRIX RENDERER
  // ==========================================
  renderMatrix() {
    const quadrants = ['do-first', 'schedule', 'delegate', 'dont-do'];
    const tasks = window.state.getFilteredTasks();

    quadrants.forEach(qKey => {
      const container = document.querySelector(`.quadrant-cards[data-quadrant="${qKey}"]`);
      const countEl = document.querySelector(`.matrix-quadrant[data-quadrant="${qKey}"] .column-count`);
      if (!container) return;

      const qTasks = tasks.filter(t => (t.quadrant === qKey || (!t.quadrant && this._inferQuadrant(t.priority) === qKey)) && t.status !== 'completed');
      if (countEl) countEl.textContent = qTasks.length;

      container.innerHTML = '';

      if (qTasks.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.78rem;">
            No items in this quadrant
          </div>
        `;
        return;
      }

      qTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.priority}-border`;
        card.draggable = true;
        card.dataset.taskId = task.id;

        card.innerHTML = `
          <div class="card-title" style="font-size: 0.85rem;">${this.escapeHtml(task.title)}</div>
          <div class="card-footer" style="padding-top: 0.35rem;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">📅 ${task.dueDate || 'No date'}</span>
            <span class="badge badge-${task.priority}">${task.priority}</span>
          </div>
        `;

        card.addEventListener('dragstart', (e) => {
          this.draggedMatrixTaskId = task.id;
          card.classList.add('dragging');
          e.dataTransfer.setData('text/plain', task.id);
        });

        card.addEventListener('dragend', () => {
          this.draggedMatrixTaskId = null;
          card.classList.remove('dragging');
        });

        card.addEventListener('click', () => {
          window.openTaskModal({ taskId: task.id });
        });

        container.appendChild(card);
      });
    });
  }

  _inferQuadrant(priority) {
    switch (priority) {
      case 'urgent': return 'do-first';
      case 'high': return 'schedule';
      case 'medium': return 'delegate';
      default: return 'dont-do';
    }
  }

  async handleMatrixDrop(taskId, targetQuadrant) {
    let newPriority = 'medium';
    if (targetQuadrant === 'do-first') newPriority = 'urgent';
    if (targetQuadrant === 'schedule') newPriority = 'high';
    if (targetQuadrant === 'delegate') newPriority = 'medium';
    if (targetQuadrant === 'dont-do') newPriority = 'low';

    window.soundEngine.playClick();
    const updated = await window.api.updateTask(taskId, { quadrant: targetQuadrant, priority: newPriority });
    window.state.updateTaskInState(updated);
    window.showToast(`Task moved to ${targetQuadrant.replace('-', ' ').toUpperCase()}`, 'info');
  }

  // ==========================================
  // 3. CALENDAR RENDERER
  // ==========================================
  renderCalendar() {
    const gridEl = document.getElementById('calendar-days-grid');
    const labelEl = document.getElementById('calendar-month-label');
    if (!gridEl) return;

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (labelEl) labelEl.textContent = `${monthNames[month]} ${year}`;

    gridEl.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const tasks = window.state.getFilteredTasks();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      cell.innerHTML = `<span class="day-number-badge">${dayNum}</span>`;
      gridEl.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      const cell = document.createElement('div');
      cell.className = `calendar-day-cell ${isToday ? 'is-today' : ''}`;
      cell.dataset.date = dateStr;

      const dayTasks = tasks.filter(t => t.dueDate === dateStr);

      let taskChipsHtml = '';
      dayTasks.slice(0, 3).forEach(task => {
        taskChipsHtml += `
          <div class="calendar-chip ${task.priority} ${task.status === 'completed' ? 'completed' : ''}" title="${this.escapeHtml(task.title)}">
            ${this.escapeHtml(task.title)}
          </div>
        `;
      });

      if (dayTasks.length > 3) {
        taskChipsHtml += `
          <span style="font-size: 0.68rem; color: var(--primary); font-weight: 700;">+${dayTasks.length - 3} more</span>
        `;
      }

      cell.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="day-number-badge">${day}</span>
          ${dayTasks.length > 0 ? `<span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">${dayTasks.length}</span>` : ''}
        </div>
        <div class="calendar-task-chips">
          ${taskChipsHtml}
        </div>
      `;

      cell.addEventListener('click', () => {
        window.openTaskModal({ dueDate: dateStr });
      });

      gridEl.appendChild(cell);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.viewsController = new ViewsController();
