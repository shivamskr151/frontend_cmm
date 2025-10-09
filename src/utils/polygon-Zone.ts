type Point = { x: number; y: number };
type Polygon = Point[];

interface HistoryState {
  polygons: Polygon[];
  activePolygonIndex: number;
  activePointIndex: number;
}

type PolygonCallback = (polygon: Polygon) => void;

export class PolygonZoneDrawer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement | null = null;
  private originalImageWidth = 0;
  private originalImageHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  // Polygon drawing state
  private isDrawingPolygon = false;
  private currentPolygon: Polygon = [];
  private polygons: Polygon[] = [];
  private activePolygonIndex = -1;
  private activePointIndex = -1;
  private isDraggingPoint = false;
  private isNearFirstPoint = false;

  // Visual settings
  private polygonColor = '#007bff';
  private activePolygonColor = '#ff7700';
  private pointColor = '#ffffff';
  private pointBorderColor = '#007bff';
  private activePointColor = '#ff7700';
  private activePointBorderColor = '#ff7700';
  private pointRadius = 6;
  private lineWidth = 2;

  // History
  private history: HistoryState[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;
  private actionLock = false;
  private lockTimeout = 300;
  private actionLockTimer: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  public onPolygonCreated: PolygonCallback | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: string | HTMLCanvasElement, imageElement: HTMLImageElement | null = null) {
    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas);
      if (!element || !(element instanceof HTMLCanvasElement)) throw new Error(`Canvas not found: ${canvas}`);
      this.canvas = element;
    } else this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    if (imageElement) this.updateImage(imageElement);

    this.setupEventListeners();
    this.setupResizeObserver();
    this.saveToHistory();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) { e.preventDefault(); this.redo(); }
      if (e.key === 'Escape') this.cancelCurrentPolygon();
    });
  }

  private setupResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleWindowResize());
      this.resizeObserver.observe(this.canvas);
    } else window.addEventListener('resize', () => this.handleWindowResize());
  }

  public updateImage(imageElement: HTMLImageElement) {
    this.image = imageElement;
    this.originalImageWidth = imageElement.naturalWidth || imageElement.width;
    this.originalImageHeight = imageElement.naturalHeight || imageElement.height;
    this.resizeCanvas();
  }

  private resizeCanvas() {
    if (!this.image) return;
    const container = this.canvas.parentElement;
    if (!container) return;

    // Don't resize during active drawing to prevent coordinate issues
    if (this.isDrawingPolygon) {
      console.log('PolygonZoneDrawer: Skipping resize during active drawing');
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspect = this.originalImageWidth / this.originalImageHeight;
    const containerAspect = containerWidth / containerHeight;

    let newWidth: number, newHeight: number;
    let offsetX = 0, offsetY = 0;

    if (containerAspect > imageAspect) {
      newHeight = containerHeight;
      newWidth = newHeight * imageAspect;
      offsetX = (containerWidth - newWidth) / 2;
    } else {
      newWidth = containerWidth;
      newHeight = newWidth / imageAspect;
      offsetY = (containerHeight - newHeight) / 2;
    }

    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.scaleX = newWidth / this.originalImageWidth;
    this.scaleY = newHeight / this.originalImageHeight;

    console.log('PolygonZoneDrawer: Canvas resized. Scale:', this.scaleX, this.scaleY);
    this.redraw();
  }

  private handleMouseDown(e: MouseEvent) {
    const { x, y } = this.screenToImageCoords(e.offsetX, e.offsetY);
    const pointIndex = this.findPointAt(x, y);
    if (pointIndex.polygonIndex !== -1) {
      this.activePolygonIndex = pointIndex.polygonIndex;
      this.activePointIndex = pointIndex.pointIndex;
      this.isDraggingPoint = true;
      this.redraw();
      return;
    }

    const polygonIndex = this.findPolygonAt(x, y);
    if (polygonIndex !== -1) { this.setActivePolygon(polygonIndex); return; }

    if (!this.isDrawingPolygon) this.startNewPolygon(x, y);
    else this.addPointToCurrentPolygon(x, y);
  }

  private handleMouseMove(e: MouseEvent) {
    const { x, y } = this.screenToImageCoords(e.offsetX, e.offsetY);

    if (this.isDraggingPoint && this.activePolygonIndex !== -1 && this.activePointIndex !== -1) {
      this.polygons[this.activePolygonIndex][this.activePointIndex] = { x, y };
      this.redraw();
      return;
    }

    if (this.isDrawingPolygon && this.currentPolygon.length >= 3) {
      const first = this.currentPolygon[0];
      const dist = Math.hypot(x - first.x, y - first.y);
      this.isNearFirstPoint = dist < 20 / this.scaleX;
    }

    // Only redraw if we're actually drawing or dragging
    if (this.isDraggingPoint) {
      this.redraw();
    } else if (this.isDrawingPolygon && this.currentPolygon.length > 0) {
      // Only redraw current polygon, not everything
      this.drawCurrentPolygon();
    }
  }

  private handleMouseUp() { this.isDraggingPoint = false; }

  private startNewPolygon(x: number, y: number) {
    this.isDrawingPolygon = true;
    this.currentPolygon = [{ x, y }];
    this.activePolygonIndex = -1;
    this.activePointIndex = -1;
    this.redraw();
  }

  private addPointToCurrentPolygon(x: number, y: number) {
    if (!this.isDrawingPolygon) return;

    if (this.currentPolygon.length >= 3) {
      const first = this.currentPolygon[0];
      const dist = Math.hypot(x - first.x, y - first.y);
      if (dist < 20) { this.completeCurrentPolygon(); return; }
    }

    this.currentPolygon.push({ x, y });
    this.redraw();
  }

  private completeCurrentPolygon() {
    if (this.currentPolygon.length >= 3) {
      this.polygons.push([...this.currentPolygon]);
      this.activePolygonIndex = this.polygons.length - 1;
      console.log('PolygonZoneDrawer: Polygon completed and added to array. Total polygons:', this.polygons.length);
      this.onPolygonCreated?.([...this.currentPolygon]);
      this.saveToHistory();
    }
    this.isDrawingPolygon = false;
    this.currentPolygon = [];
    console.log('PolygonZoneDrawer: Drawing state reset, redrawing...');
    
    // Force a final redraw to ensure polygon is visible
    this.redraw();
  }

  private cancelCurrentPolygon() {
    this.isDrawingPolygon = false;
    this.currentPolygon = [];
    this.redraw();
  }

  private findPointAt(x: number, y: number, tolerance = 10) {
    for (let i = 0; i < this.polygons.length; i++) {
      for (let j = 0; j < this.polygons[i].length; j++) {
        const p = this.polygons[i][j];
        if (Math.hypot(p.x - x, p.y - y) <= tolerance) return { polygonIndex: i, pointIndex: j };
      }
    }
    return { polygonIndex: -1, pointIndex: -1 };
  }

  private findPolygonAt(x: number, y: number) {
    for (let i = 0; i < this.polygons.length; i++) if (this.isPointInPolygon(x, y, this.polygons[i])) return i;
    return -1;
  }

  private isPointInPolygon(x: number, y: number, polygon: Polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  public setActivePolygon(index: number) {
    if (index >= -1 && index < this.polygons.length) {
      this.activePolygonIndex = index;
      this.activePointIndex = -1;
      this.redraw();
      return true;
    }
    return false;
  }

  private redraw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    
    // Always clear and redraw everything to ensure consistency
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Always draw background image first
    if (this.image) {
      ctx.drawImage(this.image, this.offsetX, this.offsetY, this.originalImageWidth * this.scaleX, this.originalImageHeight * this.scaleY);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw existing polygons (permanent) - always draw these
    if (this.polygons.length > 0) {
      console.log('PolygonZoneDrawer: Drawing', this.polygons.length, 'permanent polygons');
      this.polygons.forEach((polygon, i) => {
        this.drawPolygon(polygon, i === this.activePolygonIndex);
      });
    }

    // Draw current polygon being drawn (temporary)
    if (this.isDrawingPolygon && this.currentPolygon.length > 0) {
      console.log('PolygonZoneDrawer: Drawing current polygon with', this.currentPolygon.length, 'points');
      this.drawCurrentPolygon();
    }
  }

  private drawPolygon(polygon: Polygon, isActive = false) {
    if (polygon.length < 3) return;
    const screenPolygon = polygon.map(p => this.imageToScreenCoords(p.x, p.y));
    const color = isActive ? this.activePolygonColor : this.polygonColor;

    console.log('PolygonZoneDrawer: Drawing polygon with color:', color);
    console.log('PolygonZoneDrawer: Screen coordinates:', screenPolygon);
    console.log('PolygonZoneDrawer: Original image coordinates:', polygon);
    console.log('PolygonZoneDrawer: Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
    console.log('PolygonZoneDrawer: Scale factors:', this.scaleX, this.scaleY);
    console.log('PolygonZoneDrawer: Offset:', this.offsetX, this.offsetY);

    // Test: Draw a simple rectangle to verify canvas is working
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(50, 50, 100, 100);
    console.log('PolygonZoneDrawer: Drew test rectangle at (50,50)');

    // Draw filled polygon
    this.ctx.fillStyle = color + '40'; // More opaque fill
    this.ctx.beginPath();
    this.ctx.moveTo(screenPolygon[0].x, screenPolygon[0].y);
    screenPolygon.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.closePath();
    this.ctx.fill();

    // Draw polygon border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3; // Thicker border for visibility
    this.ctx.beginPath();
    this.ctx.moveTo(screenPolygon[0].x, screenPolygon[0].y);
    screenPolygon.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.closePath();
    this.ctx.stroke();

    screenPolygon.forEach((p, i) => this.drawPoint(p.x, p.y, isActive && i === this.activePointIndex));
  }

  private drawCurrentPolygon() {
    if (!this.currentPolygon.length) return;
    const screenPolygon = this.currentPolygon.map(p => this.imageToScreenCoords(p.x, p.y));

    if (screenPolygon.length > 1) {
      this.ctx.strokeStyle = this.polygonColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(screenPolygon[0].x, screenPolygon[0].y);
      screenPolygon.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
      this.ctx.stroke();
    }

    screenPolygon.forEach((p) => this.drawPoint(p.x, p.y, false));

    if (this.isNearFirstPoint && this.currentPolygon.length >= 3) {
      const first = this.imageToScreenCoords(this.currentPolygon[0].x, this.currentPolygon[0].y);
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = '#28a745';
      this.ctx.beginPath();
      this.ctx.arc(first.x, first.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawPoint(x: number, y: number, isActive = false) {
    const radius = this.pointRadius + (isActive ? 2 : 0);
    this.ctx.fillStyle = isActive ? this.activePointColor : this.pointColor;
    this.ctx.strokeStyle = isActive ? this.activePointBorderColor : this.pointBorderColor;
    this.ctx.lineWidth = isActive ? 3 : 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius / 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private saveToHistory() {
    if (this.actionLock) return;
    const state: HistoryState = {
      polygons: JSON.parse(JSON.stringify(this.polygons)),
      activePolygonIndex: this.activePolygonIndex,
      activePointIndex: this.activePointIndex
    };
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;
    if (this.history.length > this.maxHistorySize) { this.history.shift(); this.historyIndex--; }
  }

  public undo() { if (!this.actionLock && this.historyIndex > 0) { this.setActionLock(); this.historyIndex--; this.loadStateFromHistory(); return true; } return false; }
  public redo() { if (!this.actionLock && this.historyIndex < this.history.length - 1) { this.setActionLock(); this.historyIndex++; this.loadStateFromHistory(); return true; } return false; }

  private loadStateFromHistory() {
    const state = this.history[this.historyIndex];
    this.polygons = JSON.parse(JSON.stringify(state.polygons));
    this.activePolygonIndex = state.activePolygonIndex;
    this.activePointIndex = state.activePointIndex;
    this.redraw();
  }

  private setActionLock() {
    this.actionLock = true;
    if (this.actionLockTimer) clearTimeout(this.actionLockTimer);
    this.actionLockTimer = setTimeout(() => (this.actionLock = false), this.lockTimeout);
  }

  public getPolygons(): Polygon[] { return JSON.parse(JSON.stringify(this.polygons)); }
  public setPolygons(polygons: Polygon[]) { this.polygons = JSON.parse(JSON.stringify(polygons)); this.activePolygonIndex = -1; this.activePointIndex = -1; this.saveToHistory(); this.redraw(); }
  public clearAllPolygons() { this.polygons = []; this.currentPolygon = []; this.isDrawingPolygon = false; this.activePolygonIndex = -1; this.activePointIndex = -1; this.saveToHistory(); this.redraw(); }
  public deleteActivePolygon(): boolean { if (this.activePolygonIndex !== -1) { this.polygons.splice(this.activePolygonIndex, 1); this.activePolygonIndex = -1; this.activePointIndex = -1; this.saveToHistory(); this.redraw(); return true; } return false; }
  public canUndo() { return this.historyIndex > 0; }
  public canRedo() { return this.historyIndex < this.history.length - 1; }

  private handleWindowResize() { this.resizeCanvas(); }
  public screenToImageCoords(x: number, y: number): Point { return { x: (x - this.offsetX) / this.scaleX, y: (y - this.offsetY) / this.scaleY }; }
  public imageToScreenCoords(x: number, y: number): Point { return { x: x * this.scaleX + this.offsetX, y: y * this.scaleY + this.offsetY }; }

  public getNormalizedPolygons(): Polygon[] {
    if (!this.image) return [];
    return this.polygons.map(polygon => polygon.map(p => ({ x: p.x / this.originalImageWidth, y: p.y / this.originalImageHeight })));
  }

  public loadNormalizedPolygons(normalizedPolygons: Polygon[]) {
    if (!this.image) return;
    this.polygons = normalizedPolygons.map(polygon => polygon.map(p => ({ x: p.x * this.originalImageWidth, y: p.y * this.originalImageHeight })));
    this.saveToHistory();
    this.redraw();
  }

  public forceRefresh() {
    this.canvas.style.display = 'block';
    this.canvas.style.visibility = 'visible';
    this.redraw();
    setTimeout(() => this.redraw(), 50);
  }

  public destroy() {
    // Clean up event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
