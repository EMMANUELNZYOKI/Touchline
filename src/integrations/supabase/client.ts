import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Load variables strictly from standard Vite env
const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.",
  );
}

// Export a direct, standard Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
