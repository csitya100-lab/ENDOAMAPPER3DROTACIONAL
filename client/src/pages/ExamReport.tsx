import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDown, Printer, FileText, Mic, MicOff, SpellCheck } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

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
  relatedLesions: string[];
}

interface Lesion {
  id: string;
  name: string;
  location: string;
  depth: string;
  color: string;
}

interface PatientData {
  name: string;
  id: string;
  examiner: string;
  date: string;
}

const VIEWS: View[] = [
  { id: '1', name: '3D Perspective', enabled: false },
  { id: '2', name: 'Sagittal (Side)', enabled: false },
  { id: '3', name: 'Coronal (Front)', enabled: false },
  { id: '4', name: 'Posterior', enabled: false },
];

const MOCK_LESIONS: Lesion[] = [
  { id: 'A', name: 'Lesão A', location: 'Ovário D', depth: 'Profunda', color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'B', name: 'Lesão B', location: 'Miométrio anterior', depth: 'Moderada', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'C', name: 'Lesão C', location: 'Septo uterino', depth: 'Superficial', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'D', name: 'Lesão D', location: 'Ovário E', depth: 'Profunda', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

const DEFAULT_CARDS: CardData[] = [
  { 
    id: '1', 
    viewName: '3D Perspective', 
    title: 'Visão 3D Geral',
    description: 'Perspectiva tridimensional mostrando a distribuição geral das lesões. Permite visualizar a profundidade de penetração e a extensão lateral das lesões.',
    relatedLesions: ['A', 'B', 'C', 'D']
  },
  { 
    id: '2', 
    viewName: 'Sagittal (Side)', 
    title: 'Vista Sagital',
    description: 'Vista lateral mostrando lesões no plano anteroposterior. Útil para avaliar envolvimento da zona de junção e profundidade miometrial.',
    relatedLesions: ['A', 'B', 'C']
  },
  { 
    id: '3', 
    viewName: 'Coronal (Front)', 
    title: 'Vista Coronal',
    description: 'Vista frontal exibindo simetria esquerda-direita e extensão transversal das lesões. Crítica para avaliar acometimento de ambos os cornos.',
    relatedLesions: ['A', 'B', 'D']
  },
  { 
    id: '4', 
    viewName: 'Posterior', 
    title: 'Vista Posterior',
    description: 'Análise da superfície posterior. Importante para identificar lesões posteriores e possível envolvimento da flexura retossigmoideia.',
    relatedLesions: ['C', 'D']
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
  const [patientData, setPatientData] = useState<PatientData>({
    name: 'Paciente A - ID: 12345',
    id: 'MRN: 2024-001',
    examiner: 'Dr. Silva',
    date: new Date().toLocaleDateString('pt-BR'),
  });
  const [exportedViews, setExportedViews] = useState<Array<{ viewType: string; viewLabel: string; imageData: string }>>([]);

  // Mapeamento de viewLabel para viewName dos cards
  const labelToViewNameMap: Record<string, string> = {
    'Sagittal (AVF)': 'Sagittal (Side)',
    'Sagittal (RVF)': 'Sagittal (Side)',
    'Coronal': 'Coronal (Front)',
    'Posterior': 'Posterior'
  };

  useEffect(() => {
    const stored = localStorage.getItem('exportedViews');
    if (stored) {
      const data = JSON.parse(stored);
      const viewsArray = Array.isArray(data) ? data : [];
      setExportedViews(viewsArray);

      // Auto-habilitar as vistas correspondentes
      if (viewsArray.length > 0) {
        const newViews = views.map(v => {
          const shouldEnable = viewsArray.some(view => labelToViewNameMap[view.viewLabel] === v.name);
          return shouldEnable ? { ...v, enabled: true } : v;
        });
        setViews(newViews);
      }
    }
  }, []);

  const toggleView = (viewId: string) => {
    setViews(views.map(v => v.id === viewId ? { ...v, enabled: !v.enabled } : v));
  };

  const updateCard = (cardId: string, field: 'title' | 'description', value: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };

  const updatePatientData = (field: keyof PatientData, value: string) => {
    setPatientData({ ...patientData, [field]: value });
  };

  const [activeRecording, setActiveRecording] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const enabledViews = views.filter(v => v.enabled);
  const visibleCards = cards.filter(card => enabledViews.some(v => v.name === card.viewName));

  const layoutConfig = LAYOUT_CONFIGS[layout];
  const cardsToShow = visibleCards.slice(0, layoutConfig.count);

  const startDictation = useCallback((cardId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      const card = cards.find(c => c.id === cardId);
      if (card && event.results[event.results.length - 1].isFinal) {
        const newDescription = card.description + (card.description ? ' ' : '') + transcript;
        updateCard(cardId, 'description', newDescription);
      }
    };

    recognition.onerror = () => {
      setActiveRecording(null);
    };

    recognition.onend = () => {
      setActiveRecording(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setActiveRecording(cardId);
  }, [cards]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setActiveRecording(null);
  }, []);

  const correctSpelling = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || !card.description.trim()) return;

    const text = card.description;
    
    const corrections: Record<string, string> = {
      'tanbem': 'também',
      'nao': 'não',
      'é': 'é',
      'lesao': 'lesão',
      'utero': 'útero',
      'ovario': 'ovário',
      'miometrio': 'miométrio',
      'endometrio': 'endométrio',
      'adenomiose': 'adenomiose',
      'endometriose': 'endometriose',
      'q ': 'que ',
      'pq ': 'porque ',
      'tb ': 'também ',
      'vc ': 'você ',
      'oq ': 'o que ',
      ' q ': ' que ',
      '  ': ' ',
    };

    let corrected = text;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, right);
    });

    corrected = corrected.replace(/\s+/g, ' ').trim();
    
    corrected = corrected.replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    if (corrected !== text) {
      updateCard(cardId, 'description', corrected);
    }
  }, [cards]);

  const headerActions = (
    <>
      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
        {(['1x1', '2x2', '3x2', 'Auto'] as LayoutType[]).map(layoutOption => (
          <button
            key={layoutOption}
            onClick={() => setLayout(layoutOption)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
              layout === layoutOption
                ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-rose-700 border border-rose-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {layoutOption}
          </button>
        ))}
      </div>
      <Button
        size="sm"
        onClick={() => window.location.href = '/ditado-ia'}
        className="h-9 gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
        variant="outline"
      >
        <FileText className="w-4 h-4" />
        Ditado IA
      </Button>
      <Button
        size="sm"
        className="h-9 gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
        variant="outline"
      >
        <FileText className="w-4 h-4" />
        Gerar Relatório
      </Button>
      <Button
        size="sm"
        className="h-9 gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
        variant="outline"
      >
        <FileDown className="w-4 h-4" />
        Exportar PDF
      </Button>
      <Button
        size="sm"
        className="h-9 gap-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
        variant="outline"
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </Button>
    </>
  );

  return (
    <AppLayout 
      title="Relatório do Exame" 
      subtitle="Mapeamento 3D/2D de Endometriose"
      headerActions={headerActions}
    >
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        <aside className="w-64 bg-white border border-slate-200 rounded-lg shadow-sm p-4 overflow-y-auto flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-wide">VISTAS DISPONÍVEIS</h2>
            
            <div className="space-y-2">
              {views.map(view => (
                <div 
                  key={view.id} 
                  className="flex items-center gap-3 p-2.5 rounded hover:bg-slate-100 transition-colors cursor-pointer group"
                  onClick={() => toggleView(view.id)}
                >
                  <Checkbox
                    checked={view.enabled}
                    onCheckedChange={() => toggleView(view.id)}
                    className="cursor-pointer"
                    data-testid={`checkbox-view-${view.id}`}
                  />
                  <label className="text-sm text-slate-700 cursor-pointer flex-1 font-medium">
                    {view.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-500 font-mono">
              {enabledViews.length} vista{enabledViews.length !== 1 ? 's' : ''} selecionada{enabledViews.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-3 tracking-wide">LESÕES ENCONTRADAS</h3>
            <div className="space-y-2">
              {MOCK_LESIONS.map(lesion => (
                <div key={lesion.id} className={`text-xs p-2 rounded border ${lesion.color}`}>
                  <div className="font-bold">{lesion.name}</div>
                  <div className="text-[10px] opacity-80">{lesion.location}</div>
                  <div className="text-[10px] opacity-80">{lesion.depth}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto flex items-start justify-center bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg">
          <div
            className="bg-white shadow-2xl mt-4 mb-4"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div className="mb-6 pb-4 border-b-2 border-slate-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Paciente:</label>
                <input
                  type="text"
                  value={patientData.name}
                  onChange={(e) => updatePatientData('name', e.target.value)}
                  className="text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Data:</label>
                <input
                  type="text"
                  value={patientData.date}
                  onChange={(e) => updatePatientData('date', e.target.value)}
                  className="text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>


            <div className="mb-6 pb-4 border-b-2 border-slate-300">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Relatório de Endometriose</h1>
              <p className="text-sm text-slate-600 font-sans">
                Mapeamento 3D/2D | {enabledViews.length} vista{enabledViews.length !== 1 ? 's' : ''} | {MOCK_LESIONS.filter(l => visibleCards.some(c => c.relatedLesions.includes(l.id))).length} lesão{MOCK_LESIONS.filter(l => visibleCards.some(c => c.relatedLesions.includes(l.id))).length !== 1 ? 's' : ''} mapeada{MOCK_LESIONS.filter(l => visibleCards.some(c => c.relatedLesions.includes(l.id))).length !== 1 ? 's' : ''}
              </p>
            </div>

            {cardsToShow.length > 0 ? (
              <div className={`grid ${layoutConfig.grid} gap-5`}>
                {cardsToShow.map((card) => {
                  return (
                    <div
                      key={card.id}
                      className="border-2 border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white hover:shadow-lg transition-shadow"
                    >
                      {(() => {
                        const exportedView = exportedViews.find(v => labelToViewNameMap[v.viewLabel] === card.viewName);
                        return (
                          <div className="h-40 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 flex items-center justify-center border-b-2 border-slate-300 relative overflow-hidden">
                            {exportedView ? (
                              <img src={exportedView.imageData} alt={card.viewName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-slate-500 text-xs font-mono text-center px-4">
                                <div className="mb-1">📐 {card.viewName}</div>
                                <div className="text-[10px] text-slate-400">[Espaço para imagem]</div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <button
                                onClick={() => activeRecording === card.id ? stopDictation() : startDictation(card.id)}
                                className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                                  activeRecording === card.id 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                                title={activeRecording === card.id ? 'Parar ditado' : 'Iniciar ditado por voz'}
                                data-testid={`button-dictation-${card.id}`}
                              >
                                {activeRecording === card.id ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => correctSpelling(card.id)}
                                className="p-1.5 rounded flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Corrigir ortografia e gramática"
                                data-testid={`button-spellcheck-${card.id}`}
                              >
                                <SpellCheck className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex-1 flex flex-col p-3">
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                          className="text-sm font-bold text-slate-900 mb-2 bg-white border-b-2 border-slate-200 focus:border-blue-400 outline-none px-1 py-0.5"
                          data-testid={`input-card-title-${card.id}`}
                        />

                        <textarea
                          value={card.description}
                          onChange={(e) => updateCard(card.id, 'description', e.target.value)}
                          className="text-xs text-slate-700 leading-tight bg-white border border-slate-200 rounded p-2 flex-1 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                          placeholder="Digite ou dite a descrição..."
                          spellCheck={true}
                          data-testid={`textarea-card-description-${card.id}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-500 text-sm">Selecione vistas para visualizar o relatório</p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center">
              <p className="text-[9px] text-slate-500 font-mono">
                Uterus3D Medical Visualization System | Endometriosis Mapping
              </p>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
