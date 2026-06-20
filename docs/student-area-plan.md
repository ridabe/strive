# Área do Aluno — Plano de Desenvolvimento

## Visão Geral

Área mobile-first acessível pelo aluno após ser cadastrado pelo personal trainer.
O aluno recebe um e-mail de boas-vindas com senha provisória, acessa o sistema,
é obrigado a trocar a senha e então tem acesso a todos os módulos abaixo.

---

## Estado Atual (baseline)

| Arquivo | Status |
|---------|--------|
| `src/app/(student)/layout.tsx` | ⚠️ Existe mas sem branding do tenant |
| `src/app/(student)/student/page.tsx` | ⚠️ Existe mas sem nome do personal, incompleto |
| `src/app/(student)/student/treinos/` | ✅ Implementado (Etapas anteriores) |
| `src/app/(student)/student/treinos-extras/` | ✅ Implementado (Etapas anteriores) |
| `src/app/(student)/student/progresso/` | ⚠️ Existe mas sem upload de fotos |
| `src/app/(dashboard)/dashboard/alunos/novo/` | ❌ Não existe |
| `src/actions/students.ts` | ❌ Não existe |
| `supabase/functions/send-student-welcome/` | ❌ Não existe |

---

## Etapas de Desenvolvimento

### ✅ Etapa 1 — Cadastro de Aluno + E-mail de Convite
**Prioridade: CRÍTICA** — sem isso, nenhum aluno consegue acessar o sistema.

**O que será feito:**
- `supabase/functions/send-student-welcome/index.ts` — Edge Function exclusiva para e-mail do aluno
  - Payload: `{ email, studentName, personalName, businessName, tempPassword, logoUrl?, primaryColor? }`
  - Template diferente do e-mail de personal: mostra o nome do personal e o studio/academia
- `src/actions/students.ts` — action `createStudent(formData)`:
  1. Cria auth user com email confirmado + senha provisória gerada aleatoriamente
  2. Insere na tabela `profiles` com `role = 'student'`, `must_change_password = true`, `tenant_id`
  3. Insere na tabela `students` com `user_id` vinculado
  4. Chama Edge Function `send-student-welcome` (best-effort, não bloqueia)
  5. Retorna `{ studentId }` ou `{ error }`
- `src/app/(dashboard)/dashboard/alunos/novo/page.tsx` — formulário completo:
  - Nome completo, e-mail (obrigatório para login), telefone, data de nascimento, objetivo, observações
  - Checkbox "Enviar convite por e-mail"
  - Submit chama `createStudent()`
  - Sucesso → redireciona para `/dashboard/alunos/[id]`

**Arquivos criados/modificados:**
```
supabase/functions/send-student-welcome/index.ts  [NOVO]
src/actions/students.ts                            [NOVO]
src/app/(dashboard)/dashboard/alunos/novo/page.tsx [NOVO]
```

**Critério de conclusão:** Personal consegue cadastrar aluno, aluno recebe e-mail, acessa sistema, troca senha e chega na home `/student`.

---

### ✅ Etapa 2 — Layout Mobile-First + Home do Aluno
**Prioridade: ALTA** — base visual de toda a área do aluno.

**O que será feito:**
- `src/app/(student)/layout.tsx` — redesign completo mobile-first:
  - Busca branding do tenant (`logo_url`, `primary_color`, `business_name`)
  - Busca nome do personal vinculado ao tenant
  - Header mobile com logo do cliente + avatar do aluno (no topo)
  - Bottom navigation bar (mobile) com os 8 módulos usando ícones
  - Sidebar lateral (desktop, md+) com os mesmos links
  - `must_change_password` redirect já existe no middleware (mantém)
- `src/app/(student)/student/page.tsx` — home reformulada:
  - Banner de boas-vindas: "Olá, {firstName}" + "Seu personal: {personalName}"
  - Logo/nome do studio em destaque
  - Grid de cards rápidos para os módulos principais (treinos, progresso, frequência)
  - Próximo treino sugerido (se existir plano ativo)
  - Streak de dias consecutivos treinados

**Arquivos criados/modificados:**
```
src/app/(student)/layout.tsx                    [MODIFICADO]
src/app/(student)/student/page.tsx              [MODIFICADO]
src/components/layout/student-bottom-nav.tsx    [NOVO]
src/components/layout/student-sidebar.tsx       [MODIFICADO - adicionar tenant branding]
```

**Critério de conclusão:** Aluno vê logo do seu personal/studio, seu nome e o nome do personal na tela inicial. Navegação funciona no mobile via bottom bar.

---

### ✅ Etapa 3 — Anamnese (Formulário do Aluno)
**Prioridade: ALTA** — dados essenciais para o personal.

**O que será feito:**
- `src/app/(student)/student/anamnese/page.tsx` — formulário dinâmico:
  - Busca campos de `anamnese_templates` (globais + do tenant)
  - Agrupados por categoria (histórico médico, hábitos, objetivos, etc.)
  - Se já existe resposta → mostra os dados preenchidos (editável)
  - Submit salva/atualiza `anamnese_responses`
  - Badge de "Enviado em {data}" após submissão
- Dashboard do personal já tem `/dashboard/alunos/[id]/anamnese` — permanece

**Arquivos criados:**
```
src/app/(student)/student/anamnese/page.tsx     [NOVO]
```

**Critério de conclusão:** Aluno preenche anamnese, personal visualiza na sua área.

---

### ✅ Etapa 4 — Avaliação Física (Formulário do Aluno)
**Prioridade: MÉDIA** — complemento à anamnese.

**O que será feito:**
- `src/app/(student)/student/avaliacao/page.tsx` — formulário de medidas:
  - Campos: peso, altura, percentual de gordura, medidas (braço, cintura, quadril, coxa, peito)
  - Histórico das últimas avaliações em accordion colapsável
  - Submit insere nova entrada em `physical_assessments`
  - Nota: o personal também pode inserir na área admin — aqui é a visão do aluno
- Mini gráfico de evolução do peso (usando dados históricos)

**Arquivos criados:**
```
src/app/(student)/student/avaliacao/page.tsx    [NOVO]
```

**Critério de conclusão:** Aluno insere suas medidas, personal visualiza em `/dashboard/alunos/[id]/avaliacoes`.

---

### ✅ Etapa 5 — Meu Progresso (refinamento + fotos)
**Prioridade: MÉDIA** — já existe parcialmente.

**O que será feito:**
- Melhorar `src/app/(student)/student/progresso/page.tsx`:
  - Upload de fotos para Supabase Storage (bucket `progress-photos`)
  - Visualizador de fotos em timeline (lado a lado para comparação)
  - Campo de anotações pessoais (notas do aluno para si)
  - Gráfico de evolução do peso
- Atualizar `src/app/(student)/student/progresso/progress-form.tsx`:
  - Adicionar upload de imagens com preview
  - Validação de tipo/tamanho de arquivo

**Arquivos modificados:**
```
src/app/(student)/student/progresso/page.tsx         [MODIFICADO]
src/app/(student)/student/progresso/progress-form.tsx [MODIFICADO]
```

**Critério de conclusão:** Aluno faz upload de fotos de progresso, personal visualiza na área de admin.

---

### ✅ Etapa 6 — Frequência (Calendário + Streaks)
**Prioridade: MÉDIA** — módulo de engajamento.

**O que será feito:**
- `src/app/(student)/student/frequencia/page.tsx` — já existe, refinar:
  - Calendário visual mensal (marcação de dias treinados)
  - Streak atual (dias consecutivos) em destaque
  - Botão "Marcar treino de hoje" → insere em `attendance`
  - Relatório: total de treinos no mês, taxa de frequência %
  - Histórico dos últimos 3 meses
- Action `markAttendance()` em `src/actions/attendance.ts`

**Arquivos criados/modificados:**
```
src/app/(student)/student/frequencia/page.tsx   [MODIFICADO]
src/actions/attendance.ts                       [NOVO]
```

**Critério de conclusão:** Aluno marca presença, vê streak e calendário. Personal vê em `/dashboard/alunos/[id]/frequencia`.

---

### ✅ Etapa 7 — Feedback de Treinos
**Prioridade: MÉDIA** — engajamento e visibilidade para o personal.

**O que será feito:**
- `src/app/(student)/student/feedback/page.tsx` — lista de treinos recentes para avaliar:
  - Cards com plano/treino → rating de 1-5 estrelas + campo de comentário
  - Submit salva em `workout_feedbacks`
  - Histórico de feedbacks já enviados
- Action `submitFeedback()` em `src/actions/feedback.ts`
- Personal já tem `/dashboard/alunos/[id]/feedback` — mantém

**Arquivos criados:**
```
src/app/(student)/student/feedback/page.tsx     [NOVO]
src/actions/feedback.ts                         [NOVO]
```

**Critério de conclusão:** Aluno avalia treino com nota + comentário. Personal visualiza na área de admin.

---

### ✅ Etapa 8 — Áreas Placeholder (Futuras Funcionalidades)
**Prioridade: BAIXA** — sinalização de roadmap para o aluno.

**O que será feito:**
- `/student/financeiro` — Faturas e Cobranças (placeholder elegante)
- `/student/nutricao` — Plano Alimentar (placeholder)
- `/student/agenda` — Agendamento de Sessões (placeholder)

Cada página terá:
- Ícone + título da funcionalidade
- Descrição do que será possível fazer
- Badge "Em breve"
- CTA para contato com o personal enquanto não está disponível

**Arquivos criados:**
```
src/app/(student)/student/financeiro/page.tsx   [NOVO]
src/app/(student)/student/nutricao/page.tsx     [NOVO]
src/app/(student)/student/agenda/page.tsx       [NOVO]
```

**Critério de conclusão:** Páginas existem no menu e comunicam as funcionalidades futuras.

---

## Ordem de Execução Recomendada

```
Etapa 1 → Etapa 2 → Etapa 6 → Etapa 3 → Etapa 4 → Etapa 5 → Etapa 7 → Etapa 8
  ↑            ↑         ↑
CRÍTICA     VISUAL    ALTA VISIB.
```

**Justificativa:**
- Etapa 1 é bloqueante — sem cadastro de aluno, nada funciona
- Etapa 2 é a base visual — define a identidade da área
- Etapas 3-7 podem ser feitas em qualquer ordem, priorizando pela demanda do personal
- Etapa 8 é o mínimo de esforço com máximo de impacto na percepção do produto

---

## Infraestrutura Necessária

### Supabase Storage Buckets
- `progress-photos` — fotos de progresso do aluno (acesso RLS por student_id)

### Edge Functions
- `send-student-welcome` — e-mail de boas-vindas para o aluno (**Etapa 1**)

### Variáveis de Ambiente (já existentes)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (para criar auth user)

---

## Progresso

| Etapa | Status | Commit |
|-------|--------|--------|
| Etapa 1 — Cadastro + E-mail | ✅ Concluída | c323209 → ver commit etapa-1 |
| Etapa 2 — Layout Mobile-First | ⏳ Aguardando | — |
| Etapa 3 — Anamnese | ⏳ Aguardando | — |
| Etapa 4 — Avaliação Física | ⏳ Aguardando | — |
| Etapa 5 — Meu Progresso | ⏳ Aguardando | — |
| Etapa 6 — Frequência | ⏳ Aguardando | — |
| Etapa 7 — Feedback | ⏳ Aguardando | — |
| Etapa 8 — Placeholders | ⏳ Aguardando | — |
