/**
 * AI TASK MANAGER - REST API CLIENT
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? ''
  : '';

class ApiClient {
  async _request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Tasks API ---
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await this._request(`/api/tasks${queryString}`);
    return res.data || [];
  }

  async getTask(id) {
    const res = await this._request(`/api/tasks/${id}`);
    return res.data;
  }

  async createTask(taskData) {
    const res = await this._request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return res.data;
  }

  async updateTask(id, updateData) {
    const res = await this._request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return res.data;
  }

  async deleteTask(id) {
    return await this._request(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleTask(id) {
    const res = await this._request(`/api/tasks/${id}/toggle`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async toggleSubtask(taskId, subtaskId) {
    const res = await this._request(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async bulkUpdate(ids, updates) {
    return await this._request('/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', ids, updates })
    });
  }

  async bulkDelete(ids) {
    return await this._request('/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids })
    });
  }

  // --- Projects API ---
  async getProjects() {
    const res = await this._request('/api/projects');
    return res.data || [];
  }

  async createProject(projectData) {
    const res = await this._request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    return res.data;
  }

  async deleteProject(id) {
    return await this._request(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // --- AI Endpoints ---
  async breakdownTask(title, description) {
    const res = await this._request('/api/ai/breakdown', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
    return res.data;
  }

  async parseNaturalLanguage(text) {
    const res = await this._request('/api/ai/parse', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return res.data;
  }

  async getDailyBriefing() {
    const res = await this._request('/api/ai/daily-briefing');
    return res.data;
  }

  async chatAssistant(message, history = []) {
    const res = await this._request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
    return res.data;
  }

  // --- Analytics & Settings ---
  async getAnalytics() {
    const res = await this._request('/api/analytics');
    return res.data;
  }

  async getSettings() {
    const res = await this._request('/api/settings');
    return res.data;
  }

  async updateSettings(settings) {
    const res = await this._request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return res.data;
  }

  async exportData() {
    window.location.href = `${API_BASE}/api/export`;
  }

  async importData(jsonData) {
    const res = await this._request('/api/import', {
      method: 'POST',
      body: JSON.stringify(jsonData)
    });
    return res.data;
  }
}

window.api = new ApiClient();
