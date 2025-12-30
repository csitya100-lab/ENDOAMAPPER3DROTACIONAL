import { useCallback } from 'react';
import { useLocation } from 'wouter';
import AppSidebar from '@/components/AppSidebar';
import Canvas2D from '@/components/Canvas2D';
import { useLesionStore, Lesion, Severity } from '@/lib/lesionStore';
import { Position3D, ViewType, clampPosition } from '@shared/3d/projections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ZoomIn,
  ZoomOut,
  Trash2,
  Edit3,
  Eye,
  MapPin,
  RotateCcw,
  Grid3x3,
  ArrowLeft,
  Pen,
  Eraser,
  Pointer,
  RotateCw,
  Type,
  Minus,
  Circle
} from 'lucide-react';
import { useState } from 'react';
import { DrawingTool } from '@/components/Canvas2D';

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string }> = {
  superficial: { label: 'Superficial', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  moderate: { label: 'Moderada', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  deep: { label: 'Profunda', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
};

const VIEW_TYPES: ViewType[] = ['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'];

export default function Vistas2D() {
  const [, setLocation] = useLocation();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [editMode, setEditMode] = useState(true);
  const [currentSeverity, setCurrentSeverity] = useState<Severity>('moderate');
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('select');
  const [drawingColor, setDrawingColor] = useState('#ffffff');
  const [drawingSize, setDrawingSize] = useState(3);

  const { 
    lesions, 
    selectedLesionId, 
    addLesion, 
    updateLesion, 
    removeLesion, 
    clearLesions, 
    selectLesion 
  } = useLesionStore();

  const selectedLesion = lesions.find(l => l.id === selectedLesionId);

  const handleLesionSelect = useCallback((id: string | null) => {
    selectLesion(id);
  }, [selectLesion]);

  const handleLesionMove = useCallback((id: string, position: Position3D) => {
    updateLesion(id, { position: clampPosition(position) });
  }, [updateLesion]);

  const handleLesionCreate = useCallback((position: Position3D) => {
    addLesion({
      position: clampPosition(position),
      severity: currentSeverity,
      location: '',
      observacoes: ''
    });
  }, [addLesion, currentSeverity]);

  const handleDeleteLesion = useCallback((id: string) => {
    removeLesion(id);
  }, [removeLesion]);

  const handleClearAll = useCallback(() => {
    clearLesions();
  }, [clearLesions]);

  const handleUpdateLesion = useCallback((id: string, updates: Partial<Lesion>) => {
    updateLesion(id, updates);
  }, [updateLesion]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AppSidebar />
      
      <main className="flex-1 ml-16 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-slate-400 hover:text-white"
              data-testid="button-back-3d"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao 3D
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Grid3x3 className="w-6 h-6 text-pink-500" />
                Editor de Vistas 2D
              </h1>
              <p className="text-slate-400 text-sm">
                Edite lesões com precisão em vistas planares
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('select')}
              className={`h-8 w-8 ${drawingTool === 'select' ? 'bg-slate-700' : ''}`}
              title="Selecionar"
              data-testid="button-tool-select"
            >
              <Pointer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('pen')}
              className={`h-8 w-8 ${drawingTool === 'pen' ? 'bg-slate-700' : ''}`}
              title="Desenhar"
              data-testid="button-tool-pen"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('eraser')}
              className={`h-8 w-8 ${drawingTool === 'eraser' ? 'bg-slate-700' : ''}`}
              title="Borracha"
              data-testid="button-tool-eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('line')}
              className={`h-8 w-8 ${drawingTool === 'line' ? 'bg-slate-700' : ''}`}
              title="Linha"
              data-testid="button-tool-line"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('circle')}
              className={`h-8 w-8 ${drawingTool === 'circle' ? 'bg-slate-700' : ''}`}
              title="Círculo"
              data-testid="button-tool-circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('circle-filled')}
              className={`h-8 w-8 ${drawingTool === 'circle-filled' ? 'bg-slate-700' : ''}`}
              title="Círculo Preenchido"
              data-testid="button-tool-circle-filled"
            >
              <Circle className="w-4 h-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('text')}
              className={`h-8 w-8 ${drawingTool === 'text' ? 'bg-slate-700' : ''}`}
              title="Texto"
              data-testid="button-tool-text"
            >
              <Type className="w-4 h-4" />
            </Button>
            
            {drawingTool !== 'select' && (
              <>
                <div className="h-6 w-px bg-slate-700" />
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border border-slate-600"
                  title="Cor"
                  data-testid="input-drawing-color"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={drawingSize}
                    onChange={(e) => setDrawingSize(parseInt(e.target.value))}
                    className="w-20 h-2"
                    title="Espessura"
                    data-testid="input-drawing-size"
                  />
                  <span className="text-xs text-slate-400 w-6">{drawingSize}px</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Label htmlFor="edit-mode" className="text-sm text-slate-400">Modo</Label>
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={setEditMode}
                data-testid="switch-edit-mode"
              />
              <span className="text-sm font-medium">
                {editMode ? (
                  <span className="flex items-center gap-1 text-pink-400">
                    <Edit3 className="w-4 h-4" /> Edição
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-4 h-4" /> Visualização
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="h-8 w-8"
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="h-8 w-8"
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="h-8 w-8"
                data-testid="button-zoom-reset"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {editMode && (
              <Select value={currentSeverity} onValueChange={(v) => setCurrentSeverity(v as Severity)}>
                <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700" data-testid="select-severity">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superficial">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      Superficial
                    </span>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      Moderada
                    </span>
                  </SelectItem>
                  <SelectItem value="deep">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      Profunda
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          <div className="col-span-12">
            <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
              {VIEW_TYPES.map((viewType) => (
                <div key={viewType} className="h-full min-h-0">
                  <Canvas2D
                    viewType={viewType}
                    lesions={lesions}
                    selectedLesionId={selectedLesionId}
                    zoomLevel={zoomLevel}
                    editMode={editMode}
                    drawingTool={drawingTool}
                    drawingColor={drawingColor}
                    drawingSize={drawingSize}
                    onLesionSelect={handleLesionSelect}
                    onLesionMove={handleLesionMove}
                    onLesionCreate={handleLesionCreate}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Superficial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Moderada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Profunda
            </span>
          </div>
          <div>
            Clique para adicionar · Arraste para mover · Duplo-clique para editar
          </div>
        </div>
      </main>
    </div>
  );
}
