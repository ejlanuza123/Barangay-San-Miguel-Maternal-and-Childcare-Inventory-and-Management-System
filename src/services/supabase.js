// File: src/services/supabase.js
import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from Environment Variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);