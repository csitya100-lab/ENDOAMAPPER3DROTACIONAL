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
  ArrowLeft
} from 'lucide-react';
import { useState } from 'react';

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string }> = {
  superficial: { label: 'Superficial', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  moderate: { label: 'Moderada', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  deep: { label: 'Profunda', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
};

const VIEW_TYPES: ViewType[] = ['sagittal', 'coronal', 'posterior'];

export default function Vistas2D() {
  const [, setLocation] = useLocation();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [editMode, setEditMode] = useState(true);
  const [currentSeverity, setCurrentSeverity] = useState<Severity>('moderate');

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
          <div className="flex items-center gap-4">
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
          <div className="col-span-9">
            <div className="grid grid-cols-3 gap-4 h-full">
              {VIEW_TYPES.map((viewType) => (
                <div key={viewType} className="h-full">
                  <Canvas2D
                    viewType={viewType}
                    lesions={lesions}
                    selectedLesionId={selectedLesionId}
                    zoomLevel={zoomLevel}
                    editMode={editMode}
                    onLesionSelect={handleLesionSelect}
                    onLesionMove={handleLesionMove}
                    onLesionCreate={handleLesionCreate}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <Card className="h-full bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-pink-500" />
                    Lesões
                    <Badge variant="secondary" className="ml-2" data-testid="badge-lesion-count">
                      {lesions.length}
                    </Badge>
                  </CardTitle>
                  {lesions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-testid="button-clear-all"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100%-60px)]">
                  {lesions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm">
                        Nenhuma lesão mapeada
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Clique nas vistas para adicionar
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 space-y-2">
                      {lesions.map((lesion, index) => {
                        const config = SEVERITY_CONFIG[lesion.severity];
                        const isSelected = lesion.id === selectedLesionId;
                        
                        return (
                          <div
                            key={lesion.id}
                            onClick={() => handleLesionSelect(lesion.id)}
                            className={`
                              p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected 
                                ? 'bg-pink-500/20 border border-pink-500/50' 
                                : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                              }
                            `}
                            data-testid={`lesion-item-${lesion.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${
                                  lesion.severity === 'superficial' ? 'bg-red-500' :
                                  lesion.severity === 'moderate' ? 'bg-orange-500' : 'bg-blue-500'
                                }`} />
                                <span className="font-medium text-sm">
                                  Lesão {index + 1}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLesion(lesion.id);
                                }}
                                data-testid={`button-delete-lesion-${lesion.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="text-xs text-slate-400 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 text-[10px]`}>
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="font-mono text-[10px] text-slate-500">
                                X: {lesion.position.x.toFixed(2)} | 
                                Y: {lesion.position.y.toFixed(2)} | 
                                Z: {lesion.position.z.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedLesion && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div className="p-4 space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-pink-500" />
                          Detalhes da Lesão
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-slate-400">Severidade</Label>
                            <Select 
                              value={selectedLesion.severity} 
                              onValueChange={(v) => handleUpdateLesion(selectedLesion.id, { severity: v as Severity })}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800 border-slate-700" data-testid="select-lesion-severity">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="superficial">Superficial</SelectItem>
                                <SelectItem value="moderate">Moderada</SelectItem>
                                <SelectItem value="deep">Profunda</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-slate-400">Localização</Label>
                            <Select 
                              value={selectedLesion.location || ''} 
                              onValueChange={(v) => handleUpdateLesion(selectedLesion.id, { location: v })}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800 border-slate-700" data-testid="select-lesion-location">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="utero-anterior">Útero Anterior</SelectItem>
                                <SelectItem value="utero-posterior">Útero Posterior</SelectItem>
                                <SelectItem value="ovario-direito">Ovário Direito</SelectItem>
                                <SelectItem value="ovario-esquerdo">Ovário Esquerdo</SelectItem>
                                <SelectItem value="ligamento-largo">Ligamento Largo</SelectItem>
                                <SelectItem value="septo-retovaginal">Septo Retovaginal</SelectItem>
                                <SelectItem value="bexiga">Bexiga</SelectItem>
                                <SelectItem value="reto">Reto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-slate-400">Observações</Label>
                            <Textarea
                              value={selectedLesion.observacoes || ''}
                              onChange={(e) => handleUpdateLesion(selectedLesion.id, { observacoes: e.target.value })}
                              placeholder="Adicione observações..."
                              className="mt-1 bg-slate-800 border-slate-700 text-sm resize-none"
                              rows={3}
                              data-testid="textarea-lesion-notes"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
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
