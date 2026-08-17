/**
 * AI TASK MANAGER - MAIN APPLICATION BOOTSTRAPPER & ROUTER
 */

// Global Toast Notification Helper
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '🚨';
  if (type === 'ai') icon = '✨';

  toast.innerHTML = `
    <span>${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

class App {
  async init() {
    console.log('🚀 Initializing AI Task Manager...');

    this.bindGlobalNavigation();
    this.bindTaskModal();
    this.bindProjectModal();
    this.bindSettingsModal();
    this.bindThemeToggle();

    // Initialize sub-controllers
    window.timer.init();
    window.kanban.init();
    window.viewsController.init();
    window.analyticsController.init();
    window.aiController.init();
    window.commandPalette.init();

    // Fetch initial state from API
    await this.loadInitialData();

    // Handle view switching
    window.state.on('view:changed', (view) => this.switchView(view));
    window.state.on('projects:changed', () => this.renderSidebarProjects());

    console.log('✨ AI Task Manager Ready!');
  }

  async loadInitialData() {
    try {
      const [tasks, projects, settings] = await Promise.all([
        window.api.getTasks(),
        window.api.getProjects(),
        window.api.getSettings()
      ]);

      window.state.setSettings(settings || {});
      window.state.setProjects(projects || []);
      window.state.setTasks(tasks || []);

      this.applyTheme(settings.theme || 'dark');
      this.renderSidebarProjects();
      this.renderProjectOptionsInModals();
    } catch (err) {
      console.warn('Initialization note:', err.message);
    }
  }

  bindGlobalNavigation() {
    // Nav Items (Kanban, List, Matrix, Calendar, Analytics)
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        window.soundEngine.playClick();
        window.state.setView(view);
      });
    });

    // Header New Task Button
    const newTaskBtn = document.getElementById('header-new-task-btn');
    if (newTaskBtn) {
      newTaskBtn.addEventListener('click', () => {
        window.openTaskModal();
      });
    }

    // Filter Priority Selector
    const prioritySelect = document.getElementById('filter-priority-select');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        window.state.setPriorityFilter(e.target.value);
      });
    }

    // Filter Project Selector (Kanban toolbar)
    const projectSelect = document.getElementById('filter-project-select');
    if (projectSelect) {
      projectSelect.addEventListener('change', (e) => {
        window.state.setActiveProject(e.target.value === 'all' ? null : e.target.value);
      });
    }
  }

  switchView(viewName) {
    // Update active class on nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update active class on view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) targetSec.classList.add('active');

    // Update Header View Title
    const titleEl = document.getElementById('current-view-title-text');
    const subtitleEl = document.getElementById('current-view-subtitle-text');
    
    const titles = {
      kanban: { title: 'Kanban Board', sub: 'Visualize and manage workflow stages' },
      list: { title: 'List View', sub: 'Comprehensive tabular task overview' },
      matrix: { title: 'Eisenhower Matrix', sub: 'Prioritize by urgency and high impact' },
      calendar: { title: 'Calendar & Schedule', sub: 'Plan dates and deadlines across the month' },
      analytics: { title: 'Productivity Analytics', sub: 'Velocity, project distributions & achievements' }
    };

    if (titles[viewName]) {
      if (titleEl) titleEl.textContent = titles[viewName].title;
      if (subtitleEl) subtitleEl.textContent = titles[viewName].sub;
    }

    // Trigger specific view renders
    if (viewName === 'kanban') window.kanban.render();
    else if (viewName === 'list') window.viewsController.renderList();
    else if (viewName === 'matrix') window.viewsController.renderMatrix();
    else if (viewName === 'calendar') window.viewsController.renderCalendar();
    else if (viewName === 'analytics') window.analyticsController.render();
  }

  renderSidebarProjects() {
    const listEl = document.getElementById('sidebar-project-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    // "All Tasks" option
    const allItem = document.createElement('li');
    allItem.className = `project-item ${window.state.activeProject === null ? 'active' : ''}`;
    allItem.innerHTML = `
      <span class="project-dot" style="background: var(--text-muted); color: var(--text-muted);"></span>
      <span style="flex: 1;">All Projects</span>
      <span class="nav-badge">${window.state.tasks.length}</span>
    `;
    allItem.addEventListener('click', () => {
      window.state.setActiveProject(null);
      this.renderSidebarProjects();
    });
    listEl.appendChild(allItem);

    // Individual Projects
    window.state.projects.forEach(project => {
      const pTasks = window.state.tasks.filter(t => t.projectId === project.id);
      const item = document.createElement('li');
      item.className = `project-item ${window.state.activeProject === project.id ? 'active' : ''}`;
      item.innerHTML = `
        <span class="project-dot" style="background: ${project.color}; color: ${project.color};"></span>
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(project.name)}</span>
        <span class="nav-badge">${pTasks.length}</span>
      `;
      item.addEventListener('click', () => {
        window.state.setActiveProject(project.id);
        this.renderSidebarProjects();
      });
      listEl.appendChild(item);
    });

    this.renderProjectOptionsInModals();
  }

  renderProjectOptionsInModals() {
    const selectors = ['modal-task-project', 'filter-project-select'];
    selectors.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;

      const currentVal = select.value;
      select.innerHTML = id === 'filter-project-select'
        ? '<option value="all">All Projects</option>'
        : '<option value="">No Project (General)</option>';

      window.state.projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
      });

      if (currentVal) select.value = currentVal;
    });
  }

  // ==========================================
  // TASK MODAL CONTROLLER
  // ==========================================
  bindTaskModal() {
    const modal = document.getElementById('task-modal');
    const closeBtn = document.getElementById('close-task-modal-btn');
    const form = document.getElementById('task-form');
    const deleteBtn = document.getElementById('modal-delete-task-btn');
    const addSubtaskBtn = document.getElementById('modal-add-subtask-btn');
    const newSubtaskInput = document.getElementById('modal-new-subtask-title');

    window.openTaskModal = (options = {}) => {
      window.soundEngine.playClick();
      modal.classList.add('active');

      const taskId = options.taskId;
      window.state.editingTaskId = taskId || null;

      const titleEl = document.getElementById('modal-task-dialog-title');
      const deleteBtn = document.getElementById('modal-delete-task-btn');

      if (taskId) {
        // Edit Mode
        const task = window.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        titleEl.textContent = 'Edit Task';
        deleteBtn.style.display = 'inline-flex';

        document.getElementById('modal-task-title').value = task.title || '';
        document.getElementById('modal-task-desc').value = task.description || '';
        document.getElementById('modal-task-status').value = task.status || 'todo';
        document.getElementById('modal-task-project').value = task.projectId || '';
        document.getElementById('modal-task-duedate').value = task.dueDate || '';
        document.getElementById('modal-task-duetime').value = task.dueTime || '18:00';
        document.getElementById('modal-task-est-mins').value = task.estimatedMinutes || 30;
        document.getElementById('modal-task-spent-mins').value = task.spentMinutes || 0;
        document.getElementById('modal-task-tags').value = (task.tags || []).join(', ');

        this.setPriorityPillActive(task.priority || 'medium');
        this.setQuadrantPillActive(task.quadrant || 'schedule');
        this.renderModalSubtasks(task.subtasks || []);
      } else {
        // Create Mode
        titleEl.textContent = 'Create New Task';
        deleteBtn.style.display = 'none';

        form.reset();
        document.getElementById('modal-task-duedate').value = options.dueDate || new Date().toISOString().split('T')[0];
        document.getElementById('modal-task-status').value = options.status || 'todo';
        document.getElementById('modal-task-project').value = options.projectId || (window.state.activeProject || '');

        this.setPriorityPillActive('medium');
        this.setQuadrantPillActive('schedule');
        this.renderModalSubtasks([]);
      }
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    // Priority Pills Selection
    document.querySelectorAll('.pill-priority').forEach(pill => {
      pill.addEventListener('click', () => {
        this.setPriorityPillActive(pill.dataset.value);
      });
    });

    // Quadrant Pills Selection
    document.querySelectorAll('.pill-quadrant').forEach(pill => {
      pill.addEventListener('click', () => {
        this.setQuadrantPillActive(pill.dataset.value);
      });
    });

    // Subtask add in modal
    if (addSubtaskBtn && newSubtaskInput) {
      const addSt = () => {
        const text = newSubtaskInput.value.trim();
        if (text) {
          const list = document.getElementById('modal-subtasks-list');
          const item = this.createModalSubtaskItem({ title: text, completed: false });
          list.appendChild(item);
          newSubtaskInput.value = '';
        }
      };
      addSubtaskBtn.addEventListener('click', addSt);
      newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSt();
        }
      });
    }

    // Form Submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('modal-task-title').value.trim();
        if (!title) {
          window.showToast('Please enter a task title', 'error');
          return;
        }

        const tagsRaw = document.getElementById('modal-task-tags').value;
        const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

        // Collect subtasks from modal
        const subtasks = [];
        document.querySelectorAll('#modal-subtasks-list .subtask-edit-item').forEach(el => {
          const inp = el.querySelector('.subtask-edit-input');
          const cb = el.querySelector('input[type="checkbox"]');
          if (inp && inp.value.trim()) {
            subtasks.push({
              id: el.dataset.subId || undefined,
              title: inp.value.trim(),
              completed: cb ? cb.checked : false
            });
          }
        });

        const activePriorityPill = document.querySelector('.pill-priority.active');
        const activeQuadrantPill = document.querySelector('.pill-quadrant.active');

        const taskData = {
          title,
          description: document.getElementById('modal-task-desc').value.trim(),
          status: document.getElementById('modal-task-status').value,
          priority: activePriorityPill ? activePriorityPill.dataset.value : 'medium',
          quadrant: activeQuadrantPill ? activeQuadrantPill.dataset.value : 'schedule',
          projectId: document.getElementById('modal-task-project').value || null,
          dueDate: document.getElementById('modal-task-duedate').value,
          dueTime: document.getElementById('modal-task-duetime').value,
          estimatedMinutes: parseInt(document.getElementById('modal-task-est-mins').value, 10) || 30,
          spentMinutes: parseInt(document.getElementById('modal-task-spent-mins').value, 10) || 0,
          tags,
          subtasks
        };

        try {
          if (window.state.editingTaskId) {
            const updated = await window.api.updateTask(window.state.editingTaskId, taskData);
            window.state.updateTaskInState(updated);
            window.showToast('Task updated successfully', 'success');
          } else {
            const created = await window.api.createTask(taskData);
            window.state.addTask(created);
            window.showToast('Task created successfully', 'success');
          }

          modal.classList.remove('active');
          window.soundEngine.playComplete();
        } catch (err) {
          window.showToast('Failed to save task', 'error');
        }
      });
    }

    // Delete in modal
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (window.state.editingTaskId && confirm('Are you sure you want to delete this task?')) {
          await window.api.deleteTask(window.state.editingTaskId);
          window.state.removeTaskFromState(window.state.editingTaskId);
          modal.classList.remove('active');
          window.showToast('Task deleted', 'info');
        }
      });
    }
  }

  setPriorityPillActive(value) {
    document.querySelectorAll('.pill-priority').forEach(p => {
      p.classList.toggle('active', p.dataset.value === value);
    });
  }

  setQuadrantPillActive(value) {
    document.querySelectorAll('.pill-quadrant').forEach(p => {
      p.classList.toggle('active', p.dataset.value === value);
    });
  }

  renderModalSubtasks(subtasks) {
    const list = document.getElementById('modal-subtasks-list');
    if (!list) return;
    list.innerHTML = '';
    subtasks.forEach(st => {
      list.appendChild(this.createModalSubtaskItem(st));
    });
  }

  createModalSubtaskItem(st) {
    const item = document.createElement('div');
    item.className = 'subtask-edit-item';
    if (st.id) item.dataset.subId = st.id;

    item.innerHTML = `
      <input type="checkbox" ${st.completed ? 'checked' : ''} style="cursor: pointer; accent-color: var(--primary);" />
      <input type="text" class="subtask-edit-input" value="${this.escapeHtml(st.title)}" />
      <button type="button" class="subtask-delete-btn" title="Remove subtask">✖</button>
    `;

    item.querySelector('.subtask-delete-btn').addEventListener('click', () => item.remove());
    return item;
  }

  // ==========================================
  // PROJECT MODAL & ACTIONS
  // ==========================================
  bindProjectModal() {
    const modal = document.getElementById('project-modal');
    const openBtn = document.getElementById('sidebar-add-project-btn');
    const closeBtn = document.getElementById('close-project-modal-btn');
    const form = document.getElementById('project-form');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        modal.classList.add('active');
        document.getElementById('modal-project-name').focus();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('modal-project-name').value.trim();
        const color = document.getElementById('modal-project-color').value;
        const description = document.getElementById('modal-project-desc').value.trim();

        if (!name) return;

        try {
          const created = await window.api.createProject({ name, color, description });
          window.state.addProject(created);
          modal.classList.remove('active');
          form.reset();
          window.showToast(`✨ Created Project: "${created.name}"`, 'success');
        } catch (err) {
          window.showToast('Failed to create project', 'error');
        }
      });
    }
  }

  // ==========================================
  // SETTINGS MODAL & THEME
  // ==========================================
  bindSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('header-settings-btn');
    const closeBtn = document.getElementById('close-settings-modal-btn');
    const form = document.getElementById('settings-form');
    const exportBtn = document.getElementById('settings-export-btn');
    const importInput = document.getElementById('settings-import-input');

    if (openBtn) {
      openBtn.addEventListener('click', async () => {
        window.soundEngine.playClick();
        const settings = await window.api.getSettings();
        document.getElementById('settings-theme-select').value = settings.theme || 'dark';
        document.getElementById('settings-sound-enabled').checked = settings.soundEnabled !== false;
        document.getElementById('settings-pomodoro-work').value = settings.pomodoroWorkMinutes || 25;
        document.getElementById('settings-pomodoro-break').value = settings.pomodoroBreakMinutes || 5;
        document.getElementById('settings-ai-provider').value = settings.aiProvider || 'builtin';
        document.getElementById('settings-api-key').value = settings.apiKey || '';
        modal.classList.add('active');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updated = {
          theme: document.getElementById('settings-theme-select').value,
          soundEnabled: document.getElementById('settings-sound-enabled').checked,
          pomodoroWorkMinutes: parseInt(document.getElementById('settings-pomodoro-work').value, 10) || 25,
          pomodoroBreakMinutes: parseInt(document.getElementById('settings-pomodoro-break').value, 10) || 5,
          aiProvider: document.getElementById('settings-ai-provider').value,
          apiKey: document.getElementById('settings-api-key').value.trim()
        };

        const res = await window.api.updateSettings(updated);
        window.state.setSettings(res);
        this.applyTheme(res.theme);
        modal.classList.remove('active');
        window.showToast('Settings saved', 'success');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => window.api.exportData());
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            await window.api.importData(parsed);
            window.showToast('Data restored successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } catch (err) {
            window.showToast('Invalid backup JSON file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  bindThemeToggle() {
    const toggleBtn = document.getElementById('header-theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', async () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        await window.api.updateSettings({ theme: next });
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('header-theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Global DOM Loaded Entry
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
