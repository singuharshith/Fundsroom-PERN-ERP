const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF() {
  const outputDir = path.join(__dirname, '../../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pdfPath = path.join(outputDir, 'FundsRoom_ERP_Technical_Case_Study_Documentation.pdf');
  const doc = new PDFDocument({ margin: 54, size: 'A4' });
  doc.pipe(fs.createWriteStream(pdfPath));

  const primaryColor = '#1F5C73';
  const textColor = '#1F2937';
  const mutedColor = '#667085';
  const borderColor = '#DADFE3';

  // Title Header
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('FundsRoom ERP');
  doc.fontSize(11).font('Helvetica').fillColor(mutedColor).text('Full-Stack Technical Case Study Documentation — PERN Architecture');
  doc.moveDown(0.5);
  doc.strokeColor(borderColor).lineWidth(1).moveTo(54, doc.y).lineTo(541, doc.y).stroke();
  doc.moveDown(1);

  // Metadata Block
  doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('Project Details');
  doc.font('Helvetica').fontSize(9).fillColor(textColor);
  doc.text('Author / Developer: Harshith Singu');
  doc.text('Technology Stack: PostgreSQL 18, Express.js, React.js, Node.js (PERN)');
  doc.text('ORM & Database: Prisma ORM with Embedded PostgreSQL Server');
  doc.text('Repository: https://github.com/singuharshith/Fundsroom-PERN-ERP');
  doc.moveDown(1);

  // 1. Executive Summary
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('1. Executive Summary');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'FundsRoom ERP is an enterprise resource planning system designed for industrial manufacturing and supply chain management. It governs the full commercial sales pipeline across Sales Representatives, Warehouse Administrators, and B2B Industrial Clients:\n\n' +
    'Customer Enquiry  -->  Quotation  -->  Sales Order  -->  Inventory Reservation  -->  Dispatch'
  );
  doc.moveDown(1);

  // 2. Core Business Workflow & Role Specifications
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('2. Business Workflow & Role Authorization');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'The application enforces strict backend Role-Based Access Control (RBAC) across two operational roles:\n\n' +
    '1. Sales Representative (SALES_USER):\n' +
    '   - Creates and manages Customer Enquiries (NEW status).\n' +
    '   - Builds commercial Quotations with item pricing, discounts, and GST percentages.\n' +
    '   - Advances Quotation status (DRAFT -> SENT -> ACCEPTED / REJECTED).\n' +
    '   - Converts ACCEPTED Quotations into PENDING Sales Orders.\n\n' +
    '2. Warehouse Administrator (ADMIN):\n' +
    '   - Reviews incoming PENDING Sales Orders.\n' +
    '   - Confirms Sales Orders and locks inventory (CONFIRMED status).\n' +
    '   - Processes Dispatches with transport vehicle number and driver details.\n' +
    '   - Restocks physical inventory when incoming shipments arrive.'
  );
  doc.moveDown(1);

  // Page 2
  doc.addPage();

  // 3. Technical Safeguards & Backend Concurrency
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('3. Technical Safeguards & Concurrency Control');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'The backend implements four critical architectural safeguards to prevent data corruption:\n\n' +
    'a) Server-Side Quotation Math:\n' +
    '   All financial totals are calculated on the backend using Prisma Decimal types:\n' +
    '   Line Amount = (Quantity * Unit Price) * (1 - Discount/100) * (1 + GST/100).\n' +
    '   The backend does not accept unverified totals submitted by the client.\n\n' +
    'b) Double Conversion Guard:\n' +
    '   A database unique constraint on sales_orders.quotation_id prevents duplicate Sales Orders from being created from the same Quotation (HTTP 409 Conflict).\n\n' +
    'c) Atomic Inventory Reservation (Concurrency Lock):\n' +
    '   When confirming an order, stock is locked inside a Prisma $transaction using an atomic conditional SQL update:\n' +
    '   UPDATE inventory SET reserved_quantity = reserved_quantity + :qty WHERE product_id = :id AND (physical_quantity - reserved_quantity) >= :qty;\n' +
    '   This ensures simultaneous order confirmations cannot over-reserve stock.\n\n' +
    'd) Combined Physical & Reserved Stock Dispatch:\n' +
    '   Dispatching decrements both physical_quantity and reserved_quantity in a single atomic transaction.'
  );
  doc.moveDown(1);

  // 4. Automated Test Verification (7/7 Passed)
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('4. Automated Test Verification Summary');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'The suite contains 7 automated Jest test cases verifying all business constraints:\n\n' +
    '1. [PASSED] Server-side quotation total calculation accuracy\n' +
    '2. [PASSED] Block conversion of DRAFT or REJECTED quotations into Sales Orders\n' +
    '3. [PASSED] Block duplicate conversion of same quotation (Double Conversion Guard)\n' +
    '4. [PASSED] Block over-reservation beyond available stock\n' +
    '5. [PASSED] Block unauthorized user (SALES_USER) from confirming reservation\n' +
    '6. [PASSED] Concurrency Test: Concurrent Promise.all reservation requests allow only one success\n' +
    '7. [PASSED] Admin inventory restocking functionality & role protection'
  );
  doc.moveDown(1);

  // Page 3
  doc.addPage();

  // 5. Database Entity Schema
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('5. Database Relational Entities');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'The PostgreSQL database schema consists of 12 relational models:\n\n' +
    '- User: Authentication credentials, roles (ADMIN / SALES_USER).\n' +
    '- Customer: B2B client details (Company, Contact, Phone, Email, City).\n' +
    '- Product: Industrial SKU Master (Code, Name, Category, Unit, Base Price).\n' +
    '- Inventory: Maintains physical_quantity and reserved_quantity per product.\n' +
    '- Enquiry & EnquiryItem: Customer product request records.\n' +
    '- Quotation & QuotationItem: Commercial proposals with tax and discount math.\n' +
    '- SalesOrder & SalesOrderItem: Confirmed commercial sales contracts.\n' +
    '- Dispatch & DispatchItem: Outbound shipping records with vehicle and driver info.'
  );
  doc.moveDown(1);

  // 6. Conclusion
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('6. Conclusion');
  doc.moveDown(0.3);
  doc.fillColor(textColor).fontSize(9).font('Helvetica').text(
    'FundsRoom ERP achieves 100% compliance with all technical case study requirements. It combines robust relational data modeling, atomic SQL concurrency handling, role-based security, and a high-legibility interface built for production enterprise use.'
  );

  doc.end();
  console.log('PDF Document created successfully at:', pdfPath);
}

generatePDF();
