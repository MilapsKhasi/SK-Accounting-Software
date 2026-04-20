import { state, saveCompany, switchCompany, deleteCompany, cleanupSubscriptions } from './state';
import { supabase } from './lib/supabase';

export function renderCompanies(container) {
  const { companies } = state;

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-8">
      <div class="w-full max-w-4xl space-y-8">
        <header class="text-center space-y-2 relative">
          <div class="flex justify-center mb-6">
            <img src="/logo.svg" alt="SK Accounting Logo" class="h-16" referrerPolicy="no-referrer" />
          </div>
          <h1 class="text-3xl font-medium text-gray-900 tracking-tight">Your Companies</h1>
          <p class="text-gray-500 uppercase text-[10px] font-medium tracking-widest">Select a company to manage or create a new one</p>
          
          <button id="company-logout-btn" class="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-[#f44336] transition-colors text-xs font-medium uppercase tracking-widest">
            <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
          </button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Add Company Card -->
          <button id="add-company-btn" class="bg-white border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-4 hover:border-[#1e2a38] hover:bg-gray-50 transition-all group">
            <div class="w-12 h-12 bg-gray-50 flex items-center justify-center group-hover:bg-[#1e2a38] transition-colors">
              <i data-lucide="plus" class="w-6 h-6 text-gray-400 group-hover:text-white"></i>
            </div>
            <span class="text-xs font-medium text-gray-900 uppercase tracking-widest">Add New Company</span>
          </button>

          ${companies.map(company => `
            <div class="bg-white border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all group relative">
              <div class="space-y-4 cursor-pointer" onclick="window.enterCompany('${company.id}')">
                <div class="flex justify-between items-start">
                  <div class="w-10 h-10 bg-[#1e2a38] flex items-center justify-center text-white font-medium">
                    ${company.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1.5 text-gray-400 hover:text-[#1e2a38] hover:bg-gray-100" onclick="event.stopPropagation(); window.editCompany('${company.id}')">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-[#f44336] hover:bg-red-50" onclick="event.stopPropagation(); window.removeCompany('${company.id}')">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 tracking-tight">${company.name}</h3>
                  <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">${company.gstin || 'No GSTIN'}</p>
                </div>
              </div>
              <button onclick="window.enterCompany('${company.id}')" class="mt-6 w-full py-2 bg-gray-50 text-[#1e2a38] hover:bg-[#1e2a38] hover:text-white text-xs font-medium uppercase tracking-widest transition-all">
                Enter Dashboard
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Modal Placeholder -->
    <div id="company-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"></div>
  `;

  window.renderIcons();

  document.getElementById('company-logout-btn').onclick = () => {
    cleanupSubscriptions();
    supabase.auth.signOut();
  };

  document.getElementById('add-company-btn').onclick = () => openCompanyModal();

  window.enterCompany = async (id) => {
    const company = companies.find(c => c.id === id);
    if (company) {
      await switchCompany(company);
    }
  };

  window.editCompany = (id) => {
    const company = companies.find(c => c.id === id);
    if (company) openCompanyModal(company);
  };

  window.removeCompany = async (id) => {
    if (confirm('Are you sure you want to delete this company? All its data will be permanently removed.')) {
      await deleteCompany(id);
      renderCompanies(container);
    }
  };
}

function openCompanyModal(company = null) {
  const modal = document.getElementById('company-modal');
  modal.classList.remove('hidden');

  const isEditing = !!company;
  const initialData = company || { name: '', gstin: '', address: '' };

  modal.innerHTML = `
    <div class="bg-white w-full max-w-lg border border-gray-100 shadow-2xl">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-xl font-medium text-gray-900 uppercase tracking-tight">${isEditing ? 'Edit' : 'Add'} Company</h2>
        <button id="close-modal" class="p-2 hover:bg-gray-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <form id="company-form" class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Company Name</label>
          <input name="name" value="${initialData.name}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" required placeholder="e.g. SK Enterprise" />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">GSTIN (Optional)</label>
          <input name="gstin" value="${initialData.gstin}" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-mono font-medium uppercase" placeholder="22AAAAA0000A1Z5" />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">Address</label>
          <textarea name="address" rows="3" class="w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-[#1e2a38] outline-none transition-all font-medium" placeholder="Full Business Address">${initialData.address}</textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-8">
          <button type="button" id="cancel-modal" class="px-6 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 uppercase tracking-widest">Cancel</button>
          <button type="submit" class="px-8 py-2.5 bg-[#1e2a38] text-white text-xs font-medium hover:bg-[#2c3e50] transition-all uppercase tracking-widest">
            ${isEditing ? 'Update' : 'Create'} Company
          </button>
        </div>
      </form>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('company-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const companyData = {
        ...initialData,
        name: form.name.value,
        gstin: form.gstin.value,
        address: form.address.value
      };
      await saveCompany(companyData);
      modal.classList.add('hidden');
      renderCompanies(document.getElementById('app')); // Special case if we are on selection screen
    } catch (err) {
      alert('Error saving company. Please try again.');
    }
  };

  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  document.getElementById('cancel-modal').onclick = () => modal.classList.add('hidden');
}
