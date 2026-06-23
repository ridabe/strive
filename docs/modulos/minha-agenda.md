# Módulo: Minha Agenda

**Slug:** `minha-agenda`
**Categoria:** `comunicacao`
**Ícone:** `CalendarDays`
**Status:** `active` | `available: true`
**Criado em:** 2026-06-23

---

## Visão Geral

Calendário de compromissos do personal trainer. Permite gerenciar:

- **Atendimento Presencial** — aluno, horário, local
- **Consultoria Virtual** — aluno, horário, link do meeting
- **Pagamento a Fazer** — descrição, valor, data
- **Pagamento a Receber** — descrição, valor, data

Quando um evento inclui um aluno (`student_id`), esse evento aparece no painel do aluno em `/student/agenda`, mas apenas os eventos onde ele está envolvido — nunca os de outros alunos.

O aluno também pode **solicitar aulas presenciais** diretamente pelo seu painel. O personal recebe a solicitação, pode confirmar ou recusar com justificativa. Se recusada, o aluno vê o motivo e pode entrar em contato via WhatsApp.

---

## Banco de Dados

### Tabela: `agenda_events`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `tenant_id` | uuid FK tenants | Tenant do personal |
| `type` | text CHECK | `presencial`, `virtual`, `pagamento_a_fazer`, `pagamento_a_receber` |
| `title` | text | Título do evento |
| `event_date` | date | Data do evento |
| `start_time` | time | Horário de início (opcional) |
| `student_id` | uuid FK students | Aluno vinculado (opcional) |
| `student_name` | text | Nome do aluno (denormalizado) |
| `location` | text | Local / endereço completo |
| `meeting_url` | text | Link do meeting (virtual) |
| `amount` | numeric(10,2) | Valor (pagamentos) |
| `description` | text | Descrição (pagamentos) |
| `status` | text CHECK | `scheduled`, `completed`, `cancelled`, `pending_confirmation`, `rejected` |
| `origin` | text CHECK | `personal` (criado pelo personal) ou `student` (solicitação do aluno) |
| `rejection_reason` | text | Motivo da recusa (preenchido pelo personal) |
| `address_cep` | text | CEP do local (solicitações de alunos) |
| `notified` | boolean | Se já foi notificado no dia |
| `notes` | text | Observações livres |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-atualizado por trigger |

### Valores de `status`

| Status | Quem define | Significado |
|--------|------------|-------------|
| `scheduled` | Personal (ou após confirmação) | Evento confirmado e ativo |
| `completed` | Personal | Evento concluído |
| `cancelled` | Personal | Evento cancelado |
| `pending_confirmation` | Automático (solicitação aluno) | Aguardando confirmação do personal |
| `rejected` | Personal | Solicitação recusada com motivo |

### RLS

| Policy | Quem | Operação |
|--------|------|----------|
| `agenda_events_personal_select` | role IN (personal, global_admin) com mesmo tenant_id | SELECT |
| `agenda_events_personal_write` | role IN (personal, global_admin) com mesmo tenant_id | ALL |
| `agenda_events_student_select` | role = student onde student_id ∈ próprios students.id | SELECT |
| `agenda_events_student_insert` | role = student | INSERT (apenas presencial, pending_confirmation, próprio student_id) |

---

## Fluxo do Personal

1. Acessa `/dashboard/agenda`
2. Vê calendário mensal com dots coloridos por tipo
   - Dots com borda amber = solicitações pendentes de alunos
3. Clica num dia → painel lateral mostra eventos daquele dia
4. Botão "Novo Evento" ou "+ Adicionar" no dia → modal abre
5. Modal: escolhe tipo → preenche campos específicos → cria
6. No card do evento: pode editar, excluir, marcar como Concluído ou Cancelado
7. Nos cards de eventos presenciais com `location`: ícone abre popup embutido com mapa (sem sair do sistema)

### Campos de Endereço no Modal (tipo Presencial)

Quando o tipo selecionado é **Presencial**, o modal exibe campos de endereço estruturados:

| Campo | Comportamento |
|-------|--------------|
| **CEP** | Máscara `00000-000`; ao completar 8 dígitos faz lookup no ViaCEP e auto-preenche o endereço |
| **Endereço completo** | Texto livre, pré-preenchido pelo CEP; editável manualmente |
| **Botão "Ver no Maps"** | Aparece ao lado do label quando o campo endereço tem conteúdo; abre popup embutido (`MapsPopup`) com iframe do Google Maps — **sem sair do sistema** |

Ao salvar, o campo `location` recebe o endereço completo e `address_cep` recebe o CEP.

O botão **Ver no Maps** também aparece nos cards de evento da lista do dia selecionado, abrindo o mesmo popup embutido.

### Eventos de Solicitação do Aluno (na agenda do personal)

- Aparecem com badge âmbar "⏳ Solicitação do aluno — aguardando confirmação"
- Ações disponíveis: **Confirmar** ou **Recusar**
- Ao recusar, um campo de texto solicita o motivo (obrigatório)
- Após confirmação: status muda para `scheduled` — o aluno vê como "Confirmado"
- Após recusa: status muda para `rejected` + `rejection_reason` salvo — aluno vê motivo + botão WhatsApp

### Resumo do Mês (sidebar)

- Mostra contagem de "Solicitações pendentes" em âmbar, se houver
- Seguido de contagem por tipo de evento (apenas `scheduled`)

### Server Actions (`src/app/actions/agenda.ts`)

| Função | Descrição |
|--------|-----------|
| `getAgendaEvents(year, month)` | Lista eventos do mês (personal) |
| `getAgendaEventsByDate(date)` | Lista eventos de um dia |
| `getTodayAgendaEvents()` | Eventos de hoje para o banner (inclui pending_confirmation) |
| `createAgendaEvent(input)` | Cria evento (personal) |
| `updateAgendaEvent(input)` | Atualiza evento (inclui status) |
| `deleteAgendaEvent(id)` | Exclui evento |
| `confirmAgendaEvent(id)` | Personal confirma solicitação → status = scheduled |
| `rejectAgendaEvent(id, reason)` | Personal recusa com motivo → status = rejected |
| `createStudentPresencialRequest(input)` | Aluno cria solicitação presencial |
| `getStudentAgendaEvents()` | Lista todos os eventos do aluno (student view) |

---

## Fluxo do Aluno

### Calendário (visão principal)

O aluno acessa `/student/agenda` e vê um **calendário mensal** com o mesmo layout do personal:

- Grid 7 colunas (Dom–Sáb) com dots coloridos por tipo de evento
- Dot âmbar com borda = solicitação pendente de confirmação
- Clica num dia → painel lateral mostra os eventos daquele dia
- Navegação de meses via `ChevronLeft / ChevronRight` (busca `/api/student/agenda?year=&month=`)
- Resumo do mês no rodapé do painel: total confirmados, pendentes, total

**Na parte superior da página:**
- Botão "Solicitar aula presencial" (expansível → formulário)
- Banner âmbar se houver solicitações `pending_confirmation`
- Banner vermelho se houver solicitações `rejected`, com motivo e botão WhatsApp

**No painel do dia selecionado**, cada evento mostra:
- Badge de status (Aguardando, Confirmado, Não confirmado) para solicitações do aluno
- Horário, local + link Maps (para presencial), link do meeting (para virtual), valor (para pagamentos)
- Motivo da recusa + botão WhatsApp se `rejected`

### API Route do Aluno

`GET /api/student/agenda?year={ano}&month={mes}`

- Arquivo: `src/app/api/student/agenda/route.ts`
- Auth: usuário deve estar logado como student
- Busca `students.id` via `user_id = auth.uid()` e retorna eventos do mês filtrados por `student_id`
- Necessário para navegação de meses no componente client `StudentAgendaCalendarView`

### Componentes do Aluno

| Arquivo | Tipo | Função |
|---------|------|--------|
| `src/app/(student)/student/agenda/page.tsx` | Server | Carrega eventos do mês atual + phone do personal; renderiza `StudentAgendaCalendarView` |
| `src/app/(student)/student/agenda/StudentAgendaCalendarView.tsx` | Client | Calendário mensal, navegação, painel do dia, resumo |
| `src/app/(student)/student/agenda/AgendaRequestForm.tsx` | Client | Formulário expansível de solicitação presencial com CEP + ViaCEP |

### Fluxo de Solicitação de Aula Presencial

1. Aluno clica em "Solicitar aula presencial" (no topo do calendário)
2. Formulário expande com:
   - Data e Horário (obrigatórios)
   - CEP (máscara `00000-000`, auto-preenchimento via ViaCEP)
   - Logradouro, Número (obrigatórios)
   - Complemento (opcional)
   - Bairro, Cidade, UF (auto-preenchidos pelo CEP)
   - Observações (opcional)
3. Ao enviar: insere evento com `status = pending_confirmation`, `origin = student`, `type = presencial`
4. Evento aparece no calendário como dot âmbar no dia solicitado

### Status das Solicitações (visão do aluno no painel do dia)

| Status | Badge | Ações disponíveis |
|--------|-------|-------------------|
| `pending_confirmation` | ⏳ Aguardando confirmação (âmbar) | Nenhuma — aguarda personal |
| `scheduled` + `origin = student` | ✅ Confirmado (esmeralda) | Nenhuma |
| `rejected` | ❌ Não confirmado (vermelho) | Ver motivo + Botão WhatsApp |

### Botão WhatsApp (solicitação recusada)

- Aparece quando `status = rejected` e `tenants.contact_phone` está preenchido
- Link: `https://wa.me/55{digits_only_phone}?text=...` com mensagem pré-preenchida
- Mensagem inclui data/hora da solicitação recusada

---

## Notificações

### Banner no Layout do Personal (`(dashboard)/layout.tsx`)

Exibido **em todas as páginas do painel do personal**, logo abaixo do header, enquanto houver solicitações pendentes:

- Consulta `agenda_events` com `status = pending_confirmation` AND `origin = student` AND `tenant_id = tenant do personal`
- Exibe banner âmbar: *"X solicitações de agendamento presencial aguardando confirmação."* + botão "Ver Agenda →"
- Componente: `src/components/agenda/PendingAgendaBanner.tsx`

### Banner no Layout do Aluno (`(student)/layout.tsx`)

Exibido **em todas as páginas do painel do aluno**, enquanto houver solicitações no estado relevante:

- **Pendentes:** consulta `status = pending_confirmation` AND `origin = student` AND `student_id = aluno` → banner âmbar
- **Recusadas recentes:** consulta `status = rejected` AND `origin = student` AND `student_id = aluno` AND `event_date >= 7 dias atrás` → banner vermelho
- Componente: `src/components/agenda/StudentAgendaBanner.tsx`

### Banner de Eventos do Dia no Dashboard (`/dashboard`)

Mantido separadamente:
- Consulta `agenda_events` com `event_date = hoje` e `status IN (scheduled, pending_confirmation)`
- Exibe banner verde no topo com lista resumida e link para a agenda

### Push/Mobile (futura implementação):
- Campo `notified` na tabela marca se já foi enviada notificação
- Supabase Edge Function pode ser criada com cron para rodar às 8h e enviar push para eventos do dia com `notified = false`

---

## Diferenciação Visual por Tipo

| Tipo | Cor | Ícone |
|------|-----|-------|
| `presencial` | Azul (`text-blue-400`) | `MapPin` |
| `virtual` | Verde (`text-emerald-400`) | `Video` |
| `pagamento_a_fazer` | Vermelho (`text-red-400`) | `TrendingDown` |
| `pagamento_a_receber` | Âmbar (`text-amber-400`) | `TrendingUp` |
| Solicitação pendente | Âmbar (`text-amber-400`) | Badge especial no card |

---

## Arquivos Criados/Modificados

### Criados
```
supabase/migrations/20260623_minha_agenda.sql
supabase/migrations/20260623_agenda_fix_student_fk.sql
supabase/migrations/20260623_agenda_student_requests.sql
src/app/actions/agenda.ts
src/app/api/agenda/route.ts
src/app/api/student/agenda/route.ts
src/app/(dashboard)/dashboard/agenda/page.tsx
src/app/(dashboard)/dashboard/agenda/AgendaCalendarView.tsx
src/app/(student)/student/agenda/AgendaRequestForm.tsx
src/app/(student)/student/agenda/StudentAgendaCalendarView.tsx
src/components/agenda/PendingAgendaBanner.tsx      — banner de pendentes no layout do personal
src/components/agenda/StudentAgendaBanner.tsx      — banner de pendentes/recusadas no layout do aluno
src/components/maps-popup.tsx                      — popup embutido com iframe do Google Maps
docs/modulos/minha-agenda.md
```

### Modificados
```
src/types/database.ts                              — adicionado agenda_events (+ origin, rejection_reason, address_cep)
src/lib/modules-config.ts                          — adicionado 'minha-agenda'
src/components/layout/dashboard-sidebar.tsx        — adicionado CalendarDays + slug
src/app/(dashboard)/dashboard/page.tsx             — banner de eventos do dia
src/app/(dashboard)/layout.tsx                     — query + PendingAgendaBanner (aviso global no painel do personal)
src/app/(student)/layout.tsx                       — query + StudentAgendaBanner (aviso global no painel do aluno)
src/app/(student)/student/agenda/page.tsx          — usa StudentAgendaCalendarView
```

### Banco de Dados (alterações diretas)
```
system_modules — removido registro slug='agendamento' (Agendamento de Sessões, coming_soon)
                 substituído funcionalmente pelo módulo minha-agenda
```

---

## Integração com Sistema de Módulos

- O módulo é controlado globalmente em `/admin/modulos` (toggle `available`)
- Por tenant em `/admin/clientes/{id}/modulos` (toggle `enabled`)
- A página do personal faz redirect se o módulo não estiver habilitado para o tenant
- O sidebar só exibe o link se o slug `minha-agenda` estiver em `tenant_modules` com `enabled = true`

---

## Notas para Implementação Android

### Telas necessárias

**Personal:**
1. **Agenda (Personal)** — calendário mensal horizontal (HorizontalPager ou RecyclerView), lista do dia selecionado abaixo em LazyColumn
2. **Modal Novo Evento** — BottomSheet com seletor de tipo (4 chips) + formulário dinâmico
3. **Endereço no Modal Presencial** — campo CEP com máscara `00000-000`, botão buscar no ViaCEP (`https://viacep.com.br/ws/{cep}/json/`), campo de endereço completo (pré-preenchido), botão "Ver no Maps" abre `Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${address}"))` ou URL do Maps
4. **Card de Evento** — exibir dots por tipo, ações: Concluir / Cancelar; para `origin = student`: Confirmar / Recusar com motivo

**Aluno:**
5. **Agenda (Aluno)** — mesmo layout de calendário mensal do personal (HorizontalPager + dots coloridos + painel do dia), sem botão de novo evento
6. **Botão de Solicitação** — FAB ou card no topo que abre BottomSheet com formulário de solicitação presencial (CEP + endereço + data + hora)
7. **Card de Evento no painel do dia** — badge de status (pending/confirmed/rejected), link Maps para presencial, motivo de recusa, botão WhatsApp

### Cores dos Dots por Tipo

| Tipo | Cor HEX |
|------|---------|
| `presencial` | `#3B82F6` (blue-500) |
| `virtual` | `#10B981` (emerald-500) |
| `pagamento_a_fazer` | `#EF4444` (red-500) |
| `pagamento_a_receber` | `#F59E0B` (amber-500) |
| `pending_confirmation` | `#F59E0B` com borda `#FBBF24` (amber, ring) |
| `cancelled` / `rejected` | opacidade 30% da cor original |

### Queries Supabase (Android/Kotlin)

```kotlin
// Eventos do mês — personal
supabase.from("agenda_events")
  .select()
  .gte("event_date", startOfMonth)
  .lte("event_date", endOfMonth)
  .order("event_date", ascending = true)
  .order("start_time", ascending = true)
  .decodeList<AgendaEvent>()

// Eventos do mês — aluno
// 1. Buscar students.id
val studentRow = supabase.from("students")
  .select("id")
  .eq("user_id", userId)
  .decodeSingle<StudentRow>()

// 2. Buscar eventos do mês
supabase.from("agenda_events")
  .select()
  .eq("student_id", studentRow.id)
  .gte("event_date", startOfMonth)
  .lte("event_date", endOfMonth)
  .order("event_date", ascending = true)
  .decodeList<AgendaEvent>()

// Criar evento — personal
supabase.from("agenda_events").insert(
  AgendaEventInsert(
    tenantId = tenantId,
    type = "presencial",
    title = title,
    eventDate = date,
    startTime = time,
    studentId = studentId,
    studentName = studentName,
    location = assembledAddress,
    addressCep = cep,
    origin = "personal"
  )
)

// Criar solicitação — aluno
supabase.from("agenda_events").insert(
  AgendaEventInsert(
    tenantId = tenantId,
    type = "presencial",
    title = "Solicitação: $studentName",
    eventDate = date,
    startTime = time,
    studentId = studentId,
    studentName = studentName,
    location = assembledAddress,
    addressCep = cep,
    notes = notes,
    status = "pending_confirmation",
    origin = "student"
  )
)

// Confirmar — personal
supabase.from("agenda_events")
  .update(mapOf("status" to "scheduled"))
  .eq("id", eventId)
  .eq("status", "pending_confirmation")

// Recusar — personal
supabase.from("agenda_events")
  .update(mapOf(
    "status" to "rejected",
    "rejection_reason" to reason
  ))
  .eq("id", eventId)
  .eq("status", "pending_confirmation")
```

### ViaCEP no Android

```kotlin
// Retrofit ou Ktor - endpoint público, sem auth
suspend fun fetchCep(cep: String): ViaCepResponse {
  return httpClient.get("https://viacep.com.br/ws/${cep.replace("-","")}/json/")
    .body<ViaCepResponse>()
}

data class ViaCepResponse(
  val logradouro: String?,
  val bairro: String?,
  val localidade: String?,
  val uf: String?,
  val erro: Boolean? = null
)
```

### Google Maps (endereço presencial)

**Comportamento no Web:** o botão "Ver no Maps" abre um **popup embutido** (`MapsPopup`) com iframe do Google Maps (`maps.google.com/maps?q={address}&output=embed`), mantendo o usuário dentro do sistema. Não abre nova aba.

**Comportamento no Android (manter usuário no app):** usar um `BottomSheet` ou `Dialog` com um `WebView` embutindo o mapa, de forma análoga ao iframe web:

```kotlin
// Opção A — WebView embutido em BottomSheet (mantém usuário no app)
val bottomSheet = BottomSheetDialog(context)
val webView = WebView(context).apply {
  settings.javaScriptEnabled = true
  loadUrl("https://maps.google.com/maps?q=${Uri.encode(location)}&output=embed&hl=pt-BR&z=16")
}
bottomSheet.setContentView(webView)
bottomSheet.show()

// Opção B — fallback para o app Maps (sai do app, usar só se WebView indisponível)
val uri = Uri.parse("geo:0,0?q=${Uri.encode(location)}")
val intent = Intent(Intent.ACTION_VIEW, uri)
intent.setPackage("com.google.android.apps.maps")
if (intent.resolveActivity(packageManager) != null) {
  startActivity(intent)
} else {
  startActivity(Intent(Intent.ACTION_VIEW,
    Uri.parse("https://maps.google.com/?q=${Uri.encode(location)}")))
}
```

> **Regra de UX:** sempre preferir a Opção A (WebView/popup embutido) para manter a experiência dentro do app, assim como no web.

### WhatsApp (solicitação recusada)

```kotlin
val phone = "55${contactPhone.replace(Regex("[^0-9]"), "")}"
val msg = "Olá! Minha solicitação de aula presencial para $date às $time não foi confirmada. Podemos conversar?"
val uri = Uri.parse("https://wa.me/$phone?text=${Uri.encode(msg)}")
startActivity(Intent(Intent.ACTION_VIEW, uri))
```

### Modelo de Dados (Kotlin)

```kotlin
data class AgendaEvent(
  val id: String,
  val tenantId: String,
  val type: String,        // presencial | virtual | pagamento_a_fazer | pagamento_a_receber
  val title: String,
  val eventDate: String,   // YYYY-MM-DD
  val startTime: String?,  // HH:MM
  val studentId: String?,
  val studentName: String?,
  val location: String?,
  val addressCep: String?,
  val meetingUrl: String?,
  val amount: Double?,
  val description: String?,
  val status: String,      // scheduled | completed | cancelled | pending_confirmation | rejected
  val origin: String,      // personal | student
  val rejectionReason: String?,
  val notes: String?,
  val notified: Boolean,
  val createdAt: String,
  val updatedAt: String
)
```

### Banners de Notificação no App Mobile

Equivalente aos banners do layout web — devem aparecer em **todas as telas** do app (personal e aluno):

**Personal — banner âmbar:**
- Ao carregar qualquer tela do personal, buscar contagem de `agenda_events` com `status = pending_confirmation` AND `origin = student` AND `tenant_id = tenantId`
- Se `count > 0`: exibir Snackbar persistente âmbar ou banner fixo no topo com botão "Ver Agenda"
- Sugestão de implementação: `ViewModel` compartilhado com `StateFlow<Int>` para contagem de pendentes, observado pelo `Activity` ou `NavHost`

**Aluno — banner âmbar (pendentes) e vermelho (recusadas recentes):**
- Ao carregar qualquer tela do aluno, buscar:
  - `count(pending_confirmation, origin=student, student_id=x)` → pendentes
  - `count(rejected, origin=student, student_id=x, event_date >= hoje-7d)` → recusadas recentes
- Se `pendingCount > 0`: Snackbar/banner âmbar com link para a tela de Agenda
- Se `rejectedCount > 0`: Snackbar/banner vermelho com link para a tela de Agenda

```kotlin
// ViewModel compartilhado para o personal
class PersonalAgendaNotifViewModel(supabase: SupabaseClient, tenantId: String) : ViewModel() {
  val pendingCount = flow {
    val count = supabase.from("agenda_events")
      .select(count = Count.EXACT) {
        filter { eq("tenant_id", tenantId); eq("status", "pending_confirmation"); eq("origin", "student") }
      }.countOrNull() ?: 0
    emit(count)
  }.stateIn(viewModelScope, SharingStarted.Lazily, 0)
}
```

### Push Notifications Mobile
- Ao criar solicitação (`origin = student`): push para o personal via FCM
- Ao confirmar/recusar: push para o aluno via FCM
- Ao criar evento com `student_id`, enviar push para o aluno
- Edge Function com cron às 8h verificando `event_date = today AND notified = false`

### Permissões
- Personal: leitura e escrita em `agenda_events` do próprio tenant (via RLS)
- Aluno: leitura de todos os próprios eventos + INSERT de solicitações presenciais (via RLS)
