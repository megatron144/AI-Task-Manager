/**
 * AI TASK MANAGER - AI CONTROLLER (BREAKDOWN, DAILY BRIEFING, COPILOT CHAT)
 */

class AIController {
  constructor() {
    this.currentBreakdown = null;
    this.chatHistory = [];
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // AI Daily Briefing Trigger Button (Sidebar)
    const standupBtn = document.getElementById('sidebar-ai-standup-btn');
    if (standupBtn) {
      standupBtn.addEventListener('click', () => this.openDailyBriefing());
    }

    // Top AI Quick Action
    const topAiBtn = document.getElementById('header-ai-breakdown-btn');
    if (topAiBtn) {
      topAiBtn.addEventListener('click', () => window.openAIBreakdownModal());
    }

    // Floating AI Bubble
    const floatingAiBtn = document.getElementById('floating-ai-trigger');
    if (floatingAiBtn) {
      floatingAiBtn.addEventListener('click', () => this.toggleChatDrawer());
    }

    // Close Drawers & Modals
    const closeBriefingBtn = document.getElementById('close-briefing-drawer');
    if (closeBriefingBtn) {
      closeBriefingBtn.addEventListener('click', () => this.closeDailyBriefing());
    }

    const closeChatBtn = document.getElementById('close-chat-drawer');
    if (closeChatBtn) {
      closeChatBtn.addEventListener('click', () => this.toggleChatDrawer(false));
    }

    // AI Breakdown Modal Submit
    const generateAiBtn = document.getElementById('ai-generate-breakdown-btn');
    if (generateAiBtn) {
      generateAiBtn.addEventListener('click', () => this.generateBreakdown());
    }

    const saveAiTaskBtn = document.getElementById('ai-save-breakdown-btn');
    if (saveAiTaskBtn) {
      saveAiTaskBtn.addEventListener('click', () => this.saveBreakdownTask());
    }

    // Chat input submit
    const chatInput = document.getElementById('ai-chat-input');
    const chatSendBtn = document.getElementById('ai-chat-send-btn');
    if (chatSendBtn && chatInput) {
      const sendMsg = () => {
        const text = chatInput.value.trim();
        if (text) {
          this.sendChatMessage(text);
          chatInput.value = '';
        }
      };
      chatSendBtn.addEventListener('click', sendMsg);
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMsg();
      });
    }
  }

  // ==========================================
  // 1. AI TASK BREAKDOWN GENERATOR
  // ==========================================
  async openBreakdownModal(initialTask = null) {
    const overlay = document.getElementById('ai-breakdown-modal');
    const titleInput = document.getElementById('ai-task-prompt-input');
    const previewContainer = document.getElementById('ai-breakdown-result-container');
    const saveBtn = document.getElementById('ai-save-breakdown-btn');

    if (!overlay || !titleInput) return;

    if (initialTask) {
      titleInput.value = initialTask.title || '';
    } else {
      titleInput.value = '';
    }

    if (previewContainer) previewContainer.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';

    overlay.classList.add('active');
    titleInput.focus();

    if (initialTask && initialTask.title) {
      await this.generateBreakdown(initialTask.title, initialTask.description);
    }
  }

  async generateBreakdown(overrideTitle = null, overrideDesc = null) {
    const titleInput = document.getElementById('ai-task-prompt-input');
    const generateBtn = document.getElementById('ai-generate-breakdown-btn');
    const previewContainer = document.getElementById('ai-breakdown-result-container');
    const saveBtn = document.getElementById('ai-save-breakdown-btn');
    const subtasksListEl = document.getElementById('ai-subtasks-preview-list');
    const rationaleEl = document.getElementById('ai-reasoning-text');

    const title = overrideTitle || (titleInput ? titleInput.value.trim() : '');
    if (!title) {
      window.showToast('Please enter a goal or task title to break down', 'error');
      return;
    }

    // Show loading state
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="spinner"></span> Analyzing & Decomposing...';
    }

    try {
      const breakdown = await window.api.breakdownTask(title, overrideDesc || '');
      this.currentBreakdown = breakdown;

      if (rationaleEl) rationaleEl.textContent = breakdown.rationale || 'AI heuristic workflow generated.';

      if (subtasksListEl) {
        subtasksListEl.innerHTML = '';
        (breakdown.subtasks || []).forEach((st, idx) => {
          const item = document.createElement('div');
          item.className = 'ai-subtask-preview-item';
          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex: 1;">
              <span style="font-weight: 700; color: var(--accent-purple); font-size: 0.8rem;">${idx + 1}.</span>
              <span class="subtask-title-text" style="font-size: 0.85rem; color: var(--text-primary);">${this.escapeHtml(st.title)}</span>
            </div>
            <span class="ai-subtask-duration">~${st.estimatedMins || 30}m</span>
          `;
          subtasksListEl.appendChild(item);
        });
      }

      if (previewContainer) previewContainer.style.display = 'flex';
      if (saveBtn) saveBtn.style.display = 'inline-flex';
      window.soundEngine.playComplete();
    } catch (err) {
      window.showToast('Error generating AI breakdown', 'error');
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '✨ Generate AI Breakdown';
      }
    }
  }

  async saveBreakdownTask() {
    if (!this.currentBreakdown) return;

    const currentProject = window.state.activeProject || (window.state.projects[0] ? window.state.projects[0].id : null);
    const newTaskData = {
      title: this.currentBreakdown.title,
      description: this.currentBreakdown.description,
      status: 'todo',
      priority: this.currentBreakdown.priority || 'high',
      projectId: currentProject,
      tags: this.currentBreakdown.suggestedTags || ['AI', 'Generated'],
      estimatedMinutes: this.currentBreakdown.estimatedMinutes || 120,
      aiGenerated: true,
      subtasks: (this.currentBreakdown.subtasks || []).map(s => ({
        title: s.title,
        completed: false
      }))
    };

    try {
      const created = await window.api.createTask(newTaskData);
      window.state.addTask(created);
      window.soundEngine.playComplete();
      window.showToast(`✨ Added AI Task: "${created.title}" with ${created.subtasks.length} subtasks!`, 'success');
      this.closeBreakdownModal();
    } catch (err) {
      window.showToast('Failed to create task', 'error');
    }
  }

  closeBreakdownModal() {
    const overlay = document.getElementById('ai-breakdown-modal');
    if (overlay) overlay.classList.remove('active');
    this.currentBreakdown = null;
  }

  // ==========================================
  // 2. AI DAILY BRIEFING & STANDUP
  // ==========================================
  async openDailyBriefing() {
    const overlay = document.getElementById('ai-briefing-drawer-overlay');
    if (!overlay) return;

    window.soundEngine.playClick();
    overlay.classList.add('active');

    const greetingEl = document.getElementById('briefing-greeting');
    const summaryEl = document.getElementById('briefing-summary');
    const focusListEl = document.getElementById('briefing-top-focus');
    const timelineEl = document.getElementById('briefing-schedule-timeline');
    const insightsEl = document.getElementById('briefing-insights-list');

    if (summaryEl) summaryEl.innerHTML = '<span class="spinner"></span> Synthesizing workload state...';

    try {
      const briefing = await window.api.getDailyBriefing();

      if (greetingEl) greetingEl.textContent = briefing.greeting;
      if (summaryEl) summaryEl.innerHTML = briefing.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Top 3 Focus Cards
      if (focusListEl) {
        focusListEl.innerHTML = '';
        (briefing.topFocusTasks || []).forEach((t, i) => {
          const card = document.createElement('div');
          card.className = `task-card ${t.priority}-border`;
          card.style.padding = '0.75rem';
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge badge-${t.priority}">${t.priority}</span>
              <button class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.72rem;" data-task-id="${t.id}">🎯 Focus Now</button>
            </div>
            <div style="font-weight: 700; font-size: 0.85rem; margin-top: 0.35rem;">${this.escapeHtml(t.title)}</div>
          `;
          card.querySelector('button').addEventListener('click', () => {
            window.timer.start(t.id);
            this.closeDailyBriefing();
          });
          focusListEl.appendChild(card);
        });
      }

      // Time Block Timeline
      if (timelineEl) {
        timelineEl.innerHTML = '';
        (briefing.scheduleSlots || []).forEach(slot => {
          const item = document.createElement('div');
          item.className = 'schedule-timeline-item';
          item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-time-badge">${slot.slot} • ${slot.phase}</div>
              <div class="timeline-task-title">${this.escapeHtml(slot.taskTitle)}</div>
            </div>
          `;
          timelineEl.appendChild(item);
        });
      }

      // Insights
      if (insightsEl) {
        insightsEl.innerHTML = (briefing.insights || []).map(ins => `
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; background: var(--bg-tertiary); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-purple);">
            ${ins.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        `).join('');
      }
    } catch (err) {
      if (summaryEl) summaryEl.textContent = 'Error loading briefing.';
    }
  }

  closeDailyBriefing() {
    const overlay = document.getElementById('ai-briefing-drawer-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // ==========================================
  // 3. AI COPILOT CHAT DRAWER
  // ==========================================
  toggleChatDrawer(open = null) {
    const overlay = document.getElementById('ai-chat-drawer-overlay');
    if (!overlay) return;

    const isActive = overlay.classList.contains('active');
    const shouldOpen = open !== null ? open : !isActive;

    if (shouldOpen) {
      window.soundEngine.playClick();
      overlay.classList.add('active');
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
    } else {
      overlay.classList.remove('active');
    }
  }

  async sendChatMessage(userText) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    // Render user message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = userText;
    container.appendChild(userBubble);
    container.scrollTop = container.scrollHeight;

    // Render loading indicator for assistant
    const loaderBubble = document.createElement('div');
    loaderBubble.className = 'chat-bubble assistant';
    loaderBubble.innerHTML = '<span class="spinner"></span> Thinking...';
    container.appendChild(loaderBubble);
    container.scrollTop = container.scrollHeight;

    try {
      const response = await window.api.chatAssistant(userText, this.chatHistory);
      loaderBubble.innerHTML = this.formatMarkdown(response.reply);
      this.chatHistory.push({ role: 'user', content: userText });
      this.chatHistory.push({ role: 'assistant', content: response.reply });
      window.soundEngine.playClick();
    } catch (err) {
      loaderBubble.textContent = 'Sorry, could not process that request.';
    }

    container.scrollTop = container.scrollHeight;
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 0.1rem 0.3rem; border-radius: 4px;">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.aiController = new AIController();
window.openAIBreakdownModal = (task) => window.aiController.openBreakdownModal(task);
