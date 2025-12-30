import { useLocation } from 'wouter';
import AppSidebar from '@/components/AppSidebar';
import Canvas2D from '@/components/Canvas2D';
import { ViewType } from '@shared/3d/projections';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ZoomIn,
  ZoomOut,
  Edit3,
  Eye,
  RotateCcw,
  Grid3x3,
  ArrowLeft,
  Pen,
  Eraser,
  Pointer,
  Type,
  Minus,
  Circle,
  FileText
} from 'lucide-react';
import { useState, useRef } from 'react';
import { DrawingTool } from '@/components/Canvas2D';

const VIEW_TYPES: ViewType[] = ['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'];

const VIEW_LABELS: Record<ViewType, string> = {
  'sagittal-avf': 'Sagittal (AVF)',
  'sagittal-rvf': 'Sagittal (RVF)',
  'coronal': 'Coronal',
  'posterior': 'Posterior'
};

export default function Vistas2D() {
  const [, setLocation] = useLocation();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [editMode, setEditMode] = useState(true);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
  const [drawingColor, setDrawingColor] = useState('#ffffff');
  const [drawingSize, setDrawingSize] = useState(3);
  const [selectedViewsForExport, setSelectedViewsForExport] = useState<Set<ViewType>>(new Set());
  const canvasRefs = useRef<Record<ViewType, HTMLCanvasElement | null>>({
    'sagittal-avf': null,
    'sagittal-rvf': null,
    'coronal': null,
    'posterior': null
  });

  const toggleViewSelection = (viewType: ViewType) => {
    const newSet = new Set(selectedViewsForExport);
    if (newSet.has(viewType)) {
      newSet.delete(viewType);
    } else {
      newSet.add(viewType);
    }
    setSelectedViewsForExport(newSet);
  };

  const selectAllViews = () => {
    if (selectedViewsForExport.size === VIEW_TYPES.length) {
      setSelectedViewsForExport(new Set());
    } else {
      setSelectedViewsForExport(new Set(VIEW_TYPES));
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleExportView = () => {
    if (selectedViewsForExport.size === 0) {
      alert('Selecione uma ou mais vistas para exportar');
      return;
    }

    const exportedViews = Array.from(selectedViewsForExport).map(viewType => {
      const canvas = canvasRefs.current[viewType];
      if (!canvas) return null;
      return {
        viewType,
        viewLabel: VIEW_LABELS[viewType],
        imageData: canvas.toDataURL('image/png'),
      };
    }).filter(Boolean);

    localStorage.setItem('exportedViews', JSON.stringify(exportedViews));
    setLocation('/report');
  };

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

          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          <div className="col-span-12">
            <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
              {VIEW_TYPES.map((viewType) => (
                <div key={viewType} className="h-full min-h-0 relative group">
                  <Canvas2D
                    viewType={viewType}
                    zoomLevel={zoomLevel}
                    editMode={editMode}
                    drawingTool={drawingTool}
                    drawingColor={drawingColor}
                    drawingSize={drawingSize}
                    onCanvasRef={(canvas) => { canvasRefs.current[viewType] = canvas; }}
                  />
                  <label className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 px-3 py-2 rounded cursor-pointer hover:bg-black/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedViewsForExport.has(viewType)}
                      onChange={() => toggleViewSelection(viewType)}
                      className="cursor-pointer"
                      data-testid={`checkbox-export-${viewType}`}
                    />
                    <span className="text-xs font-medium text-white">{VIEW_LABELS[viewType]}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {selectedViewsForExport.size === 0 
                ? 'Nenhuma vista selecionada' 
                : `${selectedViewsForExport.size} vista${selectedViewsForExport.size !== 1 ? 's' : ''} selecionada${selectedViewsForExport.size !== 1 ? 's' : ''}`}
            </span>
            <Button
              onClick={selectAllViews}
              className="bg-slate-600 hover:bg-slate-700 text-white text-xs h-8"
              data-testid="button-select-all-views"
            >
              {selectedViewsForExport.size === VIEW_TYPES.length ? 'Desselecionar Todas' : 'Selecionar Todas'}
            </Button>
            <Button
              onClick={handleExportView}
              disabled={selectedViewsForExport.size === 0}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs h-8"
              data-testid="button-export-to-report"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Enviar ao Laudo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
