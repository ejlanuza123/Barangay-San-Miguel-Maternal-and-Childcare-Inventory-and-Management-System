// File: src/services/supabase.js
import { createClient } from "@supabase/supabase-js";

// --- IMPORTANT ---
// 1. Go to your Supabase project dashboard.
// 2. Navigate to Project Settings > API.
// 3. Find your Project URL and anon Public Key.
// 4. Replace the placeholder strings below with your actual credentials.

const supabaseUrl = "https://grrgopimouontsvfmtje.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycmdvcGltb3VvbnRzdmZtdGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzY0NjgsImV4cCI6MjA2NzU1MjQ2OH0.jxfKPEk1qGUP2_yUxbYAWpWU94Ca60k04eeQZnANGB4"; // Replace with your Supabase "anon" Public Key

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
