import { FieldCanvas } from '../modules/FieldCanvas';
import { PlayerIcons } from '../modules/PlayerIcons';
import { FormationManager } from '../modules/FormationManager';
import { RouteEditor } from '../modules/RouteEditor';
import { TimelineSync } from '../modules/TimelineSync';
import { apiClient } from '../services/ApiClient';
import { Formation, PlaySequence, Player, Position } from '../types';

export class FootballAnalyzer {
  private container: HTMLElement;
  private fieldCanvas: FieldCanvas;
  private playerIcons: PlayerIcons;
  private formationManager: FormationManager;
  private routeEditor: RouteEditor;
  private timelineSync: TimelineSync;
  
  private canvasElement: HTMLCanvasElement;
  private overlayElement: HTMLElement;
  private timelineElement: HTMLElement;
  private videoElement: HTMLVideoElement | null = null;

  private selectedPlayer: Player | null = null;
  private isInitialized: boolean = false;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.playerIcons = new PlayerIcons();
    this.formationManager = new FormationManager();
    this.timelineSync = new TimelineSync();

    this.initializeDOM();
    this.setupEventListeners();
    this.initialize();
  }

  private initializeDOM(): void {
    this.container.innerHTML = `
      <div class="football-analyzer">
        <header class="analyzer-header">
          <div class="header-left">
            <h1>Football Analyzer</h1>
            <div class="formation-selector">
              <select id="formation-select" class="formation-dropdown">
                <option value="">Select Formation...</option>
              </select>
              <button id="save-formation" class="btn btn-secondary">Save</button>
              <button id="reset-formation" class="btn btn-secondary">Reset</button>
            </div>
          </div>
          <div class="header-right">
            <div class="view-controls">
              <button id="zoom-in" class="btn btn-icon">+</button>
              <button id="zoom-out" class="btn btn-icon">-</button>
              <button id="snap-grid" class="btn btn-toggle">Grid</button>
            </div>
          </div>
        </header>

        <main class="analyzer-main">
          <aside class="formation-panel">
            <div class="panel-section">
              <h3>Formation Library</h3>
              <div class="formation-categories">
                <div class="category">
                  <h4>Offensive</h4>
                  <div id="offensive-formations" class="formation-list"></div>
                </div>
                <div class="category">
                  <h4>Defensive</h4>
                  <div id="defensive-formations" class="formation-list"></div>
                </div>
              </div>
            </div>

            <div class="panel-section">
              <h3>Player Properties</h3>
              <div id="player-properties" class="player-props">
                <p>Select a player to view properties</p>
              </div>
            </div>
          </aside>

          <div class="field-container">
            <div class="field-wrapper">
              <canvas id="field-canvas" class="field-canvas"></canvas>
              <div id="field-overlay" class="field-overlay"></div>
            </div>
            <div id="position-feedback" class="position-feedback"></div>
          </div>

          <aside class="timeline-panel">
            <div class="panel-section">
              <h3>Timeline Controls</h3>
              <div class="timeline-controls">
                <div class="playback-controls">
                  <button id="play-pause" class="btn btn-primary">▶</button>
                  <button id="step-back" class="btn btn-secondary">⏮</button>
                  <button id="step-forward" class="btn btn-secondary">⏭</button>
                </div>
                <div class="timeline-scrubber">
                  <input id="timeline-slider" type="range" min="0" max="100" value="0" class="timeline-slider">
                  <div class="timeline-markers">
                    <span class="marker pre-snap">Pre-Snap</span>
                    <span class="marker snap">Snap</span>
                    <span class="marker post-snap">Post-Snap</span>
                    <span class="marker end">End</span>
                  </div>
                </div>
                <div class="timeline-info">
                  <span id="current-time">0:00</span> / <span id="total-time">0:00</span>
                </div>
              </div>
            </div>

            <div class="panel-section">
              <h3>Video Sync</h3>
              <div class="video-controls">
                <input id="video-file" type="file" accept="video/*" class="file-input">
                <button id="sync-video" class="btn btn-secondary">Sync Video</button>
                <div class="sync-offset">
                  <label>Offset (ms):</label>
                  <input id="sync-offset" type="number" value="0" step="100">
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer class="analyzer-footer">
          <div class="status-bar">
            <span id="status-text">Ready</span>
            <span id="connection-status" class="status-indicator offline">Offline</span>
          </div>
        </footer>
      </div>
    `;

    // Get references to key elements
    this.canvasElement = document.getElementById('field-canvas') as HTMLCanvasElement;
    this.overlayElement = document.getElementById('field-overlay') as HTMLElement;
    this.timelineElement = document.querySelector('.timeline-scrubber') as HTMLElement;

    // Initialize modules
    this.fieldCanvas = new FieldCanvas(this.canvasElement);
    this.routeEditor = new RouteEditor(this.overlayElement);
  }

  private setupEventListeners(): void {
    // Formation selection
    const formationSelect = document.getElementById('formation-select') as HTMLSelectElement;
    formationSelect.addEventListener('change', this.handleFormationChange.bind(this));

    // Formation controls
    document.getElementById('save-formation')?.addEventListener('click', this.saveFormation.bind(this));
    document.getElementById('reset-formation')?.addEventListener('click', this.resetFormation.bind(this));

    // View controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.adjustZoom(0.2));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.2));
    document.getElementById('snap-grid')?.addEventListener('click', this.toggleSnapToGrid.bind(this));

    // Timeline controls
    document.getElementById('play-pause')?.addEventListener('click', this.togglePlayback.bind(this));
    document.getElementById('step-back')?.addEventListener('click', () => this.stepTimeline(-500));
    document.getElementById('step-forward')?.addEventListener('click', () => this.stepTimeline(500));
    
    const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement;
    timelineSlider.addEventListener('input', this.handleTimelineSeek.bind(this));

    // Video controls
    document.getElementById('video-file')?.addEventListener('change', this.handleVideoUpload.bind(this));
    document.getElementById('sync-video')?.addEventListener('click', this.syncVideo.bind(this));
    document.getElementById('sync-offset')?.addEventListener('change', this.handleOffsetChange.bind(this));

    // Module event handlers
    this.formationManager.setOnFormationChange(this.handleFormationUpdate.bind(this));
    this.routeEditor.setOnPlayerMove(this.handlePlayerMove.bind(this));
    this.timelineSync.setOnTimeUpdate(this.handleTimelineUpdate.bind(this));
    this.timelineSync.setOnPlayStateChange(this.handlePlayStateChange.bind(this));

    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  private async initialize(): Promise<void> {
    try {
      // Load formations
      await this.loadFormations();
      
      // Check API connection
      await this.checkApiConnection();
      
      // Load default formation
      this.loadDefaultFormation();
      
      this.isInitialized = true;
      this.updateStatus('Ready');
      
    } catch (error) {
      console.error('Failed to initialize Football Analyzer:', error);
      this.updateStatus('Initialization failed');
    }
  }

  private async loadFormations(): Promise<void> {
    try {
      // Load local formations
      const formations = this.formationManager.getAvailableFormations();
      this.populateFormationSelector(formations);

      // Try to load remote formations
      if (apiClient.isAuthenticated()) {
        const remoteFormations = await apiClient.getFormations();
        // Merge with local formations
      }
    } catch (error) {
      console.error('Failed to load formations:', error);
    }
  }

  private populateFormationSelector(formations: { offensive: Formation[]; defensive: Formation[] }): void {
    const select = document.getElementById('formation-select') as HTMLSelectElement;
    select.innerHTML = '<option value="">Select Formation...</option>';

    // Add offensive formations
    const offensiveGroup = document.createElement('optgroup');
    offensiveGroup.label = 'Offensive';
    formations.offensive.forEach(formation => {
      const option = document.createElement('option');
      option.value = formation.id;
      option.textContent = formation.name;
      offensiveGroup.appendChild(option);
    });
    select.appendChild(offensiveGroup);

    // Add defensive formations
    const defensiveGroup = document.createElement('optgroup');
    defensiveGroup.label = 'Defensive';
    formations.defensive.forEach(formation => {
      const option = document.createElement('option');
      option.value = formation.id;
      option.textContent = formation.name;
      defensiveGroup.appendChild(option);
    });
    select.appendChild(defensiveGroup);
  }

  private async checkApiConnection(): Promise<void> {
    try {
      await apiClient.healthCheck();
      this.updateConnectionStatus(true);
    } catch (error) {
      this.updateConnectionStatus(false);
    }
  }

  private loadDefaultFormation(): void {
    // Load I-Formation as default
    this.formationManager.loadFormation('i-formation');
  }

  private handleFormationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const formationId = select.value;
    
    if (formationId) {
      this.formationManager.loadFormation(formationId);
    }
  }

  private handleFormationUpdate(formation: Formation): void {
    // Update field visualization
    this.fieldCanvas.drawPlayers(formation.players);
    this.updatePlayerProperties();
  }

  private handlePlayerMove(playerId: string, position: Position): void {
    this.formationManager.updatePlayerPosition(playerId, position.x, position.y);
  }

  private handleTimelineUpdate(time: number, positions: { [playerId: string]: Position }): void {
    // Update player positions on field
    Object.entries(positions).forEach(([playerId, position]) => {
      this.playerIcons.updatePlayerPosition(playerId, position.x, position.y);
    });

    // Update timeline display
    this.updateTimelineDisplay(time);
  }

  private handlePlayStateChange(isPlaying: boolean): void {
    const playButton = document.getElementById('play-pause');
    if (playButton) {
      playButton.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  private togglePlayback(): void {
    if (this.timelineSync.isTimelinePlaying()) {
      this.timelineSync.pause();
    } else {
      this.timelineSync.play();
    }
  }

  private stepTimeline(deltaMs: number): void {
    const currentTime = this.timelineSync.getCurrentTime();
    this.timelineSync.seek(currentTime + deltaMs);
  }

  private handleTimelineSeek(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const progress = parseFloat(slider.value) / 100;
    const duration = this.timelineSync.getDuration();
    this.timelineSync.seek(progress * duration);
  }

  private async handleVideoUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.load();
      
      this.videoElement = video;
      this.timelineSync.setVideoElement(video);
      this.updateStatus('Video loaded');
    }
  }

  private syncVideo(): void {
    if (this.videoElement) {
      this.timelineSync.setAutoSync(true);
      this.updateStatus('Video synced');
    }
  }

  private handleOffsetChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const offset = parseInt(input.value) || 0;
    this.timelineSync.setOffset(offset);
  }

  private adjustZoom(delta: number): void {
    // Implementation for zoom adjustment
    this.updateStatus(`Zoom adjusted`);
  }

  private toggleSnapToGrid(): void {
    const button = document.getElementById('snap-grid');
    const isEnabled = button?.classList.toggle('active');
    this.routeEditor.setSnapToGrid(!!isEnabled);
    this.updateStatus(`Snap to grid ${isEnabled ? 'enabled' : 'disabled'}`);
  }

  private saveFormation(): void {
    const formation = this.formationManager.getCurrentFormation();
    if (formation) {
      const name = prompt('Enter formation name:');
      if (name) {
        this.formationManager.saveCurrentFormationAsCustom(name);
        this.updateStatus('Formation saved');
      }
    }
  }

  private resetFormation(): void {
    this.formationManager.resetFormation();
    this.updateStatus('Formation reset');
  }

  private updatePlayerProperties(): void {
    const container = document.getElementById('player-properties');
    if (!container) return;

    if (this.selectedPlayer) {
      container.innerHTML = `
        <div class="player-info">
          <h4>Player #${this.selectedPlayer.number}</h4>
          <p><strong>Position:</strong> ${this.selectedPlayer.position}</p>
          <p><strong>Team:</strong> ${this.selectedPlayer.team}</p>
          <p><strong>X:</strong> ${this.selectedPlayer.x.toFixed(1)} yards</p>
          <p><strong>Y:</strong> ${this.selectedPlayer.y.toFixed(1)} yards</p>
          <p><strong>Active:</strong> ${this.selectedPlayer.isActive ? 'Yes' : 'No'}</p>
          <button id="toggle-active" class="btn btn-small">
            ${this.selectedPlayer.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      `;

      document.getElementById('toggle-active')?.addEventListener('click', () => {
        if (this.selectedPlayer) {
          this.formationManager.setPlayerActive(this.selectedPlayer.id, !this.selectedPlayer.isActive);
        }
      });
    } else {
      container.innerHTML = '<p>Select a player to view properties</p>';
    }
  }

  private updateTimelineDisplay(time: number): void {
    const currentTimeEl = document.getElementById('current-time');
    const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement;
    
    if (currentTimeEl) {
      const seconds = Math.floor(time / 1000);
      const minutes = Math.floor(seconds / 60);
      currentTimeEl.textContent = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    if (timelineSlider) {
      const progress = (time / this.timelineSync.getDuration()) * 100;
      timelineSlider.value = progress.toString();
    }
  }

  private handleResize(): void {
    this.fieldCanvas.resize();
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return; // Don't handle shortcuts when typing in inputs
    }

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.togglePlayback();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.stepTimeline(-100);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.stepTimeline(100);
        break;
      case 'r':
        if (event.ctrlKey) {
          event.preventDefault();
          this.resetFormation();
        }
        break;
      case 's':
        if (event.ctrlKey) {
          event.preventDefault();
          this.saveFormation();
        }
        break;
    }
  }

  private updateStatus(message: string): void {
    const statusEl = document.getElementById('status-text');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      statusEl.textContent = connected ? 'Online' : 'Offline';
      statusEl.className = `status-indicator ${connected ? 'online' : 'offline'}`;
    }
  }

  // Public API methods
  public loadPlaySequence(playSequence: PlaySequence): void {
    this.timelineSync.setTimeline(playSequence);
    this.updateStatus('Play sequence loaded');
  }

  public exportFormation(): string | null {
    return this.formationManager.exportFormation();
  }

  public importFormation(formationJson: string): boolean {
    const formation = this.formationManager.importFormation(formationJson);
    if (formation) {
      this.loadFormations(); // Refresh formation list
      return true;
    }
    return false;
  }

  public async saveToCloud(): Promise<void> {
    const formation = this.formationManager.getCurrentFormation();
    if (formation && apiClient.isAuthenticated()) {
      await apiClient.saveFormation(formation);
      this.updateStatus('Saved to cloud');
    }
  }

  public dispose(): void {
    this.timelineSync.dispose();
    if (this.videoElement) {
      URL.revokeObjectURL(this.videoElement.src);
    }
  }
}