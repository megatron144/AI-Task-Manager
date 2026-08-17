/**
 * AI TASK MANAGER - CENTRAL STATE MANAGEMENT & EVENT BUS
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, payload) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(payload);
      } catch (err) {
        console.error(`Error in event listener for "${event}":`, err);
      }
    });
  }
}

class AppState extends EventEmitter {
  constructor() {
    super();
    this.tasks = [];
    this.projects = [];
    this.settings = {
      theme: 'dark',
      soundEnabled: true,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      aiProvider: 'builtin',
      userName: 'User'
    };
    this.activeView = 'kanban'; // 'kanban' | 'list' | 'matrix' | 'calendar' | 'analytics'
    this.activeProject = null;  // null = all projects
    this.priorityFilter = 'all';
    this.searchQuery = '';
    this.selectedTaskIds = new Set();
    this.editingTaskId = null;
  }

  // Setters with Event Broadcasting
  setTasks(tasks) {
    this.tasks = tasks;
    this.emit('tasks:changed', this.tasks);
  }

  addTask(task) {
    this.tasks.unshift(task);
    this.emit('tasks:changed', this.tasks);
    this.emit('task:added', task);
  }

  updateTaskInState(updatedTask) {
    this.tasks = this.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    this.emit('tasks:changed', this.tasks);
    this.emit('task:updated', updatedTask);
  }

  removeTaskFromState(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.selectedTaskIds.delete(taskId);
    this.emit('tasks:changed', this.tasks);
    this.emit('task:deleted', taskId);
  }

  setProjects(projects) {
    this.projects = projects;
    this.emit('projects:changed', this.projects);
  }

  addProject(project) {
    this.projects.push(project);
    this.emit('projects:changed', this.projects);
  }

  removeProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (this.activeProject === projectId) this.activeProject = null;
    this.emit('projects:changed', this.projects);
  }

  setView(viewName) {
    this.activeView = viewName;
    this.emit('view:changed', viewName);
  }

  setActiveProject(projectId) {
    this.activeProject = projectId;
    this.emit('filter:changed', { project: projectId, priority: this.priorityFilter, search: this.searchQuery });
  }

  setPriorityFilter(priority) {
    this.priorityFilter = priority;
    this.emit('filter:changed', { project: this.activeProject, priority, search: this.searchQuery });
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    this.emit('filter:changed', { project: this.activeProject, priority: this.priorityFilter, search: query });
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.emit('settings:changed', this.settings);
  }

  /**
   * Filter tasks based on currently active project, priority, and search query
   */
  getFilteredTasks() {
    return this.tasks.filter(task => {
      // Project filter
      if (this.activeProject && task.projectId !== this.activeProject) {
        return false;
      }
      // Priority filter
      if (this.priorityFilter !== 'all' && task.priority !== this.priorityFilter) {
        return false;
      }
      // Search query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const titleMatch = task.title && task.title.toLowerCase().includes(q);
        const descMatch = task.description && task.description.toLowerCase().includes(q);
        const tagMatch = task.tags && task.tags.some(t => t.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    });
  }

  getProjectById(id) {
    return this.projects.find(p => p.id === id) || null;
  }
}

window.state = new AppState();
