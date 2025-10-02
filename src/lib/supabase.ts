import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kuthirbcjtofsdwsfhkj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dGhpcmJjanRvZnNkd3NmaGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTAyOTQsImV4cCI6MjA1NDY4NjI5NH0.Mpt8HEXNEspVRnVs4i6bUNxGpLZxfMvTL8OcdY1x_e8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);