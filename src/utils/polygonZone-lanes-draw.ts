/**
 * PolygonZoneDrawerWithLanes - TypeScript version
 * Handles drawing polygons, resizing, and lane drawing with selection + undo/redo
 */

export interface PolygonPoint {
    x: number;
    y: number;
  }
  
  export interface Lane {
    start: PolygonPoint;
    end: PolygonPoint;
    color: string;
  }
  
  export interface Polygon {
    points: PolygonPoint[];
    color: string;
    lanes: Lane[];
  }
  
  export type CallbackFn = (data?: any) => void;
  
  export class PolygonZoneDrawerWithLanes {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
  
    // Drawing state
    private isDrawingPolygon = false;
    private currentPolygon: PolygonPoint[] = [];
    private polygons: Polygon[] = [];
    private activePolygon: Polygon | null = null;
  
    // Lane drawing state
    private isDrawingLane = false;
    private currentLane: Lane | null = null;
    private activeLane: Lane | null = null;
  
    // Selection state
  
    // Config
    private pointRadius = 5;
    private pointColor = "#fff";
    private pointBorderColor = "#000";
    private activePointColor = "#f00";
    private activePointBorderColor = "#000";
  
    private laneColor = "#666";
    private activeLaneColor = "#ff0000"; // active lane highlight color
  
    // History
    private history: { polygons: Polygon[] }[] = [];
    private historyIndex = -1;
  
    // Callbacks
    private onPolygonCreated?: CallbackFn;
    private onLaneCreated?: CallbackFn;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  
      // Mouse events
      this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
      this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
      this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
  
      // Key events
      window.addEventListener("keydown", this.handleKeyDown.bind(this));
    }
  
    /* ==============================
     * Public API
     * ============================== */
    public startPolygon() {
      this.isDrawingPolygon = true;
      this.currentPolygon = [];
      this.activePolygon = null;
      this.isDrawingLane = false;
      this.currentLane = null;
      this.activeLane = null;
      this.draw();
    }
  
    public startLane() {
      if (!this.activePolygon) return;
      this.isDrawingLane = true;
      this.currentLane = null;
      this.activeLane = null;
      // Clear selection
      this.draw();
    }
  
    public undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreFromHistory();
      }
    }
  
    public redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.restoreFromHistory();
      }
    }
  
    public setLaneColor(color: string) {
      this.laneColor = color;
    }
  
    public setCallbacks(callbacks: {
      onPolygonCreated?: CallbackFn;
      onLaneCreated?: CallbackFn;
      onPolygonUpdated?: CallbackFn;
      onLaneUpdated?: CallbackFn;
      onSelectionChanged?: CallbackFn;
    }) {
      this.onPolygonCreated = callbacks.onPolygonCreated;
      this.onLaneCreated = callbacks.onLaneCreated;
    }
  
    /* ==============================
     * Internal Methods
     * ============================== */
    private saveToHistory() {
      const snapshot: { polygons: Polygon[] } = {
        polygons: JSON.parse(JSON.stringify(this.polygons)),
      };
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snapshot);
      this.historyIndex++;
    }
  
    private restoreFromHistory() {
      const snapshot = this.history[this.historyIndex];
      if (!snapshot) return;
      this.polygons = JSON.parse(JSON.stringify(snapshot.polygons));
      this.draw();
    }
  
    private handleMouseDown(e: MouseEvent) {
      const { offsetX: x, offsetY: y } = e;
  
      if (this.isDrawingPolygon) {
        this.currentPolygon.push({ x, y });
        this.draw();
      } else if (this.isDrawingLane && this.activePolygon) {
        if (!this.currentLane) {
          this.currentLane = { start: { x, y }, end: { x, y }, color: this.laneColor };
        } else {
          this.currentLane.end = { x, y };
          this.activePolygon.lanes.push(this.currentLane);
          this.onLaneCreated?.(this.currentLane);
          this.currentLane = null;
          this.saveToHistory();
        }
        this.draw();
      }
    }
  
    private handleMouseMove(e: MouseEvent) {
      const { offsetX: x, offsetY: y } = e;
  
      if (this.isDrawingPolygon && this.currentPolygon.length > 0) {
        this.draw();
        this.ctx.beginPath();
        const last = this.currentPolygon[this.currentPolygon.length - 1];
        this.ctx.moveTo(last.x, last.y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      } else if (this.isDrawingLane && this.currentLane) {
        this.currentLane.end = { x, y };
        this.draw();
      }
    }
  
    private handleMouseUp(_e: MouseEvent) {
      // Reserved for drag/resizing in future
    }
  
    private handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && this.isDrawingPolygon) {
        if (this.currentPolygon.length > 2) {
          const polygon: Polygon = {
            points: [...this.currentPolygon],
            color: this.getRandomColor(),
            lanes: [],
          };
          this.polygons.push(polygon);
          this.activePolygon = polygon;
          this.onPolygonCreated?.(polygon);
          this.currentPolygon = [];
          this.isDrawingPolygon = false;
          this.saveToHistory();
          this.draw();
        }
      } else if (e.key === "Escape") {
        this.isDrawingPolygon = false;
        this.currentPolygon = [];
        this.isDrawingLane = false;
        this.currentLane = null;
        this.draw();
      }
    }
  
    private draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Draw existing polygons + lanes
      this.polygons.forEach((polygon) => {
        this.ctx.beginPath();
        polygon.points.forEach((p, i) => {
          if (i === 0) this.ctx.moveTo(p.x, p.y);
          else this.ctx.lineTo(p.x, p.y);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = polygon.color + "33"; // semi-transparent fill
        this.ctx.fill();
        this.ctx.strokeStyle = polygon.color;
        this.ctx.stroke();
  
        polygon.points.forEach((p) => this.drawPoint(p.x, p.y));
  
        polygon.lanes.forEach((lane) => {
          this.drawLane(lane, lane === this.activeLane);
        });
      });
  
      // Draw current polygon being created
      if (this.isDrawingPolygon && this.currentPolygon.length > 0) {
        this.ctx.beginPath();
        this.currentPolygon.forEach((p, i) => {
          if (i === 0) this.ctx.moveTo(p.x, p.y);
          else this.ctx.lineTo(p.x, p.y);
          this.drawPoint(p.x, p.y, true);
        });
        this.ctx.strokeStyle = "#000";
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
  
      // Draw current lane being created
      if (this.isDrawingLane && this.currentLane) {
        this.drawLane(this.currentLane, true);
      }
    }
  
    private drawPoint(x: number, y: number, isActive = false) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.pointRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = isActive ? this.activePointColor : this.pointColor;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = isActive ? this.activePointBorderColor : this.pointBorderColor;
      this.ctx.stroke();
    }
  
    private drawLane(lane: Lane, isActive: boolean) {
      this.ctx.beginPath();
      this.ctx.moveTo(lane.start.x, lane.start.y);
      this.ctx.lineTo(lane.end.x, lane.end.y);
      this.ctx.strokeStyle = isActive ? this.activeLaneColor : lane.color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  
    private getRandomColor(): string {
      return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }

    public destroy() {
      // Clean up event listeners
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      
      // Clean up window event listeners
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
      
      // Clear canvas
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }
  