import { Route, Position, Player } from '../types';
import { PlayerIcons } from './PlayerIcons';

export class RouteEditor {
  private container: HTMLElement;
  private playerIcons: PlayerIcons;
  private activeRoute: Route | null = null;
  private isDrawing: boolean = false;
  private snapToGrid: boolean = true;
  private gridSize: number = 1; // 1 yard grid
  private isDragging: boolean = false;
  private draggedPlayer: Player | null = null;
  private dragOffset: Position = { x: 0, y: 0 };
  private routeMarkers: SVGElement[] = [];

  private onRouteChangeCallback?: (route: Route) => void;
  private onPlayerMoveCallback?: (playerId: string, position: Position) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.playerIcons = new PlayerIcons();
    this.setupEventListeners();
  }

  public setOnRouteChange(callback: (route: Route) => void): void {
    this.onRouteChangeCallback = callback;
  }

  public setOnPlayerMove(callback: (playerId: string, position: Position) => void): void {
    this.onPlayerMoveCallback = callback;
  }

  private setupEventListeners(): void {
    // Mouse events for drag and drop
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile support
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent context menu on right click
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as Element;
    const playerIcon = target.closest('[data-player-id]') as SVGElement;

    if (playerIcon) {
      const playerId = playerIcon.getAttribute('data-player-id')!;
      this.startPlayerDrag(playerId, { x: event.clientX, y: event.clientY });
    } else if (event.shiftKey) {
      // Start drawing a route
      this.startRouteDrawing({ x: event.clientX, y: event.clientY });
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.draggedPlayer) {
      this.updatePlayerDrag({ x: event.clientX, y: event.clientY });
    } else if (this.isDrawing) {
      this.updateRouteDrawing({ x: event.clientX, y: event.clientY });
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.endPlayerDrag({ x: event.clientX, y: event.clientY });
    } else if (this.isDrawing) {
      this.addRoutePoint({ x: event.clientX, y: event.clientY });
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const target = event.target as Element;
    const playerIcon = target.closest('[data-player-id]') as SVGElement;

    if (playerIcon) {
      const playerId = playerIcon.getAttribute('data-player-id')!;
      this.startPlayerDrag(playerId, { x: touch.clientX, y: touch.clientY });
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    
    if (this.isDragging && this.draggedPlayer) {
      this.updatePlayerDrag({ x: touch.clientX, y: touch.clientY });
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.isDragging) {
      const touch = event.changedTouches[0];
      this.endPlayerDrag({ x: touch.clientX, y: touch.clientY });
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.cancelCurrentOperation();
        break;
      case 'Enter':
        if (this.isDrawing) {
          this.finishRouteDrawing();
        }
        break;
      case 'g':
        if (event.ctrlKey) {
          this.toggleSnapToGrid();
          event.preventDefault();
        }
        break;
      case 'Delete':
      case 'Backspace':
        this.deleteActiveRoute();
        break;
    }
  }

  private startPlayerDrag(playerId: string, screenPosition: Position): void {
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement;
    if (!playerElement) return;

    this.isDragging = true;
    // You would need to get the player from your formation manager
    // this.draggedPlayer = this.formationManager.getPlayerById(playerId);
    
    const rect = playerElement.getBoundingClientRect();
    this.dragOffset = {
      x: screenPosition.x - rect.left,
      y: screenPosition.y - rect.top
    };

    playerElement.classList.add('dragging');
    this.container.style.cursor = 'grabbing';
  }

  private updatePlayerDrag(screenPosition: Position): void {
    if (!this.isDragging || !this.draggedPlayer) return;

    const fieldPosition = this.screenToFieldPosition(screenPosition);
    const snappedPosition = this.snapToGrid ? this.snapPositionToGrid(fieldPosition) : fieldPosition;

    // Update visual position
    this.playerIcons.updatePlayerPosition(
      this.draggedPlayer.id, 
      snappedPosition.x, 
      snappedPosition.y
    );

    // Show position feedback
    this.showPositionFeedback(snappedPosition);
  }

  private endPlayerDrag(screenPosition: Position): void {
    if (!this.isDragging || !this.draggedPlayer) return;

    const fieldPosition = this.screenToFieldPosition(screenPosition);
    const snappedPosition = this.snapToGrid ? this.snapPositionToGrid(fieldPosition) : fieldPosition;

    // Validate position is within field bounds
    const validPosition = this.validateFieldPosition(snappedPosition);

    // Update player position
    this.onPlayerMoveCallback?.(this.draggedPlayer.id, validPosition);

    // Clean up
    const playerElement = document.querySelector(`[data-player-id="${this.draggedPlayer.id}"]`) as HTMLElement;
    playerElement?.classList.remove('dragging');
    
    this.isDragging = false;
    this.draggedPlayer = null;
    this.container.style.cursor = '';
    this.hidePositionFeedback();
  }

  private startRouteDrawing(screenPosition: Position): void {
    const fieldPosition = this.screenToFieldPosition(screenPosition);
    
    this.activeRoute = {
      id: `route-${Date.now()}`,
      points: [fieldPosition],
      type: 'custom',
      timing: 0,
      depth: 0
    };

    this.isDrawing = true;
    this.container.style.cursor = 'crosshair';
    
    // Add initial route marker
    this.addRouteMarker(fieldPosition, 'start');
  }

  private updateRouteDrawing(screenPosition: Position): void {
    if (!this.isDrawing || !this.activeRoute) return;

    const fieldPosition = this.screenToFieldPosition(screenPosition);
    const snappedPosition = this.snapToGrid ? this.snapPositionToGrid(fieldPosition) : fieldPosition;

    // Show preview line from last point to current position
    this.showRoutePreview(snappedPosition);
  }

  private addRoutePoint(screenPosition: Position): void {
    if (!this.isDrawing || !this.activeRoute) return;

    const fieldPosition = this.screenToFieldPosition(screenPosition);
    const snappedPosition = this.snapToGrid ? this.snapPositionToGrid(fieldPosition) : fieldPosition;

    this.activeRoute.points.push(snappedPosition);
    this.addRouteMarker(snappedPosition, 'waypoint');
    
    // Update route visualization
    this.updateRouteVisualization();
  }

  private finishRouteDrawing(): void {
    if (!this.isDrawing || !this.activeRoute) return;

    if (this.activeRoute.points.length < 2) {
      this.cancelCurrentOperation();
      return;
    }

    // Mark last point as end
    const lastMarker = this.routeMarkers[this.routeMarkers.length - 1];
    if (lastMarker) {
      lastMarker.classList.remove('route-marker-waypoint');
      lastMarker.classList.add('route-marker-end');
    }

    // Calculate route metadata
    this.calculateRouteMetadata();

    // Notify callback
    this.onRouteChangeCallback?.(this.activeRoute);

    // Clean up
    this.isDrawing = false;
    this.container.style.cursor = '';
    this.hideRoutePreview();
  }

  private cancelCurrentOperation(): void {
    if (this.isDrawing) {
      this.clearRouteMarkers();
      this.hideRoutePreview();
      this.isDrawing = false;
      this.activeRoute = null;
    }

    if (this.isDragging) {
      // Reset player position
      this.isDragging = false;
      this.draggedPlayer = null;
      this.hidePositionFeedback();
    }

    this.container.style.cursor = '';
  }

  private deleteActiveRoute(): void {
    if (this.activeRoute) {
      this.clearRouteMarkers();
      this.activeRoute = null;
      this.onRouteChangeCallback?.(null as any);
    }
  }

  private addRouteMarker(position: Position, type: 'start' | 'waypoint' | 'end'): void {
    const screenPos = this.fieldToScreenPosition(position);
    const marker = this.playerIcons.createRouteMarker(screenPos.x, screenPos.y, type);
    
    marker.addEventListener('click', () => {
      // Handle route marker interaction
      this.handleRouteMarkerClick(position, type);
    });

    this.container.appendChild(marker);
    this.routeMarkers.push(marker);
  }

  private clearRouteMarkers(): void {
    this.routeMarkers.forEach(marker => {
      marker.remove();
    });
    this.routeMarkers = [];
  }

  private handleRouteMarkerClick(position: Position, type: string): void {
    // Implement route marker interaction (e.g., editing, deletion)
    console.log(`Route marker clicked: ${type} at ${position.x}, ${position.y}`);
  }

  private updateRouteVisualization(): void {
    if (!this.activeRoute) return;

    // Clear existing route visualization
    const existingRoutes = this.container.querySelectorAll('.route-line');
    existingRoutes.forEach(route => route.remove());

    // Draw route lines between points
    for (let i = 0; i < this.activeRoute.points.length - 1; i++) {
      const start = this.fieldToScreenPosition(this.activeRoute.points[i]);
      const end = this.fieldToScreenPosition(this.activeRoute.points[i + 1]);
      
      const line = this.createRouteLine(start, end);
      this.container.appendChild(line);
    }
  }

  private createRouteLine(start: Position, end: Position): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('route-line');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', start.x.toString());
    line.setAttribute('y1', start.y.toString());
    line.setAttribute('x2', end.x.toString());
    line.setAttribute('y2', end.y.toString());
    line.setAttribute('stroke', '#1D4ED8');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '5,5');

    svg.appendChild(line);
    return svg;
  }

  private showRoutePreview(position: Position): void {
    // Implementation for showing route preview line
  }

  private hideRoutePreview(): void {
    // Implementation for hiding route preview
  }

  private showPositionFeedback(position: Position): void {
    // Show coordinates or snap feedback
    const feedback = document.getElementById('position-feedback');
    if (feedback) {
      feedback.textContent = `X: ${position.x.toFixed(1)}, Y: ${position.y.toFixed(1)}`;
      feedback.style.display = 'block';
    }
  }

  private hidePositionFeedback(): void {
    const feedback = document.getElementById('position-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  private calculateRouteMetadata(): void {
    if (!this.activeRoute) return;

    const points = this.activeRoute.points;
    if (points.length < 2) return;

    // Calculate total depth (vertical distance)
    const startY = points[0].y;
    const endY = points[points.length - 1].y;
    this.activeRoute.depth = Math.abs(endY - startY);

    // Estimate timing based on route length and complexity
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Rough timing calculation (assuming ~15 mph average speed)
    this.activeRoute.timing = (totalDistance / 22) * 1000; // Convert to milliseconds
  }

  private screenToFieldPosition(screenPosition: Position): Position {
    const rect = this.container.getBoundingClientRect();
    const relativeX = (screenPosition.x - rect.left) / rect.width;
    const relativeY = (screenPosition.y - rect.top) / rect.height;

    return {
      x: relativeX * 120, // 120 yards field length
      y: relativeY * 53.33 // 53.33 yards field width
    };
  }

  private fieldToScreenPosition(fieldPosition: Position): Position {
    const rect = this.container.getBoundingClientRect();
    
    return {
      x: (fieldPosition.x / 120) * rect.width + rect.left,
      y: (fieldPosition.y / 53.33) * rect.height + rect.top
    };
  }

  private snapPositionToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  private validateFieldPosition(position: Position): Position {
    return {
      x: Math.max(0, Math.min(120, position.x)),
      y: Math.max(0, Math.min(53.33, position.y))
    };
  }

  private toggleSnapToGrid(): void {
    this.snapToGrid = !this.snapToGrid;
    console.log(`Snap to grid: ${this.snapToGrid ? 'enabled' : 'disabled'}`);
  }

  public setSnapToGrid(enabled: boolean): void {
    this.snapToGrid = enabled;
  }

  public setGridSize(size: number): void {
    this.gridSize = Math.max(0.5, Math.min(5, size));
  }

  public getActiveRoute(): Route | null {
    return this.activeRoute;
  }

  public clearRoute(): void {
    this.deleteActiveRoute();
  }

  public loadRoute(route: Route): void {
    this.activeRoute = { ...route };
    this.clearRouteMarkers();
    
    // Add markers for each point
    route.points.forEach((point, index) => {
      let type: 'start' | 'waypoint' | 'end';
      if (index === 0) type = 'start';
      else if (index === route.points.length - 1) type = 'end';
      else type = 'waypoint';
      
      this.addRouteMarker(point, type);
    });

    this.updateRouteVisualization();
  }
}