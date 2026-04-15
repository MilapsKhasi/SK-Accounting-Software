import { supabase } from './lib/supabase';

export const state = {
  session: null,
  loading: true,
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

export async function initData() {
  if (!state.session?.user?.id) return;
  state.loading = true;
  notify();

  try {
    const [
      { data: profile },
      { data: vendors },
      { data: customers },
      { data: purchases },
      { data: sales },
      { data: tasks },
      { data: inventory }
    ] = await Promise.all([
      supabase.from('profiles').select('*').single(),
      supabase.from('vendors').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('purchase_entries').select('*').order('date', { ascending: false }),
      supabase.from('sales_entries').select('*').order('date', { ascending: false }),
      supabase.from('tasks').select('*'),
      supabase.from('inventory').select('*')
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
      company_name: profile?.company_name || "SK Enterprise",
      gst_number: profile?.gst_number || "",
      address: profile?.address || "",
      creation_date: profile?.creation_date || new Date().toISOString().split('T')[0],
      modules: {
        purchase: mappedPurchases,
        sales: mappedSales,
        inventory: (inventory || []).map(i => ({ ...i })),
        reports: [],
        vendors: (vendors || []).map(v => ({ ...v, contactPerson: v.contact_person, createdAt: v.created_at })),
        customers: (customers || []).map(c => ({ ...c, contactPerson: c.contact_person, createdAt: c.created_at })),
      },
      task_queue: {
        urgent: (tasks || []).filter(t => t.status === 'urgent'),
        pending: (tasks || []).filter(t => t.status === 'pending'),
        done: (tasks || []).filter(t => t.status === 'done'),
      },
      reports_snapshot: calculateSnapshot(mappedSales, mappedPurchases, inventory || [])
    };

    if (!profile && state.session?.user?.id) {
      await supabase.from('profiles').upsert({
        user_id: state.session.user.id,
        company_name: "SK Enterprise",
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    state.loading = false;
    notify();
  }
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
    supabase.channel('sales_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'sales_entries' }, () => initData()),
    supabase.channel('purchase_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_entries' }, () => initData()),
    supabase.channel('inventory_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => initData()),
    supabase.channel('vendor_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => initData()),
    supabase.channel('customer_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => initData()),
    supabase.channel('profile_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => initData()),
  ];

  subscriptionChannels.forEach(channel => channel.subscribe());
}

export function cleanupSubscriptions() {
  subscriptionChannels.forEach(channel => supabase.removeChannel(channel));
  subscriptionChannels = [];
}

export async function saveSalesEntry(entry) {
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
    payments: entry.payments
  });
}

export async function cancelSalesEntry(id) {
  await supabase.from('sales_entries').update({ status: 'Canceled' }).eq('id', id);
}

export async function deleteSalesEntry(id) {
  await supabase.from('sales_entries').delete().eq('id', id);
}

export async function savePurchaseEntry(entry) {
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
    payments: entry.payments
  });
}

export async function cancelPurchaseEntry(id) {
  await supabase.from('purchase_entries').update({ status: 'Canceled' }).eq('id', id);
}

export async function deletePurchaseEntry(id) {
  await supabase.from('purchase_entries').delete().eq('id', id);
}

export async function saveVendor(vendor) {
  await supabase.from('vendors').upsert({
    id: vendor.id,
    user_id: state.session.user.id,
    name: vendor.name,
    gstin: vendor.gstin,
    contact_person: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    created_at: vendor.createdAt
  });
}

export async function deleteVendor(id) {
  await supabase.from('vendors').delete().eq('id', id);
}

export async function saveCustomer(customer) {
  await supabase.from('customers').upsert({
    id: customer.id,
    user_id: state.session.user.id,
    name: customer.name,
    gstin: customer.gstin,
    contact_person: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    created_at: customer.createdAt
  });
}

export async function deleteCustomer(id) {
  await supabase.from('customers').delete().eq('id', id);
}
