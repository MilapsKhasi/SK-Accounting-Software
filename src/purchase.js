import { state, savePurchaseEntry, cancelPurchaseEntry, deletePurchaseEntry } from './state';

export function renderPurchase(container) {
  const { company } = state;
  const purchases = company.modules.purchase;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-medium text-gray-900 tracking-tight">Purchase Invoices</h1>
          <p class="text-gray-500 mt-1">Manage your purchase entries and bills</p>
        </div>
        <button id="new-purchase-btn" class="flex items-center gap-2 px-4 py-2 bg-[#1e2a38] text-white hover:bg-[#2c3e50] transition-colors text-sm font-medium uppercase tracking-widest">
          <i data-lucide="plus" class="w-4 h-4"></i> New Purchase Entry
        </button>
      </header>

      <div class="bg-white border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Bill No</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Vendor</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Item</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Net Bill</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Status</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${purchases.map(entry => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${entry.id}">
                  <td class="px-6 py-4 font-mono text-sm font-medium text-gray-900">${entry.billNumber}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.date}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    <button class="hover:text-[#1e2a38] hover:underline text-left font-medium" onclick="event.stopPropagation(); const v = state.company.modules.vendors.find(vend => vend.name === '${entry.vendor}'); if(v) window.navigateToLedger('vendor', v.id)">
                      ${entry.vendor}
                    </button>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.itemName}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${entry.amount.toLocaleString()}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">₹${entry.netBill.toLocaleString()}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                       entry.status === 'Paid' ? 'bg-green-50 text-green-700' :
                       entry.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                       'bg-red-50 text-red-700'
                    }">
                      ${entry.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onclick="event.stopPropagation(); window.deletePurchase('${entry.id}')">
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
    <div id="purchase-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  // Event Listeners
  document.getElementById('new-purchase-btn').onclick = () => openPurchaseModal();
  
  document.querySelectorAll('tbody tr').forEach(row => {
    row.onclick = () => {
      const entry = purchases.find(p => p.id === row.dataset.id);
      if (entry) openPurchaseModal(entry);
    };
  });
}

function openPurchaseModal(entry = null) {
  const modal = document.getElementById('purchase-modal');
  modal.classList.remove('hidden');

  const isEditing = !!entry;

  // Helper to get next PB number
  const getNextPB = () => {
    const purchases = state.company.modules.purchase;
    const nums = purchases.map(p => {
      const match = p.billNumber?.match(/PB-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `PB-${String(max + 1).padStart(3, '0')}`;
  };

  // Load draft if not editing
  const draftKey = 'draft_purchase_entry';
  const draft = !isEditing ? JSON.parse(localStorage.getItem(draftKey)) : null;

  const initialData = entry || draft || {
    id: crypto.randomUUID(),
    billNumber: getNextPB(),
    date: new Date().toISOString().split('T')[0],
    vendor: '',
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
          <h2 class="text-xl font-medium text-gray-900 uppercase tracking-tight">${isEditing ? 'Edit' : 'New'} Purchase Entry</h2>
          <button id="close-modal" class="p-2 hover:bg-gray-100 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <form id="purchase-form" class="p-8 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Bill Number</label>
              <input name="billNumber" value="${initialData.billNumber}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Date</label>
              <input type="date" name="date" value="${initialData.date}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Party Name</label>
              <input name="vendor" value="${initialData.vendor}" list="vendors-list" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" required />
              <datalist id="vendors-list">
                ${state.company.modules.vendors.map(v => `<option value="${v.name}">`).join('')}
              </datalist>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Without GST (₹)</label>
              <input type="number" name="amount" value="${initialData.amount}" step="0.01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" required />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">GST (₹)</label>
              <input type="number" name="gstAmount" value="${initialData.gstAmount}" step="0.01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Status</label>
              <div class="flex gap-2">
                <select name="status" id="status-select" class="flex-1 px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium">
                  <option value="Pending" ${initialData.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Partially" ${initialData.status === 'Partially' ? 'selected' : ''}>Partially</option>
                  <option value="Paid" ${initialData.status === 'Paid' ? 'selected' : ''}>Paid</option>
                </select>
                <button type="button" id="manage-payments-btn" class="${initialData.status === 'Partially' ? '' : 'hidden'} px-3 bg-[#ffcd00] text-[#1e2a38] text-[10px] font-medium uppercase tracking-widest flex items-center gap-1">
                  <i data-lucide="wallet" class="w-3 h-3"></i> Manage
                </button>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 space-y-4 border border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-gray-900 font-medium uppercase tracking-widest text-sm">Grand Total</span>
              <span id="display-net" class="text-2xl font-medium text-[#1e2a38]">₹0.00</span>
            </div>
            <div id="balance-row" class="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
              <span class="text-gray-500 font-medium text-[10px] uppercase tracking-widest">Balance Due</span>
              <span id="display-balance" class="font-medium text-[#f44336]">₹0.00</span>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" id="cancel-modal" class="px-6 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
            <button type="submit" class="px-8 py-2.5 bg-[#1e2a38] text-white text-xs font-medium hover:bg-[#2c3e50] transition-all uppercase tracking-widest">Save Bill</button>
          </div>
        </form>
      </div>
     </div>
    `;

    window.renderIcons();
    attachModalListeners();
  };

  const attachModalListeners = () => {
    const form = document.getElementById('purchase-form');
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
      secondModal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/30 backdrop-blur-[2px]';
      
      const renderSecondModal = () => {
        const totalAlreadyPaid = currentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const outstanding = netBill - totalAlreadyPaid;

        secondModal.innerHTML = `
          <div class="bg-white w-full max-w-lg border border-gray-200 shadow-xl overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 class="text-xl font-medium text-gray-900 capitalize tracking-tight">Partial Payment</h2>
              <button id="close-partial" class="p-2 hover:bg-gray-100 transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            
            <div class="p-8 space-y-6">
              <div class="bg-gray-100 p-6 text-[#1e2a38] text-center border border-gray-200">
                <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500">Outstanding Amount</p>
                <h3 id="modal-outstanding" class="text-3xl font-medium mt-1">₹${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>

              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Paid Amount</label>
                  <div class="flex gap-2">
                    <input type="number" id="partial-amount-input" placeholder="Enter Amount" class="flex-1 px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium text-lg" />
                    <button type="button" id="pay-remaining-btn" class="px-4 bg-[#ffcd00] text-[#1e2a38] text-[10px] font-normal capitalize tracking-widest hover:bg-[#e6b800] transition-colors">
                      Pay Remaining
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Method</label>
                  <select id="partial-method-select" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <button type="button" id="create-new-payment-btn" class="w-full py-3 bg-[#1e2a38] text-white text-xs font-normal capitalize tracking-widest hover:bg-[#2c3e50] transition-all">
                  Create New Payment
                </button>
              </div>

              <div class="pt-4 border-t border-gray-100">
                <p class="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Recent Payments</p>
                <div class="max-h-40 overflow-y-auto space-y-2">
                  ${currentPayments.length === 0 ? '<p class="text-xs text-gray-400 italic">No payments added yet</p>' : ''}
                  ${currentPayments.map((p, i) => `
                    <div class="flex justify-between items-center text-xs p-2 bg-gray-50 border border-gray-100 font-medium">
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
              <button id="cancel-partial" class="px-6 py-2 text-xs font-normal text-gray-500 hover:text-gray-900 capitalize tracking-widest">Cancel</button>
              <button id="done-partial" class="px-8 py-2 bg-[#1e2a38] text-white text-xs font-normal capitalize tracking-widest hover:bg-[#2c3e50]">Done</button>
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
            alert(`You have to give ₹${(amt - outstanding).toLocaleString()} to the vendor ${form.vendor.value}`);
          }

          const method = secondModal.querySelector('#partial-method-select').value;
          currentPayments.push({ amount: amt, method, date: new Date().toISOString().split('T')[0] });
          renderSecondModal();
        };

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
          billNumber: form.billNumber.value,
          date: form.date.value,
          vendor: form.vendor.value,
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
        billNumber: form.billNumber.value,
        date: form.date.value,
        vendor: form.vendor.value,
        amount,
        gstAmount,
        netBill,
        status: statusSelect.value,
        payments: currentPayments
      };

      await savePurchaseEntry(entryData);
      if (!isEditing) localStorage.removeItem(draftKey);
      modal.classList.add('hidden');
    };

    document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
    
    calculate();
  };

  renderModalContent();
}

window.deletePurchase = async (id) => {
  if (confirm('Are you sure you want to delete this bill?')) {
    await deletePurchaseEntry(id);
  }
};
