import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://nmwtpcbczurxrxcgpxyn.supabase.co";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function createBrowserSupabaseClient(): SupabaseClient {
  const key = getSupabaseAnonKey();
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
}

export function createAnonSupabaseClient(): SupabaseClient {
  const key = getSupabaseAnonKey();
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function createServerSupabaseClient(): SupabaseClient {
  const serviceKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;
  if (!key) throw new Error("Supabase server key is missing.");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
