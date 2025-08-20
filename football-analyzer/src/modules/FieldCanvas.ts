import { FieldDimensions, ViewportState, Player } from '../types';

export class FieldCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dimensions: FieldDimensions;
  private viewport: ViewportState;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // NFL field: 120 yards (including end zones) x 53.33 yards
    this.dimensions = {
      width: 1200, // 120 yards * 10 pixels per yard
      height: 533,  // 53.33 yards * 10 pixels per yard
      yardToPixel: 10
    };

    this.viewport = {
      zoom: 1,
      panX: 0,
      panY: 0
    };

    this.setupCanvas();
    this.drawField();
  }

  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private drawField(): void {
    this.ctx.save();
    
    // Apply viewport transformations
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    this.ctx.translate(this.viewport.panX, this.viewport.panY);

    // Clear canvas
    this.ctx.fillStyle = '#22C55E'; // Green field
    this.ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);

    // Draw field markings
    this.drawFieldMarkings();
    this.drawYardLines();
    this.drawHashMarks();
    this.drawEndZones();

    this.ctx.restore();
  }

  private drawFieldMarkings(): void {
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;

    // Sidelines
    this.ctx.strokeRect(0, 0, this.dimensions.width, this.dimensions.height);

    // Goal lines
    this.ctx.beginPath();
    this.ctx.moveTo(100, 0); // 10 yard line (end zone)
    this.ctx.lineTo(100, this.dimensions.height);
    this.ctx.moveTo(1100, 0); // Other 10 yard line
    this.ctx.lineTo(1100, this.dimensions.height);
    this.ctx.stroke();
  }

  private drawYardLines(): void {
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;

    // 5-yard lines
    for (let yard = 15; yard <= 105; yard += 5) {
      const x = yard * this.dimensions.yardToPixel;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.dimensions.height);
      this.ctx.stroke();
    }

    // 50-yard line (thicker)
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(600, 0); // 60 yards from left (50-yard line)
    this.ctx.lineTo(600, this.dimensions.height);
    this.ctx.stroke();
  }

  private drawHashMarks(): void {
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;

    const hashMarkLength = 6;
    const leftHashY = this.dimensions.height * 0.28;
    const rightHashY = this.dimensions.height * 0.72;

    for (let yard = 10; yard <= 110; yard += 1) {
      const x = yard * this.dimensions.yardToPixel;
      
      // Left hash marks
      this.ctx.beginPath();
      this.ctx.moveTo(x, leftHashY);
      this.ctx.lineTo(x, leftHashY + hashMarkLength);
      this.ctx.stroke();

      // Right hash marks
      this.ctx.beginPath();
      this.ctx.moveTo(x, rightHashY);
      this.ctx.lineTo(x, rightHashY + hashMarkLength);
      this.ctx.stroke();
    }
  }

  private drawEndZones(): void {
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Light blue for end zones
    
    // Left end zone
    this.ctx.fillRect(0, 0, 100, this.dimensions.height);
    
    // Right end zone
    this.ctx.fillRect(1100, 0, 100, this.dimensions.height);

    // End zone text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('END ZONE', 50, this.dimensions.height / 2);
    this.ctx.fillText('END ZONE', 1150, this.dimensions.height / 2);
  }

  public drawPlayers(players: Player[]): void {
    this.drawField(); // Redraw field first
    
    this.ctx.save();
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    this.ctx.translate(this.viewport.panX, this.viewport.panY);

    players.forEach(player => {
      this.drawPlayer(player);
    });

    this.ctx.restore();
  }

  private drawPlayer(player: Player): void {
    const x = player.x * this.dimensions.yardToPixel;
    const y = player.y * (this.dimensions.height / 53.33);
    const radius = player.isActive ? 14 : 12;

    // Player circle
    this.ctx.fillStyle = player.team === 'offense' ? '#3B82F6' : '#EF4444';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = player.isActive ? 3 : 2;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // Active player glow
    if (player.isActive) {
      this.ctx.shadowColor = player.team === 'offense' ? '#3B82F6' : '#EF4444';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    // Player number
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(player.number.toString(), x, y);
  }

  public drawRoute(route: { points: { x: number; y: number }[] }): void {
    if (route.points.length < 2) return;

    this.ctx.save();
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    this.ctx.translate(this.viewport.panX, this.viewport.panY);

    this.ctx.strokeStyle = '#1D4ED8';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    const firstPoint = route.points[0];
    this.ctx.moveTo(
      firstPoint.x * this.dimensions.yardToPixel, 
      firstPoint.y * (this.dimensions.height / 53.33)
    );

    route.points.slice(1).forEach(point => {
      this.ctx.lineTo(
        point.x * this.dimensions.yardToPixel, 
        point.y * (this.dimensions.height / 53.33)
      );
    });

    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  public setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(0.5, Math.min(3, zoom));
    this.drawField();
  }

  public setPan(x: number, y: number): void {
    this.viewport.panX = x;
    this.viewport.panY = y;
    this.drawField();
  }

  public screenToField(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (screenX - rect.left) / this.viewport.zoom - this.viewport.panX;
    const canvasY = (screenY - rect.top) / this.viewport.zoom - this.viewport.panY;

    return {
      x: canvasX / this.dimensions.yardToPixel,
      y: (canvasY / this.dimensions.height) * 53.33
    };
  }

  public fieldToScreen(fieldX: number, fieldY: number): { x: number; y: number } {
    const canvasX = (fieldX * this.dimensions.yardToPixel + this.viewport.panX) * this.viewport.zoom;
    const canvasY = ((fieldY / 53.33) * this.dimensions.height + this.viewport.panY) * this.viewport.zoom;

    return { x: canvasX, y: canvasY };
  }

  public resize(): void {
    this.setupCanvas();
    this.drawField();
  }
}