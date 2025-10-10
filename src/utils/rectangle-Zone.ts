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
  private offsetX = 0;
  private offsetY = 0;

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

    // Check if clicking on an existing rectangle
    const rectangleIndex = this.findRectangleAt(imageX, imageY);
    if (rectangleIndex !== -1) {
      this.activeRectangleIndex = rectangleIndex;
      this.isDraggingRectangle = true;
      const rectObj = this.rectangles[rectangleIndex];
      this.dragOffset = {
        x: imageX - rectObj.x1,
        y: imageY - rectObj.y1,
      };
      this.redraw();
      return;
    }

    // Start drawing a new rectangle
    this.isDrawingRectangle = true;
    this.currentRectangle = { x1: imageX, y1: imageY, x2: imageX, y2: imageY };
    this.activeRectangleIndex = -1;
    this.redraw();
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to image coordinates
    const imageCoords = this.screenToImageCoords(x, y);
    const imageX = imageCoords.x;
    const imageY = imageCoords.y;

    if (this.isDraggingRectangle && this.activeRectangleIndex !== -1) {
      const rectangle = this.rectangles[this.activeRectangleIndex];
      const width = rectangle.x2 - rectangle.x1;
      const height = rectangle.y2 - rectangle.y1;
      rectangle.x1 = imageX - this.dragOffset.x;
      rectangle.y1 = imageY - this.dragOffset.y;
      rectangle.x2 = rectangle.x1 + width;
      rectangle.y2 = rectangle.y1 + height;
      this.redraw();
      return;
    }

    if (this.isDrawingRectangle && this.currentRectangle) {
      this.currentRectangle.x2 = imageX;
      this.currentRectangle.y2 = imageY;
      this.redraw();
    }
  }

  private handleMouseUp() {
    if (this.isDrawingRectangle && this.currentRectangle) {
      const normalizedRect = this.normalizeRectangle(this.currentRectangle);

      // Only create rectangle if it has minimum size
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

    // Draw image if available
    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      try {
        this.ctx.drawImage(
          this.image,
          this.offsetX,
          this.offsetY,
          this.originalImageWidth * this.scaleX,
          this.originalImageHeight * this.scaleY
        );
      } catch (error) {
        console.error("Error drawing image:", error);
        // Draw placeholder background
        this.ctx.fillStyle = "#f0f0f0";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } else {
      // Draw background if no image
      this.ctx.fillStyle = "#f0f0f0";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw completed rectangles
    this.rectangles.forEach((rectangle, index) => {
      const isActive = index === this.activeRectangleIndex;
      this.drawRectangle(rectangle, isActive);
    });

    // Draw current rectangle being created
    if (this.isDrawingRectangle && this.currentRectangle) {
      this.drawRectangle(this.currentRectangle, false);
    }
  }

  private drawRectangle(rectangle: Rectangle, isActive = false) {
    if (!this.ctx) return;

    const scaled = this.scaleRectangleToScreen(rectangle);
    const color = isActive ? this.activeRectangleColor : this.rectangleColor;

    // Draw fill
    this.ctx.fillStyle = `${color}${Math.floor(this.fillOpacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    this.ctx.fillRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);

    // Draw border
    this.ctx.strokeStyle = isActive ? this.activeBorderColor : this.borderColor;
    this.ctx.lineWidth = this.borderWidth;
    this.ctx.strokeRect(scaled.x1, scaled.y1, scaled.x2 - scaled.x1, scaled.y2 - scaled.y1);
  }

  private scaleRectangleToScreen(rectangle: Rectangle): Rectangle {
    return {
      x1: rectangle.x1 * this.scaleX + this.offsetX,
      y1: rectangle.y1 * this.scaleY + this.offsetY,
      x2: rectangle.x2 * this.scaleX + this.offsetX,
      y2: rectangle.y2 * this.scaleY + this.offsetY,
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
  public updateImage(img: HTMLImageElement) {
    this.image = img;
    this.originalImageWidth = img.naturalWidth;
    this.originalImageHeight = img.naturalHeight;
    this.resizeCanvas();
  }

  // Public methods
  public getRectangles(): Rectangle[] {
    return JSON.parse(JSON.stringify(this.rectangles));
  }

  public setRectangles(rectangles: Rectangle[]) {
    this.rectangles = JSON.parse(JSON.stringify(rectangles));
    this.activeRectangleIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public clearAllRectangles() {
    this.rectangles = [];
    this.currentRectangle = null;
    this.isDrawingRectangle = false;
    this.activeRectangleIndex = -1;
    this.saveToHistory();
    this.redraw();
  }

  public deleteActiveRectangle() {
    if (this.activeRectangleIndex !== -1) {
      this.rectangles.splice(this.activeRectangleIndex, 1);
      this.activeRectangleIndex = -1;
      this.saveToHistory();
      this.redraw();
      return true;
    }
    return false;
  }

  // Get normalized coordinates (0-1 range)
  public getNormalizedRectangles() {
    if (!this.image) return [];
    
    return this.rectangles.map(rectangle => ({
      x1: rectangle.x1 / this.originalImageWidth,
      y1: rectangle.y1 / this.originalImageHeight,
      x2: rectangle.x2 / this.originalImageWidth,
      y2: rectangle.y2 / this.originalImageHeight,
    }));
  }

  // Load normalized coordinates
  public loadNormalizedRectangles(normalizedRectangles: Rectangle[]) {
    if (!this.image || !normalizedRectangles) return;
    
    this.rectangles = normalizedRectangles.map(rectangle => ({
      x1: rectangle.x1 * this.originalImageWidth,
      y1: rectangle.y1 * this.originalImageHeight,
      x2: rectangle.x2 * this.originalImageWidth,
      y2: rectangle.y2 * this.originalImageHeight,
    }));
    
    this.saveToHistory();
    this.redraw();
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
