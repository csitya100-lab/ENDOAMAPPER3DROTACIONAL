import { useLocation } from 'wouter';
import AppSidebar from '@/components/AppSidebar';
import Canvas2D from '@/components/Canvas2D';
import { ViewType } from '@shared/3d/projections';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReportStore } from '@/lib/reportStore';
import { useEffect } from 'react';
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
  Circle
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
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [editMode, setEditMode] = useState(true);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
  const [drawingColor, setDrawingColor] = useState('#ffffff');
  const [drawingSize, setDrawingSize] = useState(3);
  const [selectedViewsForExport, setSelectedViewsForExport] = useState<Set<ViewType>>(new Set());
  const [focusedView, setFocusedView] = useState<ViewType | null>(null);
  const { setDraftImages2D } = useReportStore();

  useEffect(() => {
    const captureImages = () => {
      const images = {
        sagittal: canvasRefs.current['sagittal-avf']?.toDataURL('image/png') || '',
        coronal: canvasRefs.current['coronal']?.toDataURL('image/png') || '',
        posterior: canvasRefs.current['posterior']?.toDataURL('image/png') || '',
      };
      setDraftImages2D(images);
    };

    const interval = setInterval(captureImages, 2000);
    return () => clearInterval(interval);
  }, [setDraftImages2D]);

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
      if (focusedView === viewType) {
        setFocusedView(null);
      }
    } else {
      newSet.add(viewType);
      setFocusedView(viewType);
    }
    setSelectedViewsForExport(newSet);
  };

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
                EndoMapper 2D
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
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'select' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Selecionar" : "Selecione uma vista para editar"}
              data-testid="button-tool-select"
            >
              <Pointer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('pen')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'pen' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Desenhar" : "Selecione uma vista para editar"}
              data-testid="button-tool-pen"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('eraser')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'eraser' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Borracha" : "Selecione uma vista para editar"}
              data-testid="button-tool-eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('line')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'line' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Linha" : "Selecione uma vista para editar"}
              data-testid="button-tool-line"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('circle')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'circle' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Círculo" : "Selecione uma vista para editar"}
              data-testid="button-tool-circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('circle-filled')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'circle-filled' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Círculo Preenchido" : "Selecione uma vista para editar"}
              data-testid="button-tool-circle-filled"
            >
              <Circle className="w-4 h-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawingTool('text')}
              disabled={!focusedView}
              className={`h-8 w-8 ${drawingTool === 'text' ? 'bg-slate-700' : ''} ${!focusedView ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={focusedView ? "Texto" : "Selecione uma vista para editar"}
              data-testid="button-tool-text"
            >
              <Type className="w-4 h-4" />
            </Button>
            
            {focusedView && drawingTool !== 'select' && (
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

        {focusedView ? (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
            <div className="col-span-9">
              <div className="h-full min-h-0 relative group rounded-lg overflow-hidden border-2 border-pink-500 shadow-lg shadow-pink-500/30">
                <Canvas2D
                  viewType={focusedView}
                  zoomLevel={zoomLevel}
                  editMode={editMode}
                  drawingTool={drawingTool}
                  drawingColor={drawingColor}
                  drawingSize={drawingSize}
                  onCanvasRef={(canvas) => { canvasRefs.current[focusedView] = canvas; }}
                />
                <label className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 px-3 py-2 rounded cursor-pointer hover:bg-black/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedViewsForExport.has(focusedView)}
                    onChange={() => toggleViewSelection(focusedView)}
                    className="cursor-pointer"
                    data-testid={`checkbox-export-${focusedView}`}
                  />
                  <span className="text-xs font-medium text-white">{VIEW_LABELS[focusedView]}</span>
                </label>
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              {VIEW_TYPES.map((viewType) => (
                viewType !== focusedView && (
                  <div
                    key={viewType}
                    className="h-24 min-h-0 relative group rounded border border-slate-600 transition-all overflow-hidden"
                  >
                    <Canvas2D
                      viewType={viewType}
                      zoomLevel={0.5}
                      editMode={false}
                      drawingTool="select"
                      drawingColor="#ffffff"
                      drawingSize={1}
                      onCanvasRef={(canvas) => { canvasRefs.current[viewType] = canvas; }}
                    />
                    <label className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-2 py-1 rounded cursor-pointer hover:bg-black/80 transition-colors text-xs" onClick={(e) => e.stopPropagation()}>
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
                )
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFocusedView(null)}
                className="mt-auto text-white border-slate-600 hover:border-slate-500"
              >
                Sair do Foco
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
            <div className="col-span-12">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
                {VIEW_TYPES.map((viewType) => (
                  <div
                    key={viewType}
                    className="h-full min-h-0 relative group rounded-lg border border-slate-700 transition-all overflow-hidden"
                  >
                    <Canvas2D
                      viewType={viewType}
                      zoomLevel={zoomLevel}
                      editMode={editMode}
                      drawingTool={drawingTool}
                      drawingColor={drawingColor}
                      drawingSize={drawingSize}
                      onCanvasRef={(canvas) => { canvasRefs.current[viewType] = canvas; }}
                    />
                    <label className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 px-3 py-2 rounded cursor-pointer hover:bg-black/80 transition-colors" onClick={(e) => e.stopPropagation()}>
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
        )}

      </main>
    </div>
  );
}
