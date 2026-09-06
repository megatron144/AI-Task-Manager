<div align="center">

# 🧠 NeuroTask AI

### Intelligent Autonomous Task & Project Manager

**An AI-powered, full-stack productivity application with goal decomposition, Eisenhower Matrix prioritization, Kanban workflows, Pomodoro focus engine, and smart daily briefings.**

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**NeuroTask AI** is a full-stack, offline-first productivity web application that combines classic task management paradigms with a built-in AI engine. It ships with an NLP-powered command palette, autonomous goal decomposition, an Eisenhower Matrix, live Kanban boards, a Pomodoro timer, interactive calendar, productivity analytics, and a conversational AI Copilot — all running from a single Node.js server with zero external database dependencies.

---

## ✨ Features

### 🤖 Autonomous AI Goal Decomposition
Enter a high-level goal like *"Build Mobile App Authentication"* or *"Plan Product Launch"*, and the built-in AI engine automatically breaks it down into:
- Sequenced, actionable subtasks with time estimates
- Domain-aware workflow templates (Engineering, Design, Marketing, Study, Business)
- Suggested tags, priority level, and an execution rationale

Works **100% out of the box** — no API keys needed. Optional **OpenAI** integration is available via Settings for cloud-powered LLM breakdown.

### ⚡ Natural Language Quick-Add (`Cmd+K` / `Ctrl+K`)
Invoke the Command Palette and type tasks in plain English:

```
Review backend PR tomorrow at 4pm #urgent @infra ~45m
```

The NLP parser automatically extracts:
- **Title** • **Due Date & Time** • **Priority** (`#urgent`, `#high`, `#low`)
- **Project** (`@projectname`) • **Duration** (`~45m`, `2h`)

### 📋 Multi-Perspective Views

| View | Description |
|---|---|
| 📋 **Kanban Board** | HTML5 drag-and-drop across *To Do*, *In Progress*, *In Review*, and *Completed* lanes |
| 📄 **List View** | Tabular task overview with instant checkbox completion and inline editing |
| 🔲 **Eisenhower Matrix** | 4-quadrant prioritization (*Do First*, *Schedule*, *Delegate*, *Eliminate*) with drag-and-drop |
| 📅 **Calendar** | Full monthly & weekly timeline with deadline chips and click-to-schedule |
| 📊 **Analytics** | Real-time velocity curves (SVG), completion rates, milestone bars, and achievement badges |

### ⏱️ Integrated Pomodoro Focus Engine
- Live countdown header timer with **25-minute Work** / **5-minute Break** intervals
- Sound alerts synthesized via the **Web Audio API** (no broken external assets)
- Links to active tasks to log focused minutes against estimated time

### 📡 AI Daily Executive Briefing & Copilot
- One-click standup that analyzes your workload, identifies bottlenecks, and generates an energy-matched **time-blocked schedule**
- Floating AI Copilot drawer for instant recommendations, task planning, and productivity insights

### 💾 Reliable File-Backed Storage
- Fast **JSON file storage** with atomic writes and error resilience
- Full **backup export** (`.json`) and one-click **restore** functionality
- No database setup — data lives in `backend/data/tasks.json`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v8 or higher

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/Megatron144/AI-Task-Manager.git
cd AI-Task-Manager
```

**2. Install all dependencies and build CSS:**
```bash
npm run install:all
```

**3. Start the server:**
```bash
npm start
```

**4. Open in your browser:**
```
http://localhost:3000
```

> The server serves both the REST API and the frontend SPA from the same port.

### Development Mode

To watch for CSS changes during development:
```bash
npm run watch:css
```

---

## 🛠️ Tech Stack & Architecture

```
AI-Task-Manager/
├── frontend/
│   ├── index.html            # Single-page application shell
│   ├── css/
│   │   ├── main.css          # Core design tokens & layout (glassmorphism)
│   │   ├── kanban.css        # Kanban board styles
│   │   ├── views.css         # View-specific styles
│   │   ├── modal.css         # Modal & drawer styles
│   │   └── animations.css    # Micro-animations & transitions
│   └── js/
│       ├── app.js            # Root application controller
│       ├── api.js            # REST API client layer
│       ├── state.js          # Centralized app state
│       ├── kanban.js         # Drag-and-drop Kanban logic
│       ├── views.js          # View rendering (List, Matrix, Calendar, Analytics)
│       ├── timer.js          # Pomodoro focus engine (Web Audio API)
│       ├── ai.js             # AI Copilot & Briefing UI
│       ├── commandPalette.js # NLP Command Palette
│       └── analytics.js      # SVG velocity chart & badges
└── backend/
    ├── server.js             # Express REST API server
    ├── services/
    │   ├── aiService.js      # NLP parser, heuristic goal decomposer, briefing engine
    │   └── storageService.js # JSON file-backed data persistence layer
    └── data/
        └── tasks.json        # Persistent data store (auto-created)
```

**Frontend:** Vanilla HTML5 · Modern CSS (Glassmorphism, CSS Grid/Flexbox, Dark/Light themes) · Modular Vanilla JavaScript (ES2022)

**Backend:** Node.js · Express.js · File-based JSON persistence (zero database overhead)

**AI Engine:** Domain-aware semantic heuristic decomposer · NLP task string parser · Priority scoring algorithm · Optional OpenAI integration

---

## 📡 REST API Reference

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Fetch all tasks. Supports filters: `status`, `priority`, `projectId`, `quadrant`, `search` |
| `GET` | `/api/tasks/:id` | Fetch a single task by ID |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task completion (`todo` ↔ `completed`) |
| `PATCH` | `/api/tasks/:id/subtasks/:subId/toggle` | Toggle an individual subtask |
| `POST` | `/api/tasks/bulk` | Bulk `delete` or `update` multiple tasks by ID array |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | Fetch all projects |
| `POST` | `/api/projects` | Create a new project |
| `DELETE` | `/api/projects/:id` | Delete a project |

### AI & NLP

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/breakdown` | AI goal decomposition into structured subtasks |
| `POST` | `/api/ai/parse` | Parse a natural language task string |
| `GET` | `/api/ai/daily-briefing` | Generate AI daily standup & time-block schedule |
| `POST` | `/api/ai/chat` | Send a message to the AI Copilot assistant |

### Analytics & Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Productivity score, velocity, and project metrics |
| `GET` | `/api/settings` | Fetch application settings |
| `PUT` | `/api/settings` | Update settings (AI provider, API key, preferences) |

### Backup & Restore

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export` | Download a full JSON database backup |
| `POST` | `/api/import` | Restore the database from a JSON backup |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` / `Ctrl+K` | Open Command Palette (NLP Quick-Add) |
| `1` – `5` | Switch between views (Kanban → List → Matrix → Calendar → Analytics) |
| `Esc` | Close active modal, drawer, or palette |

---

## 🤖 AI Configuration (Optional)

By default, the AI engine runs fully offline using built-in domain-aware heuristics — no setup required.

To enable cloud-powered LLM breakdown via OpenAI:
1. Open **Settings** within the app
2. Select **OpenAI** as your AI provider
3. Enter your OpenAI API key

The app falls back gracefully to the built-in heuristic engine if the cloud call fails.

---

## 🗄️ Data & Persistence

All data is stored locally in `backend/data/tasks.json`. This file is created automatically on first run and seeded with sample data from `backend/data/initialData.json`.

- **Backup**: Use the Export button in the app or call `GET /api/export`
- **Restore**: Use the Import option in the app or call `POST /api/import`
- **Reset**: Delete `tasks.json` and restart the server to restore the seed data

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ✨ by [Aditya Raj](https://github.com/Megatron144)

</div>
