type Point = { x: number; y: number };

interface Zone {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorIndex: number;
  lanes: Lane[];
}

interface Lane {
  start: Point;
  end: Point;
  colorIndex: number;
}

export class ZoneDrawer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private isDrawingBox = false;
  private isDrawingLine = false;
  private currentBox: { x1: number; y1: number; x2: number; y2: number } | null = null;
  private currentLine: { start: Point; end: Point } | null = null;

  private zones: Zone[] = [];
  private activeZoneIndex: number | null = null;

  private undoStack: Zone[][] = [];
  private redoStack: Zone[][] = [];

  private colors: string[] = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF5"];
  private drawMode: "zone" | "lane" = "zone";

  private image: HTMLImageElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.initEvents();
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.redraw();
  }

  private initEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.onMouseUp());
  }

  private getMousePos(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  public setDrawMode(mode: "zone" | "lane") {
    this.drawMode = mode;
  }

  private onMouseDown(e: MouseEvent) {
    const pos = this.getMousePos(e);
    if (this.drawMode === "zone") {
      this.isDrawingBox = true;
      this.currentBox = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
    } else if (this.drawMode === "lane" && this.activeZoneIndex !== null) {
      this.isDrawingLine = true;
      this.currentLine = { start: pos, end: pos };
    }
  }

  private onMouseMove(e: MouseEvent) {
    const pos = this.getMousePos(e);
    if (this.isDrawingBox && this.currentBox) {
      this.currentBox.x2 = pos.x;
      this.currentBox.y2 = pos.y;
      this.redraw();
    } else if (this.isDrawingLine && this.currentLine) {
      this.currentLine.end = pos;
      this.redraw();
    }
  }

  private onMouseUp() {
    if (this.isDrawingBox && this.currentBox) {
      const colorIndex = this.zones.length % this.colors.length;
      this.zones.push({ ...this.currentBox, colorIndex, lanes: [] });
      this.pushUndo();
      this.currentBox = null;
      this.isDrawingBox = false;
      this.activeZoneIndex = this.zones.length - 1;
      this.redraw();
    } else if (this.isDrawingLine && this.currentLine && this.activeZoneIndex !== null) {
      const zone = this.zones[this.activeZoneIndex];
      const colorIndex = zone.lanes.length % this.colors.length;
      zone.lanes.push({ ...this.currentLine, colorIndex });
      this.pushUndo();
      this.currentLine = null;
      this.isDrawingLine = false;
      this.redraw();
    }
  }

  private pushUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.zones)));
    this.redoStack = [];
  }

  public undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.parse(JSON.stringify(this.zones)));
    this.zones = this.undoStack.pop()!;
    this.redraw();
  }

  public redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.parse(JSON.stringify(this.zones)));
    this.zones = this.redoStack.pop()!;
    this.redraw();
  }

  public resetZones() {
    this.zones = [];
    this.activeZoneIndex = null;
    this.undoStack = [];
    this.redoStack = [];
    this.redraw();
  }

  public updateImage(img: HTMLImageElement) {
    this.image = img;
    // Store image dimensions for reference
    this.resizeCanvas();
  }

  private redraw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.image) ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    this.zones.forEach((zone) => {
      ctx.strokeStyle = this.colors[zone.colorIndex];
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x1, zone.y1, zone.x2 - zone.x1, zone.y2 - zone.y1);

      zone.lanes.forEach((lane) => {
        ctx.strokeStyle = this.colors[lane.colorIndex];
        ctx.beginPath();
        ctx.moveTo(lane.start.x, lane.start.y);
        ctx.lineTo(lane.end.x, lane.end.y);
        ctx.stroke();
      });
    });

    if (this.isDrawingBox && this.currentBox) {
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.currentBox.x1, this.currentBox.y1, this.currentBox.x2 - this.currentBox.x1, this.currentBox.y2 - this.currentBox.y1);
      ctx.setLineDash([]);
    }

    if (this.isDrawingLine && this.currentLine) {
      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(this.currentLine.start.x, this.currentLine.start.y);
      ctx.lineTo(this.currentLine.end.x, this.currentLine.end.y);
      ctx.stroke();
    }
  }

  public destroy() {
    // Clean up event listeners
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
