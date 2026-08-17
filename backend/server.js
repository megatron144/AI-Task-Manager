const express = require('express');
const cors = require('cors');
const path = require('path');
const storageService = require('./services/storageService');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve Frontend Static Assets
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ==========================================
// TASKS API
// ==========================================

// Get all tasks (with filters)
app.get('/api/tasks', (req, res) => {
  try {
    const { status, projectId, priority, quadrant, search } = req.query;
    const tasks = storageService.getTasks({ status, projectId, priority, quadrant, search });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = storageService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create task
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = storageService.createTask(req.body);
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const updated = storageService.updateTask(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const deleted = storageService.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Task Status (todo <-> completed)
app.patch('/api/tasks/:id/toggle', (req, res) => {
  try {
    const task = storageService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated = storageService.updateTask(task.id, { status: newStatus });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Subtask
app.patch('/api/tasks/:id/subtasks/:subtaskId/toggle', (req, res) => {
  try {
    const updated = storageService.toggleSubtask(req.params.id, req.params.subtaskId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task or subtask not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk task operations
app.post('/api/tasks/bulk', (req, res) => {
  try {
    const { action, ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array required' });
    }

    if (action === 'delete') {
      const count = storageService.bulkDelete(ids);
      return res.json({ success: true, deletedCount: count });
    }

    if (action === 'update' && updates) {
      const count = storageService.bulkUpdate(ids, updates);
      return res.json({ success: true, updatedCount: count });
    }

    res.status(400).json({ success: false, error: 'Invalid bulk action' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PROJECTS API
// ==========================================

app.get('/api/projects', (req, res) => {
  try {
    const projects = storageService.getProjects();
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const project = storageService.createProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    storageService.deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// AI & NLP SERVICES
// ==========================================

// AI Task Decomposition
app.post('/api/ai/breakdown', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }
    const breakdown = await aiService.breakdownTask({ title, description });
    res.json({ success: true, data: breakdown });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Natural Language Parser
app.post('/api/ai/parse', (req, res) => {
  try {
    const { text } = req.body;
    const parsed = aiService.parseNaturalLanguage(text);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Daily Briefing & Standup
app.get('/api/ai/daily-briefing', (req, res) => {
  try {
    const briefing = aiService.generateDailyBriefing();
    res.json({ success: true, data: briefing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Copilot Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await aiService.chatAssistant(message, history);
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ANALYTICS & SETTINGS
// ==========================================

app.get('/api/analytics', (req, res) => {
  try {
    const analytics = storageService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settings = storageService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = storageService.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// BACKUP & RESTORE
// ==========================================

app.get('/api/export', (req, res) => {
  try {
    const exportData = storageService.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_backup.json');
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/import', (req, res) => {
  try {
    const imported = storageService.importAll(req.body);
    res.json({ success: true, message: 'Data imported successfully', data: imported });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all for SPA frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 AI Task Manager Server running on port ${PORT}`);
  console.log(`👉 Web Interface: http://localhost:${PORT}`);
  console.log(`⚡ API Endpoints: http://localhost:${PORT}/api/tasks`);
  console.log(`===========================================`);
});