/**
 * Polygon Zone Drawer with Lanes - Handles drawing polygon zones with lanes within them
 * Extends the functionality of PolygonZoneDrawer to include lane drawing capabilities
 */
interface Point {
  x: number;
  y: number;
}

interface Lane {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  polygonIndex: number;
}

interface HistoryState {
  polygons: Point[][];
  lanes: Lane[];
  activePolygonIndex: number;
  activeLaneIndex: number;
}

export class PolygonZoneDrawerWithLanes {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private image: HTMLImageElement | null = null;

  private originalImageWidth = 0;
  private originalImageHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  // Polygon drawing state
  private isDrawingPolygon = false;
  private currentPolygon: Point[] = [];
  private polygons: Point[][] = [];
  private activePolygonIndex = -1;
  private activePointIndex = -1;
  private isDraggingPoint = false;
  private isNearFirstPoint = false;

  // Lane drawing state
  private isDrawingLane = false;
  private currentLane: Lane | null = null;
  private lanes: Lane[] = [];
  private activeLaneIndex = -1;
  private drawMode: 'polygon' | 'lane' = 'polygon';
  private laneColor = '#00cc00';

  // Visual settings
  private polygonColor = "#007bff";
  private activePolygonColor = "#ff7700";
  private pointColor = "#ffffff";
  private pointBorderColor = "#007bff";
  private activePointColor = "#ff7700";
  private activePointBorderColor = "#ff7700";
  private pointRadius = 6;
  private lineWidth = 2;

  // History for undo/redo functionality
  private history: HistoryState[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  // Action lock
  private actionLock = false;
  private lockTimeout = 300;
  private actionLockTimer: number | null = null;

  // Callbacks
  public onPolygonCreated?: (polygon: Point[]) => void;
  public onLaneCreated?: (lane: Lane) => void;

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
    this.canvas.addEventListener("dblclick", this.handleDoubleClick.bind(this));

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
      if (e.key === "Escape") {
        this.cancelCurrentDrawing();
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
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to image coordinates
    const imageCoords = this.screenToImageCoords(screenX, screenY);
    const imageX = imageCoords.x;
    const imageY = imageCoords.y;

    if (this.drawMode === 'polygon') {
      this.handlePolygonMouseDown(imageX, imageY);
    } else if (this.drawMode === 'lane') {
      this.handleLaneMouseDown(imageX, imageY);
    }
  }

  private handlePolygonMouseDown(x: number, y: number) {
    // Check if clicking on an existing point
    const pointIndex = this.findPointAt(x, y);
    if (pointIndex.polygonIndex !== -1) {
      this.activePolygonIndex = pointIndex.polygonIndex;
      this.activePointIndex = pointIndex.pointIndex;
      this.isDraggingPoint = true;
      this.redraw();
      return;
    }
    
    // Check if clicking inside an existing polygon
    const polygonIndex = this.findPolygonAt(x, y);
    if (polygonIndex !== -1) {
      this.setActivePolygon(polygonIndex);
      return;
    }
    
    // Start drawing a new polygon
    if (!this.isDrawingPolygon) {
      this.startNewPolygon(x, y);
    } else {
      this.addPointToCurrentPolygon(x, y);
    }
  }

  private handleLaneMouseDown(x: number, y: number) {
    // Only allow lane drawing if there's an active polygon
    if (this.activePolygonIndex === -1) {
      return;
    }
    
    const activePolygon = this.polygons[this.activePolygonIndex];
    if (!this.isPointInPolygon(x, y, activePolygon)) {
      return;
    }
    
    // Check if clicking on an existing lane
    const laneIndex = this.findLaneAt(x, y);
    if (laneIndex !== -1) {
      this.setActiveLane(laneIndex);
      return;
    }
    
    // Start drawing a new lane
    if (!this.isDrawingLane) {
      this.startNewLane(x, y);
    } else {
      this.completeCurrentLane(x, y);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to image coordinates
    const imageCoords = this.screenToImageCoords(screenX, screenY);
    const imageX = imageCoords.x;
    const imageY = imageCoords.y;

    if (this.drawMode === 'polygon') {
      this.handlePolygonMouseMove(imageX, imageY);
    } else if (this.drawMode === 'lane') {
      this.handleLaneMouseMove(imageX, imageY);
    }
  }

  private handlePolygonMouseMove(x: number, y: number) {
    // Handle point dragging
    if (this.isDraggingPoint && this.activePolygonIndex !== -1 && this.activePointIndex !== -1) {
      const polygon = this.polygons[this.activePolygonIndex];
      polygon[this.activePointIndex] = { x, y };
      this.redraw();
      return;
    }
    
    // Check if mouse is near the first point of current polygon
    this.isNearFirstPoint = false;
    if (this.isDrawingPolygon && this.currentPolygon.length >= 2) {
      const firstPoint = this.currentPolygon[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );
      this.isNearFirstPoint = distance < 15;
    }
    
    this.redraw();
  }

  private handleLaneMouseMove(x: number, y: number) {
    if (this.isDrawingLane && this.currentLane && this.activePolygonIndex !== -1) {
      const activePolygon = this.polygons[this.activePolygonIndex];
      
      // Constrain the end point to be within the polygon
      let constrainedX = x;
      let constrainedY = y;
      
      // Simple constraint: if point is outside polygon, find the closest point on polygon boundary
      if (!this.isPointInPolygon(x, y, activePolygon)) {
        const constrainedPoint = this.getClosestPointOnPolygonBoundary(x, y, activePolygon);
        constrainedX = constrainedPoint.x;
        constrainedY = constrainedPoint.y;
      }
      
      this.currentLane.x2 = constrainedX;
      this.currentLane.y2 = constrainedY;
      this.redraw();
    }
  }

  private handleMouseUp() {
    this.isDraggingPoint = false;
  }

  private handleDoubleClick() {
    if (this.isDrawingPolygon && this.currentPolygon.length >= 3) {
      this.completeCurrentPolygon();
    }
  }

  private startNewPolygon(x: number, y: number) {
    this.isDrawingPolygon = true;
    this.currentPolygon = [{ x, y }];
    this.activePolygonIndex = -1;
    this.activePointIndex = -1;
    this.redraw();
  }

  private addPointToCurrentPolygon(x: number, y: number) {
    if (this.isDrawingPolygon) {
      // Check if this point is close to the first point (to complete the polygon)
      if (this.currentPolygon.length >= 2) {
        const firstPoint = this.currentPolygon[0];
        const distance = Math.sqrt(
          Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
        );
        
        // If the new point is close to the first point, complete the polygon
        if (distance < 15) {
          this.completeCurrentPolygon();
          return;
        }
      }
      
      // Add the point normally if not completing the polygon
      this.currentPolygon.push({ x, y });
      this.redraw();
    }
  }

  private completeCurrentPolygon() {
    if (this.currentPolygon.length >= 3) {
      this.polygons.push([...this.currentPolygon]);
      this.activePolygonIndex = this.polygons.length - 1;
      
      // Trigger callback
      if (this.onPolygonCreated) {
        this.onPolygonCreated(this.currentPolygon);
      }
      
      this.saveToHistory();
    }
    
    this.isDrawingPolygon = false;
    this.currentPolygon = [];
    
    // Force multiple redraws to ensure visibility
    this.redraw();
    
    // Additional redraw after a short delay to ensure persistence
    setTimeout(() => {
      this.redraw();
    }, 100);
  }

  private startNewLane(x: number, y: number) {
    if (this.activePolygonIndex === -1) return;
    
    this.isDrawingLane = true;
    this.currentLane = {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      polygonIndex: this.activePolygonIndex
    };
    this.redraw();
  }

  private completeCurrentLane(x: number, y: number) {
    if (!this.isDrawingLane || !this.currentLane) return;
    
    const activePolygon = this.polygons[this.activePolygonIndex];
    let constrainedX = x;
    let constrainedY = y;
    
    // Constrain the end point to be within the polygon
    if (!this.isPointInPolygon(x, y, activePolygon)) {
      const constrainedPoint = this.getClosestPointOnPolygonBoundary(x, y, activePolygon);
      constrainedX = constrainedPoint.x;
      constrainedY = constrainedPoint.y;
    }
    
    // Ensure the lane has some minimum length
    const length = Math.sqrt(
      Math.pow(constrainedX - this.currentLane.x1, 2) + 
      Math.pow(constrainedY - this.currentLane.y1, 2)
    );
    
    if (length > 5) {
      this.currentLane.x2 = constrainedX;
      this.currentLane.y2 = constrainedY;
      
      // Add lane to the array
      this.lanes.push({ ...this.currentLane });
      
      // Trigger callback
      if (this.onLaneCreated) {
        this.onLaneCreated(this.currentLane);
      }
      
      this.saveToHistory();
    }
    
    this.isDrawingLane = false;
    this.currentLane = null;
    this.redraw();
  }

  private cancelCurrentDrawing() {
    if (this.isDrawingPolygon) {
      this.isDrawingPolygon = false;
      this.currentPolygon = [];
    }
    if (this.isDrawingLane) {
      this.isDrawingLane = false;
      this.currentLane = null;
    }
    this.redraw();
  }

  private findPointAt(x: number, y: number, tolerance = 10): { polygonIndex: number; pointIndex: number } {
    for (let i = 0; i < this.polygons.length; i++) {
      const polygon = this.polygons[i];
      for (let j = 0; j < polygon.length; j++) {
        const point = polygon[j];
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance <= tolerance) {
          return { polygonIndex: i, pointIndex: j };
        }
      }
    }
    return { polygonIndex: -1, pointIndex: -1 };
  }

  private findPolygonAt(x: number, y: number): number {
    for (let i = 0; i < this.polygons.length; i++) {
      if (this.isPointInPolygon(x, y, this.polygons[i])) {
        return i;
      }
    }
    return -1;
  }

  private findLaneAt(x: number, y: number, tolerance = 10): number {
    for (let i = 0; i < this.lanes.length; i++) {
      const lane = this.lanes[i];
      if (this.isPointNearLine(x, y, lane, tolerance)) {
        return i;
      }
    }
    return -1;
  }

  private isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private isPointNearLine(x: number, y: number, line: Lane, tolerance: number): boolean {
    const A = x - line.x1;
    const B = y - line.y1;
    const C = line.x2 - line.x1;
    const D = line.y2 - line.y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return false;
    
    const param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = line.x1;
      yy = line.y1;
    } else if (param > 1) {
      xx = line.x2;
      yy = line.y2;
    } else {
      xx = line.x1 + param * C;
      yy = line.y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tolerance;
  }

  private getClosestPointOnPolygonBoundary(x: number, y: number, polygon: Point[]): Point {
    let closestPoint = { x: polygon[0].x, y: polygon[0].y };
    let minDistance = Math.sqrt(Math.pow(x - polygon[0].x, 2) + Math.pow(y - polygon[0].y, 2));
    
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      
      const closestOnSegment = this.getClosestPointOnLineSegment(x, y, p1, p2);
      const distance = Math.sqrt(Math.pow(x - closestOnSegment.x, 2) + Math.pow(y - closestOnSegment.y, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = closestOnSegment;
      }
    }
    
    return closestPoint;
  }

  private getClosestPointOnLineSegment(x: number, y: number, p1: Point, p2: Point): Point {
    const A = x - p1.x;
    const B = y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return { x: p1.x, y: p1.y };
    
    const param = dot / lenSq;
    
    if (param < 0) {
      return { x: p1.x, y: p1.y };
    } else if (param > 1) {
      return { x: p2.x, y: p2.y };
    } else {
      return {
        x: p1.x + param * C,
        y: p1.y + param * D
      };
    }
  }

  private setActivePolygon(index: number): boolean {
    if (index >= -1 && index < this.polygons.length) {
      this.activePolygonIndex = index;
      this.activePointIndex = -1;
      this.redraw();
      return true;
    }
    return false;
  }

  private setActiveLane(index: number): boolean {
    if (index >= -1 && index < this.lanes.length) {
      this.activeLaneIndex = index;
      this.redraw();
      return true;
    }
    return false;
  }

  private redraw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear canvas with transparent background - image is handled by the img element
    
    // Draw all polygons
    this.polygons.forEach((polygon, index) => {
      const isActive = index === this.activePolygonIndex;
      this.drawPolygon(polygon, isActive);
      this.drawPolygonLabel(polygon, index + 1);
    });

    // Draw all lanes
    this.lanes.forEach((lane, index) => {
      const isActive = index === this.activeLaneIndex;
      this.drawLane(lane, isActive);
      this.drawLaneLabel(lane, index + 1);
    });

    // Draw current polygon if drawing
    if (this.isDrawingPolygon && this.currentPolygon.length > 0) {
      this.drawCurrentPolygon();
    }

    // Draw current lane if drawing
    if (this.isDrawingLane && this.currentLane) {
      this.drawCurrentLane();
    }
  }

  private drawPolygon(polygon: Point[], isActive = false) {
    if (polygon.length < 3) return;

    const screenPolygon = polygon.map(point => ({
      x: point.x * this.scaleX + this.offsetX,
      y: point.y * this.scaleY + this.offsetY
    }));

    const color = isActive ? this.activePolygonColor : this.polygonColor;

    // Draw polygon fill
    this.ctx!.fillStyle = color + '20'; // 20 = 12% opacity
    this.ctx!.beginPath();
    this.ctx!.moveTo(screenPolygon[0].x, screenPolygon[0].y);
    for (let i = 1; i < screenPolygon.length; i++) {
      this.ctx!.lineTo(screenPolygon[i].x, screenPolygon[i].y);
    }
    this.ctx!.closePath();
    this.ctx!.fill();

    // Draw polygon border
    this.ctx!.strokeStyle = color;
    this.ctx!.lineWidth = this.lineWidth;
    this.ctx!.stroke();

    // Draw points
    screenPolygon.forEach((point, pointIndex) => {
      const isActivePoint = isActive && pointIndex === this.activePointIndex;
      this.drawPoint(point.x, point.y, isActivePoint);
    });
  }

  private drawLane(lane: Lane, isActive = false) {
    const screenLane = {
      x1: lane.x1 * this.scaleX + this.offsetX,
      y1: lane.y1 * this.scaleY + this.offsetY,
      x2: lane.x2 * this.scaleX + this.offsetX,
      y2: lane.y2 * this.scaleY + this.offsetY
    };

    // Draw lane line
    this.ctx!.strokeStyle = isActive ? this.activePolygonColor : this.laneColor;
    this.ctx!.lineWidth = isActive ? 3 : 2;
    this.ctx!.beginPath();
    this.ctx!.moveTo(screenLane.x1, screenLane.y1);
    this.ctx!.lineTo(screenLane.x2, screenLane.y2);
    this.ctx!.stroke();

    // Draw endpoints
    this.drawPoint(screenLane.x1, screenLane.y1, isActive);
    this.drawPoint(screenLane.x2, screenLane.y2, isActive);
  }

  private drawCurrentPolygon() {
    if (this.currentPolygon.length === 0) return;
    
    const screenPolygon = this.currentPolygon.map(point => ({
      x: point.x * this.scaleX + this.offsetX,
      y: point.y * this.scaleY + this.offsetY
    }));

    // Draw lines between points
    if (screenPolygon.length > 1) {
      this.ctx!.strokeStyle = this.polygonColor;
      this.ctx!.lineWidth = this.lineWidth;
      this.ctx!.beginPath();
      this.ctx!.moveTo(screenPolygon[0].x, screenPolygon[0].y);
      for (let i = 1; i < screenPolygon.length; i++) {
        this.ctx!.lineTo(screenPolygon[i].x, screenPolygon[i].y);
      }
      this.ctx!.stroke();
    }
    
    // Draw visual indicator around first point when mouse is near
    if (this.isNearFirstPoint && this.currentPolygon.length >= 2) {
      const firstPoint = this.currentPolygon[0];
      const x = firstPoint.x * this.scaleX + this.offsetX;
      const y = firstPoint.y * this.scaleY + this.offsetY;
      
      // Draw completion indicator (glow effect)
      this.ctx!.save();
      this.ctx!.globalAlpha = 0.3;
      this.ctx!.fillStyle = '#28a745';
      this.ctx!.beginPath();
      this.ctx!.arc(x, y, 20, 0, Math.PI * 2);
      this.ctx!.fill();
      this.ctx!.restore();
      
      // Draw completion indicator border
      this.ctx!.strokeStyle = '#28a745';
      this.ctx!.lineWidth = 2;
      this.ctx!.setLineDash([5, 5]);
      this.ctx!.beginPath();
      this.ctx!.arc(x, y, 20, 0, Math.PI * 2);
      this.ctx!.stroke();
      this.ctx!.setLineDash([]);
    }
    
    // Draw points
    screenPolygon.forEach((point, index) => {
      const isFirstPoint = index === 0;
      const shouldHighlight = isFirstPoint && this.isNearFirstPoint;
      this.drawPoint(point.x, point.y, shouldHighlight);
    });
  }

  private drawCurrentLane() {
    if (!this.currentLane) return;
    
    const screenLane = {
      x1: this.currentLane.x1 * this.scaleX + this.offsetX,
      y1: this.currentLane.y1 * this.scaleY + this.offsetY,
      x2: this.currentLane.x2 * this.scaleX + this.offsetX,
      y2: this.currentLane.y2 * this.scaleY + this.offsetY
    };
    
    // Draw lane line
    this.ctx!.strokeStyle = this.laneColor;
    this.ctx!.lineWidth = 2;
    this.ctx!.setLineDash([5, 5]);
    this.ctx!.beginPath();
    this.ctx!.moveTo(screenLane.x1, screenLane.y1);
    this.ctx!.lineTo(screenLane.x2, screenLane.y2);
    this.ctx!.stroke();
    this.ctx!.setLineDash([]);
    
    // Draw start point
    this.drawPoint(screenLane.x1, screenLane.y1, false);
  }

  private drawPoint(x: number, y: number, isActive = false) {
    const radius = this.pointRadius;
    const fillColor = isActive ? this.activePointColor : this.pointColor;
    const borderColor = isActive ? this.activePointBorderColor : this.pointBorderColor;
    
    // Draw point fill
    this.ctx!.fillStyle = fillColor;
    this.ctx!.beginPath();
    this.ctx!.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx!.fill();
    
    // Draw point border
    this.ctx!.strokeStyle = borderColor;
    this.ctx!.lineWidth = 2;
    this.ctx!.beginPath();
    this.ctx!.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx!.stroke();
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
      polygons: JSON.parse(JSON.stringify(this.polygons)),
      lanes: JSON.parse(JSON.stringify(this.lanes)),
      activePolygonIndex: this.activePolygonIndex,
      activeLaneIndex: this.activeLaneIndex
    };
    
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push(state);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private setActionLock() {
    this.actionLock = true;
    if (this.actionLockTimer) {
      clearTimeout(this.actionLockTimer);
    }
    this.actionLockTimer = setTimeout(() => {
      this.actionLock = false;
    }, this.lockTimeout);
  }

  public undo() {
    if (this.actionLock || this.historyIndex <= 0) return false;
    
    this.setActionLock();
    this.historyIndex--;
    this.loadStateFromHistory();
    return true;
  }

  public redo() {
    if (this.actionLock || this.historyIndex >= this.history.length - 1) return false;
    
    this.setActionLock();
    this.historyIndex++;
    this.loadStateFromHistory();
    return true;
  }

  private loadStateFromHistory() {
    const state = this.history[this.historyIndex];
    this.polygons = JSON.parse(JSON.stringify(state.polygons));
    this.lanes = JSON.parse(JSON.stringify(state.lanes));
    this.activePolygonIndex = state.activePolygonIndex;
    this.activeLaneIndex = state.activeLaneIndex;
    this.redraw();
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Image handling
  public updateImage(img: HTMLImageElement) {
    this.image = img;
    this.originalImageWidth = img.naturalWidth;
    this.originalImageHeight = img.naturalHeight;
    this.resizeCanvas();
  }

  // Public methods
  public setDrawMode(mode: 'polygon' | 'lane') {
    console.log('Setting draw mode from', this.drawMode, 'to', mode);
    this.drawMode = mode;
    this.isDrawingPolygon = false;
    this.isDrawingLane = false;
    this.currentPolygon = [];
    this.currentLane = null;
    
    // If switching to lane mode and no zone is selected, select the last zone
    if (mode === 'lane' && this.activePolygonIndex === -1 && this.polygons.length > 0) {
      this.activePolygonIndex = this.polygons.length - 1;
      console.log('Auto-selected polygon for lane drawing:', this.activePolygonIndex);
    }
    
    console.log('Draw mode set to:', this.drawMode, 'Active polygon:', this.activePolygonIndex);
    this.redraw();
  }

  public getDrawMode(): 'polygon' | 'lane' {
    return this.drawMode;
  }

  public getPolygons(): Point[][] {
    return JSON.parse(JSON.stringify(this.polygons));
  }

  public getLanes(): Lane[] {
    return JSON.parse(JSON.stringify(this.lanes));
  }

  public getZonesWithLanes(): Array<{ polygon: Point[], lanes: Lane[] }> {
    const zonesWithLanes: Array<{ polygon: Point[], lanes: Lane[] }> = [];
    
    this.polygons.forEach((polygon, polygonIndex) => {
      const polygonLanes = this.lanes.filter(lane => lane.polygonIndex === polygonIndex);
      zonesWithLanes.push({
        polygon: JSON.parse(JSON.stringify(polygon)),
        lanes: JSON.parse(JSON.stringify(polygonLanes))
      });
    });
    
    return zonesWithLanes;
  }

  public setPolygons(polygons: Point[][]) {
    this.polygons = JSON.parse(JSON.stringify(polygons));
    this.activePolygonIndex = -1;
    this.activePointIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public setLanes(lanes: Lane[]) {
    this.lanes = JSON.parse(JSON.stringify(lanes));
    this.activeLaneIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public resetZones() {
    this.polygons = [];
    this.lanes = [];
    this.currentPolygon = [];
    this.currentLane = null;
    this.isDrawingPolygon = false;
    this.isDrawingLane = false;
    this.activePolygonIndex = -1;
    this.activeLaneIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public deleteActivePolygon() {
    if (this.activePolygonIndex !== -1) {
      // Remove all lanes associated with this polygon
      this.lanes = this.lanes.filter(lane => lane.polygonIndex !== this.activePolygonIndex);
      
      // Update polygon indices for remaining lanes
      this.lanes.forEach(lane => {
        if (lane.polygonIndex > this.activePolygonIndex) {
          lane.polygonIndex--;
        }
      });
      
      this.polygons.splice(this.activePolygonIndex, 1);
      this.activePolygonIndex = -1;
      this.activePointIndex = -1;
      this.saveToHistory();
      this.redraw();
      return true;
    }
    return false;
  }

  public deleteActiveLane() {
    if (this.activeLaneIndex !== -1) {
      this.lanes.splice(this.activeLaneIndex, 1);
      this.activeLaneIndex = -1;
      this.saveToHistory();
      this.redraw();
      return true;
    }
    return false;
  }

  public hasZones(): boolean {
    return this.polygons.length > 0;
  }

  public hasLanes(): boolean {
    return this.lanes.length > 0;
  }

  // Get normalized coordinates (0-1 range)
  public getNormalizedPolygons() {
    if (!this.image) return [];
    
    return this.polygons.map(polygon => 
      polygon.map(point => ({
        x: point.x / this.originalImageWidth,
        y: point.y / this.originalImageHeight
      }))
    );
  }

  public getNormalizedLanes() {
    if (!this.image) return [];
    
    return this.lanes.map(lane => ({
      x1: lane.x1 / this.originalImageWidth,
      y1: lane.y1 / this.originalImageHeight,
      x2: lane.x2 / this.originalImageWidth,
      y2: lane.y2 / this.originalImageHeight,
      polygonIndex: lane.polygonIndex
    }));
  }

  // Load normalized coordinates
  public loadNormalizedPolygons(normalizedPolygons: Point[][]) {
    if (!this.image || !normalizedPolygons) return;
    
    this.polygons = normalizedPolygons.map(polygon => 
      polygon.map(point => ({
        x: point.x * this.originalImageWidth,
        y: point.y * this.originalImageHeight
      }))
    );
    
    this.saveToHistory();
    this.redraw();
  }

  public loadNormalizedLanes(normalizedLanes: Lane[]) {
    if (!this.image || !normalizedLanes) return;
    
    this.lanes = normalizedLanes.map(lane => ({
      x1: lane.x1 * this.originalImageWidth,
      y1: lane.y1 * this.originalImageHeight,
      x2: lane.x2 * this.originalImageWidth,
      y2: lane.y2 * this.originalImageHeight,
      polygonIndex: lane.polygonIndex
    }));
    
    this.saveToHistory();
    this.redraw();
  }

  private drawPolygonLabel(polygon: Point[], polygonNumber: number) {
    if (!this.ctx || polygon.length < 3) return;

    // Calculate centroid of polygon
    let centerX = 0;
    let centerY = 0;
    for (const point of polygon) {
      centerX += point.x * this.scaleX + this.offsetX;
      centerY += point.y * this.scaleY + this.offsetY;
    }
    centerX /= polygon.length;
    centerY /= polygon.length;

    // Draw background circle for label
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw polygon number text
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Z${polygonNumber}`, centerX, centerY);
  }

  private drawLaneLabel(lane: Lane, laneNumber: number) {
    if (!this.ctx) return;

    const start = {
      x: lane.x1 * this.scaleX + this.offsetX,
      y: lane.y1 * this.scaleY + this.offsetY
    };
    const end = {
      x: lane.x2 * this.scaleX + this.offsetX,
      y: lane.y2 * this.scaleY + this.offsetY
    };

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
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}