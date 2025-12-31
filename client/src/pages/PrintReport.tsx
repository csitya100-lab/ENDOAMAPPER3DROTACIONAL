import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useReportStore } from '@/lib/reportStore';
import { ArrowLeft, Printer } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const VIEW_LABELS: Record<string, string> = {
  'sagittal-avf': 'Sagittal (AVF)',
  'sagittal-rvf': 'Sagittal (RVF)',
  'coronal': 'Coronal',
  'posterior': 'Posterior'
};

const VIEW_ORDER = ['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'] as const;

export default function PrintReport() {
  const [, setLocation] = useLocation();
  const { draftImages2D, draftImageNotes, setDraftImageNote } = useReportStore();

  const handlePrint = () => {
    window.print();
  };

  const availableViews = VIEW_ORDER.filter(key => draftImages2D[key] && draftImages2D[key].length > 0);
  const hasImages = availableViews.length > 0;

  const getGridClass = () => {
    const count = availableViews.length;
    if (count === 1) return 'grid-cols-1 max-w-3xl mx-auto';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2';
    return 'grid-cols-2 grid-rows-2';
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="print:hidden bg-slate-900 text-white p-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/vistas-2d')}
            className="text-slate-400 hover:text-white"
            data-testid="button-back-2d"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Editor
          </Button>
          <div className="h-5 w-px bg-slate-700" />
          <h1 className="text-lg font-bold">Relatório para Impressão</h1>
        </div>

        <Button
          onClick={handlePrint}
          className="bg-pink-600 hover:bg-pink-700"
          data-testid="button-print"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="p-4 print:p-2">
        <div className="text-center mb-4 print:mb-2">
          <h1 className="text-xl font-bold text-gray-900">EndoMapper - Mapeamento de Lesões</h1>
          <p className="text-gray-500 text-xs">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {!hasImages ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow">
            <p className="text-xl mb-2">Nenhuma imagem disponível</p>
            <p className="text-sm">Volte ao editor 2D, selecione as vistas e faça suas anotações.</p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-3 print:gap-2`} style={{ minHeight: 'calc(100vh - 180px)' }}>
            {availableViews.map((viewKey) => {
              const imageData = draftImages2D[viewKey];

              return (
                <div
                  key={viewKey}
                  className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden print:shadow-none print:border print:border-gray-300"
                  data-testid={`report-view-container-${viewKey}`}
                >
                  <div className="bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-2 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      {VIEW_LABELS[viewKey]}
                    </h3>
                    <span className="text-pink-200 text-xs">Vista Anatômica</span>
                  </div>
                  
                  <div 
                    className="flex-1 flex items-center justify-center bg-white p-2 min-h-0"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img
                      src={imageData}
                      alt={VIEW_LABELS[viewKey]}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap pt-1">Notas:</span>
                      <div className="flex-1 print:hidden">
                        <Textarea
                          value={draftImageNotes[viewKey]}
                          onChange={(e) => setDraftImageNote(viewKey, e.target.value)}
                          placeholder="Adicione observações para o cirurgião..."
                          className="min-h-[50px] text-sm border-gray-300 focus:border-pink-500 focus:ring-pink-500 resize-none"
                          data-testid={`textarea-note-${viewKey}`}
                        />
                      </div>
                      <p className="hidden print:block flex-1 text-sm text-gray-800 min-h-[30px]">
                        {draftImageNotes[viewKey] || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-300 print:mt-2 print:pt-2">
          <div className="grid grid-cols-2 gap-4 print:gap-2">
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center text-gray-400 text-sm print:p-3 print:text-xs">
              <p className="font-medium">Médico Responsável</p>
              <div className="mt-4 border-t border-gray-300 pt-2 print:mt-2">
                <p className="text-xs text-gray-400">Assinatura / Carimbo</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center text-gray-400 text-sm print:p-3 print:text-xs">
              <p className="font-medium">Data do Procedimento</p>
              <div className="mt-4 border-t border-gray-300 pt-2 print:mt-2">
                <p className="text-xs text-gray-400">_____ / _____ / _____</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-400 text-xs mt-3 print:mt-2">
            EndoMapper © {new Date().getFullYear()} — Sistema de Mapeamento de Endometriose
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            height: 100%;
          }
          body {
            background-color: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
        
        @media screen {
          .grid {
            max-height: calc(100vh - 220px);
          }
        }
      `}</style>
    </div>
  );
}
