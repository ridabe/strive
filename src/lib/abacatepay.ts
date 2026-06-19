import crypto from 'node:crypto'

// ─── Configuração ────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.abacatepay.com/v2'
const API_KEY  = process.env.API_ABACATE_PAY!

// Chave pública AbacatePay para verificação HMAC (constante da documentação)
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

// ─── Helper de request ────────────────────────────────────────────────────────

interface AbacateResponse<T> {
  data:    T | null
  error:   string | null
  success: boolean
}

async function request<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<AbacateResponse<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    // Desabilita cache do Next.js — sempre busca resultado fresco
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    return { data: null, error: text, success: false }
  }

  return res.json() as Promise<AbacateResponse<T>>
}

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface AbacateProduct {
  id:          string
  externalId:  string
  name:        string
  description: string | null
  price:       number       // em centavos
  currency:    'BRL'
  cycle:       string | null
  status:      'ACTIVE' | 'INACTIVE'
  devMode:     boolean
  createdAt:   string
  updatedAt:   string
}

export interface AbacateCheckout {
  id:            string
  url:           string
  externalId:    string | null
  amount:        number
  status:        'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED'
  devMode:       boolean
  completionUrl: string | null
  returnUrl:     string | null
  receiptUrl:    string | null
  createdAt:     string
  updatedAt:     string
}

// ─── API: Produtos ────────────────────────────────────────────────────────────

export async function createAbacateProduct(params: {
  externalId:  string
  name:        string
  description?: string
  price:       number          // em REAIS (convertemos para centavos internamente)
  cycle?:      'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY'
}) {
  return request<AbacateProduct>('/products/create', {
    externalId:  params.externalId,
    name:        params.name,
    description: params.description,
    price:       Math.round(params.price * 100), // centavos
    currency:    'BRL',
    cycle:       params.cycle,
  })
}

// ─── API: Assinatura checkout ─────────────────────────────────────────────────

export async function createSubscriptionCheckout(params: {
  productId:     string
  externalId:    string
  completionUrl: string
  returnUrl:     string
  methods?:      Array<'CARD' | 'PIX'>
  metadata?:     Record<string, string>
}) {
  return request<AbacateCheckout>('/subscriptions/create', {
    items:         [{ id: params.productId, quantity: 1 }],
    externalId:    params.externalId,
    completionUrl: params.completionUrl,
    returnUrl:     params.returnUrl,
    methods:       params.methods ?? ['CARD', 'PIX'],
    metadata:      params.metadata ?? {},
  })
}

// ─── Segurança: verificação HMAC do webhook ───────────────────────────────────

/**
 * Verifica a assinatura HMAC-SHA256 do webhook da AbacatePay.
 * rawBody: string raw do body recebido (antes de JSON.parse)
 * signatureHeader: valor do header X-Webhook-Signature
 */
export function verifyAbacateSignature(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader) return false

  const expected = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)

  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
