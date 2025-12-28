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

interface Canvas2DProps {
  viewType: ViewType;
  lesions: Lesion[];
  selectedLesionId: string | null;
  zoomLevel: number;
  editMode: boolean;
  onLesionSelect: (id: string | null) => void;
  onLesionMove: (id: string, position: Position3D) => void;
  onLesionCreate: (position: Position3D) => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  superficial: '#ef4444',
  moderate: '#f97316',
  deep: '#3b82f6'
};

export default function Canvas2D({
  viewType,
  lesions,
  selectedLesionId,
  zoomLevel,
  editMode,
  onLesionSelect,
  onLesionMove,
  onLesionCreate
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLesionId, setDragLesionId] = useState<string | null>(null);
  const [hoveredLesionId, setHoveredLesionId] = useState<string | null>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const bounds = calculateCanvasBounds(canvas.width, canvas.height, zoomLevel);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40 * zoomLevel;
    
    for (let x = bounds.centerX % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = bounds.centerY % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const uterusWidth = bounds.scale * 1.8;
    const uterusHeight = bounds.scale * 2.2;
    
    ctx.beginPath();
    ctx.ellipse(
      bounds.centerX,
      bounds.centerY,
      uterusWidth / 2,
      uterusHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = 'rgba(221, 138, 150, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(221, 138, 150, 0.08)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(bounds.centerX, 0);
    ctx.lineTo(bounds.centerX, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, bounds.centerY);
    ctx.lineTo(canvas.width, bounds.centerY);
    ctx.stroke();
    
    ctx.setLineDash([]);

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 120, 28);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = viewColor;
    ctx.fillText(getViewLabel(viewType).toUpperCase(), 16, 26);

  }, [lesions, selectedLesionId, hoveredLesionId, zoomLevel, viewType]);

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
      onLesionSelect(lesionId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
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

    if (isDragging && dragLesionId && editMode) {
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
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lesionId = getLesionAtPosition(x, y);
    if (lesionId) {
      onLesionSelect(lesionId);
    }
  }, [editMode, getLesionAtPosition, onLesionSelect]);

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
      
      {hoveredLesionId && !isDragging && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {editMode ? 'Arraste para mover · Duplo-clique para editar' : 'Clique para selecionar'}
        </div>
      )}
    </div>
  );
}
