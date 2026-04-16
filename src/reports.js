import { state } from './state';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function renderReports(container) {
  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
        <p class="text-gray-500 mt-1">Generate and export business reports</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <i data-lucide="trending-up" class="w-8 h-8 text-green-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">Sales Report</h3>
            <p class="text-sm text-gray-500 mt-1">Summary of all sales transactions</p>
          </div>
          <button id="gen-sales-report" class="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Generate PDF
          </button>
        </div>

        <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <i data-lucide="shopping-cart" class="w-8 h-8 text-blue-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">Purchase Report</h3>
            <p class="text-sm text-gray-500 mt-1">Summary of all purchase transactions</p>
          </div>
          <button id="gen-purchase-report" class="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Generate PDF
          </button>
        </div>

        <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div class="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
            <i data-lucide="package" class="w-8 h-8 text-purple-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">Inventory Report</h3>
            <p class="text-sm text-gray-500 mt-1">Current stock levels and valuation</p>
          </div>
          <button id="gen-inventory-report" class="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  `;

  window.renderIcons();

  document.getElementById('gen-sales-report').onclick = () => generateSalesReport();
  document.getElementById('gen-purchase-report').onclick = () => generatePurchaseReport();
  document.getElementById('gen-inventory-report').onclick = () => generateInventoryReport();
}

function generateSalesReport() {
  const sales = state.company.modules.sales;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Sales Report', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Company: ${state.company.company_name}`, 20, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

  autoTable(doc, {
    startY: 45,
    head: [['Invoice', 'Date', 'Customer', 'Amount', 'GST', 'Net Bill']],
    body: sales.map(s => [s.invoiceNumber, s.date, s.customer, s.amount, s.gstAmount, s.netBill]),
  });

  doc.save('sales_report.pdf');
}

function generatePurchaseReport() {
  const purchases = state.company.modules.purchase;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Purchase Report', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Company: ${state.company.company_name}`, 20, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

  autoTable(doc, {
    startY: 45,
    head: [['Bill No', 'Date', 'Vendor', 'Amount', 'GST', 'Net Bill']],
    body: purchases.map(p => [p.billNumber, p.date, p.vendor, p.amount, p.gstAmount, p.netBill]),
  });

  doc.save('purchase_report.pdf');
}

function generateInventoryReport() {
  const inventory = state.company.modules.inventory;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Inventory Report', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Company: ${state.company.company_name}`, 20, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

  autoTable(doc, {
    startY: 45,
    head: [['Item Name', 'SKU', 'Category', 'Qty', 'Unit', 'Price']],
    body: inventory.map(i => [i.name, i.sku, i.category, i.quantity, i.unit, i.price]),
  });

  doc.save('inventory_report.pdf');
}
