import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { 
  Users, 
  Search, 
  Download, 
  ArrowRight,
  FileText,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CustomerMasterModule } from './CustomerMasterModule';
import { VendorMasterModule } from './VendorMasterModule';

export const LedgerModule: React.FC = () => {
  const { company } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [partyType, setPartyType] = useState<'customer' | 'vendor'>('customer');
  const [viewMode, setViewMode] = useState<'list' | 'manage'>('list');

  const customers = company.modules.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const vendors = company.modules.vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLedgerData = (name: string, type: 'customer' | 'vendor') => {
    const transactions: any[] = [];
    
    if (type === 'customer') {
      const sales = company.modules.sales.filter(s => s.customer === name);
      sales.forEach(s => {
        transactions.push({
          date: s.date,
          particulars: `Sales - Inv ${s.invoiceNumber}`,
          debit: s.netBill,
          credit: 0,
          type: 'sales'
        });
        
        if (s.payments) {
          s.payments.forEach(p => {
            transactions.push({
              date: p.date,
              particulars: `Payment - ${p.method} (Inv ${s.invoiceNumber})`,
              debit: 0,
              credit: p.amount,
              type: 'payment'
            });
          });
        }
      });
    } else {
      const purchases = company.modules.purchase.filter(p => p.vendor === name);
      purchases.forEach(p => {
        transactions.push({
          date: p.date,
          particulars: `Purchase - Bill ${p.billNumber}`,
          debit: 0,
          credit: p.netBill,
          type: 'purchase'
        });
        
        if (p.payments) {
          p.payments.forEach(pay => {
            transactions.push({
              date: pay.date,
              particulars: `Payment - ${pay.method} (Bill ${p.billNumber})`,
              debit: pay.amount,
              credit: 0,
              type: 'payment'
            });
          });
        }
      });
    }

    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const exportPDF = (name: string, type: 'customer' | 'vendor') => {
    const doc = new jsPDF() as any;
    const data = getLedgerData(name, type);
    
    doc.setFontSize(18);
    doc.text('Account Ledger', 14, 20);
    doc.setFontSize(12);
    doc.text(`Party: ${name}`, 14, 30);
    doc.text(`Type: ${type.toUpperCase()}`, 14, 37);
    doc.text(`Company: ${company.company_name}`, 14, 44);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 51);

    const tableRows = data.map(t => [
      t.date,
      t.particulars,
      t.debit > 0 ? t.debit.toFixed(2) : '',
      t.credit > 0 ? t.credit.toFixed(2) : ''
    ]);

    const totalDebit = data.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = data.reduce((sum, t) => sum + t.credit, 0);
    const closingBalance = Math.abs(totalDebit - totalCredit);
    const balanceType = totalDebit > totalCredit ? 'Dr' : 'Cr';

    tableRows.push([
      '',
      'TOTAL',
      totalDebit.toFixed(2),
      totalCredit.toFixed(2)
    ]);

    tableRows.push([
      '',
      'CLOSING BALANCE',
      totalDebit > totalCredit ? closingBalance.toFixed(2) : '',
      totalCredit > totalDebit ? closingBalance.toFixed(2) : ''
    ]);

    autoTable(doc, {
      head: [['Date', 'Particulars', 'Debit', 'Credit']],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
      footStyles: { fillColor: [244, 244, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`${name}_ledger.pdf`);
  };

  const renderLedgerView = (name: string, type: 'customer' | 'vendor') => {
    const data = getLedgerData(name, type);
    const totalDebit = data.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = data.reduce((sum, t) => sum + t.credit, 0);
    const closingBalance = Math.abs(totalDebit - totalCredit);
    const balanceType = totalDebit > totalCredit ? 'Dr' : 'Cr';

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSelectedParty(null)}
            className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            ← Back to List
          </button>
          <button 
            onClick={() => exportPDF(name, type)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> {name} - Ledger History
            </h2>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
              type === 'customer' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {type}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Date</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Particulars</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-right">Debit</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-xs font-mono text-gray-500">{t.date}</td>
                    <td className="p-3 text-xs font-bold text-gray-900 uppercase tracking-tight">{t.particulars}</td>
                    <td className="p-3 text-xs font-mono text-right text-red-600">{t.debit > 0 ? `₹${t.debit.toFixed(2)}` : '-'}</td>
                    <td className="p-3 text-xs font-mono text-right text-green-600">{t.credit > 0 ? `₹${t.credit.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="p-3 text-[10px] uppercase tracking-widest text-gray-900 text-right">Total</td>
                  <td className="p-3 text-xs font-mono text-right text-gray-900">₹{totalDebit.toFixed(2)}</td>
                  <td className="p-3 text-xs font-mono text-right text-gray-900">₹{totalCredit.toFixed(2)}</td>
                </tr>
                <tr className="bg-blue-50 font-bold border-t border-blue-100">
                  <td colSpan={2} className="p-3 text-[10px] uppercase tracking-widest text-blue-600 text-right">Closing Balance</td>
                  <td className="p-3 text-xs font-mono text-right text-blue-700">
                    {totalDebit > totalCredit ? `₹${closingBalance.toFixed(2)} Dr` : '-'}
                  </td>
                  <td className="p-3 text-xs font-mono text-right text-blue-700">
                    {totalCredit > totalDebit ? `₹${closingBalance.toFixed(2)} Cr` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ledgers & Parties</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">View and manage party accounts</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-sm p-1 shadow-sm">
          <button 
            onClick={() => { setViewMode('list'); setSelectedParty(null); }}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
              viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            View Ledgers
          </button>
          <button 
            onClick={() => setViewMode('manage')}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
              viewMode === 'manage' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Manage Parties
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {viewMode === 'manage' ? (
          <motion.div
            key="manage-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <CustomerMasterModule />
            <VendorMasterModule />
          </motion.div>
        ) : selectedParty ? (
          <motion.div
            key="ledger-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderLedgerView(selectedParty, partyType)}
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search party name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs transition-all"
                />
              </div>
              <div className="flex bg-white border border-gray-200 rounded-sm p-1 shadow-sm">
                <button 
                  onClick={() => setPartyType('customer')}
                  className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                    partyType === 'customer' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Customers
                </button>
                <button 
                  onClick={() => setPartyType('vendor')}
                  className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                    partyType === 'vendor' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Vendors
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(partyType === 'customer' ? customers : vendors).map((party) => (
                <button
                  key={party.id}
                  onClick={() => setSelectedParty(party.name)}
                  className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-sm ${partyType === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{party.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                    {party.gstin || 'No GSTIN'}
                  </p>
                </button>
              ))}
              {(partyType === 'customer' ? customers : vendors).length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] bg-white border border-dashed border-gray-200 rounded-sm">
                  No {partyType}s found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
