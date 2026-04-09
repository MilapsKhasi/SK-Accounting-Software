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

  const gstReceived = company.modules.sales.reduce((sum, s) => sum + s.gstAmount, 0);
  const gstPaid = company.modules.purchase.reduce((sum, p) => sum + p.gstAmount, 0);

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">GST Summary</h1>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Tax liability and credit overview</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-green-50 rounded-sm text-green-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Output GST</span>
              </div>
              <p className="text-3xl font-bold mt-4 text-gray-900">₹{gstReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">GST Received (Sales)</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-sm text-blue-600">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Input GST</span>
              </div>
              <p className="text-3xl font-bold mt-4 text-gray-900">₹{gstPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">GST Paid (Purchases)</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-8 rounded-sm border ${
              netType === 'Payable' ? 'bg-white border-orange-200 border-l-4 border-l-orange-500' :
              netType === 'Credit' ? 'bg-white border-blue-200 border-l-4 border-l-blue-500' :
              'bg-white border-gray-200 border-l-4 border-l-gray-500'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-sm ${
                  netType === 'Payable' ? 'bg-orange-50 text-orange-600' :
                  netType === 'Credit' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Net GST Status</p>
                  <h2 className={`text-2xl font-bold uppercase tracking-tight ${
                    netType === 'Payable' ? 'text-orange-600' :
                    netType === 'Credit' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>GST {netType}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-900">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">CGST Split (50%)</p>
                <p className="text-xl font-bold text-gray-900">₹{(netAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">SGST Split (50%)</p>
                <p className="text-xl font-bold text-gray-900">₹{(netAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Info className="w-3 h-3" />
              {netType === 'Payable' ? 'This amount must be paid to the government.' : 
               netType === 'Credit' ? 'This amount can be carried forward or claimed as refund.' : 
               'Your GST accounts are perfectly balanced.'}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">JSON Summary</h2>
              </div>
            </div>
            <div className="p-4 flex-1 font-mono text-[11px] overflow-auto bg-gray-900 text-blue-300">
              <pre>
                {JSON.stringify(jsonOutput, null, 2)}
              </pre>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
              Live API Response Format
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
