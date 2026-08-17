const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const INITIAL_DATA_FILE = path.join(DATA_DIR, 'initialData.json');

class StorageService {
  constructor() {
    this._ensureDataFile();
  }

  _ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(INITIAL_DATA_FILE)) {
        const initial = fs.readFileSync(INITIAL_DATA_FILE, 'utf8');
        fs.writeFileSync(DATA_FILE, initial, 'utf8');
      } else {
        const emptyData = {
          projects: [],
          tasks: [],
          settings: {
            theme: 'dark',
            soundEnabled: true,
            pomodoroWorkMinutes: 25,
            pomodoroBreakMinutes: 5,
            aiProvider: 'builtin',
            apiKey: '',
            userName: 'User'
          }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2), 'utf8');
      }
    }
  }

  _read() {
    try {
      this._ensureDataFile();
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading data file:', err);
      return { projects: [], tasks: [], settings: {} };
    }
  }

  _write(data) {
    try {
      const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DATA_FILE);
      return true;
    } catch (err) {
      console.error('Error writing data file:', err);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    }
  }

  // --- Tasks API ---
  getTasks(filters = {}) {
    const data = this._read();
    let tasks = [...(data.tasks || [])];

    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.projectId) {
      tasks = tasks.filter(t => t.projectId === filters.projectId);
    }
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    if (filters.quadrant) {
      tasks = tasks.filter(t => t.quadrant === filters.quadrant);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return tasks;
  }

  getTaskById(id) {
    const data = this._read();
    return (data.tasks || []).find(t => t.id === id) || null;
  }

  createTask(taskData) {
    const data = this._read();
    const now = new Date().toISOString();
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'todo', // 'todo' | 'in-progress' | 'in-review' | 'completed'
      priority: taskData.priority || 'medium', // 'urgent' | 'high' | 'medium' | 'low'
      quadrant: taskData.quadrant || this._inferQuadrant(taskData.priority), // 'do-first' | 'schedule' | 'delegate' | 'dont-do'
      projectId: taskData.projectId || (data.projects[0] ? data.projects[0].id : null),
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: taskData.dueTime || '18:00',
      estimatedMinutes: parseInt(taskData.estimatedMinutes, 10) || 30,
      spentMinutes: parseInt(taskData.spentMinutes, 10) || 0,
      aiGenerated: !!taskData.aiGenerated,
      subtasks: Array.isArray(taskData.subtasks)
        ? taskData.subtasks.map((st, i) => ({
            id: st.id || `sub-${Date.now()}-${i}`,
            title: st.title || st,
            completed: !!st.completed
          }))
        : [],
      notes: taskData.notes || '',
      createdAt: now,
      updatedAt: now
    };

    data.tasks = data.tasks || [];
    data.tasks.unshift(newTask);
    this._write(data);
    return newTask;
  }

  _inferQuadrant(priority) {
    switch (priority) {
      case 'urgent': return 'do-first';
      case 'high': return 'schedule';
      case 'medium': return 'delegate';
      case 'low': return 'dont-do';
      default: return 'schedule';
    }
  }

  updateTask(id, updateData) {
    const data = this._read();
    const index = (data.tasks || []).findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = data.tasks[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    if (updateData.subtasks && Array.isArray(updateData.subtasks)) {
      updated.subtasks = updateData.subtasks.map((st, i) => ({
        id: st.id || `sub-${Date.now()}-${i}`,
        title: st.title || st,
        completed: !!st.completed
      }));
    }

    data.tasks[index] = updated;
    this._write(data);
    return updated;
  }

  deleteTask(id) {
    const data = this._read();
    const initialLen = (data.tasks || []).length;
    data.tasks = (data.tasks || []).filter(t => t.id !== id);
    if (data.tasks.length !== initialLen) {
      this._write(data);
      return true;
    }
    return false;
  }

  toggleSubtask(taskId, subtaskId) {
    const data = this._read();
    const task = (data.tasks || []).find(t => t.id === taskId);
    if (!task || !task.subtasks) return null;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return null;

    subtask.completed = !subtask.completed;
    task.updatedAt = new Date().toISOString();
    
    // Auto-update task status if all subtasks completed
    const allDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);
    if (allDone && task.status !== 'completed') {
      task.status = 'completed';
    }

    this._write(data);
    return task;
  }

  bulkUpdate(ids, updates) {
    const data = this._read();
    let updatedCount = 0;
    const now = new Date().toISOString();

    data.tasks = (data.tasks || []).map(task => {
      if (ids.includes(task.id)) {
        updatedCount++;
        return {
          ...task,
          ...updates,
          id: task.id,
          createdAt: task.createdAt,
          updatedAt: now
        };
      }
      return task;
    });

    if (updatedCount > 0) {
      this._write(data);
    }
    return updatedCount;
  }

  bulkDelete(ids) {
    const data = this._read();
    const initialLen = (data.tasks || []).length;
    data.tasks = (data.tasks || []).filter(t => !ids.includes(t.id));
    const deletedCount = initialLen - data.tasks.length;
    if (deletedCount > 0) {
      this._write(data);
    }
    return deletedCount;
  }

  // --- Projects API ---
  getProjects() {
    const data = this._read();
    return data.projects || [];
  }

  createProject(projectData) {
    const data = this._read();
    const newProject = {
      id: `proj-${Date.now()}`,
      name: projectData.name || 'New Project',
      color: projectData.color || '#6366f1',
      icon: projectData.icon || 'folder',
      description: projectData.description || ''
    };

    data.projects = data.projects || [];
    data.projects.push(newProject);
    this._write(data);
    return newProject;
  }

  deleteProject(id) {
    const data = this._read();
    data.projects = (data.projects || []).filter(p => p.id !== id);
    // Unassign tasks with this project
    data.tasks = (data.tasks || []).map(t => {
      if (t.projectId === id) {
        return { ...t, projectId: null };
      }
      return t;
    });
    this._write(data);
    return true;
  }

  // --- Settings API ---
  getSettings() {
    const data = this._read();
    return data.settings || {};
  }

  updateSettings(newSettings) {
    const data = this._read();
    data.settings = { ...(data.settings || {}), ...newSettings };
    this._write(data);
    return data.settings;
  }

  // --- Analytics API ---
  getAnalytics() {
    const data = this._read();
    const tasks = data.tasks || [];
    const projects = data.projects || [];

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const inReview = tasks.filter(t => t.status === 'in-review').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
    const highCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
    const totalSpent = tasks.reduce((sum, t) => sum + (t.spentMinutes || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const dueToday = tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length;
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;

    // By Project Breakdown
    const projectStats = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pDone = pTasks.filter(t => t.status === 'completed').length;
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        total: pTasks.length,
        completed: pDone,
        percentage: pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0
      };
    });

    // Velocity & Streaks (Calculated)
    const productivityScore = Math.min(100, Math.round((completed * 15) + (totalSpent / 60 * 10) + (completionRate * 0.5)));

    return {
      total,
      completed,
      inProgress,
      inReview,
      todo,
      completionRate,
      urgentCount,
      highCount,
      totalEstimatedHours: +(totalEstimated / 60).toFixed(1),
      totalSpentHours: +(totalSpent / 60).toFixed(1),
      dueToday,
      overdue,
      productivityScore,
      projectStats
    };
  }

  // --- Export / Import ---
  exportAll() {
    return this._read();
  }

  importAll(importedData) {
    if (!importedData || typeof importedData !== 'object') {
      throw new Error('Invalid JSON structure');
    }
    const sanitized = {
      projects: Array.isArray(importedData.projects) ? importedData.projects : [],
      tasks: Array.isArray(importedData.tasks) ? importedData.tasks : [],
      settings: importedData.settings || {}
    };
    this._write(sanitized);
    return sanitized;
  }
}

module.exports = new StorageService();
