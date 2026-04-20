import { supabase } from './lib/supabase';

export const state = {
  session: null,
  loading: true,
  companies: [],
  selectedCompany: null,
  company: {
    company_name: "SK Enterprise",
    gst_number: "",
    address: "",
    creation_date: new Date().toISOString().split('T')[0],
    modules: {
      purchase: [],
      sales: [],
      inventory: [],
      reports: [],
      vendors: [],
      customers: []
    },
    task_queue: {
      urgent: [],
      pending: [],
      done: []
    },
    reports_snapshot: {
      sales_total: 0,
      purchase_total: 0,
      gst_payable: 0,
      stock_value: 0
    }
  },
  listeners: []
};

export function subscribe(callback) {
  state.listeners.push(callback);
  return () => {
    state.listeners = state.listeners.filter(l => l !== callback);
  };
}

export function notify() {
  state.listeners.forEach(l => l(state));
}

export async function initData(silent = false) {
  if (!state.session?.user?.id) return;
  
  if (!silent) {
    state.loading = true;
    notify();
  }

  try {
    // 1. Fetch Companies first
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (companiesError) throw companiesError;
    
    state.companies = companies || [];

    // 2. Select company if not already selected (e.g. from localStorage)
    const savedCompanyId = localStorage.getItem('last_company_id');
    if (savedCompanyId) {
      const saved = state.companies.find(c => c.id === savedCompanyId);
      if (saved) {
        state.selectedCompany = saved;
      }
    }

    if (state.selectedCompany) {
      await initCompanyData(state.selectedCompany.id, true);
    } else {
      state.loading = false;
      notify();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    state.loading = false;
    notify();
  }
}

export async function initCompanyData(companyId, isInternal = false) {
  if (!state.session?.user?.id || !companyId) return;

  if (!isInternal) {
    state.loading = true;
    notify();
  }

  try {
    const [
      { data: vendors },
      { data: customers },
      { data: purchases },
      { data: sales },
      { data: tasks },
      { data: inventory }
    ] = await Promise.all([
      supabase.from('vendors').select('*').eq('company_id', companyId),
      supabase.from('customers').select('*').eq('company_id', companyId),
      supabase.from('purchase_entries').select('*').eq('company_id', companyId).order('date', { ascending: false }),
      supabase.from('sales_entries').select('*').eq('company_id', companyId).order('date', { ascending: false }),
      supabase.from('tasks').select('*').eq('company_id', companyId),
      supabase.from('inventory').select('*').eq('company_id', companyId)
    ]);

    const mappedSales = (sales || []).map(s => ({ 
      ...s, 
      invoiceNumber: s.invoice_number, 
      hsnCode: s.hsn_code, 
      discountPercent: s.discount_percent, 
      discountedAmount: s.discounted_amount, 
      gstPercent: s.gst_percent, 
      gstAmount: s.gst_amount, 
      netBill: s.net_bill, 
      gstEnabled: s.gst_enabled 
    }));

    const mappedPurchases = (purchases || []).map(p => ({ 
      ...p, 
      billNumber: p.bill_number, 
      hsnCode: p.hsn_code, 
      discountPercent: p.discount_percent, 
      discountedAmount: p.discounted_amount, 
      gstPercent: p.gst_percent, 
      gstAmount: p.gst_amount, 
      netBill: p.net_bill, 
      gstEnabled: p.gst_enabled 
    }));

    state.company = {
      company_name: state.selectedCompany.name,
      gst_number: state.selectedCompany.gstin || "",
      address: state.selectedCompany.address || "",
      creation_date: state.selectedCompany.created_at || new Date().toISOString().split('T')[0],
      modules: {
        purchase: mappedPurchases,
        sales: mappedSales,
        inventory: (inventory || []).map(i => ({ ...i })),
        reports: [],
        vendors: (vendors || []).map(v => ({ 
          ...v, 
          contactPerson: v.contact_person, 
          createdAt: v.created_at,
          openingBalance: v.opening_balance || 0,
          openingBalancePaid: v.opening_balance_paid || 0,
          openingBalanceDate: v.opening_balance_date || v.created_at
        })),
        customers: (customers || []).map(c => ({ 
          ...c, 
          contactPerson: c.contact_person, 
          createdAt: c.created_at,
          openingBalance: c.opening_balance || 0,
          openingBalancePaid: c.opening_balance_paid || 0,
          openingBalanceDate: c.opening_balance_date || c.created_at
        })),
      },
      task_queue: {
        urgent: (tasks || []).filter(t => t.status === 'urgent'),
        pending: (tasks || []).filter(t => t.status === 'pending'),
        done: (tasks || []).filter(t => t.status === 'done'),
      },
      reports_snapshot: calculateSnapshot(mappedSales, mappedPurchases, inventory || [])
    };
  } catch (error) {
    console.error("Error fetching company data:", error);
  } finally {
    state.loading = false;
    notify();
  }
}

export async function switchCompany(company) {
  state.selectedCompany = company;
  if (company) {
    localStorage.setItem('last_company_id', company.id);
    await initCompanyData(company.id);
  } else {
    localStorage.removeItem('last_company_id');
    state.company.modules = {
      purchase: [], sales: [], inventory: [], reports: [], vendors: [], customers: []
    };
    notify();
  }
}

export async function saveCompany(company) {
  const { data, error } = await supabase.from('companies').upsert({
    id: company.id || crypto.randomUUID(),
    user_id: state.session.user.id,
    name: company.name,
    gstin: company.gstin || '',
    address: company.address || ''
  }).select().single();

  if (error) throw error;
  await initData(true);
  return data;
}

export async function deleteCompany(id) {
  if (state.selectedCompany?.id === id) {
    await switchCompany(null);
  }
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
  await initData(true);
}

function calculateSnapshot(sales, purchases, inventory) {
  const sales_total = sales.filter(s => s.status !== 'Canceled').reduce((sum, s) => sum + (s.netBill || 0), 0);
  const purchase_total = purchases.filter(p => p.status !== 'Canceled').reduce((sum, p) => sum + (p.netBill || 0), 0);
  const sales_gst = sales.filter(s => s.status !== 'Canceled').reduce((sum, s) => sum + (s.gstAmount || 0), 0);
  const purchase_gst = purchases.filter(p => p.status !== 'Canceled').reduce((sum, p) => sum + (p.gstAmount || 0), 0);
  
  return {
    sales_total,
    purchase_total,
    gst_payable: sales_gst - purchase_gst,
    stock_value: inventory.reduce((sum, i) => sum + (i.quantity * 100), 0)
  };
}

// Real-time subscriptions
let subscriptionChannels = [];
export function setupSubscriptions() {
  if (!state.session?.user?.id) return;

  // Clean up existing subscriptions first to avoid "already subscribed" errors
  cleanupSubscriptions();

  subscriptionChannels = [
    supabase.channel('companies_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => initData(true)),
    supabase.channel('sales_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'sales_entries' }, () => state.selectedCompany && initCompanyData(state.selectedCompany.id, true)),
    supabase.channel('purchase_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_entries' }, () => state.selectedCompany && initCompanyData(state.selectedCompany.id, true)),
    supabase.channel('inventory_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => state.selectedCompany && initCompanyData(state.selectedCompany.id, true)),
    supabase.channel('vendor_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => state.selectedCompany && initCompanyData(state.selectedCompany.id, true)),
    supabase.channel('customer_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => state.selectedCompany && initCompanyData(state.selectedCompany.id, true)),
  ];

  subscriptionChannels.forEach(channel => channel.subscribe());
}

export function cleanupSubscriptions() {
  subscriptionChannels.forEach(channel => supabase.removeChannel(channel));
  subscriptionChannels = [];
}

export async function saveSalesEntry(entry) {
  // Optimistic update
  const index = state.company.modules.sales.findIndex(s => s.id === entry.id);
  if (index > -1) {
    state.company.modules.sales[index] = entry;
  } else {
    state.company.modules.sales.unshift(entry);
  }
  notify();

  // Auto-create customer if doesn't exist
  const existingCustomer = state.company.modules.customers.find(c => c.name === entry.customer);
  if (!existingCustomer && entry.customer) {
    await saveCustomer({
      id: crypto.randomUUID(),
      name: entry.customer,
      gstin: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      createdAt: new Date().toISOString()
    });
  }

  await supabase.from('sales_entries').upsert({
    id: entry.id,
    user_id: state.session.user.id,
    invoice_number: entry.invoiceNumber,
    date: entry.date,
    customer: entry.customer,
    item_name: entry.itemName,
    hsn_code: entry.hsnCode,
    rate: entry.rate,
    qty: entry.qty,
    amount: entry.amount,
    discount_percent: entry.discountPercent,
    discounted_amount: entry.discountedAmount,
    gst_percent: entry.gstPercent,
    gst_amount: entry.gstAmount,
    cgst: entry.cgst,
    sgst: entry.sgst,
    net_bill: entry.netBill,
    status: entry.status,
    gst_enabled: entry.gstEnabled,
    payments: entry.payments,
    company_id: state.selectedCompany.id
  });
}

export async function cancelSalesEntry(id) {
  const entry = state.company.modules.sales.find(s => s.id === id);
  if (entry) {
    entry.status = 'Canceled';
    notify();
  }
  await supabase.from('sales_entries').update({ status: 'Canceled' }).eq('id', id);
}

export async function deleteSalesEntry(id) {
  state.company.modules.sales = state.company.modules.sales.filter(s => s.id !== id);
  notify();
  await supabase.from('sales_entries').delete().eq('id', id);
}

export async function savePurchaseEntry(entry) {
  // Optimistic update
  const index = state.company.modules.purchase.findIndex(p => p.id === entry.id);
  if (index > -1) {
    state.company.modules.purchase[index] = entry;
  } else {
    state.company.modules.purchase.unshift(entry);
  }
  notify();

  // Auto-create vendor if doesn't exist
  const existingVendor = state.company.modules.vendors.find(v => v.name === entry.vendor);
  if (!existingVendor && entry.vendor) {
    await saveVendor({
      id: crypto.randomUUID(),
      name: entry.vendor,
      gstin: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      createdAt: new Date().toISOString()
    });
  }

  await supabase.from('purchase_entries').upsert({
    id: entry.id,
    user_id: state.session.user.id,
    bill_number: entry.billNumber,
    date: entry.date,
    vendor: entry.vendor,
    item_name: entry.itemName,
    hsn_code: entry.hsnCode,
    rate: entry.rate,
    qty: entry.qty,
    amount: entry.amount,
    discount_percent: entry.discountPercent,
    discounted_amount: entry.discountedAmount,
    gst_percent: entry.gstPercent,
    gst_amount: entry.gstAmount,
    cgst: entry.cgst,
    sgst: entry.sgst,
    net_bill: entry.netBill,
    status: entry.status,
    gst_enabled: entry.gstEnabled,
    payments: entry.payments,
    company_id: state.selectedCompany.id
  });
}

export async function cancelPurchaseEntry(id) {
  const entry = state.company.modules.purchase.find(p => p.id === id);
  if (entry) {
    entry.status = 'Canceled';
    notify();
  }
  await supabase.from('purchase_entries').update({ status: 'Canceled' }).eq('id', id);
}

export async function deletePurchaseEntry(id) {
  state.company.modules.purchase = state.company.modules.purchase.filter(p => p.id !== id);
  notify();
  await supabase.from('purchase_entries').delete().eq('id', id);
}

export async function saveVendor(vendor) {
  const index = state.company.modules.vendors.findIndex(v => v.id === vendor.id);
  if (index > -1) {
    state.company.modules.vendors[index] = vendor;
  } else {
    state.company.modules.vendors.push(vendor);
  }
  notify();

  await supabase.from('vendors').upsert({
    id: vendor.id,
    user_id: state.session.user.id,
    name: vendor.name,
    gstin: vendor.gstin,
    contact_person: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    created_at: vendor.createdAt,
    opening_balance: vendor.openingBalance,
    opening_balance_paid: vendor.openingBalancePaid,
    opening_balance_date: vendor.openingBalanceDate,
    company_id: state.selectedCompany.id
  });
}

export async function deleteVendor(id) {
  state.company.modules.vendors = state.company.modules.vendors.filter(v => v.id !== id);
  notify();
  await supabase.from('vendors').delete().eq('id', id);
}

export async function saveCustomer(customer) {
  const index = state.company.modules.customers.findIndex(c => c.id === customer.id);
  if (index > -1) {
    state.company.modules.customers[index] = customer;
  } else {
    state.company.modules.customers.push(customer);
  }
  notify();

  await supabase.from('customers').upsert({
    id: customer.id,
    user_id: state.session.user.id,
    name: customer.name,
    gstin: customer.gstin,
    contact_person: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    created_at: customer.createdAt,
    opening_balance: customer.openingBalance,
    opening_balance_paid: customer.openingBalancePaid,
    opening_balance_date: customer.openingBalanceDate,
    company_id: state.selectedCompany.id
  });
}

export async function deleteCustomer(id) {
  state.company.modules.customers = state.company.modules.customers.filter(c => c.id !== id);
  notify();
  await supabase.from('customers').delete().eq('id', id);
}

export async function saveInventory(item) {
  const index = state.company.modules.inventory.findIndex(i => i.id === item.id);
  if (index > -1) {
    state.company.modules.inventory[index] = item;
  } else {
    state.company.modules.inventory.push(item);
  }
  notify();

  await supabase.from('inventory').upsert({
    id: item.id,
    user_id: state.session.user.id,
    name: item.name,
    sku: item.sku,
    hsn_code: item.hsnCode,
    quantity: item.quantity,
    unit: item.unit,
    min_stock: item.minStock,
    price: item.price,
    category: item.category,
    company_id: state.selectedCompany.id
  });
}

export async function deleteInventory(id) {
  state.company.modules.inventory = state.company.modules.inventory.filter(i => i.id !== id);
  notify();
  await supabase.from('inventory').delete().eq('id', id);
}
