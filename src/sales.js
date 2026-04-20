import { state, saveSalesEntry, cancelSalesEntry, deleteSalesEntry } from './state';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function renderSales(container) {
  const { company } = state;
  const sales = company.modules.sales;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Sales Invoices</h1>
          <p class="text-gray-500 mt-1">Manage your sales entries and invoices</p>
        </div>
        <button id="new-sales-btn" class="flex items-center gap-2 px-4 py-2 bg-[#1e2a38] text-white hover:bg-[#2c3e50] transition-colors text-sm font-bold uppercase tracking-widest">
          <i data-lucide="plus" class="w-4 h-4"></i> New Sales Entry
        </button>
      </header>

      <div class="bg-white border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice No</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Item</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Net Bill</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${sales.map(entry => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${entry.id}">
                  <td class="px-6 py-4 font-mono text-sm font-bold text-gray-900">${entry.invoiceNumber}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.date}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    <button class="hover:text-[#1e2a38] hover:underline text-left font-bold" onclick="event.stopPropagation(); const c = state.company.modules.customers.find(cust => cust.name === '${entry.customer}'); if(c) window.navigateToLedger('customer', c.id)">
                      ${entry.customer}
                    </button>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.itemName}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${entry.amount.toLocaleString()}</td>
                  <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹${entry.netBill.toLocaleString()}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      entry.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      entry.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }">
                      ${entry.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1.5 text-gray-400 hover:text-[#1e2a38] hover:bg-gray-100 transition-colors" onclick="event.stopPropagation(); window.printInvoice('${entry.id}')">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                      </button>
                      <button class="p-1.5 text-gray-400 hover:text-[#f44336] hover:bg-red-50 transition-colors" onclick="event.stopPropagation(); window.deleteSales('${entry.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Placeholder -->
    <div id="sales-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  // Event Listeners
  document.getElementById('new-sales-btn').onclick = () => openSalesModal();
  
  document.querySelectorAll('tbody tr').forEach(row => {
    row.onclick = () => {
      const entry = sales.find(s => s.id === row.dataset.id);
      if (entry) openSalesModal(entry);
    };
  });
}

function openSalesModal(entry = null) {
  const modal = document.getElementById('sales-modal');
  modal.classList.remove('hidden');

  const isEditing = !!entry;
  
  // Helper to get next SB number
  const getNextSB = () => {
    const sales = state.company.modules.sales;
    const nums = sales.map(s => {
      const match = s.invoiceNumber?.match(/SB-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `SB-${String(max + 1).padStart(3, '0')}`;
  };

  // Load draft if not editing
  const draftKey = 'draft_sales_entry';
  const draft = !isEditing ? JSON.parse(localStorage.getItem(draftKey)) : null;

  const initialData = entry || draft || {
    id: crypto.randomUUID(),
    invoiceNumber: getNextSB(),
    date: new Date().toISOString().split('T')[0],
    customer: '',
    itemName: '',
    hsnCode: '',
    rate: 0,
    qty: 1,
    amount: 0,
    discountPercent: 0,
    discountedAmount: 0,
    gstPercent: 18,
    gstAmount: 0,
    cgst: 0,
    sgst: 0,
    netBill: 0,
    status: 'Pending',
    gstEnabled: true,
    payments: []
  };

  let currentPayments = [...(initialData.payments || [])];

  const renderModalContent = () => {
    modal.innerHTML = `
      <div class="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 class="text-xl font-bold text-gray-900 uppercase tracking-tight">${isEditing ? 'Edit' : 'New'} Sales Entry</h2>
          <button id="close-modal" class="p-2 hover:bg-gray-100 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <form id="sales-form" class="p-8 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Bill Number</label>
              <input name="invoiceNumber" value="${initialData.invoiceNumber}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</label>
              <input type="date" name="date" value="${initialData.date}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Party Name</label>
              <input name="customer" value="${initialData.customer}" list="customers-list" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" required />
              <datalist id="customers-list">
                ${state.company.modules.customers.map(c => `<option value="${c.name}">`).join('')}
              </datalist>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Without GST (₹)</label>
              <input type="number" name="amount" value="${initialData.amount}" step="0.01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" required />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">GST (₹)</label>
              <input type="number" name="gstAmount" value="${initialData.gstAmount}" step="0.01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
              <div class="flex gap-2">
                <select name="status" id="status-select" class="flex-1 px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold">
                  <option value="Pending" ${initialData.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Partially" ${initialData.status === 'Partially' ? 'selected' : ''}>Partially</option>
                  <option value="Paid" ${initialData.status === 'Paid' ? 'selected' : ''}>Paid</option>
                </select>
                <button type="button" id="manage-payments-btn" class="${initialData.status === 'Partially' ? '' : 'hidden'} px-3 bg-[#ffcd00] text-[#1e2a38] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <i data-lucide="wallet" class="w-3 h-3"></i> Manage
                </button>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 space-y-4 border border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-gray-900 font-bold uppercase tracking-widest text-sm">Grand Total</span>
              <span id="display-net" class="text-2xl font-black text-[#1e2a38]">₹0.00</span>
            </div>
            <div id="balance-row" class="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
              <span class="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Balance Due</span>
              <span id="display-balance" class="font-bold text-[#f44336]">₹0.00</span>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" id="cancel-modal" class="px-6 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
            <button type="submit" class="px-8 py-2.5 bg-[#1e2a38] text-white text-xs font-bold hover:bg-[#2c3e50] transition-all uppercase tracking-widest">Save Invoice</button>
          </div>
        </form>
      </div>
    `;

    window.renderIcons();
    attachModalListeners();
  };

  const attachModalListeners = () => {
    const form = document.getElementById('sales-form');
    const statusSelect = document.getElementById('status-select');
    const paymentsSection = document.getElementById('payments-section');
    
    const calculate = () => {
      const amount = parseFloat(form.amount.value) || 0;
      const gstAmount = parseFloat(form.gstAmount.value) || 0;
      const netBill = amount + gstAmount;

      const totalPaid = currentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const balance = netBill - totalPaid;

      document.getElementById('display-net').innerText = `₹${netBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      document.getElementById('display-balance').innerText = `₹${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

      return { amount, gstAmount, netBill, balance };
    };

    const openPartialPaymentModal = () => {
      const { netBill } = calculate();
      const secondModal = document.createElement('div');
      secondModal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md';
      
      const renderSecondModal = () => {
        const totalAlreadyPaid = currentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const outstanding = netBill - totalAlreadyPaid;

        secondModal.innerHTML = `
          <div class="bg-white w-full max-w-lg border border-gray-200 shadow-2xl">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 class="text-xl font-bold text-gray-900 uppercase tracking-tight">Partial Payment</h2>
              <button id="close-partial" class="p-2 hover:bg-gray-100 transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            
            <div class="p-8 space-y-6">
              <div class="bg-[#1e2a38] p-6 text-white text-center">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Outstanding Amount</p>
                <h3 id="modal-outstanding" class="text-3xl font-black mt-1">₹${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>

              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paid Amount</label>
                  <div class="flex gap-2">
                    <input type="number" id="partial-amount-input" placeholder="Enter Amount" class="flex-1 px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold text-lg" />
                    <button type="button" id="pay-remaining-btn" class="px-4 bg-[#ffcd00] text-[#1e2a38] text-[10px] font-bold uppercase tracking-widest hover:bg-[#e6b800] transition-colors">
                      Pay Remaining
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</label>
                  <select id="partial-method-select" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-bold">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <button type="button" id="create-new-payment-btn" class="w-full py-3 bg-[#1e2a38] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2c3e50] transition-all">
                  Create New Payment
                </button>
              </div>

              <div class="pt-4 border-t border-gray-100">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Payments</p>
                <div class="max-h-40 overflow-y-auto space-y-2">
                  ${currentPayments.length === 0 ? '<p class="text-xs text-gray-400 italic">No payments added yet</p>' : ''}
                  ${currentPayments.map((p, i) => `
                    <div class="flex justify-between items-center text-xs p-2 bg-gray-50 border border-gray-100 font-bold">
                      <div>
                        <span class="text-gray-900">₹${p.amount.toLocaleString()}</span>
                        <span class="text-gray-400 ml-2">via ${p.method}</span>
                      </div>
                      <button type="button" class="text-[#f44336] hover:bg-red-50 p-1" onclick="this.dispatchEvent(new CustomEvent('remove-pay', { detail: ${i}, bubbles: true }))">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="p-6 bg-gray-50 flex justify-end gap-3">
              <button id="cancel-partial" class="px-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest">Cancel</button>
              <button id="done-partial" class="px-8 py-2 bg-[#1e2a38] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2c3e50]">Done</button>
            </div>
          </div>
        `;

        window.renderIcons();

        const amountInput = secondModal.querySelector('#partial-amount-input');
        const outstandingDisplay = secondModal.querySelector('#modal-outstanding');

        amountInput.oninput = (e) => {
          const typed = parseFloat(e.target.value) || 0;
          const currentOutstanding = outstanding - typed;
          outstandingDisplay.innerText = `₹${currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          
          if (typed > outstanding) {
            outstandingDisplay.classList.add('text-[#f44336]');
          } else {
            outstandingDisplay.classList.remove('text-[#f44336]');
          }
        };

        secondModal.querySelector('#pay-remaining-btn').onclick = () => {
          amountInput.value = outstanding;
          amountInput.dispatchEvent(new Event('input'));
        };

        secondModal.querySelector('#create-new-payment-btn').onclick = () => {
          const amt = parseFloat(amountInput.value) || 0;
          if (amt <= 0) return;
          
          if (amt > outstanding) {
            alert(`You have to give ₹${(amt - outstanding).toLocaleString()} to the customer ${form.customer.value}`);
          }

          const method = secondModal.querySelector('#partial-method-select').value;
          currentPayments.push({ amount: amt, method, date: new Date().toISOString().split('T')[0] });
          renderSecondModal();
        };

        secondModal.onremovepay = (e) => {
          currentPayments.splice(e.detail, 1);
          renderSecondModal();
        };
        // Standard event listener for the custom event
        secondModal.addEventListener('remove-pay', (e) => {
          currentPayments.splice(e.detail, 1);
          renderSecondModal();
        });

        secondModal.querySelector('#close-partial').onclick = () => secondModal.remove();
        secondModal.querySelector('#cancel-partial').onclick = () => secondModal.remove();
        secondModal.querySelector('#done-partial').onclick = () => {
          calculate();
          secondModal.remove();
        };
      };

      document.body.appendChild(secondModal);
      renderSecondModal();
    };

    form.oninput = (e) => {
      const { amount, gstAmount, netBill } = calculate();
      
      // Save draft
      if (!isEditing) {
        const draftData = {
          ...initialData,
          invoiceNumber: form.invoiceNumber.value,
          date: form.date.value,
          customer: form.customer.value,
          amount,
          gstAmount,
          netBill,
          status: statusSelect.value,
          payments: currentPayments
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      }
    };

    statusSelect.onchange = (e) => {
      const status = e.target.value;
      const manageBtn = document.getElementById('manage-payments-btn');
      if (status === 'Partially') {
        manageBtn.classList.remove('hidden');
        openPartialPaymentModal();
      } else {
        manageBtn.classList.add('hidden');
        if (status === 'Paid') {
          const { netBill } = calculate();
          currentPayments = [{ amount: netBill, date: form.date.value, method: 'Cash' }];
        } else {
          currentPayments = [];
        }
      }
      calculate();
    };

    document.getElementById('manage-payments-btn').onclick = openPartialPaymentModal;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const { amount, gstAmount, netBill } = calculate();
      
      const entryData = {
        ...initialData,
        invoiceNumber: form.invoiceNumber.value,
        date: form.date.value,
        customer: form.customer.value,
        amount,
        gstAmount,
        netBill,
        status: statusSelect.value,
        payments: currentPayments
      };

      await saveSalesEntry(entryData);
      if (!isEditing) localStorage.removeItem(draftKey);
      modal.classList.add('hidden');
    };

    document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
    
    calculate();
  };

  renderModalContent();
}

window.deleteSales = async (id) => {
  if (confirm('Are you sure you want to delete this invoice?')) {
    await deleteSalesEntry(id);
  }
};

window.printInvoice = (id) => {
  const entry = state.company.modules.sales.find(s => s.id === id);
  if (!entry) return;

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('TAX INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(state.company.company_name, 20, 40);
  doc.text(state.company.address || 'Address not set', 20, 45);
  doc.text(`GSTIN: ${state.company.gst_number || 'N/A'}`, 20, 50);
  
  doc.text(`Invoice No: ${entry.invoiceNumber}`, 140, 40);
  doc.text(`Date: ${entry.date}`, 140, 45);
  
  doc.line(20, 60, 190, 60);
  
  doc.text('Bill To:', 20, 70);
  doc.text(entry.customer, 20, 75);
  
  // Table
  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Amount (₹)']],
    body: [
      ['Sales Amount (Without GST)', entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ['GST Amount', entry.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]
    ],
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.text(`Grand Total: ₹${entry.netBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 140, finalY + 10);
  
  doc.save(`${entry.invoiceNumber}.pdf`);
};
