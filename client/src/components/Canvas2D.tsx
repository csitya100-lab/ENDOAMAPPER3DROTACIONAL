import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ViewType, 
  Position3D, 
  project3DToView, 
  canvas2DTo3D, 
  calculateCanvasBounds,
  getViewLabel,
  getViewColor 
} from '@shared/3d/projections';
import { Lesion, Severity } from '@/lib/lesionStore';

export type DrawingTool = 'select' | 'pen' | 'eraser' | 'line' | 'text' | 'circle' | 'circle-filled';

interface Canvas2DProps {
  viewType: ViewType;
  lesions?: Lesion[];
  selectedLesionId?: string | null;
  zoomLevel: number;
  editMode: boolean;
  drawingTool?: DrawingTool;
  drawingColor?: string;
  drawingSize?: number;
  onLesionSelect?: (id: string | null) => void;
  onLesionMove?: (id: string, position: Position3D) => void;
  onLesionCreate?: (position: Position3D) => void;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  superficial: '#ef4444',
  moderate: '#f97316',
  deep: '#3b82f6'
};

const VIEW_IMAGES: Record<ViewType, string> = {
  'sagittal-avf': '/assets/sagittal-avf-view.png',
  'sagittal-rvf': '/assets/sagittal-rvf-view.png',
  'coronal': '/assets/coronal-view.png',
  'posterior': '/assets/posterior-view.jpg'
};

export default function Canvas2D({
  viewType,
  lesions = [],
  selectedLesionId = null,
  zoomLevel,
  editMode,
  drawingTool = 'select',
  drawingColor = '#ffffff',
  drawingSize = 3,
  onLesionSelect,
  onLesionMove,
  onLesionCreate,
  onCanvasRef
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLesionId, setDragLesionId] = useState<string | null>(null);
  const [hoveredLesionId, setHoveredLesionId] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    const imagePath = VIEW_IMAGES[viewType];
    if (imagePath) {
      const img = new Image();
      img.src = imagePath;
      img.onload = () => setViewImage(img);
    }
  }, [viewType]);

  useEffect(() => {
    onCanvasRef?.(canvasRef.current);
  }, [onCanvasRef]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const newWidth = rect.width;
    const newHeight = rect.height;
    
    let drawingImageData: ImageData | null = null;
    
    if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
      const drawingCtx = drawingCanvas.getContext('2d');
      if (drawingCtx) {
        try {
          drawingImageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        } catch (e) {
          // Handle CORS or other errors
        }
      }
    }
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }
    
    if (drawingCanvas) {
      if (drawingCanvas.width !== newWidth || drawingCanvas.height !== newHeight) {
        drawingCanvas.width = newWidth;
        drawingCanvas.height = newHeight;
      }
      
      if (drawingImageData) {
        const drawingCtx = drawingCanvas.getContext('2d');
        if (drawingCtx) {
          try {
            drawingCtx.putImageData(drawingImageData, 0, 0);
          } catch (e) {
            // Handle errors silently
          }
        }
      }
    }

    const bounds = calculateCanvasBounds(canvas.width, canvas.height, zoomLevel);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (viewImage) {
      const baseSize = Math.min(canvas.width, canvas.height) * 0.9;
      const scale = (baseSize / Math.max(viewImage.width, viewImage.height)) * zoomLevel;
      const scaledWidth = viewImage.width * scale;
      const scaledHeight = viewImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.globalAlpha = 0.9;
      ctx.drawImage(viewImage, x, y, scaledWidth, scaledHeight);
      ctx.globalAlpha = 1.0;
    }

    lesions.forEach(lesion => {
      const pos2D = project3DToView(lesion.position, viewType, bounds);
      const isSelected = lesion.id === selectedLesionId;
      const isHovered = lesion.id === hoveredLesionId;
      const color = SEVERITY_COLORS[lesion.severity];
      
      const baseRadius = 12 * zoomLevel;
      const radius = isHovered ? baseRadius * 1.2 : baseRadius;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos2D.x, pos2D.y, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(pos2D.x, pos2D.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const gradient = ctx.createRadialGradient(
        pos2D.x - radius * 0.3,
        pos2D.y - radius * 0.3,
        0,
        pos2D.x,
        pos2D.y,
        radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}88`);
      
      ctx.beginPath();
      ctx.arc(pos2D.x, pos2D.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pos2D.x - radius * 0.25, pos2D.y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });

    const viewColor = getViewColor(viewType);
    const label = getViewLabel(viewType)?.toUpperCase() || viewType.toUpperCase();
    ctx.font = 'bold 11px monospace';
    const labelWidth = ctx.measureText(label).width + 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, Math.max(labelWidth, 160), 28);
    ctx.fillStyle = viewColor;
    ctx.fillText(label, 16, 26);

  }, [lesions, selectedLesionId, hoveredLesionId, zoomLevel, viewType, viewImage]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  const getLesionAtPosition = useCallback((x: number, y: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const bounds = calculateCanvasBounds(canvas.width, canvas.height, zoomLevel);
    const hitRadius = 15 * zoomLevel;

    for (let i = lesions.length - 1; i >= 0; i--) {
      const lesion = lesions[i];
      const pos2D = project3DToView(lesion.position, viewType, bounds);
      const distance = Math.sqrt(Math.pow(x - pos2D.x, 2) + Math.pow(y - pos2D.y, 2));
      
      if (distance <= hitRadius) {
        return lesion.id;
      }
    }
    return null;
  }, [lesions, viewType, zoomLevel]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lesionId = getLesionAtPosition(x, y);

    if (lesionId) {
      setIsDragging(true);
      setDragLesionId(lesionId);
      onLesionSelect?.(lesionId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else if (onLesionCreate) {
      const bounds = calculateCanvasBounds(canvas.width, canvas.height, zoomLevel);
      const position3D = canvas2DTo3D(x, y, viewType, bounds);
      onLesionCreate(position3D);
    }
  }, [editMode, getLesionAtPosition, onLesionSelect, onLesionCreate, viewType, zoomLevel]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && dragLesionId && editMode && onLesionMove) {
      const bounds = calculateCanvasBounds(canvas.width, canvas.height, zoomLevel);
      const currentLesion = lesions.find(l => l.id === dragLesionId);
      const position3D = canvas2DTo3D(x, y, viewType, bounds, currentLesion?.position);
      onLesionMove(dragLesionId, position3D);
    } else {
      const lesionId = getLesionAtPosition(x, y);
      setHoveredLesionId(lesionId);
      canvas.style.cursor = lesionId ? 'pointer' : (editMode ? 'crosshair' : 'default');
    }
  }, [isDragging, dragLesionId, editMode, getLesionAtPosition, onLesionMove, lesions, viewType, zoomLevel]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragLesionId(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, [isDragging]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!editMode || drawingTool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lesionId = getLesionAtPosition(x, y);
    if (lesionId) {
      onLesionSelect?.(lesionId);
    }
  }, [editMode, drawingTool, getLesionAtPosition, onLesionSelect]);

  const handleDrawingPointerDown = useCallback((e: React.PointerEvent) => {
    if (drawingTool === 'select') return;
    
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool === 'text') {
      setStartPos({ x, y });
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = drawingSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = drawingColor;

    if (drawingTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (drawingTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [drawingTool, drawingColor, drawingSize]);

  const handleDrawingPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !startPos || drawingTool === 'select' || drawingTool === 'text') return;

    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    if (drawingTool === 'pen' || drawingTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawingTool === 'line' || drawingTool === 'circle' || drawingTool === 'circle-filled') {
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      ctx.lineWidth = drawingSize;
      ctx.strokeStyle = drawingColor;
      ctx.fillStyle = drawingColor;

      if (drawingTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
        if (drawingTool === 'circle-filled') {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }
    }
  }, [isDrawing, startPos, drawingTool, drawingColor, drawingSize]);

  const handleDrawingPointerUp = useCallback((e: React.PointerEvent) => {
    if (drawingTool === 'line' || drawingTool === 'circle' || drawingTool === 'circle-filled') {
      const drawingCanvas = drawingCanvasRef.current;
      if (drawingCanvas && startPos && isDrawing) {
        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ctx = drawingCanvas.getContext('2d');
        if (ctx) {
          ctx.lineWidth = drawingSize;
          ctx.strokeStyle = drawingColor;
          ctx.fillStyle = drawingColor;

          if (drawingTool === 'line') {
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          } else {
            const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
            if (drawingTool === 'circle-filled') {
              ctx.fill();
            } else {
              ctx.stroke();
            }
          }
        }
      }
    }
    setIsDrawing(false);
    setStartPos(null);
  }, [isDrawing, startPos, drawingTool, drawingColor, drawingSize]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700"
      data-testid={`canvas-2d-${viewType}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        data-testid={`canvas-${viewType}`}
      />
      
      <canvas
        ref={drawingCanvasRef}
        className={`absolute inset-0 touch-none ${drawingTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerDown={handleDrawingPointerDown}
        onPointerMove={handleDrawingPointerMove}
        onPointerUp={handleDrawingPointerUp}
        onPointerLeave={handleDrawingPointerUp}
        data-testid={`drawing-canvas-${viewType}`}
      />
      
      {showTextInput && startPos && (
        <div
          className="absolute bg-slate-800 border border-slate-600 rounded p-2"
          style={{ left: `${startPos.x}px`, top: `${startPos.y}px` }}
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textInput.trim()) {
                const drawingCanvas = drawingCanvasRef.current;
                if (drawingCanvas) {
                  const ctx = drawingCanvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = drawingColor;
                    ctx.font = `${drawingSize * 4}px sans-serif`;
                    ctx.fillText(textInput, startPos.x, startPos.y);
                  }
                }
                setShowTextInput(false);
                setTextInput('');
                setStartPos(null);
              }
            }}
            autoFocus
            className="w-24 px-2 py-1 text-sm bg-slate-900 border border-slate-500 text-white rounded"
            placeholder="Texto..."
          />
        </div>
      )}
      
      {hoveredLesionId && !isDragging && drawingTool === 'select' && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {editMode ? 'Arraste para mover · Duplo-clique para editar' : 'Clique para selecionar'}
        </div>
      )}
    </div>
  );
}
