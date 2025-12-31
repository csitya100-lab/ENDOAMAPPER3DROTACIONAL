import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useReportStore } from '@/lib/reportStore';
import { ArrowLeft, Printer, Download } from 'lucide-react';

const VIEW_LABELS: Record<string, string> = {
  'sagittal-avf': 'Sagittal (AVF)',
  'sagittal-rvf': 'Sagittal (RVF)',
  'coronal': 'Coronal',
  'posterior': 'Posterior'
};

export default function PrintReport() {
  const [, setLocation] = useLocation();
  const { draftImages2D } = useReportStore();

  const handlePrint = () => {
    window.print();
  };

  const hasImages = Object.values(draftImages2D).some(img => img && img.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
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

      <div className="p-8 max-w-4xl mx-auto print:p-4 print:max-w-none">
        <div className="text-center mb-8 print:mb-4">
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
          <div className="grid grid-cols-2 gap-6 print:gap-4">
            {(['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'] as const).map((viewKey) => {
              const imageData = draftImages2D[viewKey];
              return (
                <div
                  key={viewKey}
                  className="border border-gray-300 rounded-lg overflow-hidden print:break-inside-avoid"
                  data-testid={`report-view-${viewKey}`}
                >
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {VIEW_LABELS[viewKey]}
                    </h3>
                  </div>
                  <div className="bg-slate-900 aspect-square flex items-center justify-center">
                    {imageData ? (
                      <img
                        src={imageData}
                        alt={VIEW_LABELS[viewKey]}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">Sem imagem</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-300 print:mt-4 print:pt-4">
          <div className="text-center text-gray-500 text-xs">
            <p>Este relatório foi gerado pelo sistema EndoMapper.</p>
            <p>As imagens representam as vistas 2D com anotações do exame.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
