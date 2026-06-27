const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).filter(line => !line.trim().startsWith("#") && line.includes("=")).map(line => { const idx = line.indexOf("="); return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]; }));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const usage = await sb.from("ai_usage_events").select("id, feature_type, client_platform, provider, usage_kind, status, created_at, input_tokens, output_tokens, latency_ms, metadata, error_message").order("created_at", { ascending: false }).limit(20);
  const messages = await sb.from("ai_messages").select("id, role, metadata, created_at, conversation_id").order("created_at", { ascending: false }).limit(20);
  console.log(JSON.stringify({ usage: usage.data ?? [], usageError: usage.error?.message ?? null, messages: messages.data ?? [], messagesError: messages.error?.message ?? null }, null, 2));
})();
