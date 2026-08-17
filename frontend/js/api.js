/**
 * AI TASK MANAGER - DUAL-MODE API CLIENT (SERVER + CLIENT-SIDE STANDALONE ENGINE)
 * Supports both local Express backend & static hosting (GitHub Pages, Netlify, Vercel)
 */

function getApiBase() {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
      return 'http://localhost:3000';
    }
  }
  return '';
}

const API_BASE = getApiBase();

// Default Seed Data for Standalone Client Mode
const INITIAL_SEED_DATA = {
  projects: [
    { id: "proj-1", name: "AI Platform MVP", color: "#6366f1", icon: "sparkles", description: "Next-gen intelligent agent orchestration" },
    { id: "proj-2", name: "Design System", color: "#ec4899", icon: "palette", description: "Glassmorphic design token library & UI components" },
    { id: "proj-3", name: "Infrastructure & Cloud", color: "#06b6d4", icon: "server", description: "Scalable Kubernetes microservices & caching" },
    { id: "proj-4", name: "Marketing & Growth", color: "#10b981", icon: "trending-up", description: "Product launch campaign & analytics" }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Architect Neural Task Decomposition Pipeline",
      description: "Design autonomous pipeline for milestone breakdown with risk indicators.",
      status: "in-progress",
      priority: "urgent",
      quadrant: "do-first",
      projectId: "proj-1",
      tags: ["AI", "Architecture", "Core"],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: "17:00",
      estimatedMinutes: 180,
      spentMinutes: 95,
      aiGenerated: true,
      subtasks: [
        { id: "sub-1", title: "Define heuristic intent classification prompts", completed: true },
        { id: "sub-2", title: "Implement dependency tree resolver algorithm", completed: true },
        { id: "sub-3", title: "Add fallback rule-based subtask generator", completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "task-2",
      title: "Design Glassmorphism Component Library",
      description: "Craft sleek UI cards, glowing status badges, frosted modals, and smooth animations.",
      status: "in-progress",
      priority: "high",
      quadrant: "schedule",
      projectId: "proj-2",
      tags: ["UI/UX", "CSS", "Design"],
      dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      dueTime: "15:00",
      estimatedMinutes: 120,
      spentMinutes: 60,
      aiGenerated: false,
      subtasks: [
        { id: "sub-5", title: "Tokenize color palette & backdrop blur filters", completed: true },
        { id: "sub-6", title: "Build dynamic dark/light theme switchers", completed: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "task-3",
      title: "Implement Integrated Pomodoro Focus Engine",
      description: "Build live audio-synthesized focus timer with interval notifications.",
      status: "completed",
      priority: "medium",
      quadrant: "schedule",
      projectId: "proj-1",
      tags: ["Audio", "Productivity"],
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: "18:00",
      estimatedMinutes: 90,
      spentMinutes: 85,
      aiGenerated: false,
      subtasks: [
        { id: "sub-8", title: "Synthesize soft chime with Web Audio API", completed: true },
        { id: "sub-9", title: "Track completed focus blocks against active task", completed: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "task-4",
      title: "Natural Language Quick-Add Parser (Cmd+K)",
      description: "Allow lightning-fast task creation with natural strings like 'Review PR tomorrow 3pm #urgent'.",
      status: "todo",
      priority: "urgent",
      quadrant: "do-first",
      projectId: "proj-1",
      tags: ["NLP", "Productivity"],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: "19:00",
      estimatedMinutes: 90,
      spentMinutes: 0,
      aiGenerated: false,
      subtasks: [
        { id: "sub-19", title: "Build regex & semantic date extractor", completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  settings: {
    theme: "dark",
    soundEnabled: true,
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    aiProvider: "builtin",
    apiKey: "",
    userName: "User"
  }
};

class LocalFallbackStore {
  constructor() {
    this._init();
  }

  _init() {
    if (!localStorage.getItem('neurotask_tasks')) {
      localStorage.setItem('neurotask_tasks', JSON.stringify(INITIAL_SEED_DATA.tasks));
    }
    if (!localStorage.getItem('neurotask_projects')) {
      localStorage.setItem('neurotask_projects', JSON.stringify(INITIAL_SEED_DATA.projects));
    }
    if (!localStorage.getItem('neurotask_settings')) {
      localStorage.setItem('neurotask_settings', JSON.stringify(INITIAL_SEED_DATA.settings));
    }
  }

  getTasks(filters = {}) {
    this._init();
    let tasks = JSON.parse(localStorage.getItem('neurotask_tasks') || '[]');
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters.projectId) tasks = tasks.filter(t => t.projectId === filters.projectId);
    if (filters.priority) tasks = tasks.filter(t => t.priority === filters.priority);
    return tasks;
  }

  saveTasks(tasks) {
    localStorage.setItem('neurotask_tasks', JSON.stringify(tasks));
  }

  getProjects() {
    this._init();
    return JSON.parse(localStorage.getItem('neurotask_projects') || '[]');
  }

  saveProjects(projects) {
    localStorage.setItem('neurotask_projects', JSON.stringify(projects));
  }

  getSettings() {
    this._init();
    return JSON.parse(localStorage.getItem('neurotask_settings') || '{}');
  }

  saveSettings(settings) {
    localStorage.setItem('neurotask_settings', JSON.stringify(settings));
  }
}

const localStore = new LocalFallbackStore();

class ApiClient {
  constructor() {
    this.useLocalStorage = false;
  }

  async _request(endpoint, options = {}) {
    if (this.useLocalStorage) {
      throw new Error('Local Mode Active');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout for fast fallback

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      // Switch to standalone client mode on network error / GitHub Pages
      this.useLocalStorage = true;
      throw err;
    }
  }

  // --- Tasks API ---
  async getTasks(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => filters[k] && params.append(k, filters[k]));
      const res = await this._request(`/api/tasks${params.toString() ? `?${params.toString()}` : ''}`);
      return res.data || [];
    } catch (err) {
      return localStore.getTasks(filters);
    }
  }

  async getTask(id) {
    try {
      const res = await this._request(`/api/tasks/${id}`);
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      return tasks.find(t => t.id === id) || null;
    }
  }

  async createTask(taskData) {
    try {
      const res = await this._request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        quadrant: taskData.quadrant || 'schedule',
        projectId: taskData.projectId || null,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
      localStore.saveTasks(tasks);
      return newTask;
    }
  }

  async updateTask(id, updateData) {
    try {
      const res = await this._request(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return null;

      const updated = {
        ...tasks[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      if (updateData.subtasks && Array.isArray(updateData.subtasks)) {
        updated.subtasks = updateData.subtasks.map((st, i) => ({
          id: st.id || `sub-${Date.now()}-${i}`,
          title: st.title || st,
          completed: !!st.completed
        }));
      }
      tasks[idx] = updated;
      localStore.saveTasks(tasks);
      return updated;
    }
  }

  async deleteTask(id) {
    try {
      return await this._request(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      const tasks = localStore.getTasks().filter(t => t.id !== id);
      localStore.saveTasks(tasks);
      return { success: true };
    }
  }

  async toggleTask(id) {
    try {
      const res = await this._request(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      const task = tasks.find(t => t.id === id);
      if (!task) return null;
      task.status = task.status === 'completed' ? 'todo' : 'completed';
      task.updatedAt = new Date().toISOString();
      localStore.saveTasks(tasks);
      return task;
    }
  }

  // --- Projects API ---
  async getProjects() {
    try {
      const res = await this._request('/api/projects');
      return res.data || [];
    } catch (err) {
      return localStore.getProjects();
    }
  }

  async createProject(projectData) {
    try {
      const res = await this._request('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      return res.data;
    } catch (err) {
      const projects = localStore.getProjects();
      const newProj = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'New Project',
        color: projectData.color || '#6366f1',
        icon: projectData.icon || 'folder',
        description: projectData.description || ''
      };
      projects.push(newProj);
      localStore.saveProjects(projects);
      return newProj;
    }
  }

  // --- Settings API ---
  async getSettings() {
    try {
      const res = await this._request('/api/settings');
      return res.data;
    } catch (err) {
      return localStore.getSettings();
    }
  }

  async updateSettings(settings) {
    try {
      const res = await this._request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return res.data;
    } catch (err) {
      const current = localStore.getSettings();
      const merged = { ...current, ...settings };
      localStore.saveSettings(merged);
      return merged;
    }
  }

  // --- AI Client Engine Fallbacks ---
  async breakdownTask(title, description = '') {
    try {
      const res = await this._request('/api/ai/breakdown', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      return res.data;
    } catch (err) {
      // Client-side intelligent decomposition
      const raw = `${title} ${description}`.toLowerCase();
      const isDev = /(build|develop|code|api|backend|frontend|auth|database|bug|deploy|test|app)/i.test(raw);
      const isDesign = /(design|ui|ux|figma|prototype|mockup|brand|logo|landing)/i.test(raw);

      let subtasks = [];
      if (isDev) {
        subtasks = [
          { title: `Clarify specs & define schema for "${title}"`, estimatedMins: 30 },
          { title: `Set up core scaffolding and interfaces`, estimatedMins: 45 },
          { title: `Implement primary business logic & error handling`, estimatedMins: 60 },
          { title: `Write unit tests and perform code review`, estimatedMins: 30 }
        ];
      } else if (isDesign) {
        subtasks = [
          { title: `Gather visual references & moodboard`, estimatedMins: 25 },
          { title: `Draft low-fidelity wireframes`, estimatedMins: 35 },
          { title: `Design polished components with design tokens`, estimatedMins: 45 },
          { title: `Build interactive prototype & test responsive states`, estimatedMins: 20 }
        ];
      } else {
        subtasks = [
          { title: `Define success criteria and gather resources for "${title}"`, estimatedMins: 20 },
          { title: `Execute Phase 1: Core foundation & preparation`, estimatedMins: 40 },
          { title: `Execute Phase 2: Main deliverable execution`, estimatedMins: 40 },
          { title: `Final review and sign-off`, estimatedMins: 15 }
        ];
      }

      return {
        title,
        description,
        priority: 'high',
        estimatedMinutes: 120,
        suggestedTags: ['AI', 'Generated'],
        rationale: 'Autonomously decomposed via client-side neural heuristics.',
        subtasks: subtasks.map((s, i) => ({
          id: `sub-ai-${Date.now()}-${i}`,
          title: s.title,
          completed: false,
          estimatedMins: s.estimatedMins
        }))
      };
    }
  }

  async parseNaturalLanguage(text) {
    try {
      const res = await this._request('/api/ai/parse', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      return res.data;
    } catch (err) {
      let cleanTitle = text.trim();
      let priority = 'medium';
      let tags = [];
      let dueDate = new Date().toISOString().split('T')[0];
      let dueTime = '18:00';
      let estimatedMinutes = 30;

      if (/#urgent|!urgent/i.test(cleanTitle)) {
        priority = 'urgent';
        cleanTitle = cleanTitle.replace(/#urgent|!urgent/gi, '');
      } else if (/#high|!high/i.test(cleanTitle)) {
        priority = 'high';
        cleanTitle = cleanTitle.replace(/#high|!high/gi, '');
      }

      if (/\btomorrow\b/i.test(cleanTitle)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dueDate = d.toISOString().split('T')[0];
        cleanTitle = cleanTitle.replace(/\btomorrow\b/gi, '');
      }

      cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

      return {
        title: cleanTitle || 'New Task',
        priority,
        tags,
        dueDate,
        dueTime,
        estimatedMinutes
      };
    }
  }

  async getDailyBriefing() {
    try {
      const res = await this._request('/api/ai/daily-briefing');
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const topFocusTasks = activeTasks.slice(0, 3);

      return {
        greeting: 'Good morning! Here is your AI Daily Executive Briefing.',
        summary: `You have **${activeTasks.length} active tasks** in your pipeline.`,
        topFocusTasks,
        scheduleSlots: [
          { slot: '09:00 - 11:00', phase: 'High Energy Focus Block', taskTitle: topFocusTasks[0] ? topFocusTasks[0].title : 'Plan Roadmap', durationMinutes: 120, priority: 'urgent' },
          { slot: '11:15 - 13:00', phase: 'Core Execution Block', taskTitle: topFocusTasks[1] ? topFocusTasks[1].title : 'Review Tasks', durationMinutes: 90, priority: 'high' }
        ],
        insights: [
          '💡 **Focus Tip**: Tackle your highest-priority item first for peak momentum today.'
        ]
      };
    }
  }

  async chatAssistant(message) {
    try {
      const res = await this._request('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks().filter(t => t.status !== 'completed');
      const top = tasks[0];
      return {
        reply: `🎯 **AI Copilot Recommendation:**\n\nI recommend working on **"${top ? top.title : 'Planning your next milestone'}"**.\n\n⏱️ Start a 25-minute Pomodoro block in the header to enter deep flow!`
      };
    }
  }

  // --- Analytics API ---
  async getAnalytics() {
    try {
      const res = await this._request('/api/analytics');
      return res.data;
    } catch (err) {
      const tasks = localStore.getTasks();
      const projects = localStore.getProjects();
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const totalSpent = tasks.reduce((sum, t) => sum + (t.spentMinutes || 0), 0);

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

      return {
        total,
        completed,
        completionRate,
        totalSpentHours: +(totalSpent / 60).toFixed(1),
        overdue: 0,
        productivityScore: Math.min(100, Math.round((completed * 15) + 30)),
        projectStats
      };
    }
  }

  exportData() {
    const data = {
      projects: localStore.getProjects(),
      tasks: localStore.getTasks(),
      settings: localStore.getSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neurotask_backup.json';
    a.click();
  }

  async importData(jsonData) {
    if (jsonData.tasks) localStore.saveTasks(jsonData.tasks);
    if (jsonData.projects) localStore.saveProjects(jsonData.projects);
    if (jsonData.settings) localStore.saveSettings(jsonData.settings);
    return { success: true };
  }
}

window.api = new ApiClient();
