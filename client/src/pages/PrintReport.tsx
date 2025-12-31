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
    switch (availableViews.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/vistas-2d')}
            className="text-slate-400 hover:text-white"
            data-testid="button-back-2d"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Editor 2D
          </Button>
          <div className="h-6 w-px bg-slate-700" />
          <h1 className="text-xl font-bold">Visualizar Relatório</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-pink-600 hover:bg-pink-700"
            data-testid="button-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-[210mm] mx-auto print:p-4 print:max-w-none">
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">EndoMapper - Relatório de Vistas 2D</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>

        {!hasImages ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nenhuma imagem disponível para impressão.</p>
            <p className="text-sm mt-2">Volte ao editor 2D e faça suas anotações nas vistas.</p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-4 print:gap-3`}>
            {availableViews.map((viewKey) => {
              const imageData = draftImages2D[viewKey];

              return (
                <div
                  key={viewKey}
                  className="flex flex-col print:break-inside-avoid"
                  data-testid={`report-view-container-${viewKey}`}
                >
                  <div className="bg-gray-100 px-3 py-1.5 border border-gray-300 border-b-0 rounded-t">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                      {VIEW_LABELS[viewKey]}
                    </h3>
                  </div>
                  
                  <div 
                    className="border border-gray-300 bg-white flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img
                      src={imageData}
                      alt={VIEW_LABELS[viewKey]}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                  </div>

                  <div className="border border-gray-300 border-t-0 rounded-b p-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Observações:</p>
                    <div className="print:hidden">
                      <Textarea
                        value={draftImageNotes[viewKey]}
                        onChange={(e) => setDraftImageNote(viewKey, e.target.value)}
                        placeholder={`Observações...`}
                        className="min-h-[60px] text-xs border-gray-300 focus:border-pink-500 focus:ring-pink-500 resize-none"
                        data-testid={`textarea-note-${viewKey}`}
                      />
                    </div>
                    <div className="hidden print:block min-h-[40px] text-xs text-gray-800 whitespace-pre-wrap">
                      {draftImageNotes[viewKey] || "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200 print:mt-6 print:pt-4">
          <div className="grid grid-cols-2 gap-6 mb-4 print:gap-4">
            <div className="border border-dashed border-gray-300 p-4 rounded text-center text-gray-400 text-sm">
              Assinatura do Médico
            </div>
            <div className="border border-dashed border-gray-300 p-4 rounded text-center text-gray-400 text-sm">
              Carimbo
            </div>
          </div>
          
          <div className="text-center text-gray-400 text-xs">
            <p>© {new Date().getFullYear()} EndoMapper System</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          img {
            image-rendering: auto;
          }
        }
      `}</style>
    </div>
  );
}
