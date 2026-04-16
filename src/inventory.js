import { state, saveInventory, deleteInventory } from './state';

export function renderInventory(container) {
  const inventory = state.company.modules.inventory;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
          <p class="text-gray-500 mt-1">Monitor and manage your stock levels</p>
        </div>
        <button id="new-inventory-btn" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
          <i data-lucide="plus" class="w-4 h-4"></i> Add New Item
        </button>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Items</p>
          <p class="text-2xl font-bold mt-1">${inventory.length}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Low Stock Items</p>
          <p class="text-2xl font-bold mt-1 text-red-600">${inventory.filter(i => i.quantity <= (i.min_stock || 0)).length}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Stock Value</p>
          <p class="text-2xl font-bold mt-1 text-indigo-600">₹${state.company.reports_snapshot.stock_value.toLocaleString()}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Item Name</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">SKU / HSN</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Quantity</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${inventory.map(item => `
                <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer group" data-id="${item.id}">
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-gray-900">${item.name}</p>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wider">${item.unit || 'Units'}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm font-mono text-gray-500">${item.sku || 'N/A'}</p>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wider">HSN: ${item.hsn_code || 'N/A'}</p>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${item.category || 'General'}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm font-bold ${item.quantity <= (item.min_stock || 0) ? 'text-red-600' : 'text-gray-900'}">
                      ${item.quantity}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">₹${(item.price || 0).toLocaleString()}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onclick="event.stopPropagation(); window.deleteInventory('${item.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${inventory.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">No inventory items found. Add your first item to get started.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Placeholder -->
    <div id="inventory-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  document.getElementById('new-inventory-btn').onclick = () => openInventoryModal();
  
  document.querySelectorAll('tbody tr[data-id]').forEach(row => {
    row.onclick = () => {
      const item = inventory.find(i => i.id === row.dataset.id);
      if (item) openInventoryModal(item);
    };
  });
}

function openInventoryModal(item = null) {
  const modal = document.getElementById('inventory-modal');
  modal.classList.remove('hidden');

  const isEditing = !!item;
  const initialData = item || {
    id: crypto.randomUUID(),
    name: '',
    sku: '',
    hsnCode: '',
    quantity: 0,
    unit: 'Units',
    minStock: 5,
    price: 0,
    category: 'General'
  };

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 class="text-xl font-bold text-gray-900">${isEditing ? 'Edit' : 'Add'} Inventory Item</h2>
        <button id="close-modal" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <form id="inventory-form" class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Item Name</label>
          <input name="name" value="${initialData.name}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">SKU</label>
            <input name="sku" value="${initialData.sku || ''}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">HSN Code</label>
            <input name="hsnCode" value="${initialData.hsn_code || initialData.hsnCode || ''}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
            <input type="number" name="quantity" value="${initialData.quantity}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Unit</label>
            <select name="unit" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
              <option value="Units" ${initialData.unit === 'Units' ? 'selected' : ''}>Units</option>
              <option value="Kg" ${initialData.unit === 'Kg' ? 'selected' : ''}>Kg</option>
              <option value="Litre" ${initialData.unit === 'Litre' ? 'selected' : ''}>Litre</option>
              <option value="Box" ${initialData.unit === 'Box' ? 'selected' : ''}>Box</option>
              <option value="Pcs" ${initialData.unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Stock Level</label>
            <input type="number" name="minStock" value="${initialData.min_stock || initialData.minStock}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (₹)</label>
            <input type="number" name="price" value="${initialData.price}" step="0.01" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
            <input name="category" value="${initialData.category}" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" id="cancel-modal" class="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
          <button type="submit" class="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Save Item</button>
        </div>
      </form>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('inventory-form');
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      ...initialData,
      name: form.name.value,
      sku: form.sku.value,
      hsnCode: form.hsnCode.value,
      quantity: parseFloat(form.quantity.value),
      unit: form.unit.value,
      minStock: parseFloat(form.minStock.value),
      price: parseFloat(form.price.value),
      category: form.category.value
    };

    await saveInventory(itemData);
    modal.classList.add('hidden');
  };

  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
}

window.deleteInventory = async (id) => {
  if (confirm('Are you sure you want to delete this item?')) {
    await deleteInventory(id);
  }
};
