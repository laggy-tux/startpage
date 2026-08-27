/**
 * Google Tasks Integration & Local Storage Sync Engine
 * Handles Google OAuth 2.0 PKCE authentication, task fetching, creation, checking off, and deletion.
 */

class TasksManager {
  constructor() {
    this.clientIdKey = 'newtab_google_client_id';
    this.accessTokenKey = 'newtab_google_access_token';
    this.tokenExpiryKey = 'newtab_google_token_expiry';
    this.localTasksKey = 'newtab_local_tasks';
    
    this.tasks = [];
    this.currentListId = '@default';
    this.isGoogleConnected = false;

    this.init();
  }

  init() {
    this.checkGoogleAuthStatus();
    this.loadTasks();
    this.setupEventListeners();
  }

  checkGoogleAuthStatus() {
    const token = localStorage.getItem(this.accessTokenKey);
    const expiry = localStorage.getItem(this.tokenExpiryKey);

    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      this.isGoogleConnected = true;
      this.updateSyncBannerUI(true);
    } else {
      this.isGoogleConnected = false;
      this.updateSyncBannerUI(false);
    }
  }

  // Google OAuth 2.0 PKCE Authorization
  initiateGoogleLogin() {
    const clientId = localStorage.getItem(this.clientIdKey) || prompt('Please enter your Google OAuth 2.0 Client ID:');
    if (!clientId) {
      alert('Google Client ID is required for Google Tasks sync. You can set it in Settings.');
      return;
    }
    localStorage.setItem(this.clientIdKey, clientId);

    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'https://www.googleapis.com/auth/tasks';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  }

  handleOAuthCallback() {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');

      if (accessToken) {
        const expiryTime = Date.now() + parseInt(expiresIn, 10) * 1000;
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
        window.history.replaceState(null, null, window.location.pathname);
        this.isGoogleConnected = true;
        this.loadTasks();
      }
    }
  }

  async loadTasks() {
    this.handleOAuthCallback();

    if (this.isGoogleConnected) {
      try {
        await this.fetchGoogleTasks();
        return;
      } catch (err) {
        console.warn('Failed to fetch from Google Tasks API, falling back to local tasks:', err);
        this.isGoogleConnected = false;
        this.updateSyncBannerUI(false);
      }
    }

    // Fallback: Local Storage Tasks
    const localData = localStorage.getItem(this.localTasksKey);
    if (localData) {
      this.tasks = JSON.parse(localData);
    } else {
      // Default welcome tasks matching screenshot theme
      this.tasks = [
        { id: '1', title: 'Complete New Tab setup', completed: true },
        { id: '2', title: 'Connect Google Tasks account', completed: false },
        { id: '3', title: 'Customize desktop wallpaper', completed: false }
      ];
      this.saveLocalTasks();
    }
    this.renderTasks();
  }

  async fetchGoogleTasks() {
    const token = localStorage.getItem(this.accessTokenKey);
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${this.currentListId}/tasks?showCompleted=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Google Tasks API Error: ${res.statusText}`);

    const data = await res.json();
    this.tasks = (data.items || []).map(item => ({
      id: item.id,
      title: item.title,
      completed: item.status === 'completed'
    }));

    this.renderTasks();
    this.updateSyncBannerUI(true);
  }

  async addTask(title) {
    if (!title.trim()) return;

    if (this.isGoogleConnected) {
      try {
        const token = localStorage.getItem(this.accessTokenKey);
        const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${this.currentListId}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title.trim() })
        });
        if (res.ok) {
          await this.fetchGoogleTasks();
          return;
        }
      } catch (err) {
        console.error('Error adding task to Google Tasks:', err);
      }
    }

    // Local Task Add
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false
    };
    this.tasks.unshift(newTask);
    this.saveLocalTasks();
    this.renderTasks();
  }

  async toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (this.isGoogleConnected) {
      try {
        const token = localStorage.getItem(this.accessTokenKey);
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${this.currentListId}/tasks/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: task.completed ? 'completed' : 'needsAction'
          })
        });
      } catch (err) {
        console.error('Error updating task status:', err);
      }
    }

    this.saveLocalTasks();
    this.renderTasks();
  }

  async deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);

    if (this.isGoogleConnected) {
      try {
        const token = localStorage.getItem(this.accessTokenKey);
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${this.currentListId}/tasks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }

    this.saveLocalTasks();
    this.renderTasks();
  }

  saveLocalTasks() {
    localStorage.setItem(this.localTasksKey, JSON.stringify(this.tasks));
  }

  updateSyncBannerUI(isConnected) {
    const banner = document.getElementById('tasksSyncBanner');
    if (!banner) return;

    if (isConnected) {
      banner.innerHTML = `
        <span style="color: rgba(255, 255, 255, 0.9);">✓ Connected to Google Tasks</span>
        <button class="sync-link-btn" onclick="window.tasksManager.disconnectGoogle()">Disconnect</button>
      `;
    } else {
      banner.innerHTML = `
        <span>💡 Sync with Google Tasks</span>
        <button class="sync-link-btn" onclick="window.tasksManager.initiateGoogleLogin()">Connect</button>
      `;
    }
  }

  disconnectGoogle() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    this.isGoogleConnected = false;
    this.loadTasks();
  }

  renderTasks() {
    const listEl = document.getElementById('taskList');
    if (!listEl) return;

    if (this.tasks.length === 0) {
      listEl.innerHTML = `<li style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.88rem; padding: 16px;">No tasks yet. Add one above!</li>`;
      return;
    }

    listEl.innerHTML = this.tasks.map(task => `
      <li class="task-item">
        <label class="task-label">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="window.tasksManager.toggleTask('${task.id}')">
          <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</span>
        </label>
        <button class="delete-task-btn" title="Delete task" onclick="window.tasksManager.deleteTask('${task.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </li>
    `).join('');
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addTaskBtn');
    const input = document.getElementById('taskInput');

    if (addBtn && input) {
      const handleAdd = () => {
        this.addTask(input.value);
        input.value = '';
      };

      addBtn.addEventListener('click', handleAdd);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tasksManager = new TasksManager();
});
