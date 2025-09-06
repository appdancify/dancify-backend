// 2. src/config/supabase.js (Updated with your credentials)
// ================================================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jagzkknhmitnrknhywzc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZ3pra25obWl0bnJrbmh5d3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDkzNTUsImV4cCI6MjA3MjcyNTM1NX0.29Czwrly2NZVVVyI743pEsAxsfhCZD_2-ddAQtWNKcY';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZ3pra25obWl0bnJrbmh5d3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE0OTM1NSwiZXhwIjoyMDcyNzI1MzU1fQ.-niimr1KljLGf-Tt_yhSHqELrkGfhKKlvjekV8qQqgE';

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Client for regular operations (respects RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test connection on startup
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('dance_sections')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

// Test connection when module loads
testConnection();

module.exports = {
  supabase,
  supabaseAdmin
};