import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM     = Deno.env.get('EMAIL_FROM') ?? 'noreply@strivepersonal.com.br'
const APP_URL        = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://strivepersonal.com.br'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentWelcomePayload {
  email: string
  studentName: string
  personalName: string
  businessName: string
  tempPassword: string
  logoUrl?: string | null
  primaryColor?: string | null
}

function buildHtml(p: StudentWelcomePayload): string {
  const accent   = p.primaryColor ?? '#E8FF47'
  const loginUrl = `${APP_URL}/login`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bem-vindo ao ${p.businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0E0E1A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              ${p.logoUrl
                ? `<img src="${p.logoUrl}" alt="${p.businessName}" style="max-height:56px;max-width:200px;object-fit:contain;"/>`
                : `<span style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:4px;text-transform:uppercase;">${p.businessName}</span>`
              }
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#1A1A2E;border:1px solid #2A2A45;border-radius:16px;overflow:hidden;">

              <div style="height:4px;background-color:${accent};"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 32px;">

                <!-- Saudação -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;">
                      Olá, ${p.studentName}! 🎯
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#B0B0C3;line-height:1.7;">
                      Você foi cadastrado(a) como aluno(a) por
                      <strong style="color:#FFFFFF;">${p.personalName}</strong>
                      no estúdio <strong style="color:#FFFFFF;">${p.businessName}</strong>.
                    </p>
                    <p style="margin:12px 0 0;font-size:15px;color:#B0B0C3;line-height:1.7;">
                      Através do aplicativo você terá acesso aos seus planos de treino, progresso, anamnese e muito mais. Use os dados abaixo para entrar.
                    </p>
                  </td>
                </tr>

                <!-- Credenciais -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#0E0E1A;border:1px solid #2A2A45;border-radius:12px;padding:20px 24px;">
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:1px solid #2A2A45;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Seu e-mail de acesso</p>
                          <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${p.email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Senha provisória</p>
                          <p style="margin:0;font-size:22px;color:${accent};font-weight:700;letter-spacing:4px;font-family:monospace;">
                            ${p.tempPassword}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Aviso troca de senha -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.2);border-radius:10px;padding:14px 18px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#E8FF47;font-weight:600;">⚠️ Troca de senha obrigatória</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#B0B0C3;line-height:1.5;">
                            No primeiro acesso você será solicitado(a) a criar uma senha pessoal.
                            A senha provisória acima será invalidada após a troca.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- O que você terá acesso -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;">
                      O que você encontrará no app:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ['🏋️', 'Planos de treino', 'Seus treinos organizados pelo seu personal'],
                        ['📊', 'Meu progresso', 'Registro de evolução com fotos e medidas'],
                        ['📅', 'Frequência', 'Calendário de treinos e streak de dias'],
                        ['📋', 'Anamnese', 'Sua ficha de saúde e histórico'],
                      ].map(([icon, title, desc]) => `
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2A2A45;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;font-size:18px;">${icon}</td>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;">${title}</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#B0B0C3;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${loginUrl}"
                      style="display:inline-block;background-color:${accent};color:#000000;font-weight:700;font-size:15px;
                             text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.5px;">
                      Acessar minha área →
                    </a>
                  </td>
                </tr>

                <!-- Contato personal -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#B0B0C3;line-height:1.6;text-align:center;">
                      Dúvidas? Fale com seu personal<br/>
                      <strong style="color:#FFFFFF;">${p.personalName}</strong>
                      no estúdio <strong style="color:#FFFFFF;">${p.businessName}</strong>.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#B0B0C3;opacity:0.5;">
                © ${new Date().getFullYear()} Strive Personal · ${p.businessName}
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#B0B0C3;opacity:0.4;">
                Você recebeu este e-mail porque foi cadastrado(a) como aluno(a).
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada')
    }

    const payload: StudentWelcomePayload = await req.json()

    if (!payload.email || !payload.studentName || !payload.tempPassword || !payload.businessName) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes: email, studentName, tempPassword, businessName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = buildHtml(payload)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${payload.businessName} via Strive <${EMAIL_FROM}>`,
        to: [payload.email],
        subject: `${payload.personalName} te adicionou ao ${payload.businessName} 🎯`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('[send-student-welcome] Resend error:', resendData)
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar e-mail', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-student-welcome] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
