/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { SalesEntry } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Clock, 
  FileText,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SalesEntryModule: React.FC = () => {
  const { company, ensureCustomerExists, saveSalesEntry, deleteSalesEntry } = useAccounting();
  const [gstEnabled, setGstEnabled] = useState(true);
  const [status, setStatus] = useState<'Pending' | 'Paid' | 'Partially Paid'>('Pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getNextInvoiceNumber = () => {
    const sales = company.modules.sales;
    if (sales.length === 0) return 'SI-001';
    
    // Find the highest number in SI-XXX format
    const numbers = sales
      .map(s => {
        const match = s.invoiceNumber.match(/SI-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);
    
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `SI-${nextNum.toString().padStart(3, '0')}`;
  };
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    itemName: '',
    hsnCode: '',
    rate: 0,
    qty: 0,
    discountPercent: 0,
    gstPercent: 18,
  });

  useEffect(() => {
    if (!editingId) {
      setFormData(prev => ({ ...prev, invoiceNumber: getNextInvoiceNumber() }));
    }
  }, [company.modules.sales, editingId]);

  const [calculated, setCalculated] = useState({
    amount: 0,
    discountedAmount: 0,
    gstAmount: 0,
    cgst: 0,
    sgst: 0,
    netBill: 0,
  });

  useEffect(() => {
    const amount = formData.rate * formData.qty;
    const discountAmount = amount * (formData.discountPercent / 100);
    const discountedAmount = amount - discountAmount;
    
    let gstAmount = 0;
    if (gstEnabled) {
      gstAmount = discountedAmount * (formData.gstPercent / 100);
    }
    
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const netBill = discountedAmount + gstAmount;

    setCalculated({
      amount,
      discountedAmount,
      gstAmount,
      cgst,
      sgst,
      netBill,
    });
  }, [formData, gstEnabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null);
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEdit = (entry: SalesEntry) => {
    setError(null);
    setEditingId(entry.id);
    setFormData({
      invoiceNumber: entry.invoiceNumber,
      date: entry.date,
      customer: entry.customer,
      itemName: entry.itemName,
      hsnCode: entry.hsnCode || '',
      rate: entry.rate,
      qty: entry.qty,
      discountPercent: entry.discountPercent,
      gstPercent: entry.gstPercent,
    });
    setGstEnabled(entry.gstEnabled);
    setStatus(entry.status);
    setPayments(entry.payments || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.invoiceNumber || !formData.customer) return;

    // Check for duplicates
    const isDuplicate = company.modules.sales.some(s => 
      s.invoiceNumber.toLowerCase() === formData.invoiceNumber.toLowerCase() && s.id !== editingId
    );

    if (isDuplicate) {
      setError(`Invoice number "${formData.invoiceNumber}" already exists!`);
      return;
    }

    // Auto-create customer if it doesn't exist
    await ensureCustomerExists(formData.customer);

    const entryData: SalesEntry = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      ...formData,
      ...calculated,
      status,
      gstEnabled,
      payments,
    };

    await saveSalesEntry(entryData);

    // Reset form
    setEditingId(null);
    setError(null);
    setPayments([]);
    setFormData({
      invoiceNumber: getNextInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      customer: '',
      itemName: '',
      hsnCode: '',
      rate: 0,
      qty: 0,
      discountPercent: 0,
      gstPercent: 18,
    });
  };

  const deleteEntry = async (id: string) => {
    await deleteSalesEntry(id);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Entry</h1>
          <p className="text-gray-500 mt-1">Record new sales invoices for {company.company_name}</p>
        </div>
        <div className="flex items-center gap-6 bg-white p-2 px-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GST</span>
            <button 
              onClick={() => setGstEnabled(!gstEnabled)}
              className="text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {gstEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
            </button>
          </div>
          <div className="h-6 w-[1px] bg-gray-100" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
            <select 
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as any;
                setStatus(newStatus);
                if (newStatus === 'Paid' || newStatus === 'Partially Paid') {
                  setShowPaymentModal(true);
                }
              }}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-indigo-600"
            >
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> {editingId ? 'Edit Invoice' : 'Invoice Details'}
              </h2>
              {editingId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      invoiceNumber: '',
                      date: new Date().toISOString().split('T')[0],
                      customer: '',
                      itemName: '',
                      hsnCode: '',
                      rate: 0,
                      qty: 0,
                      discountPercent: 0,
                      gstPercent: 18,
                    });
                  }}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Number</label>
                <input 
                  type="text" 
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. SI-001"
                  className={`w-full p-3 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl focus:ring-2 focus:bg-white transition-all outline-none text-sm font-bold`}
                  required
                />
                {error && <p className="text-[10px] font-bold text-red-500 mt-1">{error}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</label>
                <input 
                  type="text" 
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                  <input 
                    type="text" 
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="Product name"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">HSN Code</label>
                  <input 
                    type="text" 
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleInputChange}
                    placeholder="HSN"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rate (₹)</label>
                  <input 
                    type="number" 
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">QTY</label>
                  <input 
                    type="number" 
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount (%)</label>
                  <input 
                    type="number" 
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
                {gstEnabled && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">GST (%)</label>
                    <select 
                      name="gstPercent"
                      value={formData.gstPercent}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    >
                      <option value={5}>5%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                      <option value={40}>40%</option>
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {editingId ? 'Update Invoice' : 'Save Invoice'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Totals Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Invoice Summary</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount (Rate × Qty)</span>
                <span className="font-mono font-medium">₹{calculated.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discounted Amount</span>
                <span className="font-mono font-medium">₹{calculated.discountedAmount.toFixed(2)}</span>
              </div>
              
              <div className="h-[1px] bg-gray-100 my-2" />
              
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Subtotal (Without GST)</span>
                <span className="font-mono">₹{calculated.discountedAmount.toFixed(2)}</span>
              </div>

              {gstEnabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-2"
                >
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST Amount ({formData.gstPercent}%)</span>
                    <span className="font-mono">₹{calculated.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CGST</p>
                      <p className="text-sm font-mono font-bold text-gray-700">₹{calculated.cgst.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SGST</p>
                      <p className="text-sm font-mono font-bold text-gray-700">₹{calculated.sgst.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="pt-4">
                <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-100">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Net Invoice Amount</p>
                  <p className="text-3xl font-mono font-bold mt-1">₹{calculated.netBill.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Section */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Invoice Amount</span>
                    <span className="text-lg font-mono font-bold text-indigo-700">₹{calculated.netBill.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Balance Remaining</span>
                    <span className="text-lg font-mono font-bold text-red-600">
                      ₹{(calculated.netBill - payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                          <input 
                            type="date"
                            value={payment.date}
                            onChange={(e) => {
                              const newPayments = [...payments];
                              newPayments[index].date = e.target.value;
                              setPayments(newPayments);
                            }}
                            className="text-xs font-medium bg-transparent border-none p-0 focus:ring-0"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Method</p>
                          <select 
                            value={payment.method}
                            onChange={(e) => {
                              const newPayments = [...payments];
                              newPayments[index].method = e.target.value;
                              setPayments(newPayments);
                            }}
                            className="text-xs font-medium bg-transparent border-none p-0 focus:ring-0"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Amount</p>
                          <input 
                            type="number"
                            value={payment.amount}
                            onChange={(e) => {
                              const newPayments = [...payments];
                              newPayments[index].amount = parseFloat(e.target.value) || 0;
                              setPayments(newPayments);
                            }}
                            className="text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const remaining = calculated.netBill - payments.reduce((sum, p) => sum + p.amount, 0);
                    if (remaining <= 0) return;
                    setPayments([...payments, {
                      id: Math.random().toString(36).substr(2, 9),
                      date: new Date().toISOString().split('T')[0],
                      method: 'Cash',
                      amount: remaining
                    }]);
                  }}
                  disabled={calculated.netBill - payments.reduce((sum, p) => sum + p.amount, 0) <= 0}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Create New Payment
                </button>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 p-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                    if (totalPaid >= calculated.netBill - 0.01) { // Tolerance for float precision
                      setStatus('Paid');
                    } else if (totalPaid > 0) {
                      setStatus('Partially Paid');
                    } else {
                      setStatus('Pending');
                    }
                    setShowPaymentModal(false);
                  }}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Confirm Payments
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Listing Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sales Invoices Listing</h2>
          <span className="text-xs text-gray-400 font-medium">{company.modules.sales.length} Transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Invoice No</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Date</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Customer</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Item</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Amount</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">GST</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Net Bill</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {company.modules.sales.map((invoice) => (
                  <motion.tr 
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="p-4 text-sm font-bold text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="p-4 text-sm text-gray-500 font-mono">{invoice.date}</td>
                    <td className="p-4 text-sm text-gray-700 font-medium">{invoice.customer}</td>
                    <td className="p-4 text-sm text-gray-500">{invoice.itemName}</td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right">₹{invoice.amount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-gray-500 font-mono text-right">
                      {invoice.gstEnabled ? `₹${invoice.gstAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-sm font-bold text-indigo-600 font-mono text-right">₹{invoice.netBill.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {invoice.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEdit(invoice)}
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteEntry(invoice.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {company.modules.sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-400 italic text-sm">
                    No sales transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
