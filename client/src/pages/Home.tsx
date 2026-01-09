import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Uterus3D, Uterus3DRef } from '@/components/Uterus3D';
import { useLesionStore, Severity, Lesion } from '@/lib/lesionStore';
import { useReportStore } from '@/lib/reportStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, RotateCcw, Plus, Clock, CheckCircle, AlertCircle, Settings2, FileText, Download, Camera, Share2 } from 'lucide-react';
import { export3DModelAsHtml } from '@/lib/export3DHtml';
import { saveCaseToDb, isSupabaseConfigured } from '@/lib/caseDb';
import AppLayout from '@/components/AppLayout';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ExamInfo {
  patient: string;
  date: string;
  type: string;
}

export default function Home() {
  const [severity, setSeverity] = useState<Severity>('superficial');
  const [markerSize, setMarkerSize] = useState(0.18);
  const [markerColor, setMarkerColor] = useState<string | undefined>(undefined);
  const { lesions } = useLesionStore();
  const [examInfo] = useState<ExamInfo>({
    patient: 'Paciente A',
    date: new Date().toLocaleDateString('pt-BR'),
    type: 'Mapeamento EndoMapper',
  });
  const uterusRef = useRef<Uterus3DRef>(null);
  const [, setLocation] = useLocation();

  const handleClearLesions = () => {
    uterusRef.current?.clearLesions();
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndShare = async () => {
    if (lesions.length === 0) {
      alert('Adicione pelo menos uma lesão antes de salvar.');
      return;
    }
    if (!isSupabaseConfigured()) {
      alert('Supabase não está configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setIsSaving(true);
    try {
      const caseId = await saveCaseToDb({
        patient_name: examInfo.patient,
        exam_date: examInfo.date,
        lesions: lesions,
      });
      const shareUrl = `${window.location.origin}/view/${caseId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert(`Caso salvo! Link copiado:\n${shareUrl}`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o caso. Verifique a configuração do Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportHtml = async () => {
    if (lesions.length === 0) {
      alert('Adicione pelo menos uma lesão antes de exportar.');
      return;
    }
    setIsExporting(true);
    try {
      await export3DModelAsHtml(lesions);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o modelo 3D. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const { draftImages2D, createReport, clearDraftImages2D, addPdfImage, pdfImages } = useReportStore();

  const handleCapture3D = () => {
    const imageData = uterusRef.current?.captureScreenshot();
    if (imageData) {
      addPdfImage({
        data: imageData,
        label: `Modelo 3D - Vista ${pdfImages.filter(img => img.viewType === '3d').length + 1}`,
        viewType: '3d',
        observation: ''
      });
      alert('Imagem 3D adicionada ao relatório!');
    } else {
      alert('Erro ao capturar a imagem. Tente novamente.');
    }
  };

  const handleGenerateReport = () => {
    if (!draftImages2D.sagittal && !draftImages2D.coronal && !draftImages2D.posterior) {
      const proceed = confirm('Nenhuma imagem foi capturada ainda. Use os botões de câmera nas vistas Sagittal, Coronal e Posterior. Deseja continuar mesmo assim?');
      if (!proceed) return;
    }

    const reportId = createReport({
      patientName: examInfo.patient,
      patientId: `PAC-${Date.now().toString(36).toUpperCase()}`,
      examDate: examInfo.date,
      examType: 'Mapeamento EndoMapper',
      images2D: draftImages2D,
      imageNotes: {
        sagittal: "",
        coronal: "",
        posterior: "",
      },
      lesions: lesions.map((l, idx) => ({
        id: l.id,
        name: `Lesão ${String.fromCharCode(65 + idx)}`,
        location: l.location || (l.severity === 'superficial' ? 'Região Superficial' : 'Região Profunda'),
        severity: l.severity,
        position: l.position
      })),
    });

    console.log('Relatório criado com ID:', reportId);
    clearDraftImages2D();
    setLocation(`/relatorio/${reportId}`);
  };

  const getLesionCount = (sev: Severity) => lesions.filter(l => l.severity === sev).length;
  const lastLesion = lesions[lesions.length - 1];
  const lesionCount = lesions.length;

  const getMappingStatus = () => {
    if (lesionCount === 0) return 'Vazio';
    if (lesionCount < 3) return 'Em andamento';
    return 'Completo';
  };

  const getMappingStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return 'bg-blue-500/10 text-blue-600 border-blue-300';
      case 'Completo':
        return 'bg-green-500/10 text-green-600 border-green-300';
      case 'Vazio':
        return 'bg-slate-500/10 text-slate-600 border-slate-300';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-300';
    }
  };

  const getMappingStatusIcon = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return <Clock className="w-3.5 h-3.5" />;
      case 'Completo':
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  const getLesionStatus = (index: number) => {
    return index === lesions.length - 1 ? 'Recém adicionada' : 'Mapeada';
  };

  const getLesionStatusColor = (status: string) => {
    switch (status) {
      case 'Recém adicionada':
        return 'bg-blue-500/10 text-blue-600 border-blue-300';
      case 'Mapeada':
        return 'bg-green-500/10 text-green-600 border-green-300';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-300';
    }
  };

  const getLesionStatusIcon = (status: string) => {
    switch (status) {
      case 'Recém adicionada':
        return <Clock className="w-3 h-3" />;
      case 'Mapeada':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        <header className="flex-none h-16 border-b border-slate-200 bg-white shadow-sm px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                 <span className="text-white font-bold text-sm">3D</span>
               </div>
               <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                 Endo<span className="text-rose-600">Mapper</span>
               </h1>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSeverity('superficial')}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                  ${severity === 'superficial' 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'}
                `}
              >
                <div className={`w-2 h-2 rounded-full ${severity === 'superficial' ? 'bg-red-500' : 'bg-slate-400'}`} />
                Superficial
              </button>
              <button
                onClick={() => setSeverity('deep')}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                  ${severity === 'deep' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'}
                `}
              >
                <div className={`w-2 h-2 rounded-full ${severity === 'deep' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                Profunda
              </button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 bg-slate-100 border-slate-200 text-slate-700">
                  <Settings2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Marcador</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block">Tamanho: {markerSize.toFixed(2)}</label>
                    <Slider
                      value={[markerSize]}
                      onValueChange={([v]) => setMarkerSize(v)}
                      min={0.08}
                      max={0.5}
                      step={0.02}
                      className="w-full"
                      data-testid="slider-marker-size"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block">Cor personalizada</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={markerColor || '#ef4444'}
                        onChange={(e) => setMarkerColor(e.target.value)}
                        className="w-10 h-8 cursor-pointer rounded border border-slate-300"
                        data-testid="input-marker-color"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMarkerColor(undefined)}
                        className="text-xs h-8"
                        data-testid="button-reset-color"
                      >
                        Usar cor padrão
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pr-4 border-r border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{examInfo.patient}</p>
                <p className="text-xs text-slate-600">{examInfo.type}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{examInfo.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono hidden sm:flex bg-slate-100 border-slate-200 text-slate-700">
                {lesionCount} lesão{lesionCount !== 1 ? 's' : ''}
              </Badge>

              <Button 
                size="sm" 
                onClick={handleCapture3D}
                className="text-xs h-9 bg-purple-600 text-white hover:bg-purple-700 border border-purple-500"
                data-testid="button-capture-3d"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Capturar 3D
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleExportHtml}
                disabled={isExporting}
                className="text-xs h-9 bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500"
                data-testid="button-export-3d"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {isExporting ? 'Exportando...' : 'Exportar 3D'}
              </Button>

              <Button 
                size="sm" 
                onClick={handleSaveAndShare}
                disabled={isSaving}
                className="text-xs h-9 bg-cyan-600 text-white hover:bg-cyan-700 border border-cyan-500"
                data-testid="button-save-share"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Salvando...' : 'Salvar & Compartilhar'}
              </Button>

              <Button 
                size="sm" 
                onClick={handleGenerateReport}
                className="text-xs h-9 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-500"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Gerar Relatório
              </Button>

              <Button 
                size="sm" 
                onClick={handleClearLesions}
                className="text-xs h-9 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                variant="outline"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Limpar
              </Button>

            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 relative">
            <Uterus3D 
              ref={uterusRef}
              severity={severity}
              markerSize={markerSize}
              markerColor={markerColor}
              markerType="circle"
              onLesionCountChange={() => {}}
              onLesionsUpdate={() => {}}
            />
          </main>

          <aside className="w-72 border-l border-slate-200 bg-white shadow-sm overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                  RESUMO DE MAPEAMENTO
                </h2>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium ${getMappingStatusColor(getMappingStatus())}`}>
                  {getMappingStatusIcon(getMappingStatus())}
                  {getMappingStatus()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                    <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                    Superficial
                  </span>
                  <span className="text-sm font-bold text-red-600">{getLesionCount('superficial')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                    <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                    Profunda
                  </span>
                  <span className="text-sm font-bold text-blue-600">{getLesionCount('deep')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <span className="text-xs text-slate-600 font-medium">Total de Lesões</span>
                  <span className="text-2xl font-bold text-slate-900 block">{lesionCount}</span>
                </div>
              </div>
            </div>

            {lastLesion && (
              <div className="p-4 border-b border-slate-200 bg-purple-50/50">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide mb-2">
                  ÚLTIMA LESÃO
                </h3>
                <div className="space-y-1.5 text-xs font-mono text-slate-700">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="font-semibold text-slate-900 capitalize">{lastLesion.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>X:</span>
                    <span className="font-semibold text-slate-900">{lastLesion.position.x.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Y:</span>
                    <span className="font-semibold text-slate-900">{lastLesion.position.y.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Z:</span>
                    <span className="font-semibold text-slate-900">{lastLesion.position.z.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}

            {lesions.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide mb-3">
                  TODAS AS LESÕES ({lesions.length})
                </h3>
                <div className="space-y-2">
                  {lesions.map((lesion, idx) => {
                    const lesionStatus = getLesionStatus(idx);
                    return (
                      <div key={lesion.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-slate-700">#{idx + 1}</span>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-medium ${getLesionStatusColor(lesionStatus)}`}>
                            {getLesionStatusIcon(lesionStatus)}
                            {lesionStatus}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Circle className="w-2.5 h-2.5 fill-current flex-shrink-0" style={{ color: lesion.color || (lesion.severity === 'superficial' ? '#ef4444' : '#3b82f6') }} />
                          <span className="text-[10px] text-slate-600 font-medium capitalize">
                            {lesion.severity === 'superficial' ? 'Superficial' : 'Profunda'}
                          </span>
                          {lesion.size && lesion.size !== 0.18 && (
                            <span className="text-[9px] text-slate-400">({lesion.size.toFixed(2)})</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
                          <div className="flex justify-between">
                            <span>X:</span>
                            <span className="font-semibold text-slate-900">{lesion.position.x.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Y:</span>
                            <span className="font-semibold text-slate-900">{lesion.position.y.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Z:</span>
                            <span className="font-semibold text-slate-900">{lesion.position.z.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {lesions.length === 0 && (
              <div className="p-4 text-center">
                <div className="text-slate-500 text-xs space-y-2">
                  <p className="font-medium">Nenhuma lesão adicionada</p>
                  <p className="text-slate-400">Clique em qualquer vista para adicionar uma lesão</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
