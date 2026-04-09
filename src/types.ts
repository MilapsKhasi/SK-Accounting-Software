/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
}

export interface PurchaseEntry {
  id: string;
  billNumber: string;
  date: string;
  vendor: string;
  itemName: string;
  hsnCode: string;
  rate: number;
  qty: number;
  amount: number;
  discountPercent: number;
  discountedAmount: number;
  gstPercent: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  netBill: number;
  status: 'Pending' | 'Paid' | 'Partially Paid';
  gstEnabled: boolean;
  payments: Payment[];
}

export interface SalesEntry {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  itemName: string;
  hsnCode: string;
  rate: number;
  qty: number;
  amount: number;
  discountPercent: number;
  discountedAmount: number;
  gstPercent: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  netBill: number;
  status: 'Pending' | 'Paid' | 'Partially Paid';
  gstEnabled: boolean;
  payments: Payment[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Task {
  id: string;
  title: string;
  type: 'sales' | 'purchase' | 'report';
  status: 'urgent' | 'pending' | 'done';
  createdAt: string;
  fileName?: string;
  validationErrors?: string[];
}

export interface TaskQueue {
  urgent: Task[];
  pending: Task[];
  done: Task[];
}

export interface ReportsSnapshot {
  sales_total: number;
  purchase_total: number;
  gst_payable: number;
  stock_value: number;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  gstin: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Company {
  company_name: string;
  gst_number: string;
  address: string;
  creation_date: string;
  modules: {
    purchase: PurchaseEntry[];
    sales: SalesEntry[];
    inventory: InventoryItem[];
    reports: any[];
    vendors: Vendor[];
    customers: Customer[];
  };
  task_queue: TaskQueue;
  reports_snapshot: ReportsSnapshot;
}
