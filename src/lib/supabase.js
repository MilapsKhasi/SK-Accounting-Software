/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ovhhcodwimxhibalscfq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aGhjb2R3aW14aGliYWxzY2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTcyMTUsImV4cCI6MjA5MTI5MzIxNX0.2C2ZrAsi_0svgpUFjPIPtXrWgNVKN-_zn3pbDmqiLts';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
