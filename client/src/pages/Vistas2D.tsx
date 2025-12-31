import { useLocation } from 'wouter';
import AppSidebar from '@/components/AppSidebar';
import Canvas2D from '@/components/Canvas2D';
import { ViewType } from '@shared/3d/projections';
import { Button } from '@/components/ui/button';
import { useReportStore } from '@/lib/reportStore';
import {
  Grid3x3,
  ArrowLeft,
  Pen,
  Eraser,
  Pointer,
  Type,
  Minus,
  Circle,
  Ruler,
  Send,
  Check
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { DrawingTool } from '@/components/Canvas2D';

const VIEW_TYPES: ViewType[] = ['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'];

const VIEW_LABELS: Record<ViewType, string> = {
  'sagittal-avf': 'Sagittal (AVF)',
  'sagittal-rvf': 'Sagittal (RVF)',
  'coronal': 'Coronal',
  'posterior': 'Posterior'
};

interface ViewSettings {
  drawingTool: DrawingTool;
  drawingColor: string;
  drawingSize: number;
  drawingData: string;
}

const createDefaultViewSettings = (): ViewSettings => ({
  drawingTool: 'pen',
  drawingColor: '#ffffff',
  drawingSize: 3,
  drawingData: '',
});

export default function Vistas2D() {
  const [, setLocation] = useLocation();
  const [viewSettings, setViewSettings] = useState<Record<ViewType, ViewSettings>>(() => ({
    'sagittal-avf': createDefaultViewSettings(),
    'sagittal-rvf': createDefaultViewSettings(),
    'coronal': createDefaultViewSettings(),
    'posterior': createDefaultViewSettings(),
  }));
  const [activeView, setActiveView] = useState<ViewType | null>(null);
  const { selectedViews, toggleViewSelection, addPdfImage, clearPdfImages } = useReportStore();

  const canvasRefs = useRef<Record<ViewType, HTMLCanvasElement | null>>({
    'sagittal-avf': null,
    'sagittal-rvf': null,
    'coronal': null,
    'posterior': null
  });

  const setCanvasRef = useCallback((viewType: ViewType) => (canvas: HTMLCanvasElement | null) => {
    canvasRefs.current[viewType] = canvas;
  }, []);

  const updateViewSetting = <K extends keyof ViewSettings>(
    view: ViewType,
    key: K,
    value: ViewSettings[K]
  ) => {
    setViewSettings(prev => ({
      ...prev,
      [view]: { ...prev[view], [key]: value }
    }));
  };

  const currentSettings = activeView ? viewSettings[activeView] : null;

  const selectedCount = Object.values(selectedViews).filter(Boolean).length;

  const handleSendToReport = () => {
    clearPdfImages();
    
    const scale = 2;
    
    VIEW_TYPES.forEach((viewType) => {
      if (selectedViews[viewType] && canvasRefs.current[viewType]) {
        const sourceCanvas = canvasRefs.current[viewType]!;
        
        const highResCanvas = document.createElement('canvas');
        highResCanvas.width = sourceCanvas.width * scale;
        highResCanvas.height = sourceCanvas.height * scale;
        
        const ctx = highResCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.scale(scale, scale);
          ctx.drawImage(sourceCanvas, 0, 0);
          
          const imgData = highResCanvas.toDataURL('image/png');
          addPdfImage({
            data: imgData,
            label: VIEW_LABELS[viewType],
            viewType: viewType,
            width: highResCanvas.width,
            height: highResCanvas.height,
            observation: '',
            drawingData: viewSettings[viewType].drawingData
          });
        }
      }
    });
    
    setLocation('/preview-report');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <AppSidebar />
      
      <main className="flex-1 ml-16 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
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
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-pink-500" />
                Editor 2D
              </h1>
              <p className="text-slate-400 text-xs">
                Clique em uma figura para editar, marque as que deseja enviar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'select')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'select' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Selecionar"
              data-testid="button-tool-select"
            >
              <Pointer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'pen')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'pen' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Desenhar"
              data-testid="button-tool-pen"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'eraser')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'eraser' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Borracha"
              data-testid="button-tool-eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'line')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'line' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Linha"
              data-testid="button-tool-line"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'circle')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'circle' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Círculo"
              data-testid="button-tool-circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'circle-filled')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'circle-filled' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Círculo Preenchido"
              data-testid="button-tool-circle-filled"
            >
              <Circle className="w-4 h-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'text')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'text' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Texto"
              data-testid="button-tool-text"
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeView && updateViewSetting(activeView, 'drawingTool', 'ruler')}
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === 'ruler' ? 'bg-slate-700' : ''} ${!activeView ? 'opacity-50' : ''}`}
              title="Régua"
              data-testid="button-tool-ruler"
            >
              <Ruler className="w-4 h-4" />
            </Button>
            
            {activeView && currentSettings?.drawingTool !== 'select' && (
              <>
                <div className="h-6 w-px bg-slate-700" />
                <input
                  type="color"
                  value={currentSettings?.drawingColor || '#ffffff'}
                  onChange={(e) => activeView && updateViewSetting(activeView, 'drawingColor', e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border border-slate-600"
                  title="Cor"
                  data-testid="input-drawing-color"
                />
              </>
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3">
          {VIEW_TYPES.map((viewType) => {
            const isSelected = selectedViews[viewType];
            const isActive = activeView === viewType;
            
            return (
              <div
                key={viewType}
                className={`relative rounded-lg overflow-hidden transition-all ${
                  isActive 
                    ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-950' 
                    : 'border border-slate-700 hover:border-slate-500'
                }`}
                onClick={() => setActiveView(viewType)}
                data-testid={`card-${viewType}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleViewSelection(viewType);
                  }}
                  className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 text-white shadow-lg' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-600'
                  }`}
                  data-testid={`checkbox-${viewType}`}
                >
                  {isSelected && <Check className="w-5 h-5" />}
                </button>

                <div className="absolute top-3 right-3 z-20 bg-black/70 px-2 py-1 rounded text-xs font-medium">
                  {VIEW_LABELS[viewType]}
                </div>

                <div className="h-full w-full bg-white">
                  <Canvas2D
                    viewType={viewType}
                    zoomLevel={1}
                    editMode={isActive}
                    drawingTool={isActive ? viewSettings[viewType].drawingTool : 'select'}
                    drawingColor={viewSettings[viewType].drawingColor}
                    drawingSize={viewSettings[viewType].drawingSize}
                    drawingData={viewSettings[viewType].drawingData}
                    onDrawingChange={(data) => updateViewSetting(viewType, 'drawingData', data)}
                    onCanvasRef={setCanvasRef(viewType)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleSendToReport}
            disabled={selectedCount === 0}
            className={`h-14 px-8 text-lg font-semibold transition-all ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            data-testid="button-send-to-report"
          >
            <Send className="w-5 h-5 mr-3" />
            Enviar {selectedCount > 0 ? `${selectedCount} ` : ''}Selecionada{selectedCount !== 1 ? 's' : ''} ao Relatório
          </Button>
        </div>
      </main>
    </div>
  );
}
