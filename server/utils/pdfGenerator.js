/**
 * PDF Generator utility module
 * Generates PDF invoices and documents
 */

const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

/**
 * Generate a PDF invoice
 * @param {Object} invoice - Invoice object with details
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 50);

      // Invoice details
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, 50, 100)
        .text(`Date: ${formatDate(invoice.createdAt)}`, 50, 115)
        .text(`Due Date: ${formatDate(invoice.dueDate)}`, 50, 130)
        .text(`Status: ${invoice.status || 'Pending'}`, 50, 145);

      // Customer info
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, 180);

      doc.fontSize(10)
        .font('Helvetica')
        .text(invoice.userId?.name || 'Customer', 50, 195)
        .text(invoice.userId?.email || '', 50, 210);

      if (invoice.billingAddress) {
        const addr = invoice.billingAddress;
        doc.text(`${addr.street || ''}`, 50, 225);
        doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`, 50, 240);
        doc.text(`${addr.country || ''}`, 50, 255);
      }

      // Items table
      const tableTop = 300;
      const col1 = 50;
      const col2 = 250;
      const col3 = 400;
      const col4 = 500;

      // Table header
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('Description', col1, tableTop)
        .text('Quantity', col2, tableTop)
        .text('Unit Price', col3, tableTop)
        .text('Amount', col4, tableTop);

      // Draw line under header
      doc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      let rowTop = tableTop + 25;
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          doc.fontSize(10)
            .font('Helvetica')
            .text(item.description || '', col1, rowTop)
            .text(String(item.quantity || 1), col2, rowTop)
            .text(formatCurrency(item.unitPrice || 0), col3, rowTop)
            .text(formatCurrency(item.amount || 0), col4, rowTop);

          rowTop += 20;
        });
      }

      // Summary section
      const summaryTop = rowTop + 20;
      doc.moveTo(50, summaryTop - 5)
        .lineTo(550, summaryTop - 5)
        .stroke();

      doc.fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 400, summaryTop)
        .text(formatCurrency(invoice.subtotal || 0), 500, summaryTop);

      const taxTop = summaryTop + 20;
      if (invoice.tax && invoice.tax.amount > 0) {
        doc.text(`Tax (${invoice.tax.rate || 0}%):`, 400, taxTop)
          .text(formatCurrency(invoice.tax.amount || 0), 500, taxTop);
      }

      const totalTop = taxTop + (invoice.tax && invoice.tax.amount > 0 ? 20 : 0);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', 400, totalTop)
        .text(formatCurrency(invoice.total || 0), 500, totalTop);

      // Footer
      doc.fontSize(9)
        .font('Helvetica')
        .text('Thank you for your business!', 50, 700, { align: 'center' })
        .text('If you have any questions, please contact us.', 50, 715, { align: 'center' });

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a PDF certificate
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [800, 600],
        margin: 40,
        bufferPages: true,
      });

      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Certificate design
      doc.fontSize(48)
        .font('Helvetica-Bold')
        .text('CERTIFICATE', 0, 150, { align: 'center' });

      doc.fontSize(24)
        .font('Helvetica')
        .text('OF COMPLETION', 0, 210, { align: 'center' });

      doc.fontSize(16)
        .text(`This certifies that`, 0, 280, { align: 'center' });

      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text(certificateData.recipientName || 'Recipient Name', 0, 320, { align: 'center' });

      doc.fontSize(16)
        .font('Helvetica')
        .text(`has successfully completed`, 0, 370, { align: 'center' });

      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(certificateData.courseName || 'Course Name', 0, 410, { align: 'center' });

      doc.fontSize(12)
        .font('Helvetica')
        .text(`Date: ${formatDate(new Date())}`, 100, 480)
        .text(`Issued by: ${certificateData.issuedBy || 'Organization'}`, 100, 510);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format currency for display
 * @param {number} amount - Amount in cents or dollars
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

module.exports = {
  generatePDF,
  generateCertificatePDF,
  formatCurrency,
  formatDate,
};
