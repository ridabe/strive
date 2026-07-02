# StrivePersonal — Instruções para Claude

Sistema de gerenciamento para personal trainers. Next.js 15 App Router · Supabase · TypeScript · Tailwind CSS.

---

## 🎨 Design Context (skill impeccable)

Este projeto tem `PRODUCT.md` (estratégico) e `DESIGN.md` (visual) na raiz, mantidos pela skill `impeccable` (`.agents/skills/impeccable/`).

- **Registro**: product (ferramenta de trabalho para o personal trainer, não marketing)
- **North Star visual**: "The Performance Terminal" — tema escuro, accent lima elétrico (`#E8FF47`) usado com raridade, flat por padrão (sem sombra)
- **Anti-referência**: clichê de app fitness genérico (gradientes motivacionais, ícones de chama, paleta quente)
- **Princípios**: a ferramenta desaparece na tarefa; energia com raridade; consistência entre admin/dashboard/cobrança; precisão antes de personalidade; multi-tenant sem parecer genérico

Antes de criar ou alterar UI, consultar `PRODUCT.md` e `DESIGN.md`. Para novas telas ou iteração visual, usar os comandos da skill (`$impeccable craft`, `$impeccable critique`, `$impeccable live`, etc.) — ver `.agents/skills/impeccable/SKILL.md`.

---

## 🧠 REGRA OBRIGATÓRIA: Graphify — Consulta antes de agir, atualização após salvar

### Antes de qualquer alteração, melhoria, ajuste ou nova feature

**Sempre invocar `/graphify` ou consultar o grafo semântico existente em `graphify-out/` antes de:**
- Iniciar qualquer implementação, refatoração ou bugfix
- Propor melhorias ou ajustes de arquitetura
- Criar novos componentes, actions, rotas ou módulos

O graphify mapeia relacionamentos reais entre arquivos, funções e módulos. Sem consultá-lo, é possível duplicar lógica, quebrar dependências ou ignorar padrões já estabelecidos no projeto.

**Fluxo obrigatório antes de editar:**

1. Verificar se `graphify-out/` existe no projeto
2. Se existir, usar a skill graphify para consultar — ex.: `/graphify query "como funciona autenticação"` ou `/graphify path src/lib/auth.ts`
3. Se não existir, rodar `/graphify` para indexar o projeto antes de prosseguir

### Após salvar qualquer arquivo de código

**Sempre atualizar o graphify ao final de uma sessão de edição que modificou arquivos `.ts` ou `.tsx`:**

```bash
/graphify update
```

Isso garante que o grafo semântico reflita o estado atual do código e futuras consultas sejam precisas.

**Regra resumida:**
> Consultar graphify → editar → salvar → atualizar graphify

---

## ⚠️ REGRA OBRIGATÓRIA: Lint Guard após toda edição

**Sempre que editar, criar ou modificar qualquer arquivo `.ts` ou `.tsx` neste projeto, execute uma verificação de lint antes de reportar o trabalho como concluído.**

### Verificação rápida obrigatória (equivalente ao Vercel)

O Vercel roda `tsc --noEmit` + ESLint + `next build`. No sandbox, usar:

```bash
# 1. TypeScript (mesma verificação do Vercel — OBRIGATÓRIO)
cd /sessions/gifted-modest-gauss/mnt/strivePersonal && \
npx tsc --noEmit --skipLibCheck 2>&1 | grep "^src/" | head -20

# 2. Verificações de integridade de arquivo (null bytes, código órfão)
python3 -c "
import glob, subprocess
files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True)
for f in files:
    data = open(f,'rb').read()
    if b'\x00' in data: print('NULL BYTES:', f)
    text = data.decode('utf-8', errors='replace')
    lines = text.splitlines()
    if lines and lines[-1].strip() in ['/', '//', '{', '};']: print('ORPHAN END:', f, repr(lines[-1]))
"
```

Se `tsc` retornar erros com `^src/`, corrija antes de finalizar.

#### ⚠️ Pasta `supabase/` DEVE estar excluída do tsconfig

O `supabase/functions/` usa imports Deno (`https://deno.land/...`) — incompatíveis com tsc do Node.
`tsconfig.json` deve ter `"supabase/**"` no array `exclude`. Nunca remover.

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
