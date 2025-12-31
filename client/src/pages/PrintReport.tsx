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

export default function PrintReport() {
  const [, setLocation] = useLocation();
  const { draftImages2D, draftImageNotes, setDraftImageNote } = useReportStore();

  const handlePrint = () => {
    window.print();
  };

  const hasImages = Object.values(draftImages2D).some(img => img && img.length > 0);

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

      <div className="p-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
        <div className="text-center mb-12 print:mb-8">
          <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">EndoMapper - Relatório de Vistas 2D</h1>
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
          <div className="space-y-12 print:space-y-8">
            {(['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'] as const).map((viewKey) => {
              const imageData = draftImages2D[viewKey];
              if (!imageData) return null;

              return (
                <div
                  key={viewKey}
                  className="flex flex-col gap-4 print:break-inside-avoid"
                  data-testid={`report-view-container-${viewKey}`}
                >
                  <div className="bg-gray-50 px-4 py-2 border-l-4 border-pink-500">
                    <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">
                      {VIEW_LABELS[viewKey]}
                    </h3>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex items-center justify-center p-4">
                    <img
                      src={imageData}
                      alt={VIEW_LABELS[viewKey]}
                      className="w-full max-h-[800px] object-contain bg-white"
                      style={{ filter: 'brightness(1.05)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Observações:</p>
                    <div className="print:hidden">
                      <Textarea
                        value={draftImageNotes[viewKey]}
                        onChange={(e) => setDraftImageNote(viewKey, e.target.value)}
                        placeholder={`Digite observações para ${VIEW_LABELS[viewKey]}...`}
                        className="min-h-[100px] border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                        data-testid={`textarea-note-${viewKey}`}
                      />
                    </div>
                    <div className="hidden print:block min-h-[60px] p-3 border border-gray-200 rounded bg-gray-50 text-gray-800 text-sm whitespace-pre-wrap">
                      {draftImageNotes[viewKey] || "Nenhuma observação registrada."}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-gray-200 print:mt-12 print:pt-6">
          <div className="grid grid-cols-2 gap-8 mb-8 print:hidden">
            <div className="border border-dashed border-gray-300 p-8 rounded-lg text-center text-gray-400">
              Espaço para Assinatura do Médico
            </div>
            <div className="border border-dashed border-gray-300 p-8 rounded-lg text-center text-gray-400">
              Carimbo da Instituição
            </div>
          </div>
          
          <div className="text-center text-gray-400 text-xs">
            <p>Este documento é parte integrante do prontuário médico.</p>
            <p>© {new Date().getFullYear()} EndoMapper System - Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
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
      `}</style>
    </div>
  );
}
