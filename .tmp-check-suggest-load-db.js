const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).filter(line => !line.trim().startsWith("#") && line.includes("=")).map(line => { const idx = line.indexOf("="); return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]; }));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const usage = await sb.from("ai_usage_events").select("id, feature_type, client_platform, status, created_at, input_tokens, output_tokens, metadata, error_message").eq("feature_type", "suggest_load").order("created_at", { ascending: false }).limit(10);
  const messages = await sb.from("ai_messages").select("id, role, metadata, created_at, conversation_id, content").order("created_at", { ascending: false }).limit(12);
  console.log(JSON.stringify({ usage: usage.data ?? [], usageError: usage.error?.message ?? null, messages: messages.data ?? [], messagesError: messages.error?.message ?? null }, null, 2));
})();
