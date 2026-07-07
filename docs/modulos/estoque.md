# Módulo: Estoque

## Visão geral

Controle de itens de estoque (suplementos, equipamentos, produtos) para academias, com registro de entradas, saídas e ajustes. É um módulo **exclusivo para tenants do tipo `academia`** — não aparece nem funciona para tenants `autonomo` (personal trainer individual). Uso interno da equipe da academia; **não há fluxo do aluno**.

Faz parte da Fase 7 da feature Academias do StrivePersonal (ver `docs/FASES_Academias_StrivePersonal.md`, `docs/PRD_Academias_StrivePersonal.md` e `docs/SPEC_Academias_StrivePersonal.md`).

## Identificação

| Campo | Valor |
|---|---|
| Slug | `estoque` |
| Categoria (`system_modules.category`) | `financeiro` — não existe categoria própria de "operacional" no CHECK constraint atual; reaproveita o grupo "Financeiro" já existente no sidebar |
| Ícone | `Package` (Lucide) |
| Status | `active` |
| Rota (personal) | `/dashboard/estoque` |
| Fluxo do aluno | Nenhum |

## Tabelas do banco

### `inventory_items`

Cadastro dos itens de estoque.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → `tenants(id)` ON DELETE CASCADE | |
| `name` | text NOT NULL | |
| `sku` | text | código/SKU opcional |
| `category` | text | categoria livre (texto, não FK) |
| `unit` | text NOT NULL DEFAULT `'un'` | unidade de medida |
| `quantity_on_hand` | numeric NOT NULL DEFAULT 0 | quantidade atual — só muda via `register_inventory_movement` (exceto na criação, onde pode receber estoque inicial diretamente) |
| `min_quantity` | numeric NOT NULL DEFAULT 0 | usado para o alerta de estoque baixo |
| `unit_cost` | numeric | custo unitário opcional |
| `sale_price` | numeric | preço de venda opcional |
| `is_active` | boolean NOT NULL DEFAULT true | soft delete — item desativado some da lista padrão |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | |

### `inventory_movements`

Log **imutável** de movimentos (somente `SELECT` e `INSERT` nas RLS policies — sem `UPDATE`/`DELETE`).

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → `tenants(id)` ON DELETE CASCADE | |
| `item_id` | uuid FK → `inventory_items(id)` ON DELETE CASCADE | |
| `type` | text CHECK IN (`'entrada'`, `'saida'`, `'ajuste'`) | |
| `quantity` | numeric NOT NULL | para `ajuste`, representa o **novo valor absoluto** do estoque (não um delta) |
| `reason` | text | motivo opcional |
| `created_by` | uuid FK → `profiles(id)` ON DELETE SET NULL | |
| `created_at` | timestamptz | |

### RPC `register_inventory_movement(p_item_id, p_type, p_quantity, p_reason)`

Função `SECURITY INVOKER` (não `DEFINER` — respeita as RLS do usuário chamador, sem escalar privilégio) que atualiza `quantity_on_hand` e grava o log em `inventory_movements` **atomicamente em uma única transação**. Valida tipo, quantidade não-negativa, e impede saída que deixaria o estoque negativo.

### RLS

Ambas as tabelas seguem o mesmo padrão: acesso liberado para `get_my_role() = 'personal'` **e** `tenants.tenant_type = 'academia'` do tenant em questão (qualquer membro da equipe da academia, sem distinção por `tenant_members.role` — owner/admin/personal têm acesso igual ao estoque). Para tenants `autonomo`, a condição `tenant_type = 'academia'` nunca é satisfeita, então a RLS bloqueia todo acesso independentemente do papel do usuário. `global_admin` tem `SELECT` em ambas as tabelas.

## Fluxo do personal (equipe da academia)

1. Acessa `/dashboard/estoque` — a page verifica `tenant_modules.enabled` para o slug `estoque` e redireciona para `/dashboard` se desabilitado; também verifica `tenants.tenant_type === 'academia'` como defesa em profundidade (a RLS já garante isso no banco).
2. Vê a lista de itens ativos (`getInventoryItems()`), com alerta visual quando `quantity_on_hand <= min_quantity`.
3. Cria um item em `/dashboard/estoque/novo` (`createInventoryItem` — insere em `inventory_items`, podendo definir uma quantidade inicial diretamente).
4. Abre um item em `/dashboard/estoque/[id]` para:
   - Editar dados cadastrais (`updateInventoryItem` — nome, SKU, categoria, unidade, mínimo, custo, preço, notas; **não** altera `quantity_on_hand` diretamente).
   - Registrar um movimento de entrada, saída ou ajuste (`registerInventoryMovement` → RPC `register_inventory_movement`).
   - Ver o histórico de movimentos (`getInventoryMovements`), com tipo, quantidade, motivo, autor e data.
   - Ativar/desativar o item (`toggleInventoryItemActive` — soft delete).

## Arquivos criados/modificados

**Migration:**
- `inventory_items`, `inventory_movements`, RLS policies, RPC `register_inventory_movement`, registro em `system_modules` (aplicada via Supabase MCP, nome `modulo_estoque_academia`)

**Server actions:**
- `src/app/actions/estoque.ts` — `getInventoryItems`, `createInventoryItem`, `updateInventoryItem`, `toggleInventoryItemActive`, `registerInventoryMovement`, `getInventoryMovements`

**UI do personal:**
- `src/app/(dashboard)/dashboard/estoque/page.tsx` — lista + alerta de estoque baixo
- `src/app/(dashboard)/dashboard/estoque/novo/page.tsx` — criação
- `src/app/(dashboard)/dashboard/estoque/[id]/page.tsx` — edição, movimento, histórico
- `src/components/estoque/inventory-item-form.tsx`
- `src/components/estoque/register-movement-form.tsx`
- `src/components/estoque/toggle-active-button.tsx`

**Integração ao sistema de módulos:**
- `src/lib/modules-config.ts` — rota `estoque` → `/dashboard/estoque`
- `src/components/layout/dashboard-sidebar.tsx` — ícone `Package` no `ICON_MAP`, slug adicionado ao grupo "Financeiro" existente
- `src/app/(dashboard)/dashboard/page.tsx` — ícone `Package` no `ICON_MAP` da home
- `src/app/(admin)/admin/clientes/[id]/modulos/page.tsx` — toggle por tenant bloqueado (com nota "somente para academias") quando `tenant_type !== 'academia'`
- `src/app/actions/modules.ts` — `toggleTenantModule` e `enableAllModulesForTenant` com defesa em profundidade contra habilitar `estoque` para tenant autônomo

**Tipos:**
- `src/types/database.ts` — tipos das duas novas tabelas e da RPC

## Integração com o sistema de módulos (toggles)

- **Catálogo global** (`/admin/modulos`): página genérica, lista qualquer `system_modules` sem lógica específica por slug — nenhuma alteração necessária.
- **Toggle por tenant** (`/admin/clientes/[id]/modulos`): alterado para reconhecer `estoque` como um módulo "academia-only" (`ACADEMIA_ONLY_SLUGS`). Quando o tenant é `autonomo`, o toggle aparece desabilitado com a nota "• somente para academias".
- **Defesa em profundidade** (`src/app/actions/modules.ts`): mesmo que a chamada não venha da UI, `toggleTenantModule` recusa habilitar `estoque` para tenant não-academia, e `enableAllModulesForTenant` (habilitar tudo em massa) filtra `estoque` automaticamente para tenants autônomos. A RLS no banco é a barreira definitiva — essas checagens de aplicação existem para não poluir `tenant_modules` com um estado que nunca teria efeito.

## Notas para implementação mobile futura

O app mobile (`strivePersonalApp`) atualmente não tem nenhuma tela de gestão administrativa equivalente às páginas `/dashboard/*` do personal — ele é focado na experiência do aluno. Módulos internos de equipe como Estoque provavelmente **não são prioritários** para portar ao app do aluno, já que não têm fluxo do aluno. Caso no futuro se decida criar uma versão mobile para a equipe da academia (app do personal, não do aluno), seguem as notas:

**Queries Supabase relevantes:**
```ts
// Listar itens ativos de um tenant
supabase
  .from('inventory_items')
  .select('id, name, sku, category, unit, quantity_on_hand, min_quantity, unit_cost, sale_price, is_active, notes')
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .order('name')

// Registrar movimento (via RPC — nunca UPDATE direto em quantity_on_hand)
supabase.rpc('register_inventory_movement', {
  p_item_id: itemId,
  p_type: 'entrada' | 'saida' | 'ajuste',
  p_quantity: quantity,
  p_reason: reason,
})

// Histórico de movimentos de um item
supabase
  .from('inventory_movements')
  .select('id, type, quantity, reason, created_at, created_by, profiles(full_name)')
  .eq('item_id', itemId)
  .order('created_at', { ascending: false })
```

**Telas sugeridas:** lista de itens com badge de estoque baixo, tela de detalhe/edição do item, modal ou tela de registro de movimento (com seletor de tipo entrada/saída/ajuste), histórico de movimentos por item.

**Permissões:** a RLS já garante que só membros de equipe (`profiles.role = 'personal'`) de um tenant `academia` acessam essas tabelas — o app mobile não precisa reimplementar essa lógica, apenas tratar erros de RLS graciosamente (ex.: esconder a tela para quem não tem acesso).

**UX mobile:** como é uma ferramenta operacional de uso rápido (ex.: dar baixa em um produto vendido), vale priorizar um fluxo de registro de movimento com poucos toques — talvez um atalho de "dar saída rápida" direto da lista, sem precisar entrar no detalhe do item.
