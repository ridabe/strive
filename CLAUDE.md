# StrivePersonal — Instruções para Claude

Sistema de gerenciamento para personal trainers. Next.js 15 App Router · Supabase · TypeScript · Tailwind CSS.

---

## ⚠️ REGRA OBRIGATÓRIA: Lint Guard após toda edição

**Sempre que editar, criar ou modificar qualquer arquivo `.ts` ou `.tsx` neste projeto, execute uma verificação de lint antes de reportar o trabalho como concluído.**

### Verificação rápida obrigatória

```bash
cd /sessions/gifted-modest-gauss/mnt/strivePersonal && pnpm exec next lint --max-warnings 0 2>&1 | head -40
```

Se retornar errors (não warnings), corrija antes de finalizar.

### Padrões que causaram falhas de build repetidas neste projeto

#### 1. Código órfão após fechamento de função

Sintoma: linhas de código aparecem após o `}` final de um componente/action exportado.
Causa: Write tool trunca arquivos >18KB; `cat >>` append cria conteúdo duplicado.

**Sempre verificar com:**
```bash
tail -10 /sessions/gifted-modest-gauss/mnt/strivePersonal/src/caminho/arquivo.tsx
```

Se aparecer código que não faz sentido (fragmentos de JSX, `.eq(...)`, `return { ... }` soltos), remova com Edit tool.

#### 2. Exports duplicados

```bash
grep -n "^export " src/arquivo.ts | sort | uniq -d
```

#### 3. Imports não usados

Ao remover uso de um import, sempre remover o nome do import statement.
Ao adicionar import, sempre confirmar que o símbolo é usado no arquivo.

#### 4. database.ts — nunca appendar

O arquivo `src/types/database.ts` é gerado por:
```
pnpm supabase gen types typescript --project-id lodetzmtsymvnjffmvat > src/types/database.ts
```
Usar `>` (sobrescrever), jamais `>>` (appendar). Após regenerar, verificar que não há duplicatas:
```bash
grep -c "^export type Database" src/types/database.ts  # deve retornar 1
grep -c "^export const Constants" src/types/database.ts  # deve retornar 1
```

#### 5. Funções inexistentes

- `createAbacatePay()` **não existe** → usar `createAbacateProduct()` ou `createSubscriptionCheckout()`
- `syncPlanToAbacatePay` foi removida permanentemente

---

## Arquitetura

- **Stack**: Next.js 15 (App Router), Supabase, TypeScript, Tailwind CSS
- **Auth**: Supabase Auth com RLS multi-tenant via `tenant_id`
- **Payments**: AbacatePay (PIX + Cartão)
- **Deploy**: Vercel (branch `master`)

### Estrutura de rotas

| Prefixo | Descrição |
|---------|-----------|
| `/admin/*` | Painel administrativo (global_admin) |
| `/dashboard/*` | Painel do personal trainer (tenant) |
| `/api/webhooks/*` | Webhooks externos (AbacatePay) |

### Helpers importantes

- `src/lib/supabase/join.ts` — `joinOne<T>(val)` para type-cast de joins Supabase
- `src/lib/modules-config.ts` — mapa de rotas por módulo slug
- `src/lib/admin/audit.ts` — `logAdminAction()` para audit log

### Padrão de Server Actions

```typescript
'use server'
// Sempre validar tenant_id via RLS — nunca passar tenant_id como parâmetro não validado
```

---

## Skill lint-guard

Se a skill `strive-lint-guard` estiver instalada, invocá-la após cada sessão de edição é equivalente ao processo acima.
