/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  Code,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export const GstSummaryModule: React.FC = () => {
  const { company } = useAccounting();

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

  const gstReceived = filteredSales.reduce((sum, s) => sum + s.gstAmount, 0);
  const gstPaid = filteredPurchases.reduce((sum, p) => sum + p.gstAmount, 0);

  let netType: 'Payable' | 'Credit' | 'Nil' = 'Nil';
  let netAmount = 0;

  if (gstReceived > gstPaid) {
    netType = 'Payable';
    netAmount = gstReceived - gstPaid;
  } else if (gstPaid > gstReceived) {
    netType = 'Credit';
    netAmount = gstPaid - gstReceived;
  }

  const jsonOutput = {
    gst_received: parseFloat(gstReceived.toFixed(2)),
    gst_paid: parseFloat(gstPaid.toFixed(2)),
    net_result: {
      type: netType,
      amount: parseFloat(netAmount.toFixed(2))
    },
    split: {
      cgst: parseFloat((netAmount / 2).toFixed(2)),
      sgst: parseFloat((netAmount / 2).toFixed(2))
    }
  };

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">GST Summary</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Output GST</span>
              </div>
              <p className="text-3xl font-bold mt-4 text-gray-900">₹{gstReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">GST Received (Sales)</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Input GST</span>
              </div>
              <p className="text-3xl font-bold mt-4 text-gray-900">₹{gstPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">GST Paid (Purchases)</p>
            </motion.div>
          </div>

          {/* Net Result Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-8 rounded-3xl border shadow-lg ${
              netType === 'Payable' ? 'bg-orange-600 border-orange-500 text-white shadow-orange-100' :
              netType === 'Credit' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-100' :
              'bg-gray-800 border-gray-700 text-white shadow-gray-100'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">Net GST Status</p>
                  <h2 className="text-2xl font-bold">GST {netType}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-mono font-bold">₹{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">CGST Split (50%)</p>
                <p className="text-xl font-mono font-bold">₹{(netAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">SGST Split (50%)</p>
                <p className="text-xl font-mono font-bold">₹{(netAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs opacity-70 italic">
              <Info className="w-3 h-3" />
              {netType === 'Payable' ? 'This amount must be paid to the government.' : 
               netType === 'Credit' ? 'This amount can be carried forward or claimed as refund.' : 
               'Your GST accounts are perfectly balanced.'}
            </div>
          </motion.div>
        </div>

        {/* JSON Output Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-xl overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">JSON Summary</h2>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="p-6 flex-1 font-mono text-sm overflow-auto custom-scrollbar">
              <pre className="text-indigo-300">
                {JSON.stringify(jsonOutput, null, 2)}
              </pre>
            </div>
            <div className="p-4 bg-gray-950/50 border-t border-gray-800 text-[10px] text-gray-500 font-medium text-center uppercase tracking-widest">
              Live API Response Format
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}} />
    </div>
  );
};
