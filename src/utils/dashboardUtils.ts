import type { RectangleDimensions, PolygonDimensions } from '../types/dashboard';

// Utility functions for calculating zone dimensions
export const calculateRectangleDimensions = (zone: { x: number; y: number; width: number; height: number }): RectangleDimensions => {
  const area = zone.width * zone.height;
  const perimeter = 2 * (zone.width + zone.height);
  const diagonal = Math.sqrt(zone.width * zone.width + zone.height * zone.height);
  const aspectRatio = zone.width / zone.height;
  
  return {
    area: Math.round(area),
    perimeter: Math.round(perimeter),
    diagonal: Math.round(diagonal),
    aspectRatio: aspectRatio.toFixed(2),
    centerX: Math.round(zone.x + zone.width / 2),
    centerY: Math.round(zone.y + zone.height / 2)
  };
};

export const calculatePolygonDimensions = (polygon: Array<{ x: number; y: number }>): PolygonDimensions => {
  // Calculate area using the shoelace formula
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  area = Math.abs(area) / 2;
  
  // Calculate perimeter
  let perimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const dx = polygon[j].x - polygon[i].x;
    const dy = polygon[j].y - polygon[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Calculate bounding box
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;
  
  // Calculate centroid
  const centroidX = xs.reduce((sum, x) => sum + x, 0) / polygon.length;
  const centroidY = ys.reduce((sum, y) => sum + y, 0) / polygon.length;
  
  return {
    area: Math.round(area),
    perimeter: Math.round(perimeter),
    boundingWidth: Math.round(boundingWidth),
    boundingHeight: Math.round(boundingHeight),
    centroidX: Math.round(centroidX),
    centroidY: Math.round(centroidY),
    pointCount: polygon.length
  };
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};
