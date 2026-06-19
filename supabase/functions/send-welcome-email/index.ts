import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM     = Deno.env.get('EMAIL_FROM') ?? 'noreply@strivepersonal.com.br'
const APP_URL        = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://strivepersonal.com.br'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailPayload {
  email: string
  fullName: string
  businessName: string
  tempPassword: string
  logoUrl?: string | null
  primaryColor?: string | null
}

function buildHtml(payload: WelcomeEmailPayload): string {
  const { email, fullName, businessName, tempPassword, primaryColor } = payload
  const accentColor = primaryColor ?? '#E8FF47'
  const loginUrl    = `${APP_URL}/login`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bem-vindo ao Strive Personal</title>
</head>
<body style="margin:0;padding:0;background-color:#0E0E1A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:6px;text-transform:uppercase;">
                STRIVE
              </span>
              <br/>
              <span style="font-size:11px;color:#B0B0C3;letter-spacing:3px;text-transform:uppercase;">
                Personal
              </span>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#1A1A2E;border:1px solid #2A2A45;border-radius:16px;overflow:hidden;">

              <!-- Barra de cor do cliente -->
              <div style="height:4px;background-color:${accentColor};"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 32px;">

                <!-- Saudação -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;">
                      Bem-vindo, ${fullName}! 👋
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#B0B0C3;line-height:1.6;">
                      Sua conta na plataforma <strong style="color:#FFFFFF;">Strive Personal</strong> foi criada para o negócio
                      <strong style="color:#FFFFFF;">${businessName}</strong>.
                      Use os dados abaixo para acessar o sistema.
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
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">E-mail de acesso</p>
                          <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Senha provisória</p>
                          <p style="margin:0;font-size:22px;color:${accentColor};font-weight:700;letter-spacing:4px;font-family:monospace;">
                            ${tempPassword}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Aviso de troca de senha -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.2);border-radius:10px;padding:14px 18px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#E8FF47;font-weight:600;">⚠️ Troca de senha obrigatória</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#B0B0C3;line-height:1.5;">
                            No primeiro acesso você será solicitado a criar uma nova senha pessoal.
                            A senha provisória acima será invalidada após a troca.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${loginUrl}"
                      style="display:inline-block;background-color:${accentColor};color:#000000;font-weight:700;font-size:15px;
                             text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.5px;">
                      Acessar o sistema →
                    </a>
                  </td>
                </tr>

                <!-- Suporte -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#B0B0C3;line-height:1.6;text-align:center;">
                      Dúvidas? Entre em contato pelo e-mail<br/>
                      <a href="mailto:suporte@strivepersonal.com.br"
                        style="color:${accentColor};text-decoration:none;">
                        suporte@strivepersonal.com.br
                      </a>
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
                © ${new Date().getFullYear()} Strive Personal · Todos os direitos reservados
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#B0B0C3;opacity:0.4;">
                Você recebeu este e-mail porque uma conta foi criada em seu nome.
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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada')
    }

    const payload: WelcomeEmailPayload = await req.json()

    if (!payload.email || !payload.tempPassword || !payload.businessName) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes: email, tempPassword, businessName' }),
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
        from: `Strive Personal <${EMAIL_FROM}>`,
        to: [payload.email],
        subject: `Bem-vindo ao Strive Personal — seus dados de acesso`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('[send-welcome-email] Resend error:', resendData)
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
    console.error('[send-welcome-email] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
