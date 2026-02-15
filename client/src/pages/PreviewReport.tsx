import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReportStore } from '@/lib/reportStore';
import { generatePdfReport } from '@/lib/pdfGenerator';
import { ArrowLeft, FileDown, Printer, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';

export default function PreviewReport() {
  const [, setLocation] = useLocation();
  const { 
    pdfImages, 
    updatePdfImageObservation, 
    removePdfImage, 
    clearPdfImages,
    reorderPdfImages,
    patientName,
    setPatientName,
    examDate,
    setExamDate,
    patientId,
    setPatientId
  } = useReportStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleExportPdf = () => {
    generatePdfReport(pdfImages, { patientName, examDate, patientId });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      requestAnimationFrame(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = '0.4';
        }
      });
    }
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDragIndex(null);
    setDropTarget(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setDropTarget(index);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderPdfImages(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDropTarget(null);
  };

  const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= pdfImages.length) return;
    reorderPdfImages(fromIndex, toIndex);
  };

  const hasImages = pdfImages.length > 0;
  const count = pdfImages.length;

  const getGridClass = () => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const getImageMaxHeight = () => {
    if (count === 1) return '600px';
    if (count === 2) return '450px';
    if (count <= 4) return '350px';
    return '280px';
  };

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
            {hasImages && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'imagem' : 'imagens'}
              </span>
            )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:mb-6">
                <div className="space-y-2">
                  <Label htmlFor="patientName" className="text-gray-700 font-medium">Nome da Paciente</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Digite o nome completo"
                    className="border-gray-200 focus:ring-pink-500 focus:border-pink-500 print:border-transparent print:p-0 print:text-lg print:font-bold"
                    data-testid="input-patient-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-gray-700 font-medium">ID / Registro</Label>
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Ex: 12345"
                    className="border-gray-200 focus:ring-pink-500 focus:border-pink-500 print:border-transparent print:p-0"
                    data-testid="input-patient-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examDate" className="text-gray-700 font-medium">Data do Exame</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="border-gray-200 focus:ring-pink-500 focus:border-pink-500 print:border-transparent print:p-0"
                    data-testid="input-exam-date"
                  />
                </div>
              </div>

              <div className="text-center mb-6 print:mb-4 border-t border-gray-100 pt-6">
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

              {hasImages && (
                <p className="text-xs text-gray-400 mb-3 print:hidden text-center">
                  Arraste as imagens para reordenar ou use as setas
                </p>
              )}

              <div className={`grid ${getGridClass()} gap-6 print:gap-4`}>
                {pdfImages.map((image, index) => (
                  <div 
                    key={`${image.viewType}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`border rounded-lg overflow-hidden print:border-gray-300 print:break-inside-avoid transition-all duration-200 ${
                      dropTarget === index
                        ? 'border-pink-400 ring-2 ring-pink-200 scale-[1.02]'
                        : dragIndex === index
                        ? 'border-gray-300 opacity-40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`preview-card-${index}`}
                  >
                    <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between print:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 print:hidden" data-testid={`drag-handle-${index}`}>
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-gray-400 font-mono print:hidden">{index + 1}</span>
                        <h3 className="font-semibold text-gray-800 text-sm">{image.label}</h3>
                      </div>
                      <div className="flex items-center gap-1 print:hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                          data-testid={`button-move-up-${index}`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === pdfImages.length - 1}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                          data-testid={`button-move-down-${index}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePdfImage(index)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-white flex items-center justify-center p-4" style={{ minHeight: count <= 2 ? '400px' : '250px' }}>
                      <img
                        src={image.data}
                        alt={image.label}
                        className="max-w-full object-contain"
                        style={{ maxHeight: getImageMaxHeight(), width: 'auto' }}
                        draggable={false}
                      />
                    </div>

                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Observações
                      </label>
                      <Textarea
                        value={image.observation}
                        onChange={(e) => updatePdfImageObservation(index, e.target.value)}
                        placeholder="Adicione observações..."
                        className="min-h-[60px] text-sm resize-none print:hidden bg-white text-black border-gray-300 focus:border-pink-500 placeholder:text-gray-400"
                        data-testid={`textarea-observation-${index}`}
                      />
                      <p className="hidden print:block text-sm text-black bg-white min-h-[40px]">
                        {image.observation || "—"}
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
