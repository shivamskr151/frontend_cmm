/**
 * Rectangle Zone Drawer - Handles drawing simple rectangle zones
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
  
  interface HistoryState {
    rectangles: Rectangle[];
    activeRectangleIndex: number;
  }
  
  export class RectangleZoneDrawer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private image: HTMLImageElement | null = null;
  
    private originalImageWidth = 0;
    private originalImageHeight = 0;
    private scaleX = 1;
    private scaleY = 1;
  
    // Rectangle drawing state
    private isDrawingRectangle = false;
    private currentRectangle: Rectangle | null = null;
    private rectangles: Rectangle[] = [];
    private activeRectangleIndex = -1;
    private isDraggingRectangle = false;
    private dragOffset: Point = { x: 0, y: 0 };
  
    // Visual settings
    private rectangleColor = "#ff6b35";
    private activeRectangleColor = "#ff4757";
    private borderColor = "#ff6b35";
    private activeBorderColor = "#ff4757";
    private fillOpacity = 0.2;
    private borderWidth = 2;
  
    // History for undo/redo functionality
    private history: HistoryState[] = [];
    private historyIndex = -1;
    private maxHistorySize = 50;
  
    // Action lock
    private actionLock = false;
    private lockTimeout = 300;
  
    // Callback
    public onRectangleCreated?: (rectangle: Rectangle) => void;
  
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
    }
  
    private resizeCanvas() {
      if (!this.image) return;
  
      const container = this.canvas.parentElement;
      if (!container) return;
  
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageRatio = this.originalImageWidth / this.originalImageHeight;
  
      let newWidth = containerWidth;
      let newHeight = containerHeight;
  
      if (containerWidth / containerHeight > imageRatio) {
        newHeight = Math.min(containerHeight, window.innerHeight * 0.7);
        newWidth = newHeight * imageRatio;
      } else {
        newWidth = Math.min(containerWidth, window.innerWidth * 0.9);
        newHeight = newWidth / imageRatio;
      }
  
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
  
      this.scaleX = newWidth / this.originalImageWidth;
      this.scaleY = newHeight / this.originalImageHeight;
  
      this.redraw();
    }
  
    private handleMouseDown(e: MouseEvent) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const scaledX = x / this.scaleX;
      const scaledY = y / this.scaleY;
  
      const rectangleIndex = this.findRectangleAt(scaledX, scaledY);
      if (rectangleIndex !== -1) {
        this.activeRectangleIndex = rectangleIndex;
        this.isDraggingRectangle = true;
        // Store drag start point for reference
        const rectObj = this.rectangles[rectangleIndex];
        this.dragOffset = {
          x: scaledX - rectObj.x1,
          y: scaledY - rectObj.y1,
        };
        this.redraw();
        return;
      }
  
      this.isDrawingRectangle = true;
      // Store start point for reference
      this.currentRectangle = { x1: scaledX, y1: scaledY, x2: scaledX, y2: scaledY };
      this.activeRectangleIndex = -1;
      this.redraw();
    }
  
    private handleMouseMove(e: MouseEvent) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const scaledX = x / this.scaleX;
      const scaledY = y / this.scaleY;
  
      if (this.isDraggingRectangle && this.activeRectangleIndex !== -1) {
        const rectangle = this.rectangles[this.activeRectangleIndex];
        const width = rectangle.x2 - rectangle.x1;
        const height = rectangle.y2 - rectangle.y1;
        rectangle.x1 = scaledX - this.dragOffset.x;
        rectangle.y1 = scaledY - this.dragOffset.y;
        rectangle.x2 = rectangle.x1 + width;
        rectangle.y2 = rectangle.y1 + height;
        this.redraw();
        return;
      }
  
      if (this.isDrawingRectangle && this.currentRectangle) {
        this.currentRectangle.x2 = scaledX;
        this.currentRectangle.y2 = scaledY;
        this.redraw();
      }
    }
  
    private handleMouseUp() {
      if (this.isDrawingRectangle && this.currentRectangle) {
        const normalizedRect = this.normalizeRectangle(this.currentRectangle);
  
        if (
          Math.abs(normalizedRect.x2 - normalizedRect.x1) > 10 &&
          Math.abs(normalizedRect.y2 - normalizedRect.y1) > 10
        ) {
          this.rectangles.push(normalizedRect);
          this.activeRectangleIndex = this.rectangles.length - 1;
          this.onRectangleCreated?.(normalizedRect);
          this.saveToHistory();
        }
  
        this.isDrawingRectangle = false;
        this.currentRectangle = null;
        this.redraw();
      }
  
      this.isDraggingRectangle = false;
    }
  
    private normalizeRectangle(rect: Rectangle): Rectangle {
      return {
        x1: Math.min(rect.x1, rect.x2),
        y1: Math.min(rect.y1, rect.y2),
        x2: Math.max(rect.x1, rect.x2),
        y2: Math.max(rect.y1, rect.y2),
      };
    }
  
    private findRectangleAt(x: number, y: number): number {
      for (let i = this.rectangles.length - 1; i >= 0; i--) {
        const rect = this.rectangles[i];
        if (x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2) {
          return i;
        }
      }
      return -1;
    }
  
    private redraw() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
      if (this.image) {
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
      }
  
      this.rectangles.forEach((rectangle, index) => {
        const isActive = index === this.activeRectangleIndex;
        this.drawRectangle(rectangle, isActive);
      });
  
      if (this.isDrawingRectangle && this.currentRectangle) {
        this.drawRectangle(this.currentRectangle, false);
      }
    }
  
    private drawRectangle(rectangle: Rectangle, isActive = false) {
      if (!this.ctx) return;
  
      const scaled = this.scaleRectangleToScreen(rectangle);
      const color = isActive ? this.activeRectangleColor : this.rectangleColor;
  
      this.ctx.fillStyle = `${color}${Math.floor(this.fillOpacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
      this.ctx.fillRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);
  
      this.ctx.strokeStyle = isActive ? this.activeBorderColor : this.borderColor;
      this.ctx.lineWidth = this.borderWidth;
      this.ctx.strokeRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);
    }
  
    private scaleRectangleToScreen(rectangle: Rectangle): Rectangle {
      return {
        x1: rectangle.x1 * this.scaleX,
        y1: rectangle.y1 * this.scaleY,
        x2: rectangle.x2 * this.scaleX,
        y2: rectangle.y2 * this.scaleY,
      };
    }
  
    // History
    private saveToHistory() {
      if (this.actionLock) return;
      const state: HistoryState = {
        rectangles: JSON.parse(JSON.stringify(this.rectangles)),
        activeRectangleIndex: this.activeRectangleIndex,
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
      this.rectangles = JSON.parse(JSON.stringify(state.rectangles));
      this.activeRectangleIndex = state.activeRectangleIndex;
      this.redraw();
    }
  
    private canUndo(): boolean {
      return this.historyIndex > 0;
    }
  
    private canRedo(): boolean {
      return this.historyIndex < this.history.length - 1;
    }
  
    // Image handling
    public async loadImage(imageUrl: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          this.updateImage(img);
          resolve();
        };
        img.onerror = (error) => reject(error);
        img.src = imageUrl;
      });
    }
  
    public updateImage(img: HTMLImageElement) {
      this.image = img;
      this.originalImageWidth = img.naturalWidth;
      this.originalImageHeight = img.naturalHeight;
      this.resizeCanvas();
    }
  
    // Export
    public getNormalizedData() {
      if (!this.image) return { rectangles: [] };
      return {
        rectangles: this.rectangles.map((rect) => ({
          x1: rect.x1 / this.originalImageWidth,
          y1: rect.y1 / this.originalImageHeight,
          x2: rect.x2 / this.originalImageWidth,
          y2: rect.y2 / this.originalImageHeight,
        })),
      };
    }
  
    public loadNormalizedData(data: { rectangles: Rectangle[] }) {
      if (!this.image || !data.rectangles) return;
      this.rectangles = data.rectangles.map((rect) => ({
        x1: rect.x1 * this.originalImageWidth,
        y1: rect.y1 * this.originalImageHeight,
        x2: rect.x2 * this.originalImageWidth,
        y2: rect.y2 * this.originalImageHeight,
      }));
      this.saveToHistory();
      this.redraw();
    }
  
    public getAllCoordinates() {
      return this.rectangles.map((rect, index) => ({
        id: index + 1,
        coordinates: {
          topLeft: { x: Math.round(rect.x1), y: Math.round(rect.y1) },
          topRight: { x: Math.round(rect.x2), y: Math.round(rect.y1) },
          bottomRight: { x: Math.round(rect.x2), y: Math.round(rect.y2) },
          bottomLeft: { x: Math.round(rect.x1), y: Math.round(rect.y2) },
        },
        dimensions: {
          width: Math.round(rect.x2 - rect.x1),
          height: Math.round(rect.y2 - rect.y1),
        },
      }));
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
  