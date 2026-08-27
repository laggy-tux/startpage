/**
 * Settings & Wallpaper Switcher Manager
 * Handles wallpaper preset selection, custom URL image addition, wallpaper deletion, user profile preferences, and Google Client ID setup.
 */

class SettingsManager {
  constructor() {
    this.wallpaperKey = 'newtab_current_wallpaper';
    this.wallpapersListKey = 'newtab_wallpapers_list';
    this.userNameKey = 'newtab_user_name';
    this.clientIdKey = 'newtab_google_client_id';

    this.defaultWallpapers = [
      { id: 'default-forest', name: 'Enchanted Forest', url: 'assets/wallpapers/default-forest.png' },
      { id: 'sky-whales', name: 'Sky Whales', url: 'assets/wallpapers/sky-whales.jpg' },
      { id: 'pixel-rooftop', name: 'Pixel Rooftop', url: 'assets/wallpapers/pixel-rooftop.png' },
      { id: 'autumn-ruins', name: 'Autumn Ruins', url: 'assets/wallpapers/autumn-ruins.png' },
      { id: 'purple-galaxy', name: 'Purple Galaxy', url: 'assets/wallpapers/purple-galaxy.png' },
      { id: 'pixel-earth', name: 'Pixel Earth', url: 'assets/wallpapers/pixel-earth.png' }
    ];

    this.wallpapers = [];

    this.init();
  }

  init() {
    this.loadWallpapersList();
    this.loadWallpaper();
    this.loadUserName();
    this.loadGoogleClientId();
    this.setupEventListeners();
  }

  loadWallpapersList() {
    const saved = localStorage.getItem(this.wallpapersListKey);
    if (saved) {
      try {
        let loaded = JSON.parse(saved);
        // Ensure default wallpapers are always present
        this.defaultWallpapers.forEach(dwp => {
          if (!loaded.some(w => w.id === dwp.id || w.url === dwp.url)) {
            loaded.unshift(dwp);
          }
        });
        this.wallpapers = loaded;
      } catch (e) {
        this.wallpapers = [...this.defaultWallpapers];
      }
    } else {
      this.wallpapers = [...this.defaultWallpapers];
    }
    this.saveWallpapersList();
  }

  saveWallpapersList() {
    localStorage.setItem(this.wallpapersListKey, JSON.stringify(this.wallpapers));
  }

  loadWallpaper() {
    const savedWallpaper = localStorage.getItem(this.wallpaperKey) || 'assets/wallpapers/default-forest.png';
    this.setWallpaper(savedWallpaper, false);
  }

  setWallpaper(url, save = true) {
    document.body.style.backgroundImage = `url('${url}')`;
    if (save) {
      localStorage.setItem(this.wallpaperKey, url);
    }
    this.highlightActiveWallpaperCard(url);
  }

  addWallpaper(name, url) {
    if (!url) return;
    const newWp = {
      id: 'wp-' + Date.now(),
      name: name || 'Custom Wallpaper',
      url: url
    };
    this.wallpapers.push(newWp);
    this.saveWallpapersList();
    this.setWallpaper(url);
    this.renderWallpaperGrid();
  }

  deleteWallpaper(id, event) {
    if (event) event.stopPropagation();

    const currentUrl = localStorage.getItem(this.wallpaperKey);
    const targetWp = this.wallpapers.find(w => w.id === id);

    this.wallpapers = this.wallpapers.filter(w => w.id !== id);
    this.saveWallpapersList();

    // If the active wallpaper was deleted, switch back to default forest wallpaper
    if (targetWp && currentUrl === targetWp.url) {
      const fallbackUrl = this.wallpapers.length > 0 ? this.wallpapers[0].url : 'assets/wallpapers/default-forest.png';
      this.setWallpaper(fallbackUrl);
    }

    this.renderWallpaperGrid();
  }

  loadUserName() {
    const name = localStorage.getItem(this.userNameKey) || 'Joy Yahshua';
    const nameEl = document.getElementById('greetingName');
    const inputEl = document.getElementById('userNameInput');
    
    if (nameEl) nameEl.textContent = name;
    if (inputEl) inputEl.value = name;
  }

  saveUserName(name) {
    if (!name.trim()) return;
    localStorage.setItem(this.userNameKey, name.trim());
    const nameEl = document.getElementById('greetingName');
    if (nameEl) nameEl.textContent = name.trim();
  }

  loadGoogleClientId() {
    const clientId = localStorage.getItem(this.clientIdKey) || '';
    const inputEl = document.getElementById('googleClientIdInput');
    if (inputEl) inputEl.value = clientId;
  }

  saveGoogleClientId(clientId) {
    localStorage.setItem(this.clientIdKey, clientId.trim());
  }

  renderWallpaperGrid() {
    const grid = document.getElementById('wallpaperGrid');
    if (!grid) return;

    const currentUrl = localStorage.getItem(this.wallpaperKey) || 'assets/wallpapers/default-forest.png';

    if (this.wallpapers.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.85rem; padding: 12px;">No wallpapers. Add one via link below!</div>`;
      return;
    }

    grid.innerHTML = this.wallpapers.map(wp => `
      <div class="wallpaper-card ${currentUrl === wp.url ? 'active' : ''}" onclick="window.settingsManager.setWallpaper('${wp.url}')">
        <button class="delete-wallpaper-btn" title="Delete wallpaper" onclick="window.settingsManager.deleteWallpaper('${wp.id}', event)">✕</button>
        <img src="${wp.url}" alt="${wp.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/wallpapers/default-forest.png';">
        <div class="wallpaper-card-title">${this.escapeHtml(wp.name)}</div>
      </div>
    `).join('');
  }

  highlightActiveWallpaperCard(url) {
    const cards = document.querySelectorAll('.wallpaper-card');
    cards.forEach(card => {
      const img = card.querySelector('img');
      if (img && img.getAttribute('src') === url) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  handleCustomUrlSubmit() {
    const input = document.getElementById('customWallpaperUrlInput');
    if (input && input.value.trim()) {
      const url = input.value.trim();
      this.addWallpaper('Custom Link', url);
      input.value = '';
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  setupEventListeners() {
    // Custom Wallpaper URL
    const applyUrlBtn = document.getElementById('applyCustomUrlBtn');
    if (applyUrlBtn) {
      applyUrlBtn.addEventListener('click', () => this.handleCustomUrlSubmit());
    }

    // User Name Input
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => this.saveUserName(e.target.value));
    }

    // Google Client ID Input
    const clientIdInput = document.getElementById('googleClientIdInput');
    if (clientIdInput) {
      clientIdInput.addEventListener('change', (e) => this.saveGoogleClientId(e.target.value));
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new SettingsManager();
});
