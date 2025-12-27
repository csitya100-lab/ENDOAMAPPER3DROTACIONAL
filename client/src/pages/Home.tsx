import { useRef, useState } from 'react';
import { Uterus3D, Uterus3DRef } from '@/components/Uterus3D';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, RotateCcw, Plus, Info, ChevronRight, FileText, LayoutDashboard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Severity = 'superficial' | 'moderate' | 'deep';

interface Lesion {
  id: string;
  position: { x: number; y: number; z: number };
  severity: Severity;
}

export default function Home() {
  const [severity, setSeverity] = useState<Severity>('superficial');
  const [lesionCount, setLesionCount] = useState(0);
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const uterusRef = useRef<Uterus3DRef>(null);

  const handleAddTestLesion = () => {
    uterusRef.current?.addTestLesion();
  };

  const handleClearLesions = () => {
    uterusRef.current?.clearLesions();
  };

  const getLesionCount = (sev: Severity) => lesions.filter(l => l.severity === sev).length;
  const lastLesion = lesions[lesions.length - 1];

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header / Toolbar */}
      <header className="flex-none h-16 border-b border-slate-200 bg-white shadow-sm px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
               <span className="text-white font-bold text-sm">3D</span>
             </div>
             <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
               Uterus<span className="text-rose-600">Mapper</span>
             </h1>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Severity Controls */}
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
              onClick={() => setSeverity('moderate')}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                ${severity === 'moderate' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${severity === 'moderate' ? 'bg-orange-500' : 'bg-slate-400'}`} />
              Moderate
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
              Deep
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono hidden sm:flex bg-slate-100 border-slate-200 text-slate-700">
            {lesionCount} lesão{lesionCount !== 1 ? 's' : ''}
          </Badge>
          
          <Button 
            size="sm" 
            onClick={handleAddTestLesion}
            className="text-xs h-9 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
            variant="outline"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Adicionar Lesão
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

          <Button
            size="sm"
            onClick={() => window.location.href = '/report'}
            className="text-xs h-9 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
            variant="outline"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Relatório
          </Button>

          <Button
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
            className="text-xs h-9 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewport */}
        <main className="flex-1 relative">
          <Uterus3D 
            ref={uterusRef}
            severity={severity}
            onLesionCountChange={setLesionCount}
            onLesionsUpdate={setLesions}
          />
        </main>

        {/* Lesion Details Panel */}
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <span className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                  <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                  Moderada
                </span>
                <span className="text-sm font-bold text-orange-600">{getLesionCount('moderate')}</span>
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
                        <Circle 
                          className="w-2.5 h-2.5 fill-current flex-shrink-0" 
                          color={lesion.severity === 'superficial' ? '#ef4444' : lesion.severity === 'moderate' ? '#f97316' : '#3b82f6'}
                        />
                        <span className="text-[10px] text-slate-600 font-medium capitalize">
                          {lesion.severity === 'superficial' ? 'Superficial' : lesion.severity === 'moderate' ? 'Moderada' : 'Profunda'}
                        </span>
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
  );
}
