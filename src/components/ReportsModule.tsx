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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  const formatDateForExport = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const filteredSales = company.modules.sales.filter(s => {
    const invoiceDate = new Date(s.date);
    const [startYear, endYearSuffix] = company.financialYear.split('-');
    const start = new Date(`${startYear}-04-01`);
    const end = new Date(`20${endYearSuffix}-03-31`);
    return invoiceDate >= start && invoiceDate <= end;
  });

  const filteredPurchases = company.modules.purchase.filter(p => {
    const purchaseDate = new Date(p.date);
    const [startYear, endYearSuffix] = company.financialYear.split('-');
    const start = new Date(`${startYear}-04-01`);
    const end = new Date(`20${endYearSuffix}-03-31`);
    return purchaseDate >= start && purchaseDate <= end;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Report';
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SK ENTERPRISE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(activeTabLabel, 105, 30, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });

    let headers: string[] = [];
    let data: any[][] = [];

    switch (activeTab) {
      case 'sales':
        headers = ['Invoice No', 'Date', 'Customer', 'Taxable Value', 'GST', 'Status'];
        data = filteredSales.map(s => [s.invoiceNumber, formatDateForExport(s.date), s.customer, s.discountedAmount.toFixed(2), s.gstAmount.toFixed(2), s.status]);
        break;
      case 'purchases':
        headers = ['Bill No', 'Date', 'Vendor', 'Taxable Value', 'GST', 'Status'];
        data = filteredPurchases.map(p => [p.billNumber, formatDateForExport(p.date), p.vendor, p.discountedAmount.toFixed(2), p.gstAmount.toFixed(2), p.status]);
        break;
      case 'customers':
        headers = ['Name', 'GSTIN', 'Contact', 'Email', 'Phone'];
        data = company.modules.customers.map(c => [c.name, c.gstin || '', c.contactPerson || '', c.email || '', c.phone || '']);
        break;
      case 'vendors':
        headers = ['Name', 'GSTIN', 'Contact', 'Email', 'Phone'];
        data = company.modules.vendors.map(v => [v.name, v.gstin || '', v.contactPerson || '', v.email || '', v.phone || '']);
        break;
      case 'gstr1':
        headers = ['Invoice No', 'Date', 'Customer GSTIN', 'Taxable', 'CGST', 'SGST', 'Total GST'];
        data = filteredSales.map(s => {
          const customer = company.modules.customers.find(c => c.name === s.customer);
          return [s.invoiceNumber, formatDateForExport(s.date), customer?.gstin || 'N/A', s.discountedAmount.toFixed(2), s.cgst.toFixed(2), s.sgst.toFixed(2), s.gstAmount.toFixed(2)];
        });
        break;
      case 'gstr2a':
        headers = ['Vendor GSTIN', 'Bill No', 'Date', 'Vendor', 'Taxable', 'GST Paid'];
        data = filteredPurchases.map(p => {
          const vendor = company.modules.vendors.find(v => v.name === p.vendor);
          return [vendor?.gstin || 'N/A', p.billNumber, formatDateForExport(p.date), p.vendor, p.discountedAmount.toFixed(2), p.gstAmount.toFixed(2)];
        });
        break;
      case 'gstr3b':
        // Special handling for GSTR-3B summary
        headers = ['Particulars', 'Amount (₹)'];
        const totalSales = filteredSales.reduce((sum, s) => sum + s.discountedAmount, 0);
        const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.discountedAmount, 0);
        const outputGst = filteredSales.reduce((sum, s) => sum + s.gstAmount, 0);
        const inputGst = filteredPurchases.reduce((sum, p) => sum + p.gstAmount, 0);
        data = [
          ['Total Taxable Sales', totalSales.toFixed(2)],
          ['Total Taxable Purchases', totalPurchases.toFixed(2)],
          ['Output GST (Sales)', outputGst.toFixed(2)],
          ['Input GST (Purchases)', inputGst.toFixed(2)],
          ['Net GST Payable/Credit', (outputGst - inputGst).toFixed(2)]
        ];
        break;
    }

    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], font: 'helvetica' },
      styles: { font: 'helvetica', fontSize: 9 }
    });

    doc.save(`SK_Enterprise_${activeTabLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    let data: any[] = [];
    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Report';

    switch (activeTab) {
      case 'sales':
        data = filteredSales.map(s => ({
          'Invoice No': s.invoiceNumber,
          'Date': formatDateForExport(s.date),
          'Customer': s.customer,
          'Taxable Value': s.discountedAmount,
          'GST Amount': s.gstAmount,
          'Status': s.status
        }));
        break;
      case 'purchases':
        data = filteredPurchases.map(p => ({
          'Bill No': p.billNumber,
          'Date': formatDateForExport(p.date),
          'Vendor': p.vendor,
          'Taxable Value': p.discountedAmount,
          'GST Amount': p.gstAmount,
          'Status': p.status
        }));
        break;
      case 'customers':
        data = company.modules.customers.map(c => ({
          'Name': c.name,
          'GSTIN': c.gstin,
          'Contact Person': c.contactPerson,
          'Email': c.email,
          'Phone': c.phone,
          'Address': c.address
        }));
        break;
      case 'vendors':
        data = company.modules.vendors.map(v => ({
          'Name': v.name,
          'GSTIN': v.gstin,
          'Contact Person': v.contactPerson,
          'Email': v.email,
          'Phone': v.phone,
          'Address': v.address
        }));
        break;
      default:
        // For other reports, just use the table rows
        data = []; // Fallback
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTabLabel);
    XLSX.writeFile(wb, `SK_Enterprise_${activeTabLabel.replace(/\s+/g, '_')}.xlsx`);
  };

  const renderTable = (headers: string[], rows: any[]) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {headers.map((h, i) => (
                <th key={i} className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length > 0 ? rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {Object.values(row).map((val: any, j) => (
                  <td key={j} className={`p-4 text-sm ${j === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length} className="p-12 text-center text-gray-400 italic text-sm">
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
    const totalSales = filteredSales.reduce((sum, s) => sum + s.discountedAmount, 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.discountedAmount, 0);
    const outputGst = filteredSales.reduce((sum, s) => sum + s.gstAmount, 0);
    const inputGst = filteredPurchases.reduce((sum, p) => sum + p.gstAmount, 0);
    const netPayable = outputGst - inputGst;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outward Supplies (Sales)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Output GST</span>
              <span className="text-sm font-bold text-green-600">₹{outputGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inward Supplies (Purchases)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Input GST</span>
              <span className="text-sm font-bold text-blue-600">₹{inputGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm ${netPayable >= 0 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-green-600 border-green-500 text-white'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Net GST {netPayable >= 0 ? 'Payable' : 'Credit'}</p>
            <p className="text-2xl font-bold">₹{Math.abs(netPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs opacity-80">CGST / SGST Split</span>
              <span className="text-sm font-bold">₹{(Math.abs(netPayable) / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })} each</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">GSTR-3B Summary Table</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Total Taxable Value (Outward)</span>
                <span className="font-mono font-bold text-gray-900">₹{totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Total Taxable Value (Inward)</span>
                <span className="font-mono font-bold text-gray-900">₹{totalPurchases.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-sm font-bold text-indigo-900">Net GST Liability</span>
                <span className="font-mono font-bold text-indigo-900">₹{netPayable.toFixed(2)}</span>
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
          filteredSales.map(s => ({
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
          filteredPurchases.map(p => ({
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
          filteredSales.map(s => {
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
          filteredPurchases.map(p => {
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
    <div className="p-12 space-y-12 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Reports Center</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sub Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Report Menu</h2>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {tab.label}
                  {activeTab === tab.id && <ArrowRight className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 opacity-80" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Compliance Status</span>
            </div>
            <p className="text-sm font-bold">GST Ready</p>
            <p className="text-[10px] opacity-70 mt-1">All reports are generated based on real-time transaction data.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <AlertCircle className="w-3 h-3" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
