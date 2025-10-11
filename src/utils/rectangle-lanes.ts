/**
 * Rectangle Zone with Lanes Drawer - Handles drawing rectangle zones with lanes
 */
interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Lane {
  start: Point;
  end: Point;
  color: string;
}

interface Zone {
  rectangle: Rectangle;
  lanes: Lane[];
  color: string;
}

interface HistoryState {
  zones: Zone[];
  activeZoneIndex: number;
}

export class ZoneDrawer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private image: HTMLImageElement | null = null;

  private originalImageWidth = 0;
  private originalImageHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  // Drawing state
  private drawMode: 'zone' | 'lane' = 'zone';
  private isDrawingRectangle = false;
  private isDrawingLane = false;
  private currentRectangle: Rectangle | null = null;
  private currentLane: Lane | null = null;
  private zones: Zone[] = [];
  private activeZoneIndex = -1;
  private activeLaneIndex = -1;

  // Visual settings
  private zoneColors = ['#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
  private laneColors = ['#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#ff8000', '#8000ff', '#ff0080', '#00ff80'];
  private fillOpacity = 0.2;
  private borderWidth = 2;
  private laneWidth = 2;

  // History for undo/redo functionality
  private history: HistoryState[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  // Action lock
  private actionLock = false;
  private lockTimeout = 300;

  // Callbacks
  public onZoneCreated?: (zone: Zone) => void;
  public onLaneCreated?: (lane: Lane, zoneIndex: number) => void;

  constructor(canvasId: string | HTMLCanvasElement, imageElement: HTMLImageElement | null = null) {
    if (typeof canvasId === "string") {
      const el = document.getElementById(canvasId);
      if (!(el instanceof HTMLCanvasElement)) {
        throw new Error(`Canvas not found: ${canvasId}`);
      }
      this.canvas = el;
    } else if (canvasId instanceof HTMLCanvasElement) {
      this.canvas = canvasId;
    } else {
      throw new Error("Invalid canvas parameter: must be a canvas ID or HTMLCanvasElement");
    }

    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }

    if (imageElement) {
      this.updateImage(imageElement);
    }

    this.setupEventListeners();
    this.setupResizeObserver();
    this.saveToHistory();
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Touch support
    this.canvas.addEventListener("touchstart", (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener("touchmove", (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener("touchend", (e: TouchEvent) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent("mouseup", {});
      this.canvas.dispatchEvent(mouseEvent);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === "z") || e.key === "y")) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  private setupResizeObserver() {
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.canvas.parentElement) {
    this.resizeCanvas();
          }
        }
      });

      if (this.canvas.parentElement) {
        resizeObserver.observe(this.canvas.parentElement);
      }
    } else {
    window.addEventListener("resize", () => this.resizeCanvas());
    }
  }

  private resizeCanvas() {
    if (!this.image) return;

    const container = this.canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageRatio = this.originalImageWidth / this.originalImageHeight;
    const containerRatio = containerWidth / containerHeight;

    let newWidth = containerWidth;
    let newHeight = containerHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > imageRatio) {
      // Container is wider than image
      newHeight = containerHeight;
      newWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - newWidth) / 2;
    } else {
      // Container is taller than image
      newWidth = containerWidth;
      newHeight = containerWidth / imageRatio;
      offsetY = (containerHeight - newHeight) / 2;
    }

    // Update canvas size to match container
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;

    // Calculate scale factors
    this.scaleX = newWidth / this.originalImageWidth;
    this.scaleY = newHeight / this.originalImageHeight;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.redraw();
  }

  private handleMouseDown(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to image coordinates
    const imageCoords = this.screenToImageCoords(x, y);
    const imageX = imageCoords.x;
    const imageY = imageCoords.y;

    console.log('Mouse down - Current mode:', this.drawMode, 'at', imageX, imageY);

    if (this.drawMode === 'zone') {
      // Check if clicking on an existing zone
      const zoneIndex = this.findZoneAt(imageX, imageY);
      if (zoneIndex !== -1) {
        this.activeZoneIndex = zoneIndex;
        this.activeLaneIndex = -1;
        this.redraw();
        return;
      }

      // Start drawing a new rectangle zone
      this.isDrawingRectangle = true;
      this.currentRectangle = { x1: imageX, y1: imageY, x2: imageX, y2: imageY };
      this.activeZoneIndex = -1;
      this.activeLaneIndex = -1;
      this.redraw();
    } else if (this.drawMode === 'lane') {
      // In lane mode, don't allow zone selection or dragging
      // Only handle lane-related operations
      
      // Check if clicking on an existing lane
      const laneIndex = this.findLaneAt(imageX, imageY);
      if (laneIndex !== -1) {
        this.activeLaneIndex = laneIndex;
        this.redraw();
        return;
      }

      // Find the zone that contains this point, or use the active zone
      let targetZoneIndex = this.activeZoneIndex;
      if (targetZoneIndex === -1) {
        targetZoneIndex = this.findZoneAt(imageX, imageY);
        console.log('Lane mode: Found zone at click point:', targetZoneIndex);
      } else {
        console.log('Lane mode: Using active zone:', targetZoneIndex);
      }

      // If we found a zone (either active or containing the point), start drawing a lane
      if (targetZoneIndex !== -1) {
        console.log('Lane mode: Starting lane drawing in zone:', targetZoneIndex);
        this.activeZoneIndex = targetZoneIndex;
        
        // Constrain the start point to be within the zone
        const activeZone = this.zones[targetZoneIndex];
        const constrainedStart = this.constrainPointToZone(imageX, imageY, activeZone.rectangle);
        
        this.isDrawingLane = true;
        this.currentLane = {
          start: constrainedStart,
          end: constrainedStart,
          color: this.laneColors[this.zones[targetZoneIndex].lanes.length % this.laneColors.length]
        };
        this.activeLaneIndex = -1;
        console.log('Lane mode: Lane drawing started, currentLane:', this.currentLane);
        this.redraw();
      } else {
        console.log('Lane mode: No zone found at click point, cannot draw lane');
        console.log('Available zones:', this.zones.map((zone, index) => ({
          index,
          rectangle: zone.rectangle
        })));
      }
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to image coordinates
    const imageCoords = this.screenToImageCoords(x, y);
    const imageX = imageCoords.x;
    const imageY = imageCoords.y;

    if (this.isDrawingRectangle && this.currentRectangle) {
      this.currentRectangle.x2 = imageX;
      this.currentRectangle.y2 = imageY;
      this.redraw();
    } else if (this.isDrawingLane && this.currentLane && this.activeZoneIndex !== -1) {
      console.log('Lane drawing: mouse move to', imageX, imageY);
      
      // Constrain the lane end point to be within the active zone
      const activeZone = this.zones[this.activeZoneIndex];
      const constrainedPoint = this.constrainPointToZone(imageX, imageY, activeZone.rectangle);
      
      this.currentLane.end = { x: constrainedPoint.x, y: constrainedPoint.y };
      this.redraw();
    }
  }

  private handleMouseUp() {
    if (this.isDrawingRectangle && this.currentRectangle) {
      const normalizedRect = this.normalizeRectangle(this.currentRectangle);

      // Only create zone if it has minimum size
      if (
        Math.abs(normalizedRect.x2 - normalizedRect.x1) > 10 &&
        Math.abs(normalizedRect.y2 - normalizedRect.y1) > 10
      ) {
        const newZone: Zone = {
          rectangle: normalizedRect,
          lanes: [],
          color: this.zoneColors[this.zones.length % this.zoneColors.length]
        };
        this.zones.push(newZone);
      this.activeZoneIndex = this.zones.length - 1;
        this.activeLaneIndex = -1;
        this.onZoneCreated?.(newZone);
        this.saveToHistory();
      }

      this.isDrawingRectangle = false;
      this.currentRectangle = null;
      this.redraw();
    } else if (this.isDrawingLane && this.currentLane && this.activeZoneIndex !== -1) {
      console.log('Lane drawing: mouse up, finishing lane');
      
      // Ensure the final end point is constrained to the zone
      const activeZone = this.zones[this.activeZoneIndex];
      const constrainedEnd = this.constrainPointToZone(this.currentLane.end.x, this.currentLane.end.y, activeZone.rectangle);
      this.currentLane.end = constrainedEnd;
      
      // Only create lane if it has minimum length
      const length = Math.sqrt(
        Math.pow(this.currentLane.end.x - this.currentLane.start.x, 2) +
        Math.pow(this.currentLane.end.y - this.currentLane.start.y, 2)
      );

      console.log('Lane length:', length);
      if (length > 10) {
        console.log('Adding lane to zone:', this.activeZoneIndex);
        this.zones[this.activeZoneIndex].lanes.push(this.currentLane);
        this.activeLaneIndex = this.zones[this.activeZoneIndex].lanes.length - 1;
        console.log('Lane added, calling callback');
        this.onLaneCreated?.(this.currentLane, this.activeZoneIndex);
        this.saveToHistory();
        console.log('Lane creation completed');
      } else {
        console.log('Lane too short, not creating');
      }

      this.isDrawingLane = false;
      this.currentLane = null;
      this.redraw();
    } else if (this.isDrawingLane) {
      console.log('Lane drawing: mouse up but conditions not met');
      console.log('isDrawingLane:', this.isDrawingLane);
      console.log('currentLane:', this.currentLane);
      console.log('activeZoneIndex:', this.activeZoneIndex);
      this.isDrawingLane = false;
      this.currentLane = null;
      this.redraw();
    }
  }

  private normalizeRectangle(rect: Rectangle): Rectangle {
    return {
      x1: Math.min(rect.x1, rect.x2),
      y1: Math.min(rect.y1, rect.y2),
      x2: Math.max(rect.x1, rect.x2),
      y2: Math.max(rect.y1, rect.y2),
    };
  }

  private findZoneAt(x: number, y: number): number {
    console.log('findZoneAt: searching for point', x, y);
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const zone = this.zones[i];
      const rect = zone.rectangle;
      console.log(`Zone ${i}:`, rect);
      console.log(`Point ${x},${y} in zone ${i}:`, x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2);
      if (x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2) {
        console.log(`Found zone ${i} containing point ${x},${y}`);
        return i;
      }
    }
    console.log('No zone found containing point', x, y);
    return -1;
  }

  private findLaneAt(x: number, y: number): number {
    if (this.activeZoneIndex === -1) return -1;
    
    const zone = this.zones[this.activeZoneIndex];
    for (let i = zone.lanes.length - 1; i >= 0; i--) {
      const lane = zone.lanes[i];
      const distance = this.pointToLineDistance(x, y, lane.start, lane.end);
      if (distance < 10) {
        return i;
      }
    }
    return -1;
  }

  private pointToLineDistance(px: number, py: number, start: Point, end: Point): number {
    const A = px - start.x;
    const B = py - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private constrainPointToZone(x: number, y: number, zoneRect: Rectangle): Point {
    // Constrain the point to be within the zone boundaries
    const constrainedX = Math.max(zoneRect.x1, Math.min(zoneRect.x2, x));
    const constrainedY = Math.max(zoneRect.y1, Math.min(zoneRect.y2, y));
    
    return { x: constrainedX, y: constrainedY };
  }

  private redraw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear canvas with transparent background - image is handled by the img element

    // Draw completed zones
    this.zones.forEach((zone, zoneIndex) => {
      const isActiveZone = zoneIndex === this.activeZoneIndex;
      this.drawZone(zone, isActiveZone);
    });

    // Draw current rectangle being created
    if (this.isDrawingRectangle && this.currentRectangle) {
      this.drawRectangle(this.currentRectangle, false);
    }

    // Draw current lane being created
    if (this.isDrawingLane && this.currentLane) {
      this.drawLane(this.currentLane, true);
    }
  }

  private drawZone(zone: Zone, isActive: boolean) {
    if (!this.ctx) return;

    // Draw rectangle
    this.drawRectangle(zone.rectangle, isActive, zone.color);

    // Draw zone label
    this.drawZoneLabel(zone.rectangle, this.zones.indexOf(zone) + 1);

    // Draw lanes
    zone.lanes.forEach((lane, laneIndex) => {
      const isActiveLane = isActive && laneIndex === this.activeLaneIndex;
      this.drawLane(lane, isActiveLane, laneIndex + 1);
    });
  }

  private drawRectangle(rectangle: Rectangle, isActive: boolean, color?: string) {
    if (!this.ctx) return;

    const scaled = this.scaleRectangleToScreen(rectangle);
    const rectColor = color || (isActive ? '#ff4757' : '#ff6b35');

    // Draw fill
    this.ctx.fillStyle = `${rectColor}${Math.floor(this.fillOpacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    this.ctx.fillRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);

    // Draw border
    this.ctx.strokeStyle = isActive ? '#ff4757' : rectColor;
    this.ctx.lineWidth = this.borderWidth;
    this.ctx.strokeRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);
  }

  private drawLane(lane: Lane, isActive: boolean, laneNumber?: number) {
    if (!this.ctx) return;

    const start = this.scalePointToScreen(lane.start);
    const end = this.scalePointToScreen(lane.end);

    // Draw the lane line
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = isActive ? '#ff0000' : lane.color;
    this.ctx.lineWidth = isActive ? 3 : this.laneWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Draw lane label
    if (laneNumber) {
      this.drawLaneLabel(start, end, laneNumber);
    }

    // Only draw endpoints if the lane is being actively drawn or selected
    if (isActive) {
      // Draw small circles at endpoints for active lanes
      this.ctx.beginPath();
      this.ctx.arc(start.x, start.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fill();
    }
  }

  private scaleRectangleToScreen(rectangle: Rectangle): Rectangle {
    return {
      x1: rectangle.x1 * this.scaleX + this.offsetX,
      y1: rectangle.y1 * this.scaleY + this.offsetY,
      x2: rectangle.x2 * this.scaleX + this.offsetX,
      y2: rectangle.y2 * this.scaleY + this.offsetY,
    };
  }

  private scalePointToScreen(point: Point): Point {
    return {
      x: point.x * this.scaleX + this.offsetX,
      y: point.y * this.scaleY + this.offsetY,
    };
  }

  // Convert screen coordinates to image coordinates
  private screenToImageCoords(x: number, y: number): Point {
    return {
      x: (x - this.offsetX) / this.scaleX,
      y: (y - this.offsetY) / this.scaleY,
    };
  }

  // History management
  private saveToHistory() {
    if (this.actionLock) return;
    const state: HistoryState = {
      zones: JSON.parse(JSON.stringify(this.zones)),
      activeZoneIndex: this.activeZoneIndex,
    };
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private setActionLock() {
    this.actionLock = true;
    setTimeout(() => {
      this.actionLock = false;
    }, this.lockTimeout);
  }

  public undo() {
    if (!this.canUndo() || this.actionLock) return;
    this.setActionLock();
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  public redo() {
    if (!this.canRedo() || this.actionLock) return;
    this.setActionLock();
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  private restoreState(state: HistoryState) {
    this.zones = JSON.parse(JSON.stringify(state.zones));
    this.activeZoneIndex = state.activeZoneIndex;
    this.redraw();
  }

  private canUndo(): boolean {
    return this.historyIndex > 0;
  }

  private canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Public methods
  public setDrawMode(mode: 'zone' | 'lane') {
    console.log('Setting draw mode from', this.drawMode, 'to', mode);
    this.drawMode = mode;
    this.isDrawingRectangle = false;
    this.isDrawingLane = false;
    this.currentRectangle = null;
    this.currentLane = null;
    
    // If switching to lane mode and no zone is selected, select the last zone
    if (mode === 'lane' && this.activeZoneIndex === -1 && this.zones.length > 0) {
      this.activeZoneIndex = this.zones.length - 1;
      console.log('Auto-selected zone for lane drawing:', this.activeZoneIndex);
    }
    
    console.log('Draw mode set to:', this.drawMode, 'Active zone:', this.activeZoneIndex);
    this.redraw();
  }

  public getDrawMode(): 'zone' | 'lane' {
    return this.drawMode;
  }

  public getActiveZoneIndex(): number {
    return this.activeZoneIndex;
  }

  public hasZones(): boolean {
    return this.zones.length > 0;
  }

  public setActiveZone(index: number) {
    if (index >= -1 && index < this.zones.length) {
      this.activeZoneIndex = index;
      this.activeLaneIndex = -1;
      this.redraw();
    }
  }

  // Image handling
  public updateImage(img: HTMLImageElement) {
    this.image = img;
    this.originalImageWidth = img.naturalWidth;
    this.originalImageHeight = img.naturalHeight;
    this.resizeCanvas();
  }

  // Data management
  public getZones(): Zone[] {
    return JSON.parse(JSON.stringify(this.zones));
  }

  public setZones(zones: Zone[]) {
    this.zones = JSON.parse(JSON.stringify(zones));
    this.activeZoneIndex = -1;
    this.activeLaneIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public resetZones() {
    this.zones = [];
    this.activeZoneIndex = -1;
    this.activeLaneIndex = -1;
    this.isDrawingRectangle = false;
    this.isDrawingLane = false;
    this.currentRectangle = null;
    this.currentLane = null;
    this.saveToHistory();
    this.redraw();
  }

  public deleteActiveZone() {
    if (this.activeZoneIndex !== -1) {
      this.zones.splice(this.activeZoneIndex, 1);
      this.activeZoneIndex = -1;
      this.activeLaneIndex = -1;
      this.saveToHistory();
      this.redraw();
      return true;
    }
    return false;
  }

  public deleteActiveLane() {
    if (this.activeZoneIndex !== -1 && this.activeLaneIndex !== -1) {
      this.zones[this.activeZoneIndex].lanes.splice(this.activeLaneIndex, 1);
      this.activeLaneIndex = -1;
      this.saveToHistory();
      this.redraw();
      return true;
    }
    return false;
  }

  // Get normalized coordinates (0-1 range)
  public getNormalizedData() {
    if (!this.image) return { zones: [], lanes: [] };
    
    const normalizedZones = this.zones.map(zone => ({
      rectangle: {
        x1: zone.rectangle.x1 / this.originalImageWidth,
        y1: zone.rectangle.y1 / this.originalImageHeight,
        x2: zone.rectangle.x2 / this.originalImageWidth,
        y2: zone.rectangle.y2 / this.originalImageHeight,
      },
      lanes: zone.lanes.map(lane => ({
        start: {
          x: lane.start.x / this.originalImageWidth,
          y: lane.start.y / this.originalImageHeight,
        },
        end: {
          x: lane.end.x / this.originalImageWidth,
          y: lane.end.y / this.originalImageHeight,
        },
        color: lane.color
      })),
      color: zone.color
    }));

    return { zones: normalizedZones };
  }

  // Load normalized coordinates
  public loadNormalizedData(data: { zones: Zone[] }) {
    if (!this.image || !data.zones) return;
    
    this.zones = data.zones.map(zone => ({
      rectangle: {
        x1: zone.rectangle.x1 * this.originalImageWidth,
        y1: zone.rectangle.y1 * this.originalImageHeight,
        x2: zone.rectangle.x2 * this.originalImageWidth,
        y2: zone.rectangle.y2 * this.originalImageHeight,
      },
      lanes: zone.lanes.map(lane => ({
        start: {
          x: lane.start.x * this.originalImageWidth,
          y: lane.start.y * this.originalImageHeight,
        },
        end: {
          x: lane.end.x * this.originalImageWidth,
          y: lane.end.y * this.originalImageHeight,
        },
        color: lane.color
      })),
      color: zone.color
    }));
    
    this.saveToHistory();
    this.redraw();
  }

  private drawZoneLabel(rectangle: Rectangle, zoneNumber: number) {
    if (!this.ctx) return;

    const scaled = this.scaleRectangleToScreen(rectangle);
    const centerX = (scaled.x1 + scaled.x2) / 2;
    const centerY = (scaled.y1 + scaled.y2) / 2;

    // Draw background circle for label
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw zone number text
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Z${zoneNumber}`, centerX, centerY);
  }

  private drawLaneLabel(start: Point, end: Point, laneNumber: number) {
    if (!this.ctx) return;

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Draw background circle for label
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw lane number text
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`L${laneNumber}`, midX, midY);
  }

  public destroy() {
    // Clean up event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
