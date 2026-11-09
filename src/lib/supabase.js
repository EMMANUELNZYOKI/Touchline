import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug step: check if these print as actual string values in browser console
console.log('Supabase URL:', supabaseUrl) 
console.log('Supabase Key Loaded:', !!supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)