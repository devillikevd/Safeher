// Initialize Supabase Client
const SUPABASE_URL = 'https://nwxmvwcmcurxgrgzejgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eG12d2NtY3VyeGdyZ3plamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mjc1OTgsImV4cCI6MjA5NjMwMzU5OH0.avUfHAtzqMo89g3NELN__cJqD5kiYmqStuFhRub7py4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('[SUPABASE] Initialized');
