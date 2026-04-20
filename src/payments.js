import { state, saveSalesEntry, savePurchaseEntry, saveCustomer, saveVendor, notify } from './state';

export function openGlobalPaymentModal(type, partyId) {
  const party = type === 'customer' 
    ? state.company.modules.customers.find(c => c.id === partyId)
    : state.company.modules.vendors.find(v => v.id === partyId);

  if (!party) return;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm';
  
  const getPendingItems = () => {
    const items = [];
    
    // Add Opening Balance if not settled
    const openingDue = (party.openingBalance || 0) - (party.openingBalancePaid || 0);
    if (openingDue > 0) {
      items.push({
        id: 'opening',
        type: 'Opening Balance',
        date: party.openingBalanceDate || party.createdAt.split('T')[0],
        total: party.openingBalance,
        paid: party.openingBalancePaid || 0,
        due: openingDue,
        ref: 'OPENING'
      });
    }

    // Add Pending Invoices/Bills
    if (type === 'customer') {
      const sales = state.company.modules.sales.filter(s => s.customer === party.name && (s.status === 'Pending' || s.status === 'Partially'));
      sales.forEach(s => {
        const paid = (s.payments || []).reduce((sum, p) => sum + p.amount, 0);
        items.push({
          id: s.id,
          type: 'Invoice',
          date: s.date,
          total: s.netBill,
          paid: paid,
          due: s.netBill - paid,
          ref: s.invoiceNumber,
          original: s
        });
      });
    } else {
      const purchases = state.company.modules.purchase.filter(p => p.vendor === party.name && (p.status === 'Pending' || p.status === 'Partially'));
      purchases.forEach(p => {
        const paid = (p.payments || []).reduce((sum, pay) => sum + pay.amount, 0);
        items.push({
          id: p.id,
          type: 'Bill',
          date: p.date,
          total: p.netBill,
          paid: paid,
          due: p.netBill - paid,
          ref: p.billNumber,
          original: p
        });
      });
    }

    return items;
  };

  let selectedItems = new Set();
  let paymentAmount = 0;
  let paymentMethod = 'Cash';
  let paymentDate = new Date().toISOString().split('T')[0];

  const render = () => {
    const pendingItems = getPendingItems();
    const totalSelectedDue = Array.from(selectedItems).reduce((sum, id) => {
      const item = pendingItems.find(i => i.id === id);
      return sum + (item ? item.due : 0);
    }, 0);

    modal.innerHTML = `
      <div class="bg-white w-full max-w-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <div>
            <h2 class="text-xl font-medium text-gray-900 uppercase tracking-tight">${type === 'customer' ? 'Receive' : 'Make'} Payment</h2>
            <p class="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">${party.name}</p>
          </div>
          <button id="close-payment-modal" class="p-2 hover:bg-gray-100 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <!-- Pending Items Table -->
          <div class="space-y-4">
            <h3 class="text-[10px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Pending Dues</h3>
            <div class="border border-gray-200">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200 font-medium uppercase tracking-wider text-gray-500">
                    <th class="px-4 py-3 w-10">Select</th>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3">Type</th>
                    <th class="px-4 py-3">Ref No</th>
                    <th class="px-4 py-3 text-right">Total (₹)</th>
                    <th class="px-4 py-3 text-right">Paid (₹)</th>
                    <th class="px-4 py-3 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${pendingItems.length === 0 ? `
                    <tr>
                      <td colspan="7" class="px-4 py-12 text-center text-gray-400">No pending dues found for this party.</td>
                    </tr>
                  ` : pendingItems.map(item => `
                    <tr class="hover:bg-gray-50 transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-blue-50/30' : ''}" onclick="this.querySelector('input').click()">
                      <td class="px-4 py-3" onclick="event.stopPropagation()">
                        <input type="checkbox" ${selectedItems.has(item.id) ? 'checked' : ''} data-id="${item.id}" class="item-checkbox w-4 h-4 text-[#1e2a38] border-gray-300 rounded focus:ring-[#1e2a38]" />
                      </td>
                      <td class="px-4 py-3">${item.date}</td>
                      <td class="px-4 py-3 font-medium uppercase text-[10px]">${item.type}</td>
                      <td class="px-4 py-3 font-mono">${item.ref}</td>
                      <td class="px-4 py-3 text-right">₹${item.total.toLocaleString()}</td>
                      <td class="px-4 py-3 text-right text-green-600">₹${item.paid.toLocaleString()}</td>
                      <td class="px-4 py-3 text-right font-medium text-[#f44336]">₹${item.due.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
                ${pendingItems.length > 0 ? `
                  <tfoot>
                    <tr class="bg-gray-50 font-medium">
                      <td colspan="6" class="px-4 py-3 text-right uppercase tracking-widest text-[10px]">Total Selected Balance</td>
                      <td class="px-4 py-3 text-right text-lg text-[#1e2a38]">₹${totalSelectedDue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            <div class="space-y-2">
              <label class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Amount to ${type === 'customer' ? 'Receive' : 'Pay'}</label>
              <input type="number" id="pay-total-input" value="${paymentAmount}" step="0.01" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium text-lg" />
              <button id="fill-full-btn" class="text-[10px] font-medium text-[#1e2a38] hover:underline uppercase tracking-widest">Pay Full Selected Amount</button>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Dated</label>
              <input type="date" id="pay-date-input" value="${paymentDate}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Method</label>
              <select id="pay-method-select" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium">
                <option value="Cash" ${paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                <option value="Bank" ${paymentMethod === 'Bank' ? 'selected' : ''}>Bank</option>
                <option value="UPI" ${paymentMethod === 'UPI' ? 'selected' : ''}>UPI</option>
                <option value="Cheque" ${paymentMethod === 'Cheque' ? 'selected' : ''}>Cheque</option>
              </select>
            </div>
          </div>
        </div>

        <div class="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0">
          <button id="cancel-payment-modal" class="px-6 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest">Cancel</button>
          <button id="process-payment-btn" class="px-10 py-2.5 bg-[#1e2a38] text-white text-xs font-medium hover:bg-[#2c3e50] transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed" ${selectedItems.size === 0 || paymentAmount <= 0 ? 'disabled' : ''}>
            ${type === 'customer' ? 'Receive' : 'Make'} Settlement
          </button>
        </div>
      </div>
    `;

    window.renderIcons();

    // Listeners
    modal.querySelector('#close-payment-modal').onclick = () => modal.remove();
    modal.querySelector('#cancel-payment-modal').onclick = () => modal.remove();
    
    modal.querySelectorAll('.item-checkbox').forEach(cb => {
      cb.onchange = (e) => {
        if (e.target.checked) selectedItems.add(e.target.dataset.id);
        else selectedItems.delete(e.target.dataset.id);
        render();
      };
    });

    const amountInput = modal.querySelector('#pay-total-input');
    amountInput.oninput = (e) => {
      paymentAmount = parseFloat(e.target.value) || 0;
      modal.querySelector('#process-payment-btn').disabled = (selectedItems.size === 0 || paymentAmount <= 0);
    };

    modal.querySelector('#fill-full-btn').onclick = () => {
      paymentAmount = totalSelectedDue;
      amountInput.value = paymentAmount;
      modal.querySelector('#process-payment-btn').disabled = (selectedItems.size === 0 || paymentAmount <= 0);
    };

    modal.querySelector('#pay-date-input').onchange = (e) => paymentDate = e.target.value;
    modal.querySelector('#pay-method-select').onchange = (e) => paymentMethod = e.target.value;

    modal.querySelector('#process-payment-btn').onclick = async () => {
      if (paymentAmount <= 0 || selectedItems.size === 0) return;
      
      let remainingPayment = paymentAmount;
      const itemsToProcess = pendingItems.filter(i => selectedItems.has(i.id));
      
      for (const item of itemsToProcess) {
        if (remainingPayment <= 0) break;
        
        const payForItem = Math.min(remainingPayment, item.due);
        remainingPayment -= payForItem;

        if (item.id === 'opening') {
          party.openingBalancePaid = (party.openingBalancePaid || 0) + payForItem;
          if (type === 'customer') await saveCustomer(party);
          else await saveVendor(party);
        } else {
          const original = item.original;
          if (!original.payments) original.payments = [];
          original.payments.push({
            amount: payForItem,
            date: paymentDate,
            method: paymentMethod
          });
          
          const totalPaid = original.payments.reduce((sum, p) => sum + p.amount, 0);
          if (totalPaid >= original.netBill) {
            original.status = 'Paid';
          } else {
            original.status = 'Partially';
          }

          if (type === 'customer') await saveSalesEntry(original);
          else await savePurchaseEntry(original);
        }
      }

      alert('Payment Settle successfully!');
      modal.remove();
      notify();
    };
  };

  document.body.appendChild(modal);
  render();
}

window.openGlobalPaymentModal = openGlobalPaymentModal;
