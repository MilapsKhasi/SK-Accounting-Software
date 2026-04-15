import { state, savePurchaseEntry, cancelPurchaseEntry, deletePurchaseEntry } from './state';

export function renderPurchase(container) {
  const { company } = state;
  const purchases = company.modules.purchase;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Purchase Invoices</h1>
          <p class="text-gray-500 mt-1">Manage your purchase entries and bills</p>
        </div>
        <button id="new-purchase-btn" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
          <i data-lucide="plus" class="w-4 h-4"></i> New Purchase Entry
        </button>
      </header>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Bill No</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Item</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Net Bill</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${purchases.map(entry => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${entry.id}">
                  <td class="px-6 py-4 font-mono text-sm font-bold text-gray-900">${entry.billNumber}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.date}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">${entry.vendor}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${entry.itemName}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${entry.amount.toLocaleString()}</td>
                  <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹${entry.netBill.toLocaleString()}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
  const initialData = entry || {
    id: crypto.randomUUID(),
    billNumber: `BILL-${Date.now().toString().slice(-6)}`,
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

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 class="text-xl font-bold text-gray-900">${isEditing ? 'Edit' : 'New'} Purchase Entry</h2>
        <button id="close-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <form id="purchase-form" class="p-8 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Bill Number</label>
            <input name="billNumber" value="${initialData.billNumber}" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold" readonly />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</label>
            <input type="date" name="date" value="${initialData.date}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor</label>
            <input name="vendor" value="${initialData.vendor}" list="vendors-list" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
            <datalist id="vendors-list">
              ${state.company.modules.vendors.map(v => `<option value="${v.name}">`).join('')}
            </datalist>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Item Name</label>
            <input name="itemName" value="${initialData.itemName}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">HSN Code</label>
            <input name="hsnCode" value="${initialData.hsnCode}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Rate (₹)</label>
            <input type="number" name="rate" value="${initialData.rate}" step="0.01" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
            <input type="number" name="qty" value="${initialData.qty}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Discount (%)</label>
            <input type="number" name="discountPercent" value="${initialData.discountPercent}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">GST (%)</label>
            <select name="gstPercent" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
              <option value="0" ${initialData.gstPercent === 0 ? 'selected' : ''}>0%</option>
              <option value="5" ${initialData.gstPercent === 5 ? 'selected' : ''}>5%</option>
              <option value="12" ${initialData.gstPercent === 12 ? 'selected' : ''}>12%</option>
              <option value="18" ${initialData.gstPercent === 18 ? 'selected' : ''}>18%</option>
              <option value="28" ${initialData.gstPercent === 28 ? 'selected' : ''}>28%</option>
            </select>
          </div>
        </div>

        <div class="bg-gray-50 p-6 rounded-2xl space-y-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500 font-medium">Gross Amount</span>
            <span id="display-amount" class="font-bold text-gray-900">₹0.00</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500 font-medium">Discounted Amount</span>
            <span id="display-discounted" class="font-bold text-gray-900">₹0.00</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500 font-medium">GST Amount</span>
            <span id="display-gst" class="font-bold text-gray-900">₹0.00</span>
          </div>
          <div class="h-[1px] bg-gray-200 my-2"></div>
          <div class="flex justify-between items-center">
            <span class="text-gray-900 font-bold">Net Bill Value</span>
            <span id="display-net" class="text-2xl font-black text-indigo-600">₹0.00</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" id="cancel-modal" class="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
          <button type="submit" class="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Save Bill</button>
        </div>
      </form>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('purchase-form');
  
  const calculate = () => {
    const rate = parseFloat(form.rate.value) || 0;
    const qty = parseFloat(form.qty.value) || 0;
    const discountPercent = parseFloat(form.discountPercent.value) || 0;
    const gstPercent = parseFloat(form.gstPercent.value) || 0;

    const amount = rate * qty;
    const discountedAmount = amount - (amount * (discountPercent / 100));
    const gstAmount = discountedAmount * (gstPercent / 100);
    const netBill = discountedAmount + gstAmount;

    document.getElementById('display-amount').innerText = `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('display-discounted').innerText = `₹${discountedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('display-gst').innerText = `₹${gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('display-net').innerText = `₹${netBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return { amount, discountedAmount, gstAmount, netBill };
  };

  form.oninput = calculate;
  calculate();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const { amount, discountedAmount, gstAmount, netBill } = calculate();
    
    const entryData = {
      ...initialData,
      date: form.date.value,
      vendor: form.vendor.value,
      itemName: form.itemName.value,
      hsnCode: form.hsnCode.value,
      rate: parseFloat(form.rate.value),
      qty: parseFloat(form.qty.value),
      discountPercent: parseFloat(form.discountPercent.value),
      gstPercent: parseFloat(form.gstPercent.value),
      amount,
      discountedAmount,
      gstAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      netBill,
      status: 'Pending'
    };

    await savePurchaseEntry(entryData);
    modal.classList.add('hidden');
  };

  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
}

window.deletePurchase = async (id) => {
  if (confirm('Are you sure you want to delete this bill?')) {
    await deletePurchaseEntry(id);
  }
};
