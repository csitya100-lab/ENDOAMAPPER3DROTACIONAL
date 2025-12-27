import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, FileDown, Printer, FileText } from 'lucide-react';

type LayoutType = '1x1' | '2x2' | '3x2' | 'Auto';

interface View {
  id: string;
  name: string;
  enabled: boolean;
}

interface CardData {
  id: string;
  viewName: string;
  title: string;
  description: string;
}

const VIEWS: View[] = [
  { id: '1', name: '3D Perspective', enabled: true },
  { id: '2', name: 'Sagittal (Side)', enabled: true },
  { id: '3', name: 'Coronal (Front)', enabled: true },
  { id: '4', name: 'Posterior', enabled: true },
];

const DEFAULT_CARDS: CardData[] = [
  { 
    id: '1', 
    viewName: '3D Perspective', 
    title: 'Visão 3D Geral',
    description: 'Perspectiva tridimensional mostrando a distribuição geral das lesões. Permite visualizar a profundidade de penetração e a extensão lateral das lesões.' 
  },
  { 
    id: '2', 
    viewName: 'Sagittal (Side)', 
    title: 'Vista Sagital',
    description: 'Vista lateral mostrando lesões no plano anteroposterior. Útil para avaliar envolvimento da zona de junção e profundidade miometrial.' 
  },
  { 
    id: '3', 
    viewName: 'Coronal (Front)', 
    title: 'Vista Coronal',
    description: 'Vista frontal exibindo simetria esquerda-direita e extensão transversal das lesões. Crítica para avaliar acometimento de ambos os cornos.' 
  },
  { 
    id: '4', 
    viewName: 'Posterior', 
    title: 'Vista Posterior',
    description: 'Análise da superfície posterior. Importante para identificar lesões posteriores e possível envolvimento da flexura retossigmoideia.' 
  },
];

const LAYOUT_CONFIGS: Record<LayoutType, { grid: string; count: number }> = {
  '1x1': { grid: 'grid-cols-1', count: 1 },
  '2x2': { grid: 'grid-cols-2', count: 4 },
  '3x2': { grid: 'grid-cols-3', count: 6 },
  'Auto': { grid: 'grid-cols-2', count: 4 },
};

export default function ExamReport() {
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [views, setViews] = useState(VIEWS);
  const [cards, setCards] = useState(DEFAULT_CARDS);

  const toggleView = (viewId: string) => {
    setViews(views.map(v => v.id === viewId ? { ...v, enabled: !v.enabled } : v));
  };

  const toggleAllViews = () => {
    const allEnabled = views.every(v => v.enabled);
    setViews(views.map(v => ({ ...v, enabled: !allEnabled })));
  };

  const updateCard = (cardId: string, field: 'title' | 'description', value: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };

  const enabledViews = views.filter(v => v.enabled);
  const visibleCards = cards.filter(card => enabledViews.some(v => v.name === card.viewName));

  const layoutConfig = LAYOUT_CONFIGS[layout];
  const cardsToShow = visibleCards.slice(0, layoutConfig.count);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/'}
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Relatório do Exame</h1>
            <p className="text-xs text-white/50 mt-0.5">Mapeamento 3D/2D de Endometriose</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout Controls */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            {(['1x1', '2x2', '3x2', 'Auto'] as LayoutType[]).map(layoutOption => (
              <button
                key={layoutOption}
                onClick={() => setLayout(layoutOption)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
                  layout === layoutOption
                    ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {layoutOption}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <Button
              size="sm"
              className="h-9 gap-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
            >
              <FileText className="w-4 h-4" />
              Gerar Relatório
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2 bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Sidebar - Vistas Disponíveis */}
        <aside className="w-64 bg-white/5 border border-white/10 rounded-lg p-4 overflow-y-auto flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white mb-4 tracking-wide">VISTAS DISPONÍVEIS</h2>
            
            <div className="space-y-2">
              {views.map(view => (
                <div 
                  key={view.id} 
                  className="flex items-center gap-3 p-2.5 rounded hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <Checkbox
                    checked={view.enabled}
                    onChange={() => toggleView(view.id)}
                    className="cursor-pointer"
                    data-testid={`checkbox-view-${view.id}`}
                  />
                  <label className="text-sm text-white/80 cursor-pointer flex-1 font-medium">
                    {view.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 mt-3">
            <Button
              size="sm"
              onClick={toggleAllViews}
              className="w-full text-xs h-8 bg-white/10 text-white/80 hover:bg-white/20 border border-white/20"
            >
              {views.every(v => v.enabled) ? 'Desselecionar Todas' : 'Selecionar Todas'}
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/50 font-mono">
              {enabledViews.length} vista{enabledViews.length !== 1 ? 's' : ''} selecionada{enabledViews.length !== 1 ? 's' : ''}
            </p>
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 overflow-auto flex items-start justify-center bg-gradient-to-b from-slate-900/30 to-slate-900/10 rounded-lg">
          <div
            className="bg-white shadow-2xl mt-4 mb-4"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}
          >
            {/* Report Header */}
            <div className="mb-6 pb-4 border-b-2 border-slate-300">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Exame de Endometriose</h1>
              <p className="text-sm text-slate-600 font-sans">
                Data: {new Date().toLocaleDateString('pt-BR')} | Vistas: {enabledViews.length}
              </p>
            </div>

            {/* Cards Grid */}
            {cardsToShow.length > 0 ? (
              <div className={`grid ${layoutConfig.grid} gap-5`}>
                {cardsToShow.map((card) => (
                  <div
                    key={card.id}
                    className="border-2 border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white"
                  >
                    {/* Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 flex items-center justify-center border-b-2 border-slate-300">
                      <div className="text-slate-500 text-xs font-mono text-center px-4">
                        <div className="mb-1">📐 {card.viewName}</div>
                        <div className="text-[10px] text-slate-400">[Espaço para imagem]</div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col p-3">
                      {/* Title Field */}
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                        className="text-sm font-bold text-slate-900 mb-2 bg-white border-b-2 border-slate-200 focus:border-blue-400 outline-none px-1 py-0.5"
                      />

                      {/* Description Field */}
                      <textarea
                        value={card.description}
                        onChange={(e) => updateCard(card.id, 'description', e.target.value)}
                        className="text-xs text-slate-700 leading-tight bg-white border border-slate-200 rounded p-2 flex-1 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                        placeholder="Descreva os achados e lesões vistos nesta vista..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-500 text-sm">Selecione vistas para visualizar o relatório</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center">
              <p className="text-[9px] text-slate-500 font-mono">
                Uterus3D Medical Visualization System | Endometriosis Mapping
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
