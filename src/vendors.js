import { state, saveVendor, deleteVendor } from './state';

export function renderVendors(container) {
  const vendors = state.company.modules.vendors;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Vendor Master</h1>
          <p class="text-gray-500 mt-1">Manage your suppliers and vendors</p>
        </div>
        <button id="new-vendor-btn" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
          <i data-lucide="plus" class="w-4 h-4"></i> Add New Vendor
        </button>
      </header>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor Name</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">GSTIN</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Person</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${vendors.map(vendor => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${vendor.id}">
                  <td class="px-6 py-4 text-sm font-bold text-gray-900">${vendor.name}</td>
                  <td class="px-6 py-4 font-mono text-sm text-gray-500">${vendor.gstin || 'N/A'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${vendor.contactPerson || 'N/A'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${vendor.phone || 'N/A'}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Ledger" onclick="event.stopPropagation(); window.navigateToLedger('vendor', '${vendor.id}')">
                        <i data-lucide="book-open" class="w-4 h-4"></i>
                      </button>
                      <button class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onclick="event.stopPropagation(); window.deleteVendor('${vendor.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${vendors.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">No vendors found. Add your first vendor to get started.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Placeholder -->
    <div id="vendor-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  document.getElementById('new-vendor-btn').onclick = () => openVendorModal();
  
  document.querySelectorAll('tbody tr[data-id]').forEach(row => {
    row.onclick = () => {
      const vendor = vendors.find(v => v.id === row.dataset.id);
      if (vendor) openVendorModal(vendor);
    };
  });
}

function openVendorModal(vendor = null) {
  const modal = document.getElementById('vendor-modal');
  modal.classList.remove('hidden');

  const isEditing = !!vendor;
  const initialData = vendor || {
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
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 class="text-xl font-bold text-gray-900">${isEditing ? 'Edit' : 'Add'} Vendor</h2>
        <button id="close-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <form id="vendor-form" class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor Name</label>
          <input name="name" value="${initialData.name}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">GSTIN</label>
            <input name="gstin" value="${initialData.gstin}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Person</label>
            <input name="contactPerson" value="${initialData.contactPerson}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
            <input type="email" name="email" value="${initialData.email}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</label>
            <input name="phone" value="${initialData.phone}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</label>
          <textarea name="address" rows="3" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">${initialData.address}</textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" id="cancel-modal" class="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
          <button type="submit" class="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Save Vendor</button>
        </div>
      </form>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('vendor-form');
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const vendorData = {
      ...initialData,
      name: form.name.value,
      gstin: form.gstin.value,
      contactPerson: form.contactPerson.value,
      email: form.email.value,
      phone: form.phone.value,
      address: form.address.value
    };

    await saveVendor(vendorData);
    modal.classList.add('hidden');
  };

  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
}

window.deleteVendor = async (id) => {
  if (confirm('Are you sure you want to delete this vendor?')) {
    await deleteVendor(id);
  }
};
