import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { URL } from "node:url";

function readLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const entries = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    });
  return Object.fromEntries(entries);
}

const env = readLocalEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = env.SUPABASE_DB_PASS;

if (!supabaseUrl || !dbPassword) {
  console.error("Variáveis obrigatórias ausentes em .env.local: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_DB_PASS.");
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).host.split(".")[0];
const encodedPassword = encodeURIComponent(dbPassword);
const dbUrl = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

const forwardedArgs = process.argv.slice(2);
const globalOnly =
  forwardedArgs.length === 0 ||
  forwardedArgs.includes("--version") ||
  forwardedArgs.includes("-v") ||
  forwardedArgs.includes("--help") ||
  forwardedArgs.includes("-h");
const shouldAttachDbUrl =
  forwardedArgs[0] === "db" ||
  (forwardedArgs[0] === "migration" && forwardedArgs[1] === "list");
const hasDbUrl = forwardedArgs.includes("--db-url");
const args = globalOnly || hasDbUrl || !shouldAttachDbUrl ? forwardedArgs : [...forwardedArgs, "--db-url", dbUrl];

const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/c", "node_modules\\.bin\\supabase.cmd", ...args], {
        stdio: "inherit",
      })
    : spawnSync("npx", ["supabase", ...args], { stdio: "inherit" });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
