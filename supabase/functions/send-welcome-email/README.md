# Edge Function: send-welcome-email

Envia e-mail de boas-vindas para novos clientes (personal trainers) via Resend.

## Deploy

```bash
# Na raiz do projeto
supabase functions deploy send-welcome-email --project-ref lodetzmtsymvnjffmvat
```

## Variáveis de ambiente necessárias no Supabase

Configurar em: Supabase Dashboard → Project → Edge Functions → Secrets

```
RESEND_API_KEY=re_...
EMAIL_FROM=noreplay@algoritmumbrasil.com.br
NEXT_PUBLIC_APP_URL=https://strivepersonal.com.br   # ou http://localhost:3000 em dev
```

## Payload esperado (POST)

```json
{
  "email": "personal@email.com",
  "fullName": "João Silva",
  "businessName": "João Silva Personal",
  "tempPassword": "Ab12cd@!",
  "logoUrl": "https://...",      // opcional
  "primaryColor": "#E8FF47"     // opcional
}
```

## Resposta

```json
{ "success": true, "id": "resend-message-id" }
```
