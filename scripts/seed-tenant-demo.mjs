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
    // Skip if .env.local is missing and the values are provided by environment.
  }
}

readLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tenantName = process.env.DEMO_TENANT_NAME ?? "Igreja Demo";
const tenantSlug = process.env.DEMO_TENANT_SLUG ?? "igreja-demo";
const planCode = process.env.DEMO_PLAN_CODE ?? "plano-demo";
const adminEmail = process.env.DEMO_TENANT_ADMIN_EMAIL ?? "admin-demo@igreja.org";
const adminPassword = process.env.DEMO_TENANT_ADMIN_PASSWORD ?? "Demo1234!";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    [
      "Variáveis obrigatórias ausentes:",
      "- NEXT_PUBLIC_SUPABASE_URL",
      "- SUPABASE_SERVICE_ROLE_KEY",
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

async function getOrCreateUser() {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    query: adminEmail,
    limit: 1,
  });

  if (listError) {
    throw new Error(`Falha ao buscar usuário existente: ${listError.message}`);
  }

  const existingUser = listData?.users?.find((user) => user.email === adminEmail);
  if (existingUser) {
    return existingUser;
  }

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Admin Demo",
    },
  });

  if (createError) {
    throw new Error(`Falha ao criar usuário de tenant: ${createError.message}`);
  }

  if (!createdUser.user) {
    throw new Error("Supabase não retornou o usuário criado.");
  }

  return createdUser.user;
}

async function main() {
  const { data: planData, error: planError } = await supabaseAdmin.from("plans").upsert(
    [
      {
        name: "Plano de Demonstração",
        code: planCode,
        description: "Plano de demonstração para testes do Admin Cliente.",
        monthly_price_cents: 0,
        status: "active",
        max_members: 100,
        max_admins: 5,
        sort_order: 0,
      },
    ],
    { onConflict: "code" },
  );

  if (planError) {
    throw new Error(`Falha ao criar plano de demonstração: ${planError.message}`);
  }

  const plan = planData?.[0];
  const tenantPayload = {
    name: tenantName,
    slug: tenantSlug,
    legal_name: `${tenantName} Ltda`,
    document_number: "00.000.000/0001-00",
    contact_name: "Admin Demo",
    contact_email: adminEmail,
    contact_phone: "(11) 99999-0000",
    plan_id: plan?.id ?? null,
    status: "active",
    primary_color: "#087C7A",
    accent_color: "#00A7C4",
  };

  const { data: tenantData, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .upsert([tenantPayload], { onConflict: "slug" })
    .select("id")
    .single();

  if (tenantError) {
    throw new Error(`Falha ao criar Igreja de demonstração: ${tenantError.message}`);
  }

  const tenantId = tenantData.id;

  const moduleRows = [
    {
      code: "membros",
      name: "Membros",
      description: "Gestão de membros e ministérios.",
      status: "active",
      sort_order: 0,
    },
    {
      code: "eventos",
      name: "Eventos",
      description: "Calendário e programação.",
      status: "active",
      sort_order: 10,
    },
    {
      code: "comunicados",
      name: "Comunicados",
      description: "Avisos e mensagens gerais.",
      status: "active",
      sort_order: 20,
    },
  ];

  const { error: modulesError } = await supabaseAdmin.from("platform_modules").upsert(moduleRows, {
    onConflict: "code",
  });

  if (modulesError) {
    throw new Error(`Falha ao criar catálogo de módulos: ${modulesError.message}`);
  }

  const { data: allModules, error: allModulesError } = await supabaseAdmin
    .from("platform_modules")
    .select("id, code")
    .in("code", moduleRows.map((module) => module.code));

  if (allModulesError || !allModules) {
    throw new Error(`Falha ao recuperar módulos após criação: ${allModulesError?.message}`);
  }

  const tenantModuleRows = allModules.map((module) => ({
    tenant_id: tenantId,
    module_id: module.id,
    status: "active",
    enabled_at: new Date().toISOString(),
    configured_at: new Date().toISOString(),
  }));

  const { error: tenantModulesError } = await supabaseAdmin.from("tenant_modules").upsert(tenantModuleRows, {
    onConflict: "tenant_id,module_id",
  });

  if (tenantModulesError) {
    throw new Error(`Falha ao configurar módulos do tenant: ${tenantModulesError.message}`);
  }

  const user = await getOrCreateUser();

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: user.id,
    email: adminEmail,
    full_name: "Admin Demo",
    tenant_id: tenantId,
    tenant_role: "owner",
    status: "active",
  });

  if (profileError) {
    throw new Error(`Falha ao criar perfil de usuário do tenant: ${profileError.message}`);
  }

  const memberRows = [
    {
      id: `${tenantId}-member-1`,
      tenant_id: tenantId,
      name: "Mariana Souza",
      email: "mariana@igreja.org",
      phone: "(11) 99999-0001",
      status: "active",
      ministry: "Louvor",
      notes: "Líder de célula.",
    },
    {
      id: `${tenantId}-member-2`,
      tenant_id: tenantId,
      name: "Paulo Alves",
      email: "paulo@igreja.org",
      phone: "(11) 99999-0002",
      status: "active",
      ministry: "Recepção",
      notes: "Voluntário de plantão.",
    },
  ];

  const announcementRows = [
    {
      id: `${tenantId}-announce-1`,
      tenant_id: tenantId,
      title: "Culto Especial",
      message: "Não perca o culto especial de domingo com convidados.",
      published_at: new Date().toISOString(),
    },
  ];

  const eventRows = [
    {
      id: `${tenantId}-event-1`,
      tenant_id: tenantId,
      title: "Culto Dominical",
      description: "Adoração, palavra e comunhão.",
      location: "Templo principal",
      event_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    },
  ];

  const { error: membersError } = await supabaseAdmin.from("members").upsert(memberRows, {
    onConflict: "id",
  });

  if (membersError) {
    throw new Error(`Falha ao criar membros de demonstração: ${membersError.message}`);
  }

  const { error: announcementsError } = await supabaseAdmin.from("tenant_announcements").upsert(announcementRows, {
    onConflict: "id",
  });

  if (announcementsError) {
    throw new Error(`Falha ao criar comunicados de demonstração: ${announcementsError.message}`);
  }

  const { error: eventsError } = await supabaseAdmin.from("tenant_events").upsert(eventRows, {
    onConflict: "id",
  });

  if (eventsError) {
    throw new Error(`Falha ao criar eventos de demonstração: ${eventsError.message}`);
  }

  console.log("Igreja de demonstração criado com sucesso.");
  console.log(`Tenant: ${tenantName} (${tenantSlug})`);
  console.log(`Usuário: ${adminEmail}`);
  console.log(`Senha: ${adminPassword}`);
  console.log("Abra /admin-cliente e faça login com o usuário da igreja para testar o Admin Cliente.");
}

await main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
