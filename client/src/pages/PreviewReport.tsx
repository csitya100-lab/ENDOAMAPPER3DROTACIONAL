import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useReportStore } from '@/lib/reportStore';
import { generatePdfReport } from '@/lib/pdfGenerator';
import { ArrowLeft, FileDown, Printer, Trash2 } from 'lucide-react';

const VIEW_ORDER = ['sagittal-avf', 'sagittal-rvf', 'coronal', 'posterior'] as const;

export default function PreviewReport() {
  const [, setLocation] = useLocation();
  const { pdfImages, updatePdfImageObservation, removePdfImage, clearPdfImages } = useReportStore();

  const handleExportPdf = () => {
    generatePdfReport(pdfImages);
  };

  const handlePrint = () => {
    window.print();
  };

  const getImageByViewType = (viewType: string) => {
    return pdfImages.find(img => img.viewType === viewType);
  };

  const getImageIndex = (viewType: string) => {
    return pdfImages.findIndex(img => img.viewType === viewType);
  };

  const orderedImages = VIEW_ORDER
    .map(viewType => ({ viewType, image: getImageByViewType(viewType), index: getImageIndex(viewType) }))
    .filter(item => item.image !== undefined);

  const hasImages = orderedImages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 print:hidden sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/vistas-2d')}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Editor
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">Prévia do Relatório</h1>
          </div>

          <div className="flex items-center gap-3">
            {hasImages && (
              <Button
                variant="outline"
                onClick={clearPdfImages}
                className="text-red-600 border-red-200 hover:bg-red-50"
                data-testid="button-clear-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!hasImages}
              data-testid="button-print"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!hasImages}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              data-testid="button-export-pdf"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 print:p-4">
        {!hasImages ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">Nenhuma imagem adicionada</p>
            <p className="text-gray-400 text-sm mb-6">
              Volte ao editor 2D, selecione uma vista e clique em "Adicionar ao Relatório"
            </p>
            <Button
              onClick={() => setLocation('/vistas-2d')}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Ir para o Editor
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 print:border-0 print:p-0 print:mb-4">
              <div className="text-center mb-6 print:mb-4">
                <h2 className="text-2xl font-bold text-gray-900 print:text-xl">EndoMapper</h2>
                <p className="text-gray-500 text-sm">Mapeamento de Lesões de Endometriose</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 print:gap-4">
                {orderedImages.map(({ viewType, image, index }) => (
                  <div 
                    key={viewType} 
                    className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-300"
                    data-testid={`preview-card-${viewType}`}
                  >
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between print:bg-gray-50">
                      <h3 className="font-medium text-gray-800 text-sm">{image!.label}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePdfImage(index)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 print:hidden"
                        data-testid={`button-remove-${viewType}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="aspect-square bg-white flex items-center justify-center p-4">
                      <img
                        src={image!.data}
                        alt={image!.label}
                        className="max-w-full max-h-full object-contain"
                        draggable={false}
                      />
                    </div>

                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Observações
                      </label>
                      <Textarea
                        value={image!.observation}
                        onChange={(e) => updatePdfImageObservation(index, e.target.value)}
                        placeholder="Adicione observações para o cirurgião..."
                        className="min-h-[60px] text-sm resize-none print:hidden"
                        data-testid={`textarea-observation-${viewType}`}
                      />
                      <p className="hidden print:block text-sm text-gray-700 min-h-[40px]">
                        {image!.observation || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:p-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 font-medium text-sm">Médico Responsável</p>
                  <div className="mt-8 border-t border-gray-300 pt-2">
                    <p className="text-xs text-gray-400">Assinatura / Carimbo</p>
                  </div>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 font-medium text-sm">Data do Procedimento</p>
                  <div className="mt-8 border-t border-gray-300 pt-2">
                    <p className="text-xs text-gray-400">_____ / _____ / _____</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6 text-gray-400 text-xs print:mt-4">
              EndoMapper © {new Date().getFullYear()} — Sistema de Mapeamento de Endometriose
            </div>
          </>
        )}
      </main>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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
