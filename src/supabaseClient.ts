// File: src/supabaseClient.ts
// This file creates a single, shared Supabase client for your entire app.

import { createClient } from "@supabase/supabase-js";

// Ensure your .env file has these variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.");
  // You can throw an error here to stop the app from running without config
  throw new Error("Supabase environment variables are not configured.");
}

// Create and export the single client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

