/**
 * Main Application Script
 * Handles Clock, Greeting, Dock Shortcuts rendering, and Modal state management.
 */

class App {
  constructor() {
    this.init();
  }

  init() {
    this.startClock();
    this.renderDockShortcuts();
    this.setupModalControls();
  }

  /* Live Clock */
  startClock() {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours ? hours : 12; // 12-hour format

      const timeString = `${hours}:${minutes} ${ampm}`;
      const clockEl = document.getElementById('digitalClock');
      if (clockEl) clockEl.textContent = timeString;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  /* Render Website Shortcuts from shortcuts.config.js */
  renderDockShortcuts() {
    const dockContainer = document.getElementById('shortcutsDock');
    if (!dockContainer) return;

    const shortcuts = window.SHORTCUTS_CONFIG || [];

    const shortcutsHTML = shortcuts.map(item => `
      <a href="${item.url}" target="_blank" class="dock-item" data-tooltip="${item.name}">
        ${item.icon}
      </a>
    `).join('');

    // Settings icon & Fullscreen icon appended to the dock
    const actionIconsHTML = `
      <button class="dock-item" id="settingsBtn" data-tooltip="Settings" onclick="window.app.openSettingsModal()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/></svg>
      </button>
      <button class="dock-item" id="fullscreenBtn" data-tooltip="Toggle Fullscreen" onclick="window.app.toggleFullscreen()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
      </button>
    `;

    dockContainer.innerHTML = shortcutsHTML + actionIconsHTML;
  }

  /* Modal & Drawer Controls */
  setupModalControls() {
    const todoTile = document.getElementById('todoTileBtn');
    const backdrop = document.getElementById('overlayBackdrop');

    if (todoTile) {
      todoTile.addEventListener('click', () => this.toggleTasksDrawer());
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeAllOverlays());
    }
  }

  toggleTasksDrawer() {
    const drawer = document.getElementById('tasksDrawer');
    const backdrop = document.getElementById('overlayBackdrop');
    if (!drawer) return;

    const isActive = drawer.classList.contains('active');
    this.closeAllOverlays();

    if (!isActive) {
      drawer.classList.add('active');
      if (backdrop) backdrop.classList.add('active');
    }
  }

  openSettingsModal() {
    this.closeAllOverlays();
    const modal = document.getElementById('settingsModal');
    const backdrop = document.getElementById('overlayBackdrop');
    if (window.settingsManager) window.settingsManager.renderWallpaperGrid();
    if (modal && backdrop) {
      modal.classList.add('active');
      backdrop.classList.add('active');
    }
  }

  closeAllOverlays() {
    const drawer = document.getElementById('tasksDrawer');
    const settingsModal = document.getElementById('settingsModal');
    const backdrop = document.getElementById('overlayBackdrop');

    if (drawer) drawer.classList.remove('active');
    if (settingsModal) settingsModal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
