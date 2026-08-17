/**
 * AI TASK MANAGER - COMMAND PALETTE (CMD+K) & NLP QUICK-ADD
 */

class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.parsedNLP = null;
  }

  init() {
    this.overlay = document.getElementById('command-palette-overlay');
    this.input = document.getElementById('command-palette-input');
    this.previewBar = document.getElementById('command-nlp-preview');
    this.commandList = document.getElementById('command-palette-items');

    this.bindHotkeys();
    this.bindEvents();
  }

  bindHotkeys() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Also header search bar triggers command palette
    const headerSearch = document.getElementById('header-search-bar');
    if (headerSearch) {
      headerSearch.addEventListener('click', () => this.open());
    }
  }

  bindEvents() {
    if (!this.input) return;

    // Real-time NLP parsing debounce
    let debounceTimer;
    this.input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.handleInput(), 150);
    });

    this.input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await this.executePrimaryAction();
      }
    });

    // Close on backdrop click
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.overlay) return;
    this.isOpen = true;
    this.overlay.classList.add('active');
    if (this.input) {
      this.input.value = '';
      this.input.focus();
    }
    this.renderCommands('');
    window.soundEngine.playClick();
  }

  close() {
    if (!this.overlay) return;
    this.isOpen = false;
    this.overlay.classList.remove('active');
    if (this.previewBar) this.previewBar.style.display = 'none';
  }

  async handleInput() {
    const text = this.input.value.trim();
    if (!text) {
      if (this.previewBar) this.previewBar.style.display = 'none';
      this.renderCommands('');
      return;
    }

    // Call NLP parser
    try {
      this.parsedNLP = await window.api.parseNaturalLanguage(text);
      if (this.previewBar && this.parsedNLP) {
        this.previewBar.style.display = 'flex';
        this.previewBar.innerHTML = `
          <span>✨ <strong>${this.escapeHtml(this.parsedNLP.title)}</strong></span>
          <span class="badge badge-${this.parsedNLP.priority}">${this.parsedNLP.priority}</span>
          <span>📅 ${this.parsedNLP.dueDate} at ${this.parsedNLP.dueTime}</span>
          <span>⏱️ ${this.parsedNLP.estimatedMinutes}m</span>
          ${this.parsedNLP.projectHint ? `<span>@${this.parsedNLP.projectHint}</span>` : ''}
        `;
      }
    } catch (e) {}

    this.renderCommands(text);
  }

  renderCommands(query) {
    if (!this.commandList) return;

    const baseCommands = [
      { id: 'add-nlp-task', title: `⚡ Quick Add Task: "${query || 'Type anything...'}"`, action: () => this.executeQuickAdd() },
      { id: 'view-kanban', title: '📋 Switch to Kanban Board', action: () => window.state.setView('kanban'), shortcut: '1' },
      { id: 'view-list', title: '📄 Switch to List View', action: () => window.state.setView('list'), shortcut: '2' },
      { id: 'view-matrix', title: '🔲 Switch to Eisenhower Matrix', action: () => window.state.setView('matrix'), shortcut: '3' },
      { id: 'view-calendar', title: '📅 Switch to Calendar View', action: () => window.state.setView('calendar'), shortcut: '4' },
      { id: 'view-analytics', title: '📊 Open Productivity Analytics', action: () => window.state.setView('analytics'), shortcut: '5' },
      { id: 'ai-briefing', title: '🤖 Launch AI Daily Standup Briefing', action: () => window.aiController.openDailyBriefing() },
      { id: 'ai-breakdown', title: '✨ Open AI Task Decomposer', action: () => window.openAIBreakdownModal() },
      { id: 'start-pomodoro', title: '⏱️ Start Pomodoro Focus Session', action: () => window.timer.start() },
      { id: 'export-data', title: '💾 Export All Tasks (Backup JSON)', action: () => window.api.exportData() }
    ];

    const filtered = query
      ? baseCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.id === 'add-nlp-task')
      : baseCommands;

    this.commandList.innerHTML = '';
    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `command-item ${idx === 0 ? 'selected' : ''}`;
      item.innerHTML = `
        <span>${cmd.title}</span>
        ${cmd.shortcut ? `<span class="command-shortcut-key">${cmd.shortcut}</span>` : ''}
      `;
      item.addEventListener('click', () => {
        cmd.action();
        this.close();
      });
      this.commandList.appendChild(item);
    });
  }

  async executePrimaryAction() {
    const text = this.input.value.trim();
    if (text) {
      await this.executeQuickAdd();
    } else {
      this.close();
    }
  }

  async executeQuickAdd() {
    const text = this.input.value.trim();
    if (!text) return;

    try {
      const parsed = this.parsedNLP || await window.api.parseNaturalLanguage(text);
      const defaultProj = window.state.activeProject || (window.state.projects[0] ? window.state.projects[0].id : null);

      const newTask = await window.api.createTask({
        title: parsed.title,
        priority: parsed.priority || 'medium',
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        estimatedMinutes: parsed.estimatedMinutes || 30,
        projectId: defaultProj,
        tags: parsed.tags || []
      });

      window.state.addTask(newTask);
      window.soundEngine.playComplete();
      window.showToast(`✨ Created task: "${newTask.title}"`, 'success');
      this.close();
    } catch (err) {
      window.showToast('Failed to create task', 'error');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.commandPalette = new CommandPalette();
