import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function readLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  try {
    const entries = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      });

    for (const [key, value] of entries) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // The script can also run with environment variables supplied by CI.
  }
}

readLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.GLOBAL_ADMIN_EMAIL;
const adminPassword = process.env.GLOBAL_ADMIN_PASSWORD;
const adminName = process.env.GLOBAL_ADMIN_NAME ?? "Admin Global SirvaOS";

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error(
    [
      "Variáveis obrigatórias ausentes:",
      "- NEXT_PUBLIC_SUPABASE_URL",
      "- SUPABASE_SERVICE_ROLE_KEY",
      "- GLOBAL_ADMIN_EMAIL",
      "- GLOBAL_ADMIN_PASSWORD",
    ].join("\n"),
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    full_name: adminName,
  },
});

if (createError) {
  console.error(`Falha ao criar usuário global: ${createError.message}`);
  process.exit(1);
}

const user = createdUser.user;

if (!user) {
  console.error("Supabase não retornou o usuário criado.");
  process.exit(1);
}

const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
  id: user.id,
  email: adminEmail,
  full_name: adminName,
  global_role: "super_admin",
  status: "active",
});

if (profileError) {
  console.error(`Usuário criado, mas falhou ao promover perfil: ${profileError.message}`);
  process.exit(1);
}

console.log(`Admin global criado e promovido: ${adminEmail}`);
