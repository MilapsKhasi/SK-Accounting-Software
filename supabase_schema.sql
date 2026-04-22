-- FINAL SQL SCHEMA FOR ACCOUNTING APP
-- This script removes existing tables and creates new ones with RLS enabled.

-- 1. Drop existing tables
DROP TABLE IF EXISTS purchase_entries CASCADE;
DROP TABLE IF EXISTS sales_entries CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create Profiles table (Company settings)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT 'ZenterPrime GST',
  gst_number TEXT,
  address TEXT,
  creation_date DATE DEFAULT CURRENT_DATE
);

-- 3. Create Vendors table
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gstin TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 4. Create Customers table
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gstin TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 5. Create Purchase Entries table
CREATE TABLE purchase_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  date DATE NOT NULL,
  vendor TEXT NOT NULL,
  item_name TEXT,
  hsn_code TEXT,
  rate NUMERIC DEFAULT 0,
  qty NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discounted_amount NUMERIC DEFAULT 0,
  gst_percent NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  net_bill NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  gst_enabled BOOLEAN DEFAULT TRUE,
  payments JSONB DEFAULT '[]'::jsonb
);

-- 6. Create Sales Entries table
CREATE TABLE sales_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  customer TEXT NOT NULL,
  item_name TEXT,
  hsn_code TEXT,
  rate NUMERIC DEFAULT 0,
  qty NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discounted_amount NUMERIC DEFAULT 0,
  gst_percent NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  net_bill NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  gst_enabled BOOLEAN DEFAULT TRUE,
  payments JSONB DEFAULT '[]'::jsonb
);

-- 7. Create Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  file_name TEXT,
  created_at TEXT
);

-- 8. Create Inventory table
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  stock NUMERIC DEFAULT 0,
  unit TEXT,
  min_stock NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0
);

-- 9. Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies (Users can only see/edit their own data)

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Vendors Policies
CREATE POLICY "Users can view own vendors" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vendors" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vendors" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vendors" ON vendors FOR DELETE USING (auth.uid() = user_id);

-- Customers Policies
CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = user_id);

-- Purchase Entries Policies
CREATE POLICY "Users can view own purchases" ON purchase_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchase_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON purchase_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON purchase_entries FOR DELETE USING (auth.uid() = user_id);

-- Sales Entries Policies
CREATE POLICY "Users can view own sales" ON sales_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON sales_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON sales_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON sales_entries FOR DELETE USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Inventory Policies
CREATE POLICY "Users can view own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory FOR DELETE USING (auth.uid() = user_id);
