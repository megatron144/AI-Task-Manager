const storageService = require('./storageService');

class AIService {
  /**
   * Break down a high-level task/goal into structured actionable subtasks
   */
  async breakdownTask({ title, description, context = {} }) {
    // If user provided an external API key and selected cloud LLM, we can call it.
    const settings = storageService.getSettings();
    if (settings.aiProvider === 'openai' && settings.apiKey) {
      try {
        return await this._breakdownWithOpenAI(title, description, settings.apiKey);
      } catch (err) {
        console.warn('OpenAI breakdown failed, using built-in neural heuristics:', err.message);
      }
    }

    return this._breakdownWithHeuristics(title, description);
  }

  /**
   * Built-in intelligent semantic heuristic decomposer
   */
  _breakdownWithHeuristics(title, description = '') {
    const rawText = `${title} ${description}`.toLowerCase();
    
    // Domain classifications
    const isDev = /(build|develop|code|api|backend|frontend|auth|database|bug|deploy|docker|k8s|refactor|test|app|website|react|node)/i.test(rawText);
    const isDesign = /(design|ui|ux|wireframe|figma|prototype|mockup|brand|logo|landing|css|theme|graphic)/i.test(rawText);
    const isMarketing = /(launch|marketing|campaign|growth|seo|social|content|blog|video|newsletter|ads|promote)/i.test(rawText);
    const isStudy = /(study|exam|course|learn|read|research|chapter|paper|homework|quiz)/i.test(rawText);
    const isBusiness = /(pitch|investor|budget|finance|sales|client|contract|meeting|hiring|strategy|roadmap)/i.test(rawText);

    let generatedSubtasks = [];
    let suggestedTags = [];
    let priority = 'high';
    let estimatedMinutes = 120;
    let rationale = '';

    if (isDev) {
      suggestedTags = ['Engineering', 'Architecture', 'Dev'];
      priority = /(auth|security|bug|crash|deploy|critical|broken)/i.test(rawText) ? 'urgent' : 'high';
      estimatedMinutes = 180;
      rationale = 'Decomposed based on agile engineering workflow: spec clarification, component design, implementation, and automated testing.';
      
      generatedSubtasks = [
        { title: `Clarify technical requirements & define schema for "${title}"`, completed: false, estimatedMins: 30 },
        { title: `Set up core scaffolding, models, and interface contracts`, completed: false, estimatedMins: 45 },
        { title: `Implement primary business logic and error handling pipelines`, completed: false, estimatedMins: 60 },
        { title: `Write unit & integration tests covering edge cases`, completed: false, estimatedMins: 30 },
        { title: `Perform code review, documentation, and staging deployment`, completed: false, estimatedMins: 15 }
      ];
    } else if (isDesign) {
      suggestedTags = ['Design', 'UI/UX', 'Creative'];
      priority = 'medium';
      estimatedMinutes = 150;
      rationale = 'Structured according to human-centered design principles: inspiration discovery, wireframing, high-fidelity mockups, and prototype review.';

      generatedSubtasks = [
        { title: `Gather visual references, moodboard & competitor benchmarks`, completed: false, estimatedMins: 30 },
        { title: `Draft low-fidelity wireframes and layout information hierarchy`, completed: false, estimatedMins: 40 },
        { title: `Design polished high-fidelity components with design tokens`, completed: false, estimatedMins: 50 },
        { title: `Build interactive prototype & test responsive breakpoints`, completed: false, estimatedMins: 20 },
        { title: `Export assets & create handoff documentation for developers`, completed: false, estimatedMins: 10 }
      ];
    } else if (isMarketing) {
      suggestedTags = ['Growth', 'Marketing', 'Campaign'];
      priority = 'high';
      estimatedMinutes = 140;
      rationale = 'Structured for maximum audience engagement: value proposition drafting, multi-channel asset creation, and analytics distribution.';

      generatedSubtasks = [
        { title: `Define target persona, core value proposition & KPI metrics`, completed: false, estimatedMins: 25 },
        { title: `Write compelling copy and headline variants for "${title}"`, completed: false, estimatedMins: 35 },
        { title: `Produce visual creatives, banners, and demo screenshots`, completed: false, estimatedMins: 40 },
        { title: `Schedule distribution across email newsletter & social channels`, completed: false, estimatedMins: 20 },
        { title: `Monitor initial conversion analytics and engage with comments`, completed: false, estimatedMins: 20 }
      ];
    } else if (isStudy) {
      suggestedTags = ['Learning', 'Research', 'Academics'];
      priority = 'medium';
      estimatedMinutes = 120;
      rationale = 'Cognitive learning cycle: active reading, structured synthesis, retrieval practice, and applied self-testing.';

      generatedSubtasks = [
        { title: `Survey core curriculum syllabus & outline key focus concepts`, completed: false, estimatedMins: 20 },
        { title: `Deep reading session and handwritten Cornell note synthesis`, completed: false, estimatedMins: 45 },
        { title: `Create active-recall flashcards & mental model diagrams`, completed: false, estimatedMins: 30 },
        { title: `Solve practical practice problems under timed conditions`, completed: false, estimatedMins: 25 }
      ];
    } else if (isBusiness) {
      suggestedTags = ['Strategy', 'Operations', 'Executive'];
      priority = 'high';
      estimatedMinutes = 160;
      rationale = 'Executive execution framework: stakeholder alignment, financial modeling, and presentation delivery.';

      generatedSubtasks = [
        { title: `Draft executive summary and problem-solution framework`, completed: false, estimatedMins: 35 },
        { title: `Compile quantitative financial projections and resource requirements`, completed: false, estimatedMins: 45 },
        { title: `Design crisp presentation slide deck for stakeholders`, completed: false, estimatedMins: 50 },
        { title: `Conduct dry-run review and finalize action plan milestones`, completed: false, estimatedMins: 30 }
      ];
    } else {
      // General Smart Breakdown
      suggestedTags = ['Productivity', 'Focus'];
      priority = 'medium';
      estimatedMinutes = 90;
      rationale = 'Decomposed using the First Principles action framework for goal achievement.';

      generatedSubtasks = [
        { title: `Define success criteria and gather required resources for "${title}"`, completed: false, estimatedMins: 20 },
        { title: `Execute Phase 1: Core foundation & preparation`, completed: false, estimatedMins: 35 },
        { title: `Execute Phase 2: Main deliverable execution & refinement`, completed: false, estimatedMins: 25 },
        { title: `Final review, quality check, and completion sign-off`, completed: false, estimatedMins: 10 }
      ];
    }

    return {
      title,
      description: description || `AI-decomposed workflow for: ${title}`,
      priority,
      estimatedMinutes,
      suggestedTags,
      rationale,
      subtasks: generatedSubtasks.map((st, i) => ({
        id: `sub-ai-${Date.now()}-${i}`,
        title: st.title,
        completed: false,
        estimatedMins: st.estimatedMins
      }))
    };
  }

  /**
   * Parse natural language task strings:
   * E.g. "Review backend PR tomorrow at 4pm #urgent @ai ~45m"
   */
  parseNaturalLanguage(text) {
    if (!text || typeof text !== 'string') {
      return { title: 'Untitled Task' };
    }

    let cleanTitle = text.trim();
    let priority = 'medium';
    let tags = [];
    let projectHint = null;
    let dueDate = null;
    let dueTime = '18:00';
    let estimatedMinutes = 30;

    // 1. Extract Tags (#tag)
    const tagMatches = cleanTitle.match(/#([\w-]+)/g);
    if (tagMatches) {
      tagMatches.forEach(tag => {
        const rawTag = tag.substring(1);
        if (['urgent', 'high', 'low', 'critical'].includes(rawTag.toLowerCase())) {
          priority = rawTag.toLowerCase() === 'critical' ? 'urgent' : rawTag.toLowerCase();
        } else {
          tags.push(rawTag);
        }
        cleanTitle = cleanTitle.replace(tag, '');
      });
    }

    // 2. Extract Project mentions (@project)
    const projectMatch = cleanTitle.match(/@([\w-]+)/);
    if (projectMatch) {
      projectHint = projectMatch[1];
      cleanTitle = cleanTitle.replace(projectMatch[0], '');
    }

    // 3. Extract Estimated Duration (~45m, ~2h, 30min)
    const durationMatch = cleanTitle.match(/~(\d+)(m|h|min|mins|hours)/i) || cleanTitle.match(/(\d+)\s*(m|min|mins|h|hr|hours)\b/i);
    if (durationMatch) {
      const val = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2].toLowerCase();
      if (unit.startsWith('h')) {
        estimatedMinutes = val * 60;
      } else {
        estimatedMinutes = val;
      }
      cleanTitle = cleanTitle.replace(durationMatch[0], '');
    }

    // 4. Extract Priority keywords if not already extracted
    if (/!(urgent|critical|asap)/i.test(cleanTitle) || /\b(urgent|critical|asap)\b/i.test(cleanTitle)) {
      priority = 'urgent';
      cleanTitle = cleanTitle.replace(/!(urgent|critical|asap)/gi, '').replace(/\b(urgent|critical|asap)\b/gi, '');
    } else if (/!high|\bhigh priority\b/i.test(cleanTitle)) {
      priority = 'high';
      cleanTitle = cleanTitle.replace(/!high|\bhigh priority\b/gi, '');
    } else if (/!low|\blow priority\b/i.test(cleanTitle)) {
      priority = 'low';
      cleanTitle = cleanTitle.replace(/!low|\blow priority\b/gi, '');
    }

    // 5. Extract Due Date & Time
    const today = new Date();
    const targetDate = new Date();

    if (/\btomorrow\b/i.test(cleanTitle)) {
      targetDate.setDate(today.getDate() + 1);
      dueDate = targetDate.toISOString().split('T')[0];
      cleanTitle = cleanTitle.replace(/\btomorrow\b/gi, '');
    } else if (/\btoday\b/i.test(cleanTitle)) {
      dueDate = today.toISOString().split('T')[0];
      cleanTitle = cleanTitle.replace(/\btoday\b/gi, '');
    } else if (/\bnext week\b/i.test(cleanTitle)) {
      targetDate.setDate(today.getDate() + 7);
      dueDate = targetDate.toISOString().split('T')[0];
      cleanTitle = cleanTitle.replace(/\bnext week\b/gi, '');
    } else {
      // Check for day names (e.g. on monday, friday)
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < days.length; i++) {
        const dayRegex = new RegExp(`\\b(on\\s+)?${days[i]}\\b`, 'i');
        if (dayRegex.test(cleanTitle)) {
          const currentDay = today.getDay();
          let diff = i - currentDay;
          if (diff <= 0) diff += 7;
          targetDate.setDate(today.getDate() + diff);
          dueDate = targetDate.toISOString().split('T')[0];
          cleanTitle = cleanTitle.replace(dayRegex, '');
          break;
        }
      }
    }

    // Extract Time (e.g., 3pm, 15:30, at 4:00pm)
    const timeMatch = cleanTitle.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch && (timeMatch[3] || timeMatch[2])) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? timeMatch[2] : '00';
      const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;

      dueTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      cleanTitle = cleanTitle.replace(timeMatch[0], '');
    }

    if (!dueDate) {
      dueDate = today.toISOString().split('T')[0];
    }

    // Clean up excessive whitespace and punctuation
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '');
    if (!cleanTitle) cleanTitle = 'New Task';

    return {
      title: cleanTitle,
      priority,
      tags,
      projectHint,
      dueDate,
      dueTime,
      estimatedMinutes,
      aiGenerated: false
    };
  }

  /**
   * Generate an executive AI Daily Briefing with prioritized actions and energy-matched schedule
   */
  generateDailyBriefing() {
    const tasks = storageService.getTasks();
    const projects = storageService.getProjects();
    const todayStr = new Date().toISOString().split('T')[0];

    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const completedToday = tasks.filter(t => t.status === 'completed' && t.updatedAt && t.updatedAt.startsWith(todayStr));
    const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < todayStr);
    const dueTodayTasks = activeTasks.filter(t => t.dueDate === todayStr);
    const urgentTasks = activeTasks.filter(t => t.priority === 'urgent');
    const inProgressTasks = activeTasks.filter(t => t.status === 'in-progress');

    // Priority ranking algorithm: (Urgent*4 + Overdue*3 + DueToday*2 + InProgress*1)
    const scoredTasks = activeTasks.map(task => {
      let score = 0;
      if (task.priority === 'urgent') score += 50;
      if (task.priority === 'high') score += 30;
      if (task.dueDate && task.dueDate < todayStr) score += 40;
      if (task.dueDate === todayStr) score += 25;
      if (task.status === 'in-progress') score += 15;
      if (task.subtasks && task.subtasks.length > 0) {
        const done = task.subtasks.filter(s => s.completed).length;
        score += (done / task.subtasks.length) * 10;
      }
      return { ...task, aiPriorityScore: score };
    }).sort((a, b) => b.aiPriorityScore - a.aiPriorityScore);

    const topFocusTasks = scoredTasks.slice(0, 3);

    // Build intelligent time-blocked schedule for the day
    const scheduleSlots = [];
    let currentHour = 9;
    let currentMin = 0;

    topFocusTasks.forEach((task, idx) => {
      const startStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      const duration = Math.min(120, task.estimatedMinutes || 60);
      
      let endMin = currentMin + duration;
      let endHour = currentHour + Math.floor(endMin / 60);
      endMin = endMin % 60;

      const endStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      scheduleSlots.push({
        slot: `${startStr} - ${endStr}`,
        phase: idx === 0 ? 'High Energy Focus Block' : idx === 1 ? 'Core Execution Block' : 'Wrap-up & Review',
        taskTitle: task.title,
        taskId: task.id,
        durationMinutes: duration,
        priority: task.priority
      });

      // Add 15 min rest interval
      currentMin = (endMin + 15) % 60;
      currentHour = endHour + Math.floor((endMin + 15) / 60);
    });

    // Generate smart insights and advice
    const insights = [];
    if (overdueTasks.length > 0) {
      insights.push(`🚨 **Bottleneck Alert**: You have ${overdueTasks.length} overdue task(s). Recommended to reschedule or complete the top blocker: "${overdueTasks[0].title}".`);
    }
    if (urgentTasks.length > 3) {
      insights.push(`⚠️ **Cognitive Load Warning**: You have ${urgentTasks.length} urgent tasks active. Consider delegating lower-impact items to avoid context switching.`);
    }
    if (completedToday.length > 0) {
      insights.push(`🎉 **Great Momentum**: You have already completed ${completedToday.length} task(s) today! Keep this flow going.`);
    } else {
      insights.push(`💡 **Focus Tip**: Kick off the day with your highest-impact task: "${topFocusTasks[0] ? topFocusTasks[0].title : 'Plan your roadmap'}" for a quick psychological win.`);
    }

    return {
      date: todayStr,
      greeting: this._getGreeting(),
      summary: `You have **${activeTasks.length} active tasks** across ${projects.length} projects. ${dueTodayTasks.length} due today, and ${overdueTasks.length} requiring immediate attention.`,
      topFocusTasks,
      scheduleSlots,
      insights,
      stats: {
        activeCount: activeTasks.length,
        dueTodayCount: dueTodayTasks.length,
        overdueCount: overdueTasks.length,
        completedTodayCount: completedToday.length
      }
    };
  }

  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! Here is your AI Daily Executive Briefing.';
    if (hour < 18) return 'Good afternoon! Here is your mid-day productivity briefing.';
    return 'Good evening! Here is your daily wrap-up and progress summary.';
  }

  /**
   * Conversational Assistant Handler for workload queries
   */
  async chatAssistant(message, conversationHistory = []) {
    const tasks = storageService.getTasks();
    const projects = storageService.getProjects();
    const analytics = storageService.getAnalytics();
    const activeTasks = tasks.filter(t => t.status !== 'completed');

    const msgLower = (message || '').toLowerCase();

    if (msgLower.includes('what should i do') || msgLower.includes('work on next') || msgLower.includes('recommend')) {
      const topTask = activeTasks.sort((a, b) => (a.priority === 'urgent' ? -1 : 1))[0];
      if (!topTask) {
        return {
          reply: `✨ All clear! You have no pending tasks. Would you like me to help you plan your next project or goal?`
        };
      }
      return {
        reply: `🎯 **Recommended Next Action:**\n\nI recommend tackling **"${topTask.title}"**.\n\n- **Priority:** \`${topTask.priority.toUpperCase()}\`\n- **Due Date:** ${topTask.dueDate || 'Flexible'}\n- **Estimated Duration:** ${topTask.estimatedMinutes || 30} mins\n\n💡 *Tip: Activate the 25-minute Pomodoro timer in the header to jump right into flow state.*`,
        suggestedTaskId: topTask.id
      };
    }

    if (msgLower.includes('summary') || msgLower.includes('progress') || msgLower.includes('status')) {
      return {
        reply: `📊 **Project Status Overview:**\n\n- **Total Tasks:** ${analytics.total}\n- **Completed:** ${analytics.completed} (${analytics.completionRate}% completion rate)\n- **In Progress:** ${analytics.inProgress}\n- **Productivity Score:** ${analytics.productivityScore}/100\n- **Overdue Items:** ${analytics.overdue > 0 ? `🚨 ${analytics.overdue}` : '✅ 0'}\n\nYou're making solid progress! Let me know if you want me to break down any new tasks.`
      };
    }

    if (msgLower.includes('break down') || msgLower.includes('decompose') || msgLower.includes('plan')) {
      const breakdown = this._breakdownWithHeuristics(message.replace(/break down|decompose|plan/gi, '').trim() || 'New Project');
      return {
        reply: `🤖 **Here is a proposed breakdown for "${breakdown.title}":**\n\n${breakdown.subtasks.map((st, i) => `${i + 1}. ${st.title} (~${st.estimatedMins}m)`).join('\n')}\n\n*Would you like me to add this directly as a new task card?*`,
        breakdownData: breakdown
      };
    }

    // Default friendly conversational response
    return {
      reply: `👋 I'm your **AI Task Copilot**! I can help you with:\n\n1. ⚡ **Task Breakdown**: Type *"Break down [any goal]"* to automatically generate subtasks.\n2. 🎯 **Priority Guidance**: Ask *"What should I work on next?"*\n3. 📊 **Daily Standup**: Click the **AI Briefing** button in the sidebar or ask *"Give me a progress summary"*\n4. ⏱️ **Focus Timer**: Start a Pomodoro block anytime for deep work.\n\nWhat can I assist you with today?`
    };
  }
}

module.exports = new AIService();
