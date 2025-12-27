import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, FileDown, Printer } from 'lucide-react';

type LayoutType = '1x1' | '2x2' | '3x2' | '2x3';

interface View {
  id: string;
  name: string;
  enabled: boolean;
}

interface ReportCard {
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

const DEFAULT_CARDS: ReportCard[] = [
  { id: '1', viewName: '3D Perspective', title: '3D Overview', description: 'Overall anatomical distribution. Lesions are visualized in three-dimensional space showing their relative positions and depth penetration.' },
  { id: '2', viewName: 'Sagittal (Side)', title: 'Sagittal View', description: 'Lateral view showing anteroposterior lesion distribution. Helpful for assessing lesion depth and junctional zone involvement.' },
  { id: '3', viewName: 'Coronal (Front)', title: 'Coronal View', description: 'Frontal view displaying left-right symmetry and transverse extent of lesions. Critical for assessing fibroid localization.' },
  { id: '4', viewName: 'Posterior', title: 'Posterior View', description: 'Posterior surface analysis. Important for identifying serosal involvement and parametrial extension.' },
];

const LAYOUT_CONFIGS: Record<LayoutType, { grid: string; cardHeights: string[] }> = {
  '1x1': { grid: 'grid-cols-1', cardHeights: ['h-[600px]'] },
  '2x2': { grid: 'grid-cols-2', cardHeights: ['h-[280px]', 'h-[280px]', 'h-[280px]', 'h-[280px]'] },
  '3x2': { grid: 'grid-cols-3', cardHeights: ['h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]'] },
  '2x3': { grid: 'grid-cols-2', cardHeights: ['h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]', 'h-[250px]'] },
};

export default function ExamReport() {
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [views, setViews] = useState(VIEWS);

  const toggleView = (viewId: string) => {
    setViews(views.map(v => v.id === viewId ? { ...v, enabled: !v.enabled } : v));
  };

  const enabledViews = views.filter(v => v.enabled);
  const visibleCards = DEFAULT_CARDS.filter(card => enabledViews.some(v => v.name === card.viewName));

  const layoutConfig = LAYOUT_CONFIGS[layout];

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex-none h-16 border-b border-white/10 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/'}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold text-white">Exam Report</h1>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
          {(['1x1', '2x2', '3x2', '2x3'] as LayoutType[]).map(layoutOption => (
            <button
              key={layoutOption}
              onClick={() => setLayout(layoutOption)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                layout === layoutOption
                  ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {layoutOption}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export PDF
          </Button>
          <Button
            size="sm"
            className="h-8 gap-2 bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Sidebar */}
        <aside className="w-56 bg-white/5 border border-white/10 rounded-lg p-4 overflow-y-auto flex flex-col">
          <h2 className="text-sm font-bold text-white mb-4 tracking-wide">VIEWS</h2>
          <div className="space-y-3 flex-1">
            {views.map(view => (
              <div key={view.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors cursor-pointer">
                <Checkbox
                  checked={view.enabled}
                  onChange={() => toggleView(view.id)}
                  className="cursor-pointer"
                  data-testid={`checkbox-view-${view.id}`}
                />
                <label className="text-xs text-white/80 cursor-pointer flex-1 font-medium">
                  {view.name}
                </label>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 mt-3">
            <p className="text-[10px] text-white/50 font-mono">
              {enabledViews.length} view{enabledViews.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </aside>

        {/* A4 Preview */}
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div
            className="bg-white shadow-2xl"
            style={{
              width: '210mm',
              height: '297mm',
              padding: '20mm',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Report Header */}
            <div className="mb-6 pb-4 border-b border-gray-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Uterus3D Report</h1>
              <p className="text-xs text-gray-600 font-mono">
                Generated: {new Date().toLocaleDateString()} | Views: {enabledViews.length}
              </p>
            </div>

            {/* Cards Grid */}
            <div className={`grid ${layoutConfig.grid} gap-4`}>
              {visibleCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`${layoutConfig.cardHeights[idx] || 'h-[250px]'} border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-gray-50`}
                >
                  {/* Image Placeholder */}
                  <div className="flex-shrink-0 h-1/2 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-b border-gray-300">
                    <div className="text-gray-500 text-xs font-mono text-center px-2">
                      {card.viewName}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col p-2.5">
                    {/* Title */}
                    <h3 className="text-xs font-bold text-gray-900 mb-1.5">
                      {card.title}
                    </h3>

                    {/* Description Text */}
                    <p className="text-[10px] text-gray-700 line-clamp-4 leading-tight mb-2">
                      {card.description}
                    </p>

                    {/* Bottom text box area */}
                    <div className="flex-1 min-h-[30px] border border-gray-300 rounded bg-white text-[9px] p-1 text-gray-500 flex items-start">
                      <span>Clinical notes...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 text-center">
              <p className="text-[8px] text-gray-500 font-mono">
                Uterus3D Medical Visualization System
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
