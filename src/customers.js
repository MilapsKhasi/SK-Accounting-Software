import { state, saveCustomer, deleteCustomer } from './state';

export function renderCustomers(container) {
  const customers = state.company.modules.customers;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-medium text-gray-900 tracking-tight">Customer Master</h1>
          <p class="text-gray-500 mt-1">Manage your clients and customers</p>
        </div>
        <button id="new-customer-btn" class="flex items-center gap-2 px-4 py-2 bg-[#1e2a38] text-white hover:bg-[#2c3e50] transition-colors text-xs font-medium uppercase tracking-widest">
          <i data-lucide="plus" class="w-4 h-4"></i> Add New Customer
        </button>
      </header>

      <div class="bg-white border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Customer Name</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">GSTIN</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Contact Person</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Phone</th>
                <th class="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${customers.map(customer => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${customer.id}">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">${customer.name}</td>
                  <td class="px-6 py-4 font-mono text-sm text-gray-500">${customer.gstin || 'N/A'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${customer.contactPerson || 'N/A'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${customer.phone || 'N/A'}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1.5 text-gray-400 hover:text-[#1e2a38] hover:bg-gray-100 transition-colors" title="View Ledger" onclick="event.stopPropagation(); window.navigateToLedger('customer', '${customer.id}')">
                        <i data-lucide="book-open" class="w-4 h-4"></i>
                      </button>
                      <button class="p-1.5 text-gray-400 hover:text-[#f44336] hover:bg-red-50 transition-colors" onclick="event.stopPropagation(); window.deleteCustomer('${customer.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${customers.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">No customers found. Add your first customer to get started.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Placeholder -->
    <div id="customer-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  document.getElementById('new-customer-btn').onclick = () => openCustomerModal();
  
  document.querySelectorAll('tbody tr[data-id]').forEach(row => {
    row.onclick = () => {
      const customer = customers.find(c => c.id === row.dataset.id);
      if (customer) openCustomerModal(customer);
    };
  });
}

function openCustomerModal(customer = null) {
  const modal = document.getElementById('customer-modal');
  modal.classList.remove('hidden');

  const isEditing = !!customer;
  const initialData = customer || {
    id: crypto.randomUUID(),
    name: '',
    gstin: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    createdAt: new Date().toISOString()
  };

  modal.innerHTML = `
    <div class="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 class="text-xl font-medium text-gray-900 uppercase tracking-tight">${isEditing ? 'Edit' : 'Add'} Customer</h2>
        <button id="close-modal" class="p-2 hover:bg-gray-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <form id="customer-form" class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Customer Name</label>
          <input name="name" value="${initialData.name}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">GSTIN</label>
            <input name="gstin" value="${initialData.gstin}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-mono font-medium" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Contact Person</label>
            <input name="contactPerson" value="${initialData.contactPerson}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Email</label>
            <input type="email" name="email" value="${initialData.email}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Phone</label>
            <input name="phone" value="${initialData.phone}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Address</label>
          <textarea name="address" rows="3" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium">${initialData.address}</textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" id="cancel-modal" class="px-6 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
          <button type="submit" class="px-8 py-2.5 bg-[#1e2a38] text-white text-xs font-medium hover:bg-[#2c3e50] transition-all uppercase tracking-widest">Save Customer</button>
        </div>
      </form>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('customer-form');
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const customerData = {
      ...initialData,
      name: form.name.value,
      gstin: form.gstin.value,
      contactPerson: form.contactPerson.value,
      email: form.email.value,
      phone: form.phone.value,
      address: form.address.value
    };

    await saveCustomer(customerData);
    modal.classList.add('hidden');
  };

  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
}

window.deleteCustomer = async (id) => {
  if (confirm('Are you sure you want to delete this customer?')) {
    await deleteCustomer(id);
  }
};
