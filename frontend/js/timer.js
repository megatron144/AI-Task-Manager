/**
 * AI TASK MANAGER - POMODORO FOCUS TIMER & WEB AUDIO SOUND ENGINE
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play gentle completion chime
  playComplete() {
    if (!window.state || !window.state.settings.soundEnabled) return;
    try {
      this._initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Dual harmonious tone: C5 (523.25Hz) -> G5 (783.99Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio synthesis note:', e.message);
    }
  }

  // Soft UI click feedback
  playClick() {
    if (!window.state || !window.state.settings.soundEnabled) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

class PomodoroTimer {
  constructor() {
    this.sound = new SoundEngine();
    this.status = 'idle'; // 'idle' | 'running' | 'paused'
    this.mode = 'work';   // 'work' | 'break'
    this.remainingSeconds = 25 * 60;
    this.totalSeconds = 25 * 60;
    this.intervalId = null;
    this.activeTaskId = null;
    this.completedSessions = 0;
  }

  init() {
    this.pillEl = document.getElementById('pomodoro-header-pill');
    this.timeEl = document.getElementById('pomodoro-display-time');

    if (this.pillEl) {
      this.pillEl.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Listen to settings update to adjust work/break duration
    window.state.on('settings:changed', (settings) => {
      if (this.status === 'idle') {
        const mins = this.mode === 'work' ? (settings.pomodoroWorkMinutes || 25) : (settings.pomodoroBreakMinutes || 5);
        this.remainingSeconds = mins * 60;
        this.totalSeconds = this.remainingSeconds;
        this.updateDisplay();
      }
    });

    this.updateDisplay();
  }

  toggle() {
    this.sound.playClick();
    if (this.status === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  start(taskId = null) {
    if (taskId) this.activeTaskId = taskId;
    this.status = 'running';
    if (this.pillEl) this.pillEl.classList.add('running');

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.updateDisplay();
    window.showToast(`🔥 Focus Session Started (${this.mode === 'work' ? '25 min deep work' : '5 min break'})`, 'info');
  }

  pause() {
    this.status = 'paused';
    if (this.pillEl) this.pillEl.classList.remove('running');
    if (this.intervalId) clearInterval(this.intervalId);
    this.updateDisplay();
    window.showToast('⏸️ Focus Timer Paused', 'info');
  }

  reset() {
    this.status = 'idle';
    if (this.pillEl) this.pillEl.classList.remove('running');
    if (this.intervalId) clearInterval(this.intervalId);

    const workMins = (window.state.settings && window.state.settings.pomodoroWorkMinutes) || 25;
    this.mode = 'work';
    this.remainingSeconds = workMins * 60;
    this.totalSeconds = this.remainingSeconds;
    this.updateDisplay();
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();

      // If active task exists, add 1/60th of a minute to spent time every 60s
      if (this.activeTaskId && this.remainingSeconds % 60 === 0 && this.mode === 'work') {
        const task = window.state.tasks.find(t => t.id === this.activeTaskId);
        if (task) {
          const updatedMinutes = (task.spentMinutes || 0) + 1;
          window.api.updateTask(task.id, { spentMinutes: updatedMinutes }).then(updated => {
            window.state.updateTaskInState(updated);
          });
        }
      }
    } else {
      this.completeSession();
    }
  }

  completeSession() {
    this.sound.playComplete();
    if (this.intervalId) clearInterval(this.intervalId);

    if (this.mode === 'work') {
      this.completedSessions++;
      this.mode = 'break';
      const breakMins = (window.state.settings && window.state.settings.pomodoroBreakMinutes) || 5;
      this.remainingSeconds = breakMins * 60;
      this.totalSeconds = this.remainingSeconds;
      this.status = 'idle';
      if (this.pillEl) this.pillEl.classList.remove('running');
      window.showToast('🎉 Focus Block Completed! Take a 5-minute breather.', 'success');
    } else {
      this.mode = 'work';
      const workMins = (window.state.settings && window.state.settings.pomodoroWorkMinutes) || 25;
      this.remainingSeconds = workMins * 60;
      this.totalSeconds = this.remainingSeconds;
      this.status = 'idle';
      if (this.pillEl) this.pillEl.classList.remove('running');
      window.showToast('✨ Break Finished! Ready to dive back in?', 'info');
    }

    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.timeEl) {
      this.timeEl.textContent = formatted;
    }

    document.title = this.status === 'running'
      ? `(${formatted}) ${this.mode === 'work' ? '🎯 Focus' : '☕ Break'} - AI Task Manager`
      : 'AI Task Manager';
  }
}

window.soundEngine = new SoundEngine();
window.timer = new PomodoroTimer();
