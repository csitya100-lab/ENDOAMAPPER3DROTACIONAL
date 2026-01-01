import { jsPDF } from 'jspdf';
import { PdfImage } from './reportStore';

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 10;

const SLOTS = [
  { x: 10, y: 30, w: 190, h: 240 }
];

function addImageInSlot(
  pdf: jsPDF,
  imgData: string,
  slot: { x: number; y: number; w: number; h: number },
  origWidth: number,
  origHeight: number,
  label: string,
  observation: string
) {
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text(label, slot.x, slot.y - 3);

  const reservedForObs = observation && observation.trim() ? 20 : 0;
  const availableH = slot.h - reservedForObs;
  
  const ratio = origHeight / origWidth;
  let imgW = slot.w;
  let imgH = imgW * ratio;

  if (imgH > availableH) {
    imgH = availableH;
    imgW = imgH / ratio;
  }

  const x = slot.x + (slot.w - imgW) / 2;
  const y = slot.y;

  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
  
  if (observation && observation.trim()) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const obsY = slot.y + slot.h - 10;
    const lines = pdf.splitTextToSize(`Obs: ${observation}`, slot.w);
    pdf.text(lines.slice(0, 3), slot.x, obsY);
  }
}

function addHeader(pdf: jsPDF, pageNum: number, totalPages: number) {
  pdf.setFontSize(16);
  pdf.setTextColor(219, 39, 119);
  pdf.text('EndoMapper - Mapeamento de Lesões', A4_WIDTH / 2, 15, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  pdf.text(`Data: ${dateStr}`, MARGIN, 25);
  pdf.text(`Página ${pageNum}/${totalPages}`, A4_WIDTH - MARGIN, 25, { align: 'right' });
  
  pdf.setDrawColor(219, 39, 119);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, 28, A4_WIDTH - MARGIN, 28);
}

function addFooter(pdf: jsPDF) {
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    'EndoMapper © ' + new Date().getFullYear() + ' - Sistema de Mapeamento de Endometriose',
    A4_WIDTH / 2,
    A4_HEIGHT - 8,
    { align: 'center' }
  );
}

export function generatePdfReport(images: PdfImage[]): void {
  if (images.length === 0) {
    alert('Nenhuma imagem adicionada ao relatório.');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const slotsPerPage = SLOTS.length;
  const totalPages = Math.ceil(images.length / slotsPerPage);

  images.forEach((img, index) => {
    const pageIndex = Math.floor(index / slotsPerPage);
    const slotIndex = index % slotsPerPage;

    if (pageIndex > 0 && slotIndex === 0) {
      pdf.addPage();
    }

    if (slotIndex === 0) {
      addHeader(pdf, pageIndex + 1, totalPages);
      addFooter(pdf);
    }

    const tempImg = new Image();
    tempImg.src = img.data;
    const origWidth = tempImg.width || 800;
    const origHeight = tempImg.height || 600;

    addImageInSlot(
      pdf,
      img.data,
      SLOTS[slotIndex],
      origWidth,
      origHeight,
      img.label,
      img.observation
    );
  });

  pdf.save('relatorio-endomapper.pdf');
}
