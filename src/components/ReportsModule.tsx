/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { 
  FileText, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  ClipboardCheck, 
  BarChart3,
  Search,
  Download,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ReportTab = 
  | 'purchases' 
  | 'sales' 
  | 'customers' 
  | 'vendors' 
  | 'gstr1' 
  | 'gstr2a' 
  | 'gstr3b';

export const ReportsModule: React.FC = () => {
  const { company } = useAccounting();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'purchases', label: 'Purchases Report', icon: ShoppingCart },
    { id: 'customers', label: 'Customers Summary', icon: Users },
    { id: 'vendors', label: 'Vendors Summary', icon: Users },
    { id: 'gstr1', label: 'GSTR-1 Filing', icon: ClipboardCheck },
    { id: 'gstr2a', label: 'GSTR-2A Summary', icon: Search },
    { id: 'gstr3b', label: 'GSTR-3B Summary', icon: BarChart3 },
  ];

  const renderTable = (headers: string[], rows: any[]) => (
    <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {headers.map((h, i) => (
                <th key={i} className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length > 0 ? rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {Object.values(row).map((val: any, j) => (
                  <td key={j} className={`p-3 text-xs ${j === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length} className="p-12 text-center text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                  No data available for this report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGstr3b = () => {
    const totalSales = company.modules.sales.reduce((sum, s) => sum + s.discountedAmount, 0);
    const totalPurchases = company.modules.purchase.reduce((sum, p) => sum + p.discountedAmount, 0);
    const outputGst = company.modules.sales.reduce((sum, s) => sum + s.gstAmount, 0);
    const inputGst = company.modules.purchase.reduce((sum, p) => sum + p.gstAmount, 0);
    const netPayable = outputGst - inputGst;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outward Supplies (Sales)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Output GST</span>
              <span className="text-sm font-bold text-green-600">₹{outputGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inward Supplies (Purchases)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Input GST</span>
              <span className="text-sm font-bold text-blue-600">₹{inputGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className={`p-6 rounded-sm border ${netPayable >= 0 ? 'bg-white border-orange-200 border-l-4 border-l-orange-500' : 'bg-white border-blue-200 border-l-4 border-l-blue-500'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${netPayable >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>Net GST {netPayable >= 0 ? 'Payable' : 'Credit'}</p>
            <p className="text-2xl font-bold text-gray-900">₹{Math.abs(netPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CGST / SGST Split</span>
              <span className="text-sm font-bold text-gray-900">₹{(Math.abs(netPayable) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })} each</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">GSTR-3B Summary Table</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Taxable Value (Outward)</span>
                <span className="font-mono font-bold text-gray-900">₹{totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Taxable Value (Inward)</span>
                <span className="font-mono font-bold text-gray-900">₹{totalPurchases.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Net GST Liability</span>
                <span className="font-mono font-bold text-blue-700">₹{netPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sales':
        return renderTable(
          ['Invoice No', 'Date', 'Customer', 'Taxable Value', 'GST Amount', 'Status'],
          company.modules.sales.map(s => ({
            no: s.invoiceNumber,
            date: s.date,
            party: s.customer,
            taxable: `₹${s.discountedAmount.toFixed(2)}`,
            gst: `₹${s.gstAmount.toFixed(2)}`,
            status: s.status
          }))
        );
      case 'purchases':
        return renderTable(
          ['Bill No', 'Date', 'Vendor', 'Taxable Value', 'GST Amount', 'Status'],
          company.modules.purchase.map(p => ({
            no: p.billNumber,
            date: p.date,
            party: p.vendor,
            taxable: `₹${p.discountedAmount.toFixed(2)}`,
            gst: `₹${p.gstAmount.toFixed(2)}`,
            status: p.status
          }))
        );
      case 'customers':
        return renderTable(
          ['Customer Name', 'GSTIN', 'Contact Person', 'Email', 'Phone', 'Join Date'],
          company.modules.customers.map(c => ({
            name: c.name,
            gstin: c.gstin || 'N/A',
            contact: c.contactPerson || 'N/A',
            email: c.email || 'N/A',
            phone: c.phone || 'N/A',
            date: c.createdAt
          }))
        );
      case 'vendors':
        return renderTable(
          ['Vendor Name', 'GSTIN', 'Contact Person', 'Email', 'Phone', 'Join Date'],
          company.modules.vendors.map(v => ({
            name: v.name,
            gstin: v.gstin || 'N/A',
            contact: v.contactPerson || 'N/A',
            email: v.email || 'N/A',
            phone: v.phone || 'N/A',
            date: v.createdAt
          }))
        );
      case 'gstr1':
        return renderTable(
          ['Invoice No', 'Date', 'Customer GSTIN', 'Taxable Value', 'CGST', 'SGST', 'Total GST'],
          company.modules.sales.map(s => {
            const customer = company.modules.customers.find(c => c.name === s.customer);
            return {
              no: s.invoiceNumber,
              date: s.date,
              gstin: customer?.gstin || 'N/A',
              taxable: `₹${s.discountedAmount.toFixed(2)}`,
              cgst: `₹${s.cgst.toFixed(2)}`,
              sgst: `₹${s.sgst.toFixed(2)}`,
              total: `₹${s.gstAmount.toFixed(2)}`
            };
          })
        );
      case 'gstr2a':
        return renderTable(
          ['Vendor GSTIN', 'Bill No', 'Date', 'Vendor Name', 'Taxable Value', 'GST Paid'],
          company.modules.purchase.map(p => {
            const vendor = company.modules.vendors.find(v => v.name === p.vendor);
            return {
              gstin: vendor?.gstin || 'N/A',
              no: p.billNumber,
              date: p.date,
              name: p.vendor,
              taxable: `₹${p.discountedAmount.toFixed(2)}`,
              gst: `₹${p.gstAmount.toFixed(2)}`
            };
          })
        );
      case 'gstr3b':
        return renderGstr3b();
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Financial statements and GST compliance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Report Menu</h2>
            </div>
            <nav className="p-1 space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                  {tab.label}
                  {activeTab === tab.id && <ArrowRight className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 p-4 bg-blue-600 rounded-sm text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 opacity-80" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Compliance Status</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-tight">GST Ready</p>
            <p className="text-[10px] opacity-70 mt-1 uppercase tracking-tighter">Real-time transaction data sync.</p>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <AlertCircle className="w-3 h-3" />
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
