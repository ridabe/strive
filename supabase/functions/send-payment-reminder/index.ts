import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM     = Deno.env.get('EMAIL_FROM') ?? 'noreply@strivepersonal.com.br'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentReminderPayload {
  email: string
  studentName: string
  businessName: string
  amount: number
  dueDate: string // "YYYY-MM-DD"
  logoUrl?: string | null
  primaryColor?: string | null
}

function formatAmount(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function buildHtml(p: PaymentReminderPayload): string {
  const accent = p.primaryColor ?? '#E8FF47'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lembrete de pagamento — ${p.businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0E0E1A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              ${p.logoUrl
                ? `<img src="${p.logoUrl}" alt="${p.businessName}" style="max-height:56px;max-width:200px;object-fit:contain;"/>`
                : `<span style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:4px;text-transform:uppercase;">${p.businessName}</span>`
              }
            </td>
          </tr>

          <tr>
            <td style="background-color:#1A1A2E;border:1px solid #2A2A45;border-radius:16px;overflow:hidden;">

              <div style="height:4px;background-color:${accent};"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 32px;">

                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;">
                      Olá, ${p.studentName}!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#B0B0C3;line-height:1.7;">
                      Passando para lembrar que sua mensalidade em
                      <strong style="color:#FFFFFF;">${p.businessName}</strong>
                      vence hoje.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#0E0E1A;border:1px solid #2A2A45;border-radius:12px;padding:20px 24px;">
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:1px solid #2A2A45;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Valor</p>
                          <p style="margin:0;font-size:22px;color:${accent};font-weight:700;">${formatAmount(p.amount)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Vencimento</p>
                          <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${formatDateBR(p.dueDate)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#B0B0C3;line-height:1.6;text-align:center;">
                      Já efetuou o pagamento? Desconsidere este lembrete —<br/>
                      o registro será atualizado pela equipe de
                      <strong style="color:#FFFFFF;">${p.businessName}</strong>.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#B0B0C3;opacity:0.5;">
                © ${new Date().getFullYear()} Strive Personal · ${p.businessName}
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

    const payload: PaymentReminderPayload = await req.json()

    if (!payload.email || !payload.studentName || !payload.businessName || !payload.dueDate || payload.amount == null) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes: email, studentName, businessName, amount, dueDate' }),
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
        subject: `Lembrete: sua mensalidade em ${payload.businessName} vence hoje`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('[send-payment-reminder] Resend error:', resendData)
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
    console.error('[send-payment-reminder] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
