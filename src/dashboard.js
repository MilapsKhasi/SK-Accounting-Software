import { state, subscribe, setupSubscriptions, cleanupSubscriptions } from './state';
import { supabase } from './lib/supabase';
import { renderSales } from './sales';
import { renderPurchase } from './purchase';
import { renderVendors } from './vendors';
import { renderCustomers } from './customers';
import { renderInventory } from './inventory';
import { renderGSTSummary } from './gst-summary';
import { renderReports } from './reports';
import { renderLedger } from './ledger';

let activeTab = 'dashboard';
let isSidebarOpen = true;

export function renderDashboard(container) {
  setupSubscriptions();

  const unsubscribe = subscribe(() => {
    updateUI(container);
  });

  updateUI(container);

  // Initial icon render
  window.renderIcons();
}

function updateUI(container) {
  if (state.loading) {
    container.innerHTML = `
      <div class="min-h-screen bg-white flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading SK Accounting...</p>
        </div>
      </div>
    `;
    return;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'sales', label: 'Sales Invoices', icon: 'trending-up' },
    { id: 'purchase', label: 'Purchase Invoices', icon: 'shopping-cart' },
    { id: 'inventory', label: 'Inventory', icon: 'package' },
    { id: 'vendors', label: 'Vendor Master', icon: 'users' },
    { id: 'customers', label: 'Customer Master', icon: 'users' },
    { id: 'gst-summary', label: 'GST Summary', icon: 'file-text' },
    { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
    { id: 'ledger', label: 'Party Ledger', icon: 'book-open' },
    { id: 'system', label: 'System Info', icon: 'info' },
  ];

  const { company } = state;

  container.innerHTML = `
    <div class="min-h-screen bg-[#F9FAFB] flex font-sans text-gray-900">
      <!-- Sidebar -->
      <aside id="sidebar" class="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-20 shadow-sm transition-all duration-300" style="width: ${isSidebarOpen ? '280px' : '80px'}">
        <div class="p-6 flex items-center gap-3 border-b border-gray-50">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
            <i data-lucide="building-2" class="text-white w-6 h-6"></i>
          </div>
          <span class="font-bold text-lg tracking-tight truncate ${isSidebarOpen ? '' : 'hidden'}">SK Accounting</span>
        </div>

        <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
          ${navItems.map(item => `
            <button data-tab="${item.id}" class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}">
              <i data-lucide="${item.icon}" class="w-5 h-5 flex-shrink-0"></i>
              <span class="${isSidebarOpen ? '' : 'hidden'}">${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="p-4 border-t border-gray-50 space-y-2">
          <button id="logout-btn" class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50">
            <i data-lucide="log-out" class="w-5 h-5 flex-shrink-0"></i>
            <span class="font-medium ${isSidebarOpen ? '' : 'hidden'}">Sign Out</span>
          </button>
          <button id="toggle-sidebar" class="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
            <i data-lucide="${isSidebarOpen ? 'x' : 'menu'}" class="w-5 h-5"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0">
        <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-400 uppercase tracking-widest">Active Company</span>
            <div class="h-4 w-[1px] bg-gray-200 mx-2"></div>
            <span class="text-sm font-bold text-gray-900">${company.company_name}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-xs font-bold text-gray-900 truncate max-w-[150px]">${state.session.user.email}</p>
              <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Session</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
              ${state.session.user.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div id="content-area" class="flex-1 overflow-y-auto">
          ${renderActiveTab()}
        </div>
      </main>
    </div>
  `;

  window.renderIcons();

  // Event Listeners
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      updateUI(container);
    };
  });

  document.getElementById('logout-btn').onclick = () => {
    cleanupSubscriptions();
    supabase.auth.signOut();
  };

  document.getElementById('toggle-sidebar').onclick = () => {
    isSidebarOpen = !isSidebarOpen;
    updateUI(container);
  };

  // Module Initializations
  const moduleContainers = {
    'sales': renderSales,
    'purchase': renderPurchase,
    'vendors': renderVendors,
    'customers': renderCustomers,
    'inventory': renderInventory,
    'gst-summary': renderGSTSummary,
    'reports': renderReports,
    'ledger': renderLedger
  };

  if (moduleContainers[activeTab]) {
    moduleContainers[activeTab](document.getElementById(`${activeTab}-container`));
  }
}

window.navigateToLedger = (partyType, partyId) => {
  activeTab = 'ledger';
  // We need to pass the selected party to the ledger module.
  // Since we're using a simple updateUI, we can store these in a temporary global or state.
  window.ledgerSelection = { partyType, partyId };
  const container = document.querySelector('main').parentElement;
  updateUI(container);
};

function renderActiveTab() {
  switch (activeTab) {
    case 'dashboard':
      return renderDashboardView();
    case 'sales':
    case 'purchase':
    case 'vendors':
    case 'customers':
    case 'inventory':
    case 'gst-summary':
    case 'reports':
    case 'ledger':
      return `<div id="${activeTab}-container"></div>`;
    case 'system':
      return renderSystemInfo();
    default:
      return `
        <div class="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <i data-lucide="settings" class="w-8 h-8 text-gray-400 animate-spin-slow"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">Module Under Construction</h2>
          <p class="text-gray-500 mt-2 max-w-xs">
            The module is currently being implemented.
          </p>
        </div>
      `;
  }
}

function renderDashboardView() {
  const { company } = state;
  const { reports_snapshot } = company;

  const stats = [
    { label: 'Total Sales', value: `₹${reports_snapshot.sales_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'trending-up', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Purchases', value: `₹${reports_snapshot.purchase_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'shopping-cart', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'GST Payable', value: `₹${reports_snapshot.gst_payable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'file-text', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Stock Value', value: `₹${reports_snapshot.stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'package', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return `
    <div class="p-8 space-y-8">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p class="text-gray-500 mt-1">Real-time overview for ${company.company_name}</p>
        </div>
        <div class="flex gap-3">
          <button class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
            <i data-lucide="upload" class="w-4 h-4"></i> Upload Sales
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <i data-lucide="upload" class="w-4 h-4"></i> Upload Purchase
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <i data-lucide="file-text" class="w-4 h-4"></i> Generate Report
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${stats.map(stat => `
          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div class="flex justify-between items-start">
              <div class="p-2 rounded-lg ${stat.bg}">
                <i data-lucide="${stat.icon}" class="w-5 h-5 ${stat.color}"></i>
              </div>
              <button class="text-xs font-medium text-indigo-600 hover:underline">View Details</button>
            </div>
            <p class="text-2xl font-bold mt-4 text-gray-900">${stat.value}</p>
            <p class="text-sm font-medium text-gray-500 mt-1">${stat.label}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSystemInfo() {
  const { company } = state;
  return `
    <div class="p-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">System Initialization</h1>
        <p class="text-gray-500 mt-2">Initialized company object for ${company.company_name}.</p>
      </header>
      <div class="bg-gray-900 rounded-2xl p-6 overflow-hidden border border-gray-800 shadow-2xl">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-xs text-gray-500 font-mono ml-2">purchase_module_structure.json</span>
        </div>
        <pre class="text-green-400 font-mono text-sm overflow-x-auto">${JSON.stringify({
          company: company.company_name,
          module: "Purchase Entry",
          form_fields: [
            "Purchase Bill Number", "Date", "Vendor / Supplier", "Item Name", 
            "HSN Code", "Rate", "QTY", "Amount", "Discount %", 
            "Discounted Amount", "GST %", "Subtotal"
          ],
          totals_section: [
            "Without GST", "GST Amount", "CGST", "SGST", "Net Bill"
          ],
          listing_columns: [
            "Bill No", "Date", "Vendor", "Item", "Amount", "GST", "Net Bill", "Status"
          ],
          accounting_logic: {
            amount: "Rate * Qty",
            discounted_amount: "Amount - (Amount * Discount%)",
            gst_amount: "Discounted Amount * GST%",
            cgst_sgst: "GST Amount / 2",
            net_bill: "Discounted Amount + GST Amount"
          }
        }, null, 2)}</pre>
      </div>
    </div>
  `;
}

