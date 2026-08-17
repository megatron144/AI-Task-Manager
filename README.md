# 🧠 NeuroTask AI - Intelligent Autonomous Task & Project Manager

An AI-powered, full-stack Task & Project Management web application featuring intelligent goal decomposition, Eisenhower Matrix prioritization, real-time Pomodoro focus engine, dynamic Kanban workflows, calendar scheduling, and productivity analytics.

![UI Design](https://img.shields.io/badge/Design-Glassmorphism-6366f1)
![AI-Powered](https://img.shields.io/badge/AI-Neural%20Heuristics%20%26%20NLP-8b5cf6)
![NodeJS](https://img.shields.io/badge/Backend-Node.js%20Express-10b981)

---

## ✨ Hero Features

### 1. 🤖 Autonomous AI Goal Decomposition
- Enter high-level goals like *"Build Mobile App Authentication"*, *"Plan Product Launch"*, or *"Study for Machine Learning Finals"*.
- The built-in AI engine autonomously parses and breaks your goal down into sequenced milestones, subtasks, time estimates, suggested tags, and execution rationale.
- Works **100% out of the box** with zero external API keys required, with optional OpenAI/Gemini cloud LLM connectivity in Settings.

### 2. ⚡ Natural Language Quick-Add (`Cmd+K` / `Ctrl+K`)
- Instant Command Palette with live real-time NLP parsing.
- Type strings like `Review backend PR tomorrow at 4pm #urgent @infra ~45m` and watch the system automatically extract the title, date, time, priority, tags, project, and duration.

### 3. 📋 Multi-Perspective Views
- **Kanban Board**: Physics-smooth HTML5 drag-and-drop workflow across *To Do*, *In Progress*, *In Review*, and *Completed* lanes.
- **List & Table View**: Tabular overview with instant checkbox completion, sorting, and inline editing.
- **Eisenhower Matrix**: 4-quadrant prioritization (*Do First*, *Schedule*, *Delegate*, *Eliminate*) with interactive cross-quadrant drag-and-drop.
- **Interactive Calendar**: Full monthly & weekly timeline with deadline chips and click-to-schedule capabilities.
- **Productivity Analytics**: Real-time calculated velocity curve (SVG), completion ratios, project milestone bars, and gamified achievement badges.

### 4. ⏱️ Integrated Pomodoro Focus Engine
- Header timer with live countdown, interval switches (25 min Work / 5 min Break), and sound synthesized with the **Web Audio API** (zero broken external sound assets).
- Links directly to your active task to log actual focused minutes against estimated time.

### 5. 🤖 AI Daily Executive Briefing & Copilot
- One-click daily standup summarizing today's workload, identifying overdue bottlenecks, and calculating an energy-matched time-block schedule.
- Floating AI Copilot assistant drawer for instant task recommendations and advice.

### 6. 💾 Reliable File-Backed Storage & Portability
- Fast JSON file storage with atomic writes and error resilience.
- Full backup export (`.json`) and 1-click restore functionality.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation & Launch

1. **Install Dependencies**:
```bash
npm run install:all
```

2. **Start the Application**:
```bash
npm start
```

3. **Open in Browser**:
Visit [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism design tokens, CSS Grid/Flexbox, Dark/Light modes), Modular Vanilla JavaScript (`api.js`, `state.js`, `kanban.js`, `views.js`, `timer.js`, `ai.js`, `commandPalette.js`, `analytics.js`).
- **Backend**: Node.js & Express.js REST API with zero external database setup overhead.
- **AI & NLP Engine**: Intelligent semantic heuristic parser and goal decomposition engine with external LLM expansion hook.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Fetch tasks with query filters (`status`, `priority`, `projectId`, `search`) |
| `POST` | `/api/tasks` | Create a new task with subtasks, tags, and priority |
| `PUT` | `/api/tasks/:id` | Update task fields and subtasks |
| `DELETE` | `/api/tasks/:id` | Remove a task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task completion status |
| `PATCH` | `/api/tasks/:id/subtasks/:subId/toggle` | Toggle individual subtask completion |
| `POST` | `/api/ai/breakdown` | AI Task & Goal decomposition into subtasks |
| `POST` | `/api/ai/parse` | Natural language string parser |
| `GET` | `/api/ai/daily-briefing` | Generate daily standup & time-blocked schedule |
| `POST` | `/api/ai/chat` | AI Copilot conversational assistant |
| `GET` | `/api/analytics` | Productivity score, velocity, and project metrics |
| `GET` | `/api/export` | Download JSON database backup |
| `POST` | `/api/import` | Restore database from JSON backup |

---

## ⌨️ Keyboard Shortcuts

- `Cmd + K` or `Ctrl + K`: Open Command Palette / Natural Language Quick-Add
- `ESC`: Close active modal or drawer
- `1 - 5`: Jump across Kanban, List, Matrix, Calendar, and Analytics views

---

## 📄 License
MIT License
