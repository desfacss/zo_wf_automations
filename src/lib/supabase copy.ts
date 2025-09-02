import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey,{
  auth: {
    persistSession: true,
    storageKey: 'app.auth.token',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }}
);

export type Database = {
  external: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          organization_id: string;
          location_id: string;
          created_at: string;
          [key: string]: any;
        };
      };
    };
  };
  identity: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          organization_id: string;
          location_id: string;
          email: string;
          created_at: string;
          [key: string]: any;
        };
      };
    };
  };
};