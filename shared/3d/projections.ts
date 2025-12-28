export type ViewType = 'sagittal-avf' | 'sagittal-rvf' | 'coronal' | 'posterior';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface CanvasBounds {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  scale: number;
}

const MODEL_BOUNDS = {
  minX: -2,
  maxX: 2,
  minY: -2,
  maxY: 2,
  minZ: -2,
  maxZ: 2
};

export function project3DToView(position3D: Position3D, viewType: ViewType, bounds: CanvasBounds): Position2D {
  const { x, y, z } = position3D;
  const { width, height, centerX, centerY, scale } = bounds;
  
  let canvasX: number;
  let canvasY: number;
  
  switch (viewType) {
    case 'sagittal-avf':
      canvasX = centerX + (z * scale);
      canvasY = centerY - (y * scale);
      break;
    case 'sagittal-rvf':
      canvasX = centerX - (z * scale);
      canvasY = centerY - (y * scale);
      break;
    case 'coronal':
      canvasX = centerX + (x * scale);
      canvasY = centerY - (y * scale);
      break;
    case 'posterior':
      canvasX = centerX - (x * scale);
      canvasY = centerY - (y * scale);
      break;
    default:
      canvasX = centerX;
      canvasY = centerY;
  }
  
  return { x: canvasX, y: canvasY };
}

export function canvas2DTo3D(
  canvasX: number, 
  canvasY: number, 
  viewType: ViewType, 
  bounds: CanvasBounds,
  existingPosition?: Position3D
): Position3D {
  const { centerX, centerY, scale } = bounds;
  
  const normalizedX = (canvasX - centerX) / scale;
  const normalizedY = -(canvasY - centerY) / scale;
  
  switch (viewType) {
    case 'sagittal-avf':
      return {
        x: existingPosition?.x ?? 0,
        y: normalizedY,
        z: normalizedX
      };
    case 'sagittal-rvf':
      return {
        x: existingPosition?.x ?? 0,
        y: normalizedY,
        z: -normalizedX
      };
    case 'coronal':
      return {
        x: normalizedX,
        y: normalizedY,
        z: existingPosition?.z ?? 0
      };
    case 'posterior':
      return {
        x: -normalizedX,
        y: normalizedY,
        z: existingPosition?.z ?? 0
      };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

export function getViewLabel(viewType: ViewType): string {
  const labels: Record<ViewType, string> = {
    'sagittal-avf': 'Vista Sagital AVF',
    'sagittal-rvf': 'Vista Sagital RVF',
    coronal: 'Vista Coronal',
    posterior: 'Vista Posterior'
  };
  return labels[viewType];
}

export function getViewColor(viewType: ViewType): string {
  const colors: Record<ViewType, string> = {
    'sagittal-avf': '#3b82f6',
    'sagittal-rvf': '#8b5cf6',
    coronal: '#10b981',
    posterior: '#f59e0b'
  };
  return colors[viewType];
}

export function calculateCanvasBounds(
  canvasWidth: number, 
  canvasHeight: number, 
  zoomLevel: number = 1
): CanvasBounds {
  const baseScale = Math.min(canvasWidth, canvasHeight) / 5;
  return {
    width: canvasWidth,
    height: canvasHeight,
    centerX: canvasWidth / 2,
    centerY: canvasHeight / 2,
    scale: baseScale * zoomLevel
  };
}

export function isPositionInView(position3D: Position3D, viewType: ViewType): boolean {
  const { x, y, z } = position3D;
  
  const inBounds = (
    x >= MODEL_BOUNDS.minX && x <= MODEL_BOUNDS.maxX &&
    y >= MODEL_BOUNDS.minY && y <= MODEL_BOUNDS.maxY &&
    z >= MODEL_BOUNDS.minZ && z <= MODEL_BOUNDS.maxZ
  );
  
  return inBounds;
}

export function clampPosition(position3D: Position3D): Position3D {
  return {
    x: Math.max(MODEL_BOUNDS.minX, Math.min(MODEL_BOUNDS.maxX, position3D.x)),
    y: Math.max(MODEL_BOUNDS.minY, Math.min(MODEL_BOUNDS.maxY, position3D.y)),
    z: Math.max(MODEL_BOUNDS.minZ, Math.min(MODEL_BOUNDS.maxZ, position3D.z))
  };
}
