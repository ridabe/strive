/**
 * Edge Function: notify-sales-new-client
 *
 * Enviada automaticamente via trigger PostgreSQL (pg_net) sempre que um
 * novo personal trainer se cadastra — web ou app mobile.
 *
 * Requer secrets do projeto (Supabase Dashboard > Settings > Edge Functions):
 *   RESEND_API_KEY        — já configurado
 *   NOTIFY_SALES_SECRET   — segredo compartilhado com o trigger do banco
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY')    ?? ''
const NOTIFY_SECRET     = Deno.env.get('NOTIFY_SALES_SECRET') ?? ''
const EMAIL_FROM        = Deno.env.get('EMAIL_FROM')        ?? 'noreply@strivepersonal.com.br'
const SALES_EMAIL       = 'vendas@strivepersonal.com.br'

interface NewClientPayload {
  full_name:     string
  email:         string | null
  business_name: string
  plan:          string
  slug:          string
  registered_at: string
  source:        string   // 'web' | 'mobile' | 'admin'
}

const PLAN_LABELS: Record<string, string> = {
  free:    'Gratuito',
  pro:     'Pro',
  premium: 'Premium',
}

function buildHtml(p: NewClientPayload): string {
  const planLabel = PLAN_LABELS[p.plan] ?? p.plan
  const date = new Date(p.registered_at).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Novo cadastro — Strive Personal</title>
</head>
<body style="margin:0;padding:0;background-color:#0E0E1A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:6px;text-transform:uppercase;">STRIVE</span>
              <br/>
              <span style="font-size:10px;color:#B0B0C3;letter-spacing:3px;text-transform:uppercase;">Personal · Vendas</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1A1A2E;border:1px solid #2A2A45;border-radius:16px;overflow:hidden;">
              <div style="height:4px;background:linear-gradient(90deg,#E8FF47,#a3c418);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px;">

                <!-- Título -->
                <tr>
                  <td style="padding-bottom:6px;">
                    <p style="margin:0;font-size:11px;color:#E8FF47;font-weight:700;letter-spacing:2px;text-transform:uppercase;">🎯 Novo cadastro</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;">
                      ${p.full_name} acabou de se cadastrar
                    </h1>
                  </td>
                </tr>

                <!-- Dados do cliente -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#0E0E1A;border:1px solid #2A2A45;border-radius:12px;">
                      ${row('Nome',        p.full_name,                true)}
                      ${row('E-mail',      p.email ?? '—',             false)}
                      ${row('Studio',      p.business_name,            false)}
                      ${row('Plano',       planLabel,                  false)}
                      ${row('Origem',      capitalize(p.source),       false)}
                      ${rowLast('Horário', date)}
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="https://app.strivepersonal.com.br/admin/clientes"
                      style="display:inline-block;background-color:#E8FF47;color:#000000;font-weight:700;
                             font-size:14px;text-decoration:none;padding:12px 32px;border-radius:100px;">
                      Ver no Admin →
                    </a>
                  </td>
                </tr>

                <!-- Nota -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#B0B0C3;line-height:1.6;text-align:center;">
                      Este e-mail é automático — enviado sempre que um novo personal se cadastra na plataforma.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#B0B0C3;opacity:0.4;">
                © ${new Date().getFullYear()} Strive Personal — uso interno
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function row(label: string, value: string, first: boolean): string {
  return `
    <tr>
      <td style="padding:14px 20px ${first ? '14px' : '0'} 20px;${first ? '' : 'padding-top:0;'}border-bottom:1px solid #2A2A45;">
        <p style="margin:0 0 2px;font-size:10px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">${label}</p>
        <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${value}</p>
      </td>
    </tr>
  `
}

function rowLast(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:14px 20px;">
        <p style="margin:0 0 2px;font-size:10px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">${label}</p>
        <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${value}</p>
      </td>
    </tr>
  `
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

serve(async (req: Request) => {
  // Valida o segredo compartilhado com o trigger do banco
  const secret = req.headers.get('x-notify-secret') ?? ''
  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!RESEND_API_KEY) {
    console.error('[notify-sales] RESEND_API_KEY não configurada')
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY ausente' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: NewClientPayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const html = buildHtml(payload)

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `Strive Personal <${EMAIL_FROM}>`,
      to:      [SALES_EMAIL],
      subject: `🎯 Novo cadastro: ${payload.full_name} — ${payload.business_name}`,
      html,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[notify-sales] Resend error:', data)
    return new Response(JSON.stringify({ error: 'Falha no envio', details: data }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log('[notify-sales] Email enviado para', SALES_EMAIL, '| id:', data.id)
  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
