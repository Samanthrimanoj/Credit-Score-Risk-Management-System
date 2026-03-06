import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE with your actual Supabase project credentials
// Find them at: https://supabase.com → Your Project → Settings → API
const SUPABASE_URL = 'https://jcgprqqvfhyknysslqau.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZ3BycXF2Zmh5a255c3NscWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTM4MDYsImV4cCI6MjA4ODI4OTgwNn0.GrZuLDSngEcXUQSmMsQ0gGlmoXy5g_RPyZNA8LjnbCc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
