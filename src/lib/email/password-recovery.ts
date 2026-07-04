export interface PasswordRecoveryEmailPayload {
  recipientName: string
  recipientEmail: string
  recoveryLink: string
  appUrl: string
}

/**
 * Escapa valores dinâmicos antes de interpolar no HTML do e-mail.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Monta o HTML reutilizável do e-mail de recuperação de senha.
 */
export function buildPasswordRecoveryEmail({
  recipientName,
  recipientEmail,
  recoveryLink,
  appUrl,
}: PasswordRecoveryEmailPayload): string {
  const safeName = escapeHtml(recipientName)
  const safeEmail = escapeHtml(recipientEmail)
  const safeRecoveryLink = escapeHtml(recoveryLink)
  const safeAppUrl = escapeHtml(appUrl)

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir senha</title>
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0E0E1A;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
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
          <tr>
            <td style="background-color:#1A1A2E;border:1px solid #2A2A45;border-radius:16px;overflow:hidden;">
              <div style="height:4px;background-color:#E8FF47;"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 32px;">
                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;">
                      Olá, ${safeName}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#B0B0C3;line-height:1.7;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no
                      <strong style="color:#FFFFFF;"> Strive Personal</strong>.
                    </p>
                    <p style="margin:12px 0 0;font-size:15px;color:#B0B0C3;line-height:1.7;">
                      Use o botão abaixo para continuar com segurança. Se você não pediu essa alteração, basta ignorar este e-mail.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:#0E0E1A;border:1px solid #2A2A45;border-radius:12px;padding:20px 24px;">
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:1px solid #2A2A45;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Conta solicitante</p>
                          <p style="margin:0;font-size:15px;color:#FFFFFF;font-weight:600;">${safeEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#B0B0C3;text-transform:uppercase;letter-spacing:1px;">Ação disponível</p>
                          <p style="margin:0;font-size:15px;color:#E8FF47;font-weight:700;">Criar uma nova senha de acesso</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${safeRecoveryLink}"
                      style="display:inline-block;background-color:#E8FF47;color:#000000;font-weight:700;font-size:15px;
                             text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.5px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background-color:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.2);border-radius:10px;padding:14px 18px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#E8FF47;font-weight:600;">Dica de segurança</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#B0B0C3;line-height:1.6;">
                            Após abrir o link, escolha uma senha forte e exclusiva para sua conta. Se este pedido não foi feito por você, nenhuma ação adicional é necessária.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#B0B0C3;">
                      Se o botão não funcionar, copie e cole este link no navegador:
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;">
                      <a href="${safeRecoveryLink}" style="color:#E8FF47;text-decoration:none;">${safeRecoveryLink}</a>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#B0B0C3;line-height:1.6;text-align:center;">
                      Você também pode acessar o sistema por<br/>
                      <a href="${safeAppUrl}/login" style="color:#E8FF47;text-decoration:none;">${safeAppUrl}/login</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#B0B0C3;opacity:0.5;">
                © ${new Date().getFullYear()} Strive Personal · Todos os direitos reservados
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#B0B0C3;opacity:0.4;">
                Você recebeu este e-mail porque foi solicitada a redefinição da sua senha.
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
