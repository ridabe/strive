const fs = require("fs");
const path = require("path");
const root = path.resolve("supabase/functions/ai-assistant");
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).filter(line => !line.trim().startsWith("#") && line.includes("=")).map(line => { const idx = line.indexOf("="); return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]; }));
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
(async () => {
  const files = walk(root).filter((file) => file.endsWith('.ts'));
  const form = new FormData();
  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const blob = new Blob([fs.readFileSync(file)], { type: 'application/typescript' });
    form.append('file', blob, rel);
  }
  form.append('metadata', JSON.stringify({ entrypoint_path: 'index.ts', verify_jwt: true, name: 'ai-assistant' }));
  const resp = await fetch('https://api.supabase.com/v1/projects/lodetzmtsymvnjffmvat/functions/deploy?slug=ai-assistant', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
    body: form,
  });
  const text = await resp.text();
  console.log(JSON.stringify({ status: resp.status, ok: resp.ok, text }, null, 2));
})();
