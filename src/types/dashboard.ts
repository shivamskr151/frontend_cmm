export interface ZoneCoordinates {
  zones: Array<{ x: number; y: number; width: number; height: number }>;
  lanes: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>;
  polygons: Array<Array<{ x: number; y: number }>>;
}

export interface RectangleDimensions {
  area: number;
  perimeter: number;
  diagonal: number;
  aspectRatio: string;
  centerX: number;
  centerY: number;
}

export interface PolygonDimensions {
  area: number;
  perimeter: number;
  boundingWidth: number;
  boundingHeight: number;
  centroidX: number;
  centroidY: number;
  pointCount: number;
}

export interface SpeedLimit {
  vehicleType: string;
  speed: number;
}

export interface ZoneTypeOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type ModalType = 'success' | 'error' | 'warning' | 'info';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
