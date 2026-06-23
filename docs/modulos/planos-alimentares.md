# Módulo: Planos Alimentares

**Slug:** `planos-alimentares`
**Categoria:** `acompanhamento`
**Ícone:** `UtensilsCrossed`
**Status:** `active` | `available: true`
**Sort order:** `95`
**Criado em:** 2026-06-23

---

## Visão Geral

Permite ao personal trainer montar planos alimentares completos com refeições e alimentos, calcular macronutrientes automaticamente e atribuir planos a alunos. O aluno visualiza seu plano em tempo real com os totais nutricionais do dia.

Fluxo completo:
1. Personal cria um **Plano Alimentar** (nome, objetivo, meta calórica) — status inicial `inactive`
2. Adiciona **Refeições** ao plano (café da manhã, almoço, etc.) com tipo e horário sugerido
3. Em cada refeição, **busca alimentos** pelo nome no banco de alimentos global (122+), define a quantidade em gramas e vê o preview de macros em tempo real antes de confirmar
4. Pode adicionar, remover e ajustar quantidades de qualquer alimento antes de salvar — todas as edições ficam em **estado local (draft)** sem chamar o servidor
5. Ao terminar uma refeição, clica em **Salvar** naquele card — o servidor persiste todos os alimentos de uma vez via `replaceMealFoods`
6. Com todas as refeições salvas, clica em **Publicar Plano** — status muda para `active`
7. **Atribui o plano a alunos** via painel de atribuição (muitos-para-muitos)
8. O aluno visualiza seu plano em `/student/planos-alimentares` com macros calculados

---

## Banco de Dados

### Tabela: `food_items`

Banco de alimentos (global + por tenant).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `tenant_id` | uuid FK tenants \| NULL | NULL = alimento global (pré-cadastrado) |
| `name` | text NOT NULL | Nome do alimento (ex: "Frango grelhado") |
| `category` | text DEFAULT 'outros' | Categoria nutricional — ver valores abaixo |
| `portion_grams` | numeric DEFAULT 100 | Peso da porção de referência em gramas |
| `portion_label` | text DEFAULT '100g' | Rótulo da porção (ex: "1 unidade", "100g") |
| `calories` | numeric DEFAULT 0 | Kcal por `portion_grams` |
| `protein_g` | numeric DEFAULT 0 | Proteína (g) por `portion_grams` |
| `carbs_g` | numeric DEFAULT 0 | Carboidratos (g) por `portion_grams` |
| `fat_g` | numeric DEFAULT 0 | Gorduras (g) por `portion_grams` |
| `fiber_g` | numeric DEFAULT 0 | Fibras (g) por `portion_grams` |
| `is_global` | boolean DEFAULT false | true = visível para todos os tenants |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

**Categorias de alimentos (valores livres — sem enum):**
- `proteinas` — carnes, ovos, laticínios proteicos
- `carboidratos` — arroz, pão, macarrão, aveia
- `gorduras` — azeite, castanhas, abacate
- `verduras` — folhas e legumes de baixa caloria
- `frutas` — frutas em geral
- `laticinios` — leite, iogurte, queijo
- `graos` — feijão, lentilha, grão-de-bico
- `outros` — itens que não se encaixam

**Cálculo de nutrição por quantidade:**
```
// Para X gramas de um alimento:
fator = X / food_item.portion_grams   // ex: 150g / 100g = 1.5
kcal  = food_item.calories  * fator
prot  = food_item.protein_g * fator
carbs = food_item.carbs_g   * fator
fat   = food_item.fat_g     * fator
```

**RLS:** tenant vê seus próprios alimentos + todos os globais (`is_global = true`). O banco já possui **122 alimentos globais** pré-cadastrados.

---

### Tabela: `meal_plans`

Plano alimentar pertencente a um tenant.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `tenant_id` | uuid FK tenants | Tenant do personal |
| `student_id` | uuid FK students \| NULL | Legado — usar `student_meal_plan_assignments` para atribuições múltiplas |
| `name` | text NOT NULL | Nome do plano (ex: "Dieta Low Carb — Cutting") |
| `goal` | text \| NULL | Objetivo — ver valores abaixo |
| `description` | text \| NULL | Observações gerais (restrições, alergias) |
| `daily_calories` | numeric \| NULL | Meta calórica diária (kcal) |
| `start_date` | date \| NULL | Início do período |
| `end_date` | date \| NULL | Fim do período |
| `status` | text DEFAULT 'active' | `active`, `inactive`, `archived` |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

**Valores de `goal` (livres — sem enum):**
`Emagrecimento`, `Hipertrofia`, `Manutenção`, `Saúde Geral`, `Performance`, `Vegetariano`

**RLS:** tenant vê apenas seus próprios planos.

---

### Tabela: `meal_plan_meals`

Refeições de um plano alimentar.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `meal_plan_id` | uuid FK meal_plans | Plano pai |
| `tenant_id` | uuid FK tenants | Tenant do personal |
| `meal_type` | enum `meal_type` | Tipo da refeição — ver enum abaixo |
| `name` | text NOT NULL | Nome personalizado (ex: "Café da Manhã Reforçado") |
| `suggested_time` | time \| NULL | Horário sugerido (ex: `08:00:00`) |
| `sort_order` | smallint DEFAULT 0 | Ordem de exibição |
| `notes` | text \| NULL | Observações da refeição |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

**Enum `meal_type`:**
| Valor | Rótulo PT-BR |
|-------|-------------|
| `cafe_da_manha` | Café da Manhã |
| `lanche_manha` | Lanche da Manhã |
| `almoco` | Almoço |
| `lanche_tarde` | Lanche da Tarde |
| `jantar` | Jantar |
| `ceia` | Ceia |
| `pre_treino` | Pré-Treino |
| `pos_treino` | Pós-Treino |
| `outro` | Outro |

---

### Tabela: `meal_plan_foods`

Alimentos dentro de uma refeição.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `meal_id` | uuid FK meal_plan_meals | Refeição pai |
| `tenant_id` | uuid FK tenants | Tenant do personal |
| `food_item_id` | uuid FK food_items | Alimento do banco |
| `quantity` | numeric DEFAULT 1 | Quantidade em **gramas** |
| `calories` | numeric DEFAULT 0 | Kcal pré-calculados para `quantity` |
| `protein_g` | numeric DEFAULT 0 | Proteína pré-calculada |
| `carbs_g` | numeric DEFAULT 0 | Carboidratos pré-calculados |
| `fat_g` | numeric DEFAULT 0 | Gorduras pré-calculadas |
| `fiber_g` | numeric DEFAULT 0 | Fibras pré-calculadas |
| `notes` | text \| NULL | Observação do item |
| `sort_order` | smallint DEFAULT 0 | Ordem de exibição |
| `created_at` | timestamptz | Criação |

> **Desnormalização:** `calories`, `protein_g`, etc. em `meal_plan_foods` são pré-calculados no momento do `replaceMealFoods` usando `food_item.X * (quantity / food_item.portion_grams)`. No mobile, você pode usar esses valores diretamente para evitar recalcular, ou recalcular on-the-fly via join — o resultado é equivalente quando `portion_grams = 100` (padrão).

---

### Tabela: `student_meal_plan_assignments`

Atribuições muitos-para-muitos entre planos alimentares e alunos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `meal_plan_id` | uuid FK meal_plans | Plano alimentar |
| `student_id` | uuid FK students | Aluno |
| `tenant_id` | uuid FK tenants | Tenant do personal |
| `status` | text DEFAULT 'active' | `active` ou `inactive` |
| `assigned_at` | timestamptz | Data de atribuição |

**Constraint UNIQUE:** `(meal_plan_id, student_id)` — um aluno não pode ter o mesmo plano duplicado.

**RLS:** tenant gerencia apenas as atribuições do seu próprio tenant.

---

## Diagrama de Relacionamentos

```
tenants
  │
  ├── food_items (tenant_id nullable → globais têm NULL)
  │
  ├── meal_plans (tenant_id)
  │     │
  │     └── meal_plan_meals (meal_plan_id)
  │           │
  │           └── meal_plan_foods (meal_id)
  │                 └── food_items (food_item_id)
  │
  └── student_meal_plan_assignments (tenant_id)
        ├── meal_plans (meal_plan_id)
        └── students (student_id)
```

---

## API — Server Actions (Next.js)

Todos os arquivos usam `'use server'`. Auth via Supabase Auth + RLS.

### `src/app/actions/food-items.ts`

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `getFoodItems()` | — | `FoodItem[]` | Lista alimentos do tenant + globais, ordenados por nome |
| `createFoodItem(formData)` | FormData | `{ success, id }` \| `{ error }` | Cria alimento para o tenant |
| `updateFoodItem(id, formData)` | string, FormData | `{ success }` \| `{ error }` | Atualiza alimento próprio do tenant |
| `deleteFoodItem(id)` | string | `{ success }` \| `{ error }` | Remove alimento próprio do tenant |

**FormData fields para create/update:**
```
name           string  (required)
category       string  (required)
portion_grams  number  (default: 100)
portion_label  string  (default: "Xg")
calories       number
protein_g      number
carbs_g        number
fat_g          number
fiber_g        number
```

**Type `FoodItem`:**
```typescript
{
  id: string
  name: string
  category: string
  portion_grams: number
  portion_label: string
  calories: number      // por portion_grams
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  is_global: boolean
}
```

---

### `src/app/actions/meal-plans.ts`

#### Tipos exportados

```typescript
type MealFood = {
  id: string
  quantity: number          // gramas
  sort_order: number
  notes: string | null
  food_items: {
    id: string
    name: string
    category: string
    portion_grams: number
    calories: number        // por portion_grams
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  } | null
}

type Meal = {
  id: string
  name: string
  meal_type: string              // valor do enum meal_type
  suggested_time: string | null  // "HH:MM:SS"
  sort_order: number
  notes: string | null
  meal_plan_foods: MealFood[]
}

type MealPlanWithMeals = {
  id: string
  tenant_id: string
  name: string
  goal: string | null
  description: string | null
  daily_calories: number | null
  status: string
  created_at: string
  meals: Meal[]                  // já ordenado por sort_order
}

type MealPlanSummary = {
  id: string
  name: string
  goal: string | null
  status: string
  created_at: string
  student_meal_plan_assignments: { student_id: string }[]
}
```

#### Funções — Planos

| Função | Parâmetros | Retorno |
|--------|-----------|---------|
| `getMealPlans()` | — | `MealPlanSummary[]` |
| `getMealPlan(id)` | string | `MealPlanWithMeals \| null` |
| `createMealPlan(formData)` | FormData | `{ planId }` \| `{ error }` |
| `updateMealPlan(id, formData)` | string, FormData | `{ success }` \| `{ error }` |
| `publishMealPlan(id)` | string | `{ success }` \| `{ error }` |
| `deactivateMealPlan(id)` | string | `{ success }` \| `{ error }` |
| `deleteMealPlan(id)` | string | `{ success }` \| `{ error }` |

**FormData fields para createMealPlan / updateMealPlan:**
```
name            string  (required)
goal            string  (optional)
description     string  (optional)
daily_calories  number  (optional)
```

#### Funções — Refeições

| Função | Parâmetros | Retorno |
|--------|-----------|---------|
| `addMeal(planId, name, mealType, suggestedTime, notes)` | string×5 | `{ success, id }` \| `{ error }` |
| `updateMeal(id, planId, name, mealType, suggestedTime, notes)` | string×6 | `{ success }` \| `{ error }` |
| `deleteMeal(id, planId)` | string×2 | `{ success }` \| `{ error }` |

#### Funções — Alimentos da Refeição (batch)

| Função | Parâmetros | Retorno |
|--------|-----------|---------|
| `replaceMealFoods(mealId, planId, foods)` | string×2 + array | `{ success }` \| `{ error }` |

**`replaceMealFoods` — substitui todos os alimentos de uma refeição em uma operação:**
```typescript
// Assinatura
replaceMealFoods(
  mealId: string,
  planId: string,
  foods: { foodItemId: string; quantity: number; sortOrder: number }[]
): Promise<{ success: true } | { error: string }>

// O que faz internamente:
// 1. DELETE FROM meal_plan_foods WHERE meal_id = mealId
// 2. Busca valores nutricionais de todos os food_items em batch
// 3. INSERT rows com macros pré-calculados
// 4. revalidatePath('/dashboard/planos-alimentares/[planId]')
```

> **Importante para mobile:** não existe endpoint de add/update/delete individual de `meal_plan_foods`. A operação é sempre batch via `replaceMealFoods`. O mobile deve montar o array final de alimentos e enviar tudo de uma vez.

#### Funções — Atribuições

| Função | Parâmetros | Retorno |
|--------|-----------|---------|
| `getAssignmentsForMealPlan(planId)` | string | Array de assignments com join em `students` |
| `getActiveStudentsForMealPlan()` | — | `{ id, full_name, avatar_url }[]` |
| `assignMealPlanToStudents(planId, studentIds)` | string, string[] | `{ success }` \| `{ error }` |
| `removeMealPlanAssignment(planId, studentId)` | string×2 | `{ success }` \| `{ error }` |
| `getStudentMealPlans(studentId)` | string | `MealPlanWithMeals[]` (apenas `status = 'active'`) |

---

## Rotas

### Dashboard do Personal Trainer

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/dashboard/planos-alimentares` | `(dashboard)/dashboard/planos-alimentares/page.tsx` | Lista todos os planos do tenant |
| `/dashboard/planos-alimentares/novo` | `(dashboard)/dashboard/planos-alimentares/novo/page.tsx` | Formulário de criação |
| `/dashboard/planos-alimentares/[id]` | `(dashboard)/dashboard/planos-alimentares/[id]/page.tsx` | Detalhe + editor de refeições + atribuição |

### Área do Aluno

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/student/planos-alimentares` | `(student)/student/planos-alimentares/page.tsx` | Lista os planos ativos do aluno com totais nutricionais |

---

## Componentes

### `MealPlanEditor` — `src/components/meal-plans/MealPlanEditor.tsx`

**Client Component** usado na página de detalhe do plano pelo personal trainer.

**Props:**
```typescript
{
  planId: string
  initialMeals: Meal[]    // dados carregados server-side
  foodItems: FoodItem[]   // banco de alimentos completo (122+ itens globais + do tenant)
  status: string          // 'active' | 'inactive'
}
```

#### Arquitetura de estado (draft local)

O editor mantém um **mapa de draft** (`draftMap: Record<mealId, DraftFood[]>`) em React state. Todas as edições de alimentos (adicionar, remover, alterar quantidade) acontecem **apenas no cliente**, sem chamadas ao servidor. O servidor só é chamado quando o usuário clica em **Salvar** em uma refeição específica.

```typescript
type DraftFood = {
  localId: string     // ID temporário no cliente (crypto.randomUUID())
  dbId?: string       // ID no banco (se o alimento já estava salvo)
  foodItem: FoodItem  // dados completos do alimento
  quantity: number    // gramas
}
```

**Ciclo de vida do draft:**
```
initialMeals (server) → useState(draftMap) → edições locais
                                                    ↓
                              "Salvar" → replaceMealFoods() → revalidatePath
                                                    ↓
                              Next.js re-renderiza → useEffect sincroniza draftMap
```

#### Sub-componente: `FoodSearchPanel`

Painel de busca de alimentos exibido dentro do card de refeição.

**Comportamento:**
1. Input de texto filtra os `foodItems` no cliente por nome ou categoria (sem chamada à API)
2. Exibe até 30 resultados, cada um com: nome, categoria e macros por porção
3. Ao clicar num resultado, exibe um input de quantidade (gramas) com **preview de macros em tempo real** enquanto o usuário digita
4. "Adicionar à Refeição" insere o alimento no `draftMap` local — nenhuma chamada ao servidor neste momento
5. Enter no input de quantidade também confirma

**Preview de macros (tempo real):**
```typescript
// Atualiza a cada keystroke no input de quantidade:
const factor  = quantidade / food.portion_grams
const preview = {
  calories: food.calories  * factor,
  protein:  food.protein_g * factor,
  carbs:    food.carbs_g   * factor,
  fat:      food.fat_g     * factor,
}
```

#### Sub-componente: `MealCard`

Card de uma refeição com seu draft de alimentos.

**Funcionalidades:**
- **Accordion** expansível (aberto por padrão)
- **Header** mostra: nome, tipo, horário, total de kcal da refeição, botão Salvar (quando há draft não salvo) e botões de editar/excluir
- **Borda verde** quando há alterações pendentes (`isDirty = true`)
- **Edição inline** de nome, tipo (`meal_type`) e horário
- **Lista de alimentos** do draft com: nome, macros calculados, badge de quantidade clicável para editar, botão × (visível no hover) para remover
- **Totais por refeição** na base do card (kcal, proteína, carbs, gordura)
- **Hint "Alterações não salvas"** enquanto `isDirty = true`

**Lógica de isDirty:**
```typescript
// Uma refeição está "suja" se o draft difere do estado salvo no servidor:
const isDirty =
  draft.length !== meal.meal_plan_foods.length ||
  draft.some((d, i) => {
    const orig = meal.meal_plan_foods[i]
    return !orig || d.quantity !== orig.quantity || d.foodItem.id !== orig.food_items?.id
  })
```

**Salvar uma refeição:**
- Chama `replaceMealFoods(meal.id, planId, draft.map(...))`
- Envia array com `{ foodItemId, quantity, sortOrder }` para todos os alimentos do draft
- O servidor apaga todos os registros existentes em `meal_plan_foods` para esse `meal_id` e insere os novos com macros pré-calculados

#### Totais do dia e bloqueio de publicação

- O **total do dia** é calculado em `useMemo` somando os drafts de todas as refeições
- O botão **Publicar Plano** fica desabilitado enquanto `anyDirty = true` (qualquer refeição com draft não salvo)
- Texto do botão muda para "Salve as refeições para Publicar" quando bloqueado

---

### `MealPlanAssignPanel` — `src/components/meal-plans/MealPlanAssignPanel.tsx`

**Client Component** para atribuição de alunos ao plano.

**Props:**
```typescript
{
  planId: string
  allStudents: { id: string; full_name: string; avatar_url: string | null }[]
  assignments: { student_id: string; students: unknown }[]
}
```

**Funcionalidades:**
- Accordion mostrando alunos já atribuídos com botão de remover
- Checkbox list dos alunos ainda não atribuídos
- Botão "Atribuir (N)" persiste via `assignMealPlanToStudents`
- Usa `upsert` com `onConflict: 'meal_plan_id,student_id'` — idempotente

---

### `StudentMealPlanView` — `src/components/meal-plans/StudentMealPlanView.tsx`

**Client Component** para o aluno visualizar seu plano alimentar (read-only).

**Props:**
```typescript
{
  meals: Meal[]
}
```

**Funcionalidades:**
- Estado local `openMeals: Record<mealId, boolean>` controla qual refeição está expandida (todas abertas por padrão)
- Cada card mostra: tipo da refeição, nome, horário, total de kcal, lista de alimentos com macros, resumo nutricional da refeição
- Rodapé **Total do Dia** com kcal, proteína, carboidratos e gordura

---

## Lógica de Negócio

### Cálculo de Macronutrientes

```typescript
// Fórmula base — usada no cliente (draft) e no servidor (pré-cálculo)
function calcFood(food: FoodItem, quantityGrams: number) {
  const factor = quantityGrams / food.portion_grams
  return {
    calories: food.calories  * factor,
    protein:  food.protein_g * factor,
    carbs:    food.carbs_g   * factor,
    fat:      food.fat_g     * factor,
  }
}

// Total de uma refeição = reduce dos alimentos
// Total do plano = reduce das refeições
```

### Status do Plano

| Status | Significado | Editável? | Visível ao aluno? |
|--------|-------------|-----------|-------------------|
| `inactive` | Rascunho — sendo montado | ✅ Sim | ❌ Não |
| `active` | Publicado — disponível | ✅ Sim | ✅ Sim |
| `archived` | Arquivado | ❌ Não | ❌ Não |

> O botão "Publicar" só é habilitado quando **não há refeições com draft pendente**. Isso garante que o aluno sempre vê o estado realmente salvo no banco, não um draft parcial.

O aluno só vê planos com `status = 'active'` E que estão em `student_meal_plan_assignments` com `status = 'active'`.

### Alimentos Globais vs. do Tenant

- `is_global = true` → alimento pré-cadastrado pela plataforma, visível a todos os tenants
- `is_global = false` → alimento criado pelo personal, visível apenas ao seu tenant
- Na query: `.or('tenant_id.eq.X,is_global.eq.true')`

---

## Implementação Mobile (Guia)

### Diferença principal em relação ao web

No web, os alimentos ficam em estado React local (draft) e são persistidos em batch via `replaceMealFoods`. No mobile, **adotar a mesma estratégia**:

1. Carregar refeições e alimentos do servidor ao abrir o editor
2. Manter estado local no app (lista de alimentos por refeição)
3. Permitir adicionar/remover/alterar quantidade localmente
4. Mostrar macros em tempo real a partir do estado local
5. "Salvar" chama a API para substituir todos os alimentos da refeição de uma vez
6. Publicar só após todas as refeições estarem salvas

### Endpoint de batch save (REST direto ao Supabase)

O mobile deve implementar `replaceMealFoods` como duas operações consecutivas:

```dart
// 1. Deletar alimentos existentes da refeição
await supabase
  .from('meal_plan_foods')
  .delete()
  .eq('meal_id', mealId);

// 2. Buscar macros dos alimentos selecionados
final foodIds = foods.map((f) => f.foodItemId).toSet().toList();
final foodData = await supabase
  .from('food_items')
  .select('id, calories, protein_g, carbs_g, fat_g, fiber_g, portion_grams')
  .inFilter('id', foodIds);

final foodMap = { for (var f in foodData) f['id']: f };

// 3. Inserir novos alimentos com macros pré-calculados
final rows = foods.asMap().entries.map((entry) {
  final i    = entry.key;
  final food = entry.value;
  final fi   = foodMap[food.foodItemId];
  final factor = fi != null ? food.quantity / fi['portion_grams'] : 0.0;
  return {
    'meal_id':      mealId,
    'tenant_id':    tenantId,
    'food_item_id': food.foodItemId,
    'quantity':     food.quantity,
    'sort_order':   i,
    'calories':     fi != null ? (fi['calories']  * factor) : 0,
    'protein_g':    fi != null ? (fi['protein_g'] * factor) : 0,
    'carbs_g':      fi != null ? (fi['carbs_g']   * factor) : 0,
    'fat_g':        fi != null ? (fi['fat_g']     * factor) : 0,
    'fiber_g':      fi != null ? (fi['fiber_g']   * factor) : 0,
  };
}).toList();

await supabase.from('meal_plan_foods').insert(rows);
```

### Queries Supabase recomendadas

#### Listar planos do aluno logado

```dart
final response = await supabase
  .from('student_meal_plan_assignments')
  .select('meal_plans(id, name, goal, description, daily_calories, status, created_at)')
  .eq('student_id', studentId)
  .eq('status', 'active');

// Filtrar apenas status = 'active' nos meal_plans após receber
```

#### Carregar plano completo com refeições e alimentos

```dart
final data = await supabase
  .from('meal_plans')
  .select('''
    id, name, goal, description, daily_calories, status,
    meal_plan_meals (
      id, name, meal_type, suggested_time, sort_order, notes,
      meal_plan_foods (
        id, quantity, sort_order, notes,
        food_items (
          id, name, category, portion_grams,
          calories, protein_g, carbs_g, fat_g, fiber_g
        )
      )
    )
  ''')
  .eq('id', planId)
  .single();
```

#### Buscar banco de alimentos (para o editor)

```dart
// Carrega todos os alimentos visíveis ao tenant
// RLS já filtra: tenant_id = meu_tenant OR is_global = true
final foods = await supabase
  .from('food_items')
  .select('id, name, category, portion_grams, portion_label, calories, protein_g, carbs_g, fat_g, fiber_g, is_global')
  .order('name');

// Filtrar client-side por nome ou categoria:
final filtered = foods.where((f) =>
  f['name'].toLowerCase().contains(query) ||
  f['category'].toLowerCase().contains(query)
).take(30).toList();
```

### Ordenação dos dados

```dart
// Sempre ordenar após receber da API
meals.sort((a, b) => a['sort_order'].compareTo(b['sort_order']));
for (final meal in meals) {
  (meal['meal_plan_foods'] as List)
    .sort((a, b) => a['sort_order'].compareTo(b['sort_order']));
}
```

### Cálculo de macros (Dart)

```dart
class NutritionCalc {
  static Map<String, double> forItem({
    required double quantityGrams,
    required double portionGrams,
    required double calories,
    required double proteinG,
    required double carbsG,
    required double fatG,
  }) {
    final factor = quantityGrams / portionGrams;
    return {
      'calories': calories * factor,
      'protein':  proteinG * factor,
      'carbs':    carbsG   * factor,
      'fat':      fatG     * factor,
    };
  }

  static Map<String, double> totalForMeal(List<Map<String, dynamic>> foods) {
    return foods.fold(
      {'calories': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fat': 0.0},
      (acc, food) {
        final fi     = food['food_items'] as Map<String, dynamic>;
        final item   = forItem(
          quantityGrams: (food['quantity'] as num).toDouble(),
          portionGrams:  (fi['portion_grams'] as num).toDouble(),
          calories:      (fi['calories']  as num).toDouble(),
          proteinG:      (fi['protein_g'] as num).toDouble(),
          carbsG:        (fi['carbs_g']   as num).toDouble(),
          fatG:          (fi['fat_g']     as num).toDouble(),
        );
        return {
          'calories': acc['calories']! + item['calories']!,
          'protein':  acc['protein']!  + item['protein']!,
          'carbs':    acc['carbs']!    + item['carbs']!,
          'fat':      acc['fat']!      + item['fat']!,
        };
      },
    );
  }
}
```

---

## Telas Sugeridas (Mobile)

### Área do Aluno

#### `PlanoAlimentarListScreen`
- Lista planos ativos atribuídos ao aluno
- Card com: nome, objetivo (badge colorido), meta calórica (ícone chama), status
- Tap → `PlanoAlimentarDetalheScreen`

#### `PlanoAlimentarDetalheScreen`
- Cabeçalho: nome, objetivo, meta calórica, descrição
- Lista de refeições em cards accordion (todos abertos por padrão)
- Cada card: tipo (ícone), nome, horário sugerido, total kcal
- Ao expandir: lista de alimentos com nome, quantidade e macros por item; resumo nutricional da refeição
- Rodapé fixo (sticky bottom): **Total do Dia** com kcal, proteína, carbs e gordura

#### Componente `MacroTotals` (sugerido)
```dart
// Exibição dos 4 macros em linha/grid
Row(children: [
  MacroChip(label: 'Kcal',    value: totalCalories, color: Colors.orange),
  MacroChip(label: 'Prot',    value: totalProtein,  color: Colors.blue),
  MacroChip(label: 'Carbs',   value: totalCarbs,    color: Colors.amber),
  MacroChip(label: 'Gordura', value: totalFat,      color: Colors.red),
])
```

#### Componente `MacroProgressBar` (sugerido, quando há meta calórica)
```dart
// Se meal_plan.daily_calories != null:
LinearProgressIndicator(
  value: totalCalories / plan.dailyCalories,
  // label: "1.840 / 2.000 kcal"
)
```

### Área do Personal (se app incluir painel do personal)

#### `CriarPlanoAlimentarScreen`
- Form: nome, objetivo (select), meta calórica, descrição

#### `EditorPlanoAlimentarScreen`
- Lista de refeições com botão "+"
- Cada refeição: accordion com lista de alimentos do draft local
- Header do card mostra macros totais da refeição em tempo real
- Botão **Salvar Refeição** (aparece quando há draft pendente, borda destacada)
- Campo de busca de alimentos: filtra lista local, exibe macros por porção
- Preview de macros ao digitar a quantidade antes de confirmar
- Botão global **Publicar Plano** (desabilitado enquanto houver refeições com draft pendente)

#### `BuscarAlimentoScreen` (pode ser bottom sheet ou tela separada)
- Input de busca filtra client-side
- Lista com: nome, categoria, macros por 100g
- Ao selecionar: slide in de input de quantidade com preview de macros
- Confirmar → volta para `EditorPlanoAlimentarScreen` com alimento no draft

---

## Permissões e RLS

| Ação | Quem pode |
|------|-----------|
| Criar/editar/excluir `food_items` | Personal (role = `personal`) do tenant |
| Ver `food_items` globais | Todos os autenticados via RLS (tenant_id IS NULL OR is_global = true) |
| Ver `food_items` do tenant | Personal + alunos do mesmo tenant |
| Criar/editar/excluir `meal_plans` | Personal do tenant |
| Ver `meal_plans` | Personal do tenant (via RLS `tenant_id`) |
| Criar/editar/excluir `meal_plan_meals` | Personal do tenant |
| Criar/editar/excluir `meal_plan_foods` | Personal do tenant |
| Gerenciar `student_meal_plan_assignments` | Personal do tenant |
| Ver `meal_plans` como aluno | Via join em `student_meal_plan_assignments` (student_id = auth.uid()) |
| Ver `meal_plan_meals/foods` como aluno | Leitura via join no plano do próprio aluno |

---

## Configuração no Sistema de Módulos

| Campo | Valor |
|-------|-------|
| `system_modules.slug` | `planos-alimentares` |
| `system_modules.name` | `Planos Alimentares` |
| `system_modules.category` | `acompanhamento` |
| `system_modules.icon` | `UtensilsCrossed` |
| `system_modules.sort_order` | `95` |
| `system_modules.status` | `active` |
| `MODULE_ROUTES` (frontend) | `{ href: '/dashboard/planos-alimentares', label: 'Planos Alimentares' }` |
| Dashboard sidebar grupo | `Acompanhamento` |
| Student sidebar | Item "Plano Alimentar" com ícone `UtensilsCrossed` |

O módulo aparece no sidebar do dashboard apenas se o tenant tiver `tenant_modules.enabled = true` para este slug.

---

## Arquivos do Módulo

```
src/
├── app/
│   ├── actions/
│   │   ├── food-items.ts                          ← CRUD banco de alimentos
│   │   └── meal-plans.ts                          ← CRUD planos + refeições + batch save + atribuições
│   └── (dashboard)/dashboard/planos-alimentares/
│       ├── page.tsx                               ← Lista de planos (personal)
│       ├── novo/
│       │   └── page.tsx                           ← Criação de plano
│       └── [id]/
│           └── page.tsx                           ← Detalhe + editor + painel de atribuição
├── components/
│   └── meal-plans/
│       ├── MealPlanEditor.tsx                     ← Editor draft local + busca + batch save
│       ├── MealPlanAssignPanel.tsx                ← Painel de atribuição de alunos
│       └── StudentMealPlanView.tsx                ← Visualização read-only do aluno
└── app/(student)/student/planos-alimentares/
    └── page.tsx                                   ← Lista e visualização (aluno)

docs/modulos/
└── planos-alimentares.md                          ← Este arquivo
```

---

## Histórico de Mudanças

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-06-23 | 1.0 | Módulo criado — banco de alimentos, planos, refeições, atribuições |
| 2026-06-23 | 1.0 | Migration `create_student_meal_plan_assignments` aplicada |
| 2026-06-23 | 1.0 | `database.ts` atualizado com enum `meal_type` e nova tabela |
| 2026-06-23 | 1.1 | Editor refatorado para draft local com busca de alimentos client-side e batch save por refeição (`replaceMealFoods`). Macros atualizam em tempo real antes de qualquer chamada ao servidor. Botão Publicar bloqueado enquanto houver drafts pendentes. |
