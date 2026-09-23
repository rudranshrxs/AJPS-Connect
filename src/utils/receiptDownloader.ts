import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture a DOM element by ID using html2canvas and download as PDF.
 * No preview — starts download instantly.
 */
export async function downloadReceiptAsPDF(elementId: string, filename: string = 'Receipt.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Receipt element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 proportions in mm
    const pdfWidth = 210;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}

/**
 * Capture a DOM element by ID using html2canvas and download as JPG.
 * No preview — starts download instantly.
 */
export async function downloadReceiptAsJPG(elementId: string, filename: string = 'Receipt.jpg') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Receipt element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Create invisible <a> tag, set href, and trigger download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('JPG generation failed:', err);
  }
}

/**
 * Capture a DOM element by ID using html2canvas and open print dialog.
 */
export async function printReceipt(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Receipt element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Receipt</title></head>
          <body style="margin:0; padding:0; text-align:center;">
            <img src="${dataUrl}" style="max-width:100%; height:auto;" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (err) {
    console.error('Print failed:', err);
  }
}
