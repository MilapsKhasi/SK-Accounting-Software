import { state } from './state';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function renderLedger(container) {
  const customers = state.company.modules.customers;
  const vendors = state.company.modules.vendors;
  
  let selectedPartyType = window.ledgerSelection?.partyType || 'customer';
  let selectedPartyId = window.ledgerSelection?.partyId || '';
  let fromDate = '2025-03-31';
  let toDate = '2026-04-01';

  // Clear selection after use
  delete window.ledgerSelection;

  const updateLedgerView = () => {
    const party = selectedPartyType === 'customer' 
      ? customers.find(c => c.id === selectedPartyId)
      : vendors.find(v => v.id === selectedPartyId);

    const entries = [];
    if (party) {
      if (selectedPartyType === 'customer') {
        const sales = state.company.modules.sales.filter(s => s.customer === party.name && s.status !== 'Canceled');
        sales.forEach(s => {
          const displayBillNo = s.invoiceNumber;
          
          // Add the bill entry (Debit)
          entries.push({
            date: s.date,
            particulars: `BILL NUMBER ${displayBillNo}`,
            debit: s.netBill,
            credit: 0,
            timestamp: new Date(s.date).getTime()
          });
          
          // Add payment entries (Credit)
          if (s.payments && Array.isArray(s.payments)) {
            s.payments.forEach(p => {
              entries.push({
                date: p.date || s.date,
                particulars: `PAYMENT RECEIVED OF BILL NUMBER ${s.invoiceNumber}${p.method ? ` (${p.method})` : ''}`,
                debit: 0,
                credit: p.amount,
                timestamp: new Date(p.date || s.date).getTime() + 1 // Ensure payment comes after bill if same date
              });
            });
          } else if (s.status === 'Paid') {
            // If it's paid but no payments array (legacy or direct), show full credit
            entries.push({
              date: s.date,
              particulars: `PAYMENT RECEIVED OF BILL NUMBER ${s.invoiceNumber}`,
              debit: 0,
              credit: s.netBill,
              timestamp: new Date(s.date).getTime() + 1
            });
          }
        });
      } else {
        const purchases = state.company.modules.purchase.filter(p => p.vendor === party.name && p.status !== 'Canceled');
        purchases.forEach(p => {
          const displayBillNo = p.billNumber;

          // For vendors, Purchase is Debit (we owe them), Payment is Credit (we paid them)
          // Wait, the user's logic for Customer is Bill=Debit, Payment=Credit.
          // For Vendor, it should be the opposite? Or same?
          // Usually, in a "Vendor Ledger", we show what we owe them.
          // Let's stick to the same visual logic as Customer for consistency if they want it "exactly like PDF".
          
          entries.push({
            date: p.date,
            particulars: `BILL NUMBER ${displayBillNo}`,
            debit: p.netBill,
            credit: 0,
            timestamp: new Date(p.date).getTime()
          });
          
          if (p.payments && Array.isArray(p.payments)) {
            p.payments.forEach(pay => {
              entries.push({
                date: pay.date || p.date,
                particulars: `PAYMENT MADE FOR BILL NUMBER ${p.billNumber}${pay.method ? ` (${pay.method})` : ''}`,
                debit: 0,
                credit: pay.amount,
                timestamp: new Date(pay.date || p.date).getTime() + 1
              });
            });
          } else if (p.status === 'Paid') {
            entries.push({
              date: p.date,
              particulars: `PAYMENT MADE FOR BILL NUMBER ${p.billNumber}`,
              debit: 0,
              credit: p.netBill,
              timestamp: new Date(p.date).getTime() + 1
            });
          }
        });
      }
    }

    // Sort by date
    entries.sort((a, b) => a.timestamp - b.timestamp);

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const closingBalance = totalDebit - totalCredit;

    const ledgerContent = document.getElementById('ledger-content');
    if (!ledgerContent) return;

    ledgerContent.innerHTML = `
      <div class="bg-white border border-gray-400 p-8 max-w-5xl mx-auto font-['Poppins'] text-gray-900 overflow-hidden" style="min-height: 297mm;">
        
        <!-- Header Box -->
        <div class="border-2 border-black p-4 text-center mb-6">
          <h1 class="text-2xl font-bold uppercase tracking-widest">${state.company.company_name}</h1>
        </div>

        <!-- Info Section -->
        <div class="grid grid-cols-2 gap-x-12 gap-y-4 mb-6 text-[13px]">
          <div class="flex items-center gap-4">
            <span class="font-bold w-32 uppercase">LEDGER OF</span>
            <div class="flex-1 border-b border-black pb-1 font-bold uppercase">
              ${party ? party.name : 'CUSTOMER'}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="font-bold w-32 uppercase">FROM DATE</span>
            <div class="flex-1 border-b border-black pb-1 font-bold">
              ${fromDate}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="font-bold w-32 uppercase">GSTIN NUMBER</span>
            <div class="flex-1 border-b border-black pb-1 font-bold uppercase">
              ${party ? (party.gstin || 'GSTIN NUMBER') : 'GSTIN NUMBER'}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="font-bold w-32 uppercase">TO DATE</span>
            <div class="flex-1 border-b border-black pb-1 font-bold">
              ${toDate}
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="border-2 border-black">
          <table class="w-full border-collapse text-[13px]">
            <thead>
              <tr class="border-b-2 border-black">
                <th class="border-r-2 border-black px-4 py-2 text-left w-20 font-bold uppercase italic">SR NO</th>
                <th class="border-r-2 border-black px-4 py-2 text-left font-bold uppercase italic">PARTICULARS</th>
                <th class="border-r-2 border-black px-4 py-2 text-right w-40 font-bold uppercase italic">DEBIT</th>
                <th class="px-4 py-2 text-right w-40 font-bold uppercase italic">CREDIT</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map((entry, index) => `
                <tr class="h-10">
                  <td class="border-r-2 border-black px-4 py-2 font-medium">${index + 1}</td>
                  <td class="border-r-2 border-black px-4 py-2 font-medium uppercase">${entry.particulars}</td>
                  <td class="border-r-2 border-black px-4 py-2 text-right font-medium">${entry.debit > 0 ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                  <td class="px-4 py-2 text-right font-medium">${entry.credit > 0 ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 15 - entries.length) }).map(() => `
                <tr class="h-10">
                  <td class="border-r-2 border-black px-4 py-2"></td>
                  <td class="border-r-2 border-black px-4 py-2"></td>
                  <td class="border-r-2 border-black px-4 py-2 text-right"></td>
                  <td class="px-4 py-2 text-right"></td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-black bg-white">
                <td colspan="2" class="border-r-2 border-black px-4 py-2 text-center font-bold uppercase italic">GRAND TOTAL</td>
                <td class="border-r-2 border-black px-4 py-2 text-right font-bold">${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-2 text-right font-bold">${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="border-t-2 border-black bg-white">
                <td colspan="3" class="border-r-2 border-black px-4 py-2 text-center font-bold uppercase italic">NET CLOSING BALANCE</td>
                <td class="px-4 py-2 text-right font-bold">${Math.abs(closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Party Ledger</h1>
          <p class="text-gray-500 mt-1">View detailed transaction history for customers and vendors</p>
        </div>
        <div class="flex gap-4">
          <button id="print-ledger-btn" class="flex items-center gap-2 px-4 py-2 bg-[#1e2a38] text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <i data-lucide="printer" class="w-4 h-4"></i> Print Ledger
          </button>
        </div>
      </header>

      <div class="bg-white p-6 border border-gray-200 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Party Type</label>
            <select id="party-type" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Party</label>
            <select id="party-select" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold">
              <option value="">Choose a party...</option>
              ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">From Date</label>
            <input type="date" id="from-date" value="2025-03-31" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">To Date</label>
            <input type="date" id="to-date" value="2026-04-01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" />
          </div>
        </div>
      </div>

      <div id="ledger-content"></div>
    </div>
  `;

  window.renderIcons();

  const partyTypeSelect = document.getElementById('party-type');
  const partySelect = document.getElementById('party-select');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');

  partyTypeSelect.onchange = (e) => {
    selectedPartyType = e.target.value;
    const list = selectedPartyType === 'customer' ? customers : vendors;
    partySelect.innerHTML = `<option value="">Choose a party...</option>` + list.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    selectedPartyId = '';
    updateLedgerView();
  };

  partySelect.onchange = (e) => {
    selectedPartyId = e.target.value;
    updateLedgerView();
  };

  fromDateInput.onchange = (e) => {
    fromDate = e.target.value;
    updateLedgerView();
  };

  toDateInput.onchange = (e) => {
    toDate = e.target.value;
    updateLedgerView();
  };

  document.getElementById('print-ledger-btn').onclick = () => {
    const party = selectedPartyType === 'customer' 
      ? customers.find(c => c.id === selectedPartyId)
      : vendors.find(v => v.id === selectedPartyId);
    
    // Recalculate everything for the PDF
    const entries = [];
    if (party) {
      if (selectedPartyType === 'customer') {
        const sales = state.company.modules.sales.filter(s => s.customer === party.name && s.status !== 'Canceled');
        sales.forEach(s => {
          entries.push({
            date: s.date,
            particulars: `BILL NUMBER ${s.invoiceNumber}`,
            debit: s.netBill,
            credit: 0,
            timestamp: new Date(s.date).getTime()
          });
          if (s.payments && Array.isArray(s.payments)) {
            s.payments.forEach(p => {
              entries.push({
                date: p.date || s.date,
                particulars: `PAYMENT RECEIVED OF BILL NUMBER ${s.invoiceNumber}${p.method ? ` (${p.method})` : ''}`,
                debit: 0,
                credit: p.amount,
                timestamp: new Date(p.date || s.date).getTime() + 1
              });
            });
          } else if (s.status === 'Paid') {
            entries.push({
              date: s.date,
              particulars: `PAYMENT RECEIVED OF BILL NUMBER ${s.invoiceNumber}`,
              debit: 0,
              credit: s.netBill,
              timestamp: new Date(s.date).getTime() + 1
            });
          }
        });
      } else {
        const purchases = state.company.modules.purchase.filter(p => p.vendor === party.name && p.status !== 'Canceled');
        purchases.forEach(p => {
          entries.push({
            date: p.date,
            particulars: `BILL NUMBER ${p.billNumber}`,
            debit: p.netBill,
            credit: 0,
            timestamp: new Date(p.date).getTime()
          });
          if (p.payments && Array.isArray(p.payments)) {
            p.payments.forEach(pay => {
              entries.push({
                date: pay.date || p.date,
                particulars: `PAYMENT MADE FOR BILL NUMBER ${p.billNumber}${pay.method ? ` (${pay.method})` : ''}`,
                debit: 0,
                credit: pay.amount,
                timestamp: new Date(pay.date || p.date).getTime() + 1
              });
            });
          } else if (p.status === 'Paid') {
            entries.push({
              date: p.date,
              particulars: `PAYMENT MADE FOR BILL NUMBER ${p.billNumber}`,
              debit: 0,
              credit: p.netBill,
              timestamp: new Date(p.date).getTime() + 1
            });
          }
        });
      }
    }
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const closingBalance = totalDebit - totalCredit;

    generatePDF(party, entries, fromDate, toDate, totalDebit, totalCredit, closingBalance);
  };

  function generatePDF(party, entries, from, to, tDebit, tCredit, balance) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Page Border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, contentWidth, doc.internal.pageSize.getHeight() - (margin * 2));

    // Header Box
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, contentWidth, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(state.company.company_name.toUpperCase(), pageWidth / 2, margin + 13, { align: 'center' });

    // Secondary line
    doc.line(margin, margin + 20, margin + contentWidth, margin + 20);

    // Info Section
    doc.setFontSize(10);
    const infoY = margin + 35;
    
    // Column 1
    doc.setFont('helvetica', 'bold');
    doc.text('LEDGER OF', margin + 5, infoY);
    doc.setFont('helvetica', 'bold');
    doc.text(party ? party.name.toUpperCase() : 'CUSTOMER', margin + 45, infoY);
    doc.line(margin + 45, infoY + 2, margin + contentWidth / 2 - 5, infoY + 2);

    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN NUMBER', margin + 5, infoY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(party ? (party.gstin || 'N/A').toUpperCase() : 'GSTIN NUMBER', margin + 45, infoY + 10);
    doc.line(margin + 45, infoY + 12, margin + contentWidth / 2 - 5, infoY + 12);

    // Column 2
    doc.setFont('helvetica', 'bold');
    doc.text('FROM DATE', margin + contentWidth / 2 + 5, infoY);
    doc.setFont('helvetica', 'bold');
    doc.text(from, margin + contentWidth / 2 + 45, infoY);
    doc.line(margin + contentWidth / 2 + 45, infoY + 2, margin + contentWidth - 5, infoY + 2);

    doc.setFont('helvetica', 'bold');
    doc.text('TO DATE', margin + contentWidth / 2 + 5, infoY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(to, margin + contentWidth / 2 + 45, infoY + 10);
    doc.line(margin + contentWidth / 2 + 45, infoY + 12, margin + contentWidth - 5, infoY + 12);

    // Table
    autoTable(doc, {
      startY: infoY + 20,
      margin: { left: margin, right: margin },
      head: [['SR NO', 'PARTICULARS', 'DEBIT', 'CREDIT']],
      body: [
        ...entries.map((e, i) => [
          i + 1,
          e.particulars.toUpperCase(),
          e.debit > 0 ? e.debit.toFixed(2) : '',
          e.credit > 0 ? e.credit.toFixed(2) : ''
        ]),
        // Add empty rows to match the reference look if needed
        ...Array.from({ length: Math.max(0, 15 - entries.length) }).map(() => ['', '', '', ''])
      ],
      foot: [
        [
          { content: 'GRAND TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: tDebit.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: tCredit.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }
        ],
        [
          { content: 'NET CLOSING BALANCE', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: Math.abs(balance).toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }
        ]
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: 'bolditalic',
        fillColor: false,
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 40 },
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5,
      bodyStyles: {
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      didParseCell: function(data) {
        // Vertical line for SR NO etc
        data.cell.styles.lineWidth = 0.5;
        if (data.column.index === 3) {
           data.cell.styles.borderWidth = { top: 0, right: 0.5, bottom: 0.5, left: 0 };
        }
      }
    });

    doc.save(`ledger_${party ? party.name.replace(/\s+/g, '_').toLowerCase() : 'report'}.pdf`);
  }

  updateLedgerView();
}
