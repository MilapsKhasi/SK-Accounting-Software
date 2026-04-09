/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Customer, SalesEntry } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Mail, 
  Phone, 
  MapPin, 
  UserCircle,
  Heart,
  History,
  ArrowLeft,
  TrendingUp,
  Edit2,
  FileText,
  X,
  Download,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const CustomerMasterModule: React.FC = () => {
  const { company, saveCustomer, deleteCustomer } = useAccounting();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const formatDateForExport = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const exportToPDF = (customer: Customer) => {
    const doc = new jsPDF();
    const ledgerData = getLedgerData(customer);
    const totalDebit = ledgerData.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = ledgerData.reduce((sum, r) => sum + r.credit, 0);
    const netBalance = Math.abs(totalDebit - totalCredit);

    const period = financialYear === '2025-26' ? '1 APRIL 25 TO 31 MARCH 26' : 
                   financialYear === '2024-25' ? '1 APRIL 24 TO 31 MARCH 25' : 
                   '1 APRIL 26 TO 31 MARCH 27';

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SK ENTERPRISE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('24CMAPK3117Q1ZZ', 105, 26, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(customer.name.toUpperCase(), 105, 38, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.gstin || "CUSTOMER'S GSTIN NUMBER", 105, 44, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(period, 105, 54, { align: 'center' });

    // Table
    autoTable(doc, {
      startY: 65,
      head: [['DATE', 'PARTICULARS', 'DEBIT', 'CREDIT']],
      body: ledgerData.map(row => [
        formatDateForExport(row.date),
        row.particulars.toUpperCase(),
        row.debit > 0 ? row.debit.toLocaleString('en-IN') : '',
        row.credit > 0 ? row.credit.toLocaleString('en-IN') : ''
      ]),
      theme: 'plain',
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Footer
    doc.setLineWidth(0.1);
    doc.line(15, finalY + 2, 195, finalY + 2);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 40, finalY + 8);
    
    doc.text(totalDebit.toLocaleString('en-IN'), 165, finalY + 8, { align: 'right' });
    doc.text(totalCredit.toLocaleString('en-IN'), 195, finalY + 8, { align: 'right' });

    doc.line(15, finalY + 12, 195, finalY + 12);
    
    doc.text('NET CLOSING BALANCE', 40, finalY + 18);
    doc.text(netBalance.toLocaleString('en-IN'), 195, finalY + 18, { align: 'right' });

    doc.save(`${customer.name}_Ledger_${financialYear}.pdf`);
    setShowExportDropdown(false);
  };

  const getLedgerData = (customer: Customer) => {
    const sales = company.modules.sales.filter(s => s.customer === customer.name);
    const ledger: any[] = [];

    sales.forEach(s => {
      // Add Invoice row
      ledger.push({
        date: s.date,
        particulars: `Sales Bill - ${s.invoiceNumber}`,
        debit: s.netBill,
        credit: 0,
        timestamp: new Date(s.date).getTime()
      });

      // Add Payment rows
      if (s.payments) {
        s.payments.forEach(p => {
          ledger.push({
            date: p.date,
            particulars: `Payment Received of Sales Bill - ${s.invoiceNumber} (${p.method})`,
            debit: 0,
            credit: p.amount,
            timestamp: new Date(p.date).getTime()
          });
        });
      }
    });

    return ledger.sort((a, b) => a.timestamp - b.timestamp);
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      gstin: customer.gstin || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const customerData: Customer = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      ...formData,
      createdAt: editingId 
        ? company.modules.customers.find(c => c.id === editingId)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    await saveCustomer(customerData);

    setEditingId(null);
    setFormData({
      name: '',
      gstin: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
  };

  const getCustomerTransactions = (customerName: string) => {
    return company.modules.sales.filter(s => s.customer.toLowerCase() === customerName.toLowerCase());
  };

  if (selectedCustomer) {
    const ledgerData = getLedgerData(selectedCustomer);
    const totalDebit = ledgerData.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = ledgerData.reduce((sum, r) => sum + r.credit, 0);
    const netBalance = Math.abs(totalDebit - totalCredit);

    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto bg-white shadow-sm border border-gray-100 rounded-3xl">
        <div className="flex justify-between items-center print:hidden mb-8">
          <button 
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
          
          <div className="flex items-center gap-4">
            <select 
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>

            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Download className="w-3 h-3" /> Export As <ChevronDown className={`w-3 h-3 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showExportDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10"
                  >
                    <button 
                      onClick={() => exportToPDF(selectedCustomer)}
                      className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-500" /> PDF Document
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center py-12">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1 uppercase">SK ENTERPRISE</h2>
            <p className="text-sm font-bold text-gray-400 tracking-[0.3em] uppercase">24CMAPK3117Q1ZZ</p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1">{selectedCustomer.name}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCustomer.gstin || "CUSTOMER'S GSTIN NUMBER"}</p>
          </div>

          <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] border-y border-gray-100 py-3 w-full max-w-md">
            {financialYear === '2025-26' ? '1 APRIL 25 TO 31 MARCH 26' : 
             financialYear === '2024-25' ? '1 APRIL 24 TO 31 MARCH 25' : 
             '1 APRIL 26 TO 31 MARCH 27'}
          </p>
        </div>

        <div className="overflow-x-auto pb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y-2 border-gray-900">
                <th className="py-5 px-2 text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em]">Date</th>
                <th className="py-5 px-2 text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em]">Particulars</th>
                <th className="py-5 px-2 text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em] text-right">Debit</th>
                <th className="py-5 px-2 text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em] text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledgerData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-5 px-2 text-sm font-bold text-gray-900">{row.date}</td>
                  <td className="py-5 px-2 text-sm font-bold text-gray-900 uppercase tracking-tight">{row.particulars}</td>
                  <td className="py-5 px-2 text-sm font-black text-gray-900 text-right">
                    {row.debit > 0 ? row.debit.toLocaleString('en-IN') : ''}
                  </td>
                  <td className="py-5 px-2 text-sm font-black text-gray-900 text-right">
                    {row.credit > 0 ? row.credit.toLocaleString('en-IN') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t-2 border-gray-900 pt-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em]">Total</p>
            <div className="flex gap-16">
              <p className="text-sm font-black text-gray-900 w-24 text-right">
                {totalDebit.toLocaleString('en-IN')}
              </p>
              <p className="text-sm font-black text-gray-900 w-24 text-right">
                {totalCredit.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-900 italic uppercase tracking-[0.2em]">Net Closing Balance</p>
            <p className="text-sm font-black text-gray-900 w-24 text-right">
              {netBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Customer Master</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              {editingId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      name: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                    });
                  }}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Global Solutions"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">GSTIN</label>
                <input 
                  type="text" 
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Person</label>
                <input 
                  type="text" 
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="e.g. Jane Smith"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full customer address"
                  rows={3}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-4 h-4" /> {editingId ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>

      {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Directory</h2>
              <span className="text-xs text-gray-400 font-medium">{company.modules.customers.length} Customers</span>
            </div>
            <div className="divide-y divide-gray-50">
              <AnimatePresence>
                {company.modules.customers.map((customer) => (
                  <motion.div 
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-6 hover:bg-green-50/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                          <UserCircle className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-gray-700">{customer.contactPerson || 'No Contact Person'}</span>
                            <span className="text-gray-300">•</span>
                            <span>Client since {customer.createdAt}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">View History</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{customer.email || 'No Email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{customer.phone || 'No Phone'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-3">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{customer.address || 'No Address Provided'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {company.modules.customers.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic text-sm">
                  No customers added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
