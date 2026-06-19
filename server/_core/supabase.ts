import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

export function createSupabaseServerClient() {
  return createClient(ENV.supabaseUrl, ENV.supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
