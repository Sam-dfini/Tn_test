import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, filename: string = 'dossier.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Add a temporary 'exporting' class to hide non-print elements like buttons
    element.classList.add('pdf-exporting');

    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true, 
      logging: false,
      backgroundColor: '#0a0a0a', // match dark theme typical bg
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 size in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let position = 0;
    
    // If image fits on one page
    if (pdfHeight <= pdf.internal.pageSize.getHeight()) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    } else {
      // Logic for multi-page
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  } finally {
    element.classList.remove('pdf-exporting');
  }
};
