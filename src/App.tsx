/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  FileText, 
  Settings, 
  Info,
  Menu,
  X,
  Building2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { Task } from './types';
import { PurchaseEntryModule } from './components/PurchaseEntryModule';
import { SalesEntryModule } from './components/SalesEntryModule';
import { VendorMasterModule } from './components/VendorMasterModule';
import { CustomerMasterModule } from './components/CustomerMasterModule';
import { GstSummaryModule } from './components/GstSummaryModule';
import { ReportsModule } from './components/ReportsModule';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

function DashboardContent({ session }: { session: Session }) {
  const { company, addTask, moveTask } = useAccounting();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const totalSales = company.modules.sales.reduce((sum, s) => sum + s.netBill, 0);
  const totalPurchases = company.modules.purchase.reduce((sum, p) => sum + p.netBill, 0);
  const totalSalesGst = company.modules.sales.reduce((sum, s) => sum + s.gstAmount, 0);
  const totalPurchaseGst = company.modules.purchase.reduce((sum, p) => sum + p.gstAmount, 0);
  const gstPayable = totalSalesGst - totalPurchaseGst;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales Invoices', icon: TrendingUp },
    { id: 'purchase', label: 'Purchase Invoices', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'vendors', label: 'Vendor Master', icon: Users },
    { id: 'customers', label: 'Customer Master', icon: Users },
    { id: 'gst-summary', label: 'GST Summary', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'system', label: 'System Info', icon: Info },
  ];

  const handleUpload = (type: 'sales' | 'purchase') => {
    const fileName = `${type}_invoice_${Math.floor(Math.random() * 1000)}.pdf`;
    addTask(`New ${type} invoice upload`, type, 'pending', fileName);
  };

  const renderDashboard = () => (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time overview for {company.company_name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleUpload('sales')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Upload Sales
          </button>
          <button 
            onClick={() => handleUpload('purchase')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Upload Purchase
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <FileText className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </header>

      {/* Reports Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sales', value: `₹${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Purchases', value: `₹${totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'GST Payable', value: `₹${gstPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Stock Value', value: `₹${company.reports_snapshot.stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <button className="text-xs font-medium text-indigo-600 hover:underline">View Details</button>
            </div>
            <p className="text-2xl font-bold mt-4 text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Task Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['urgent', 'pending', 'done'] as const).map((status) => (
          <div key={status} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 capitalize">{status}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {company.task_queue[status].length}
                </span>
              </div>
              {status === 'urgent' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
              {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            
            <div className="bg-gray-50/50 p-3 rounded-2xl border border-dashed border-gray-200 flex-1 space-y-3 min-h-[400px]">
              {company.task_queue[status].map((task) => (
                <motion.div
                  layoutId={task.id}
                  key={task.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      task.type === 'sales' ? 'bg-green-100 text-green-700' : 
                      task.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{task.createdAt}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight">{task.title}</h4>
                  {task.fileName && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{task.fileName}</span>
                    </div>
                  )}
                  
                  {task.validationErrors && task.validationErrors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 uppercase mb-1">
                        <AlertCircle className="w-3 h-3" /> Validation Errors
                      </div>
                      <ul className="text-[10px] text-red-600 list-disc list-inside space-y-0.5">
                        {task.validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status !== 'done' && (
                      <button 
                        onClick={() => moveTask(task.id, status === 'urgent' ? 'pending' : 'done')}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                        title="Move Forward"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {company.task_queue[status].length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                  No tasks in {status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'sales':
        return <SalesEntryModule />;
      case 'purchase':
        return <PurchaseEntryModule />;
      case 'vendors':
        return <VendorMasterModule />;
      case 'customers':
        return <CustomerMasterModule />;
      case 'gst-summary':
        return <GstSummaryModule />;
      case 'reports':
        return <ReportsModule />;
      case 'system':
        return (
          <div className="p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Initialization</h1>
              <p className="text-gray-500 mt-2">Initialized company object for SK Enterprise.</p>
            </header>
            <div className="bg-gray-900 rounded-2xl p-6 overflow-hidden border border-gray-800 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 font-mono ml-2">purchase_module_structure.json</span>
              </div>
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                {JSON.stringify({
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
                }, null, 2)}
              </pre>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-gray-400 animate-spin-slow" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Module Under Construction</h2>
            <p className="text-gray-500 mt-2 max-w-xs">
              The {navItems.find(i => i.id === activeTab)?.label} module is currently being implemented.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-gray-900">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-20 shadow-sm"
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
            <Building2 className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight truncate"
            >
              SK Accounting
            </motion.span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Active Company</span>
            <div className="h-4 w-[1px] bg-gray-200 mx-2" />
            <span className="text-sm font-bold text-gray-900">{company.company_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{session.user.email}</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Session</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
              {session.user.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Initializing SK Accounting...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <AccountingProvider session={session}>
      <DashboardContent session={session} />
    </AccountingProvider>
  );
}

