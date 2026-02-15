import { useLocation } from "wouter";
import AppSidebar from "@/components/AppSidebar";
import Canvas2D from "@/components/Canvas2D";
import { ViewType } from "@shared/3d/projections";
import { Button } from "@/components/ui/button";
import { useReportStore } from "@/lib/reportStore";
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
  Check,
  Camera,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";
import { DrawingTool, Canvas2DHandle } from "@/components/Canvas2D";

const VIEW_TYPES: ViewType[] = [
  "sagittal-avf",
  "sagittal-rvf",
  "coronal",
  "posterior",
];

const VIEW_LABELS: Record<ViewType, string> = {
  "sagittal-avf": "Sagittal (AVF)",
  "sagittal-rvf": "Sagittal (RVF)",
  coronal: "Coronal",
  posterior: "Posterior",
};

interface ViewSettings {
  drawingTool: DrawingTool;
  drawingColor: string;
  drawingSize: number;
  drawingData: string;
  fillTexture: "none" | "solid" | "pattern";
}

const createDefaultViewSettings = (): ViewSettings => ({
  drawingTool: "pen",
  drawingColor: "#ff0000",
  drawingSize: 3,
  drawingData: "",
  fillTexture: "none",
});

export default function Vistas2D() {
  const [, setLocation] = useLocation();
  const [viewSettings, setViewSettings] = useState<
    Record<ViewType, ViewSettings>
  >(() => ({
    "sagittal-avf": createDefaultViewSettings(),
    "sagittal-rvf": createDefaultViewSettings(),
    coronal: createDefaultViewSettings(),
    posterior: createDefaultViewSettings(),
  }));
  const [activeView, setActiveView] = useState<ViewType | null>(null);
  const [historyState, setHistoryState] = useState<Record<ViewType, { canUndo: boolean; canRedo: boolean }>>({
    "sagittal-avf": { canUndo: false, canRedo: false },
    "sagittal-rvf": { canUndo: false, canRedo: false },
    coronal: { canUndo: false, canRedo: false },
    posterior: { canUndo: false, canRedo: false },
  });
  const canvasHandleRefs = useRef<Record<ViewType, Canvas2DHandle | null>>({
    "sagittal-avf": null,
    "sagittal-rvf": null,
    coronal: null,
    posterior: null,
  });
  const { selectedViews, toggleViewSelection, addPdfImage, clearPdfImages } =
    useReportStore();
  const canvasRefs = useRef<Record<ViewType, { main: HTMLCanvasElement | null; drawing: HTMLCanvasElement | null }>>({
    "sagittal-avf": { main: null, drawing: null },
    "sagittal-rvf": { main: null, drawing: null },
    coronal: { main: null, drawing: null },
    posterior: { main: null, drawing: null },
  });

  const setCanvasRef = useCallback(
    (viewType: ViewType) => (canvas: HTMLCanvasElement | null, drawingCanvas: HTMLCanvasElement | null) => {
      canvasRefs.current[viewType] = { main: canvas, drawing: drawingCanvas };
    },
    [],
  );

  const updateViewSetting = <K extends keyof ViewSettings>(
    view: ViewType,
    key: K,
    value: ViewSettings[K],
  ) => {
    setViewSettings((prev) => ({
      ...prev,
      [view]: { ...prev[view], [key]: value },
    }));
  };

  const currentSettings = activeView ? viewSettings[activeView] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeView) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        canvasHandleRefs.current[activeView]?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        canvasHandleRefs.current[activeView]?.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  const selectedCount = Object.values(selectedViews).filter(Boolean).length;

  const captureViewImage = (viewType: ViewType): string | null => {
    const refs = canvasRefs.current[viewType];
    if (!refs.main) return null;

    const scale = 2;
    const mainCanvas = refs.main;
    const drawingCanvas = refs.drawing;

    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = mainCanvas.width * scale;
    mergedCanvas.height = mainCanvas.height * scale;

    const ctx = mergedCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.scale(scale, scale);
    
    ctx.drawImage(mainCanvas, 0, 0);
    
    if (drawingCanvas) {
      ctx.drawImage(drawingCanvas, 0, 0);
    }

    return mergedCanvas.toDataURL("image/png");
  };

  const handleCaptureSingleView = (viewType: ViewType) => {
    const imgData = captureViewImage(viewType);
    if (imgData) {
      addPdfImage({
        data: imgData,
        label: VIEW_LABELS[viewType],
        viewType: viewType,
        observation: "",
      });
      toast.success(`${VIEW_LABELS[viewType]} capturada e adicionada ao relatório`);
    }
  };

  const handleSendToReport = () => {
    VIEW_TYPES.forEach((viewType) => {
      if (selectedViews[viewType]) {
        const imgData = captureViewImage(viewType);
        if (imgData) {
          addPdfImage({
            data: imgData,
            label: VIEW_LABELS[viewType],
            viewType: viewType,
            observation: "",
          });
        }
      }
    });

    setLocation("/preview-report");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col transition-colors">
      <AppSidebar />

      <main className="flex-1 ml-16 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/3d")}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              data-testid="button-back-3d"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao 3D
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-pink-500" />
                Editor 2D
              </h1>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                Clique em uma figura para editar, marque as que deseja enviar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-transparent shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "select")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "select" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Selecionar"
              data-testid="button-tool-select"
            >
              <Pointer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "pen")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "pen" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Desenhar"
              data-testid="button-tool-pen"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "eraser")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "eraser" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Borracha"
              data-testid="button-tool-eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "line")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "line" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Linha"
              data-testid="button-tool-line"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "circle")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "circle" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Círculo"
              data-testid="button-tool-circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "circle-filled")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "circle-filled" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Círculo Preenchido"
              data-testid="button-tool-circle-filled"
            >
              <Circle className="w-4 h-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "text")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "text" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Texto"
              data-testid="button-tool-text"
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                activeView &&
                updateViewSetting(activeView, "drawingTool", "ruler")
              }
              disabled={!activeView}
              className={`h-8 w-8 ${currentSettings?.drawingTool === "ruler" ? "bg-slate-700" : ""} ${!activeView ? "opacity-50" : ""}`}
              title="Régua"
              data-testid="button-tool-ruler"
            >
              <Ruler className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => activeView && canvasHandleRefs.current[activeView]?.undo()}
                disabled={!activeView || !historyState[activeView!]?.canUndo}
                className="h-8 w-8"
                title="Desfazer (Ctrl+Z)"
                data-testid="button-undo"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => activeView && canvasHandleRefs.current[activeView]?.redo()}
                disabled={!activeView || !historyState[activeView!]?.canRedo}
                className="h-8 w-8"
                title="Refazer (Ctrl+Y)"
                data-testid="button-redo"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            {activeView && currentSettings?.drawingTool !== "select" && (
              <div className="flex items-center gap-3 ml-2 border-l border-slate-700 pl-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Cor</span>
                  <input
                    type="color"
                    value={currentSettings?.drawingColor || "#ff0000"}
                    onChange={(e) =>
                      activeView &&
                      updateViewSetting(
                        activeView,
                        "drawingColor",
                        e.target.value,
                      )
                    }
                    className="w-8 h-8 cursor-pointer rounded bg-transparent border-none"
                    title="Cor"
                    data-testid="input-drawing-color"
                  />
                </div>

                <div className="flex flex-col gap-1 w-24">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Tamanho: {currentSettings?.drawingSize}px</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={currentSettings?.drawingSize || 3}
                    onChange={(e) =>
                      activeView &&
                      updateViewSetting(
                        activeView,
                        "drawingSize",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full accent-pink-500"
                    title="Espessura"
                    data-testid="input-drawing-size"
                  />
                </div>

                {["circle", "circle-filled"].includes(currentSettings?.drawingTool || "") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Preenchimento</span>
                    <select
                      value={currentSettings?.fillTexture || "none"}
                      onChange={(e) =>
                        activeView &&
                        updateViewSetting(
                          activeView,
                          "fillTexture",
                          e.target.value as any,
                        )
                      }
                      className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white"
                      data-testid="select-fill-texture"
                    >
                      <option value="none">Nenhum</option>
                      <option value="solid">Sólido</option>
                      <option value="pattern">Hachura</option>
                    </select>
                  </div>
                )}
              </div>
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
                    ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-slate-950"
                    : "border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                }`}
                onClick={() => setActiveView(viewType)}
                data-testid={`card-${viewType}`}
              >
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleViewSelection(viewType);
                    }}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-lg"
                        : "bg-white/90 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600"
                    }`}
                    data-testid={`checkbox-${viewType}`}
                  >
                    {isSelected && <Check className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCaptureSingleView(viewType);
                    }}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
                    title="Capturar e adicionar ao relatório"
                    data-testid={`button-capture-${viewType}`}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute top-3 right-3 z-20 bg-gray-900/80 dark:bg-black/70 px-2 py-1 rounded text-xs font-medium text-white">
                  {VIEW_LABELS[viewType]}
                </div>

                <div className="h-full w-full bg-white">
                  <Canvas2D
                    ref={(handle) => { canvasHandleRefs.current[viewType] = handle; }}
                    viewType={viewType}
                    zoomLevel={1}
                    editMode={isActive}
                    drawingTool={
                      isActive ? viewSettings[viewType].drawingTool : "select"
                    }
                    drawingColor={viewSettings[viewType].drawingColor}
                    drawingSize={viewSettings[viewType].drawingSize}
                    drawingData={viewSettings[viewType].drawingData}
                    onDrawingChange={(data) =>
                      updateViewSetting(viewType, "drawingData", data)
                    }
                    fillTexture={isActive ? viewSettings[viewType].fillTexture : "none"}
                    onCanvasRef={setCanvasRef(viewType)}
                    onHistoryChange={(canUndo, canRedo) => {
                      setHistoryState(prev => ({
                        ...prev,
                        [viewType]: { canUndo, canRedo },
                      }));
                    }}
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
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 text-white"
                : "bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed"
            }`}
            data-testid="button-send-to-report"
          >
            <Send className="w-5 h-5 mr-3" />
            Enviar {selectedCount > 0 ? `${selectedCount} ` : ""}Selecionada
            {selectedCount !== 1 ? "s" : ""} ao Relatório
          </Button>
        </div>
      </main>
    </div>
  );
}
