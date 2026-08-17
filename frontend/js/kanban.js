/**
 * AI TASK MANAGER - KANBAN CONTROLLER & DRAG-AND-DROP ENGINE
 */

class KanbanController {
  constructor() {
    this.columns = ['todo', 'in-progress', 'in-review', 'completed'];
    this.draggedTaskId = null;
  }

  init() {
    this.boardEl = document.getElementById('kanban-board');
    if (!this.boardEl) return;

    this.bindEvents();
    this.render();

    // Subscribe to state updates
    window.state.on('tasks:changed', () => this.render());
    window.state.on('filter:changed', () => this.render());
  }

  bindEvents() {
    // Set up drag and drop listeners for columns
    const colEls = document.querySelectorAll('.kanban-column');
    colEls.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const newStatus = col.dataset.status;
        if (this.draggedTaskId && newStatus) {
          this.handleTaskDrop(this.draggedTaskId, newStatus);
        }
      });
    });

    // Quick add task buttons on columns
    document.querySelectorAll('.column-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const status = btn.closest('.kanban-column').dataset.status;
        window.openTaskModal({ status });
      });
    });
  }

  async handleTaskDrop(taskId, newStatus) {
    const task = window.state.tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    window.soundEngine.playClick();

    // Optimistic UI update
    const prevStatus = task.status;
    task.status = newStatus;
    window.state.updateTaskInState({ ...task });

    try {
      const updated = await window.api.updateTask(taskId, { status: newStatus });
      window.state.updateTaskInState(updated);
      if (newStatus === 'completed') {
        window.soundEngine.playComplete();
        window.showToast(`🎉 Task completed: "${task.title}"`, 'success');
      }
    } catch (err) {
      task.status = prevStatus;
      window.state.updateTaskInState({ ...task });
      window.showToast('Failed to update task status', 'error');
    }
  }

  render() {
    if (window.state.activeView !== 'kanban') return;

    const filteredTasks = window.state.getFilteredTasks();

    this.columns.forEach(status => {
      const cardsContainer = document.querySelector(`.column-cards[data-status="${status}"]`);
      const countBadge = document.querySelector(`.column-count[data-status="${status}"]`);
      if (!cardsContainer) return;

      const columnTasks = filteredTasks.filter(t => t.status === status);
      if (countBadge) countBadge.textContent = columnTasks.length;

      cardsContainer.innerHTML = '';

      if (columnTasks.length === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-column-state" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.8rem;">
            <span>No tasks in this lane</span>
          </div>
        `;
        return;
      }

      columnTasks.forEach(task => {
        const cardEl = this.createCardElement(task);
        cardsContainer.appendChild(cardEl);
      });
    });
  }

  createCardElement(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.priority}-border`;
    card.draggable = true;
    card.dataset.taskId = task.id;

    const project = window.state.getProjectById(task.projectId);
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

    // Due date formatting
    const todayStr = new Date().toISOString().split('T')[0];
    let dueClass = '';
    let dueLabel = task.dueDate || 'No date';

    if (task.dueDate) {
      if (task.dueDate < todayStr && task.status !== 'completed') {
        dueClass = 'overdue';
        dueLabel = `Overdue (${task.dueDate})`;
      } else if (task.dueDate === todayStr) {
        dueClass = 'due-today';
        dueLabel = `Today at ${task.dueTime || '18:00'}`;
      }
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="card-project-tag">
          ${project ? `<span class="project-dot" style="color: ${project.color}; background: ${project.color}"></span> ${this.escapeHtml(project.name)}` : '<span class="project-dot" style="color: var(--text-muted); background: var(--text-muted)"></span> General'}
        </div>
        <div class="card-actions">
          <button class="card-action-btn card-ai-btn" title="AI Subtask Decomposition">✨</button>
          <button class="card-action-btn card-timer-btn" title="Focus on this task with Pomodoro">⏱️</button>
          <button class="card-action-btn card-delete-btn" title="Delete task">🗑️</button>
        </div>
      </div>

      <div class="card-title">${this.escapeHtml(task.title)}</div>
      
      ${task.description ? `<div class="card-desc">${this.escapeHtml(task.description)}</div>` : ''}

      ${subtasks.length > 0 ? `
        <div class="card-subtasks">
          <div class="subtasks-header">
            <span>Subtasks</span>
            <span>${completedSubtasks}/${subtasks.length}</span>
          </div>
          <div class="subtask-progress-bar">
            <div class="subtask-progress-fill" style="width: ${subtaskProgress}%"></div>
          </div>
        </div>
      ` : ''}

      <div class="card-footer">
        <div class="card-due ${dueClass}">
          <span>📅</span>
          <span>${dueLabel}</span>
        </div>
        <div class="card-meta-right">
          ${task.aiGenerated ? `<span class="ai-pill">✨ AI</span>` : ''}
          <span class="badge badge-${task.priority}">${task.priority}</span>
        </div>
      </div>
    `;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      this.draggedTaskId = task.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      this.draggedTaskId = null;
      card.classList.remove('dragging');
    });

    // Card click opens detail modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn')) return;
      window.openTaskModal({ taskId: task.id });
    });

    // Card action button listeners
    const aiBtn = card.querySelector('.card-ai-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openAIBreakdownModal(task);
      });
    }

    const timerBtn = card.querySelector('.card-timer-btn');
    if (timerBtn) {
      timerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.timer.start(task.id);
        window.showToast(`🎯 Timer focused on: "${task.title}"`, 'info');
      });
    }

    const deleteBtn = card.querySelector('.card-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete task "${task.title}"?`)) {
          await window.api.deleteTask(task.id);
          window.state.removeTaskFromState(task.id);
          window.showToast('Task deleted', 'info');
        }
      });
    }

    return card;
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.kanban = new KanbanController();
