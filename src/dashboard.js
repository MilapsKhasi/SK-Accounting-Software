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
          <div class="w-12 h-12 border-4 border-[#1e2a38] border-t-transparent animate-spin"></div>
          <p class="text-sm font-medium text-gray-500 uppercase tracking-widest">Loading ZenterPrime GST...</p>
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
  ];

  const { company } = state;

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8f9fb] flex font-sans text-gray-900">
      <!-- Sidebar -->
      <aside id="sidebar" class="bg-[#1e2a38] flex flex-col h-screen sticky top-0 z-20 transition-all duration-300" style="width: ${state.ui.isSidebarOpen ? '280px' : '80px'}">
        <div class="p-6 flex items-center gap-3 border-b border-white/10">
          <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src="/logo.svg" alt="Logo" class="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <span class="font-medium text-lg tracking-tight truncate text-white ${state.ui.isSidebarOpen ? '' : 'hidden'}">ZenterPrime GST</span>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          ${navItems.map(item => `
            <button data-tab="${item.id}" class="w-full flex items-center gap-3 p-3 transition-all duration-200 ${state.ui.activeTab === item.id ? 'bg-[#ffcd00] text-[#1e2a38] font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
              <i data-lucide="${item.icon}" class="w-5 h-5 flex-shrink-0"></i>
              <span class="${state.ui.isSidebarOpen ? '' : 'hidden'}">${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="p-4 border-t border-white/10 space-y-1">
          <button id="logout-btn" class="w-full flex items-center gap-3 p-3 transition-all duration-200 bg-[#f44336] text-white hover:bg-[#d32f2f]">
            <i data-lucide="log-out" class="w-5 h-5 flex-shrink-0"></i>
            <span class="font-medium ${state.ui.isSidebarOpen ? '' : 'hidden'}">Sign Out</span>
          </button>
          <button id="toggle-sidebar" class="w-full flex items-center justify-center p-3 hover:bg-white/5 text-gray-400 transition-colors">
            <i data-lucide="${state.ui.isSidebarOpen ? 'x' : 'menu'}" class="w-5 h-5"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0">
        <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-widest">Active Company</span>
            <div class="h-4 w-[1px] bg-gray-200 mx-2"></div>
            <span class="text-sm font-medium text-gray-900">${company.company_name}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-xs font-medium text-gray-900 truncate max-w-[150px]">${state.session.user.email}</p>
              <p class="text-[10px] font-medium text-[#1e2a38] uppercase tracking-wider">Active Session</p>
            </div>
            <div class="w-8 h-8 bg-gray-100 flex items-center justify-center text-[#1e2a38] font-medium text-xs border border-gray-200">
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
      state.ui.activeTab = btn.dataset.tab;
      updateUI(container);
    };
  });

  document.getElementById('logout-btn').onclick = () => {
    cleanupSubscriptions();
    supabase.auth.signOut();
  };

  document.getElementById('toggle-sidebar').onclick = () => {
    state.ui.isSidebarOpen = !state.ui.isSidebarOpen;
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

  if (moduleContainers[state.ui.activeTab]) {
    moduleContainers[state.ui.activeTab](document.getElementById(`${state.ui.activeTab}-container`));
  }
}

window.navigateToLedger = (partyType, partyId) => {
  state.ui.activeTab = 'ledger';
  // We need to pass the selected party to the ledger module.
  // Since we're using a simple updateUI, we can store these in a temporary global or state.
  window.ledgerSelection = { partyType, partyId };
  const container = document.querySelector('main').parentElement;
  updateUI(container);
};

function renderActiveTab() {
  switch (state.ui.activeTab) {
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
      return `<div id="${state.ui.activeTab}-container"></div>`;
    default:
      return `
        <div class="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
          <div class="w-16 h-16 bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
            <i data-lucide="settings" class="w-8 h-8 text-gray-400 animate-spin-slow"></i>
          </div>
          <h2 class="text-xl font-medium text-gray-900 uppercase tracking-tight">Module Under Construction</h2>
          <p class="text-gray-500 mt-2 max-w-xs text-[10px] font-medium uppercase tracking-widest">
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
          <h1 class="text-3xl font-medium text-gray-900 tracking-tight">Dashboard</h1>
          <p class="text-gray-500 mt-1 uppercase text-[10px] font-medium tracking-widest">Real-time overview for ${company.company_name}</p>
        </div>
        <div class="flex gap-3">
          <button class="flex items-center gap-2 px-4 py-2 bg-[#1e2a38] text-white hover:bg-[#2c3e50] transition-colors text-xs font-medium uppercase tracking-widest">
            <i data-lucide="upload" class="w-4 h-4"></i> Upload Sales
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#1e2a38] hover:bg-gray-50 transition-colors text-xs font-medium uppercase tracking-widest">
            <i data-lucide="upload" class="w-4 h-4"></i> Upload Purchase
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#1e2a38] hover:bg-gray-50 transition-colors text-xs font-medium uppercase tracking-widest">
            <i data-lucide="file-text" class="w-4 h-4"></i> Generate Report
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${stats.map(stat => `
          <div class="bg-white p-6 border border-gray-200">
            <div class="flex justify-between items-start">
              <div class="p-2 ${stat.bg}">
                <i data-lucide="${stat.icon}" class="w-5 h-5 ${stat.color}"></i>
              </div>
              <button class="text-[10px] font-medium uppercase tracking-widest text-[#1e2a38] hover:underline">View Details</button>
            </div>
            <p class="text-2xl font-medium mt-4 text-gray-900">${stat.value}</p>
            <p class="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">${stat.label}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

