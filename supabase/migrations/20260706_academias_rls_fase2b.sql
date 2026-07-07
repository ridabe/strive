-- ============================================================
-- Fase 2b — estende a restrição por assigned_personal_id às tabelas de
-- dados individuais do aluno. Ver docs/FASES_Academias_StrivePersonal.md.
--
-- Estratégia: 1 função helper nova (can_view_student_by_id) + swap de
-- cada policy existente, preservando exatamente a condição original e
-- só ACRESCENTANDO a checagem de atribuição. Para colunas student_id
-- nullable, usa "student_id IS NULL OR can_view_student_by_id(...)" —
-- registros não vinculados a um aluno específico (templates, recursos
-- gerais do tenant) continuam visíveis a qualquer personal do tenant,
-- sem restrição (mesma leitura dada às tabelas de catálogo).
-- Para policies que já incluíam global_admin no role check, preserva
-- o bypass do global_admin explicitamente.
-- ============================================================

create or replace function public.can_view_student_by_id(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.can_view_student(s.tenant_id, s.assigned_personal_id)
     from public.students s where s.id = p_student_id),
    false
  );
$$;

comment on function public.can_view_student_by_id(uuid) is
  'Atalho para can_view_student() a partir de um student_id — resolve tenant_id e assigned_personal_id do próprio registro do aluno. Usado pelas policies das tabelas de dados individuais (treinos, avaliações, financeiro etc.) na Fase 2b.';

-- ------------------------------------------------------------
-- agenda_events (student_id nullable; policies incluem global_admin)
-- ------------------------------------------------------------
drop policy if exists "agenda_events_personal_select" on public.agenda_events;
create policy "agenda_events_personal_select" on public.agenda_events for select
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = any (array['personal'::app_role, 'global_admin'::app_role]))
    and (get_my_role() = 'global_admin'::app_role or student_id is null or public.can_view_student_by_id(student_id))
  );

drop policy if exists "agenda_events_personal_write" on public.agenda_events;
create policy "agenda_events_personal_write" on public.agenda_events for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = any (array['personal'::app_role, 'global_admin'::app_role]))
    and (get_my_role() = 'global_admin'::app_role or student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- ai_conversations (student_id not null; só role personal)
-- ------------------------------------------------------------
drop policy if exists "personal_tenant_conversations" on public.ai_conversations;
create policy "personal_tenant_conversations" on public.ai_conversations for select
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- ai_usage_events (student_id nullable; global_admin tem policy própria, não tocada)
-- ------------------------------------------------------------
drop policy if exists "ai_usage_events_personal_tenant_select" on public.ai_usage_events;
create policy "ai_usage_events_personal_tenant_select" on public.ai_usage_events for select
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and (student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- anamnese_responses (student_id not null; admin/self não tocadas)
-- ------------------------------------------------------------
drop policy if exists "anamnese_responses_personal" on public.anamnese_responses;
create policy "anamnese_responses_personal" on public.anamnese_responses for all
  using (
    (get_my_role() = 'personal'::app_role)
    and (exists (select 1 from students s where s.user_id = anamnese_responses.user_id and s.tenant_id = get_my_tenant_id()))
    and public.can_view_student_by_id(anamnese_responses.student_id)
  )
  with check (
    (get_my_role() = 'personal'::app_role)
    and (exists (select 1 from students s where s.user_id = anamnese_responses.user_id and s.tenant_id = get_my_tenant_id()))
    and public.can_view_student_by_id(anamnese_responses.student_id)
  );

drop policy if exists "anamnese_responses_personal_no_account" on public.anamnese_responses;
create policy "anamnese_responses_personal_no_account" on public.anamnese_responses for all
  using (
    (get_my_role() = 'personal'::app_role)
    and (user_id is null)
    and (tenant_id = get_my_tenant_id())
    and public.can_view_student_by_id(anamnese_responses.student_id)
  )
  with check (
    (get_my_role() = 'personal'::app_role)
    and (user_id is null)
    and (tenant_id = get_my_tenant_id())
    and public.can_view_student_by_id(anamnese_responses.student_id)
  );

-- ------------------------------------------------------------
-- attendance (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "attendance: personal CRUD no próprio tenant" on public.attendance;
create policy "attendance: personal CRUD no próprio tenant" on public.attendance for all
  using (tenant_id = get_my_tenant_id() and public.can_view_student_by_id(student_id));

-- ------------------------------------------------------------
-- challenge_participants (student_id not null; role personal)
-- ------------------------------------------------------------
drop policy if exists "personal_manage_participants" on public.challenge_participants;
create policy "personal_manage_participants" on public.challenge_participants for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  )
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- extra_workouts (student_id nullable; sem role check explícito, preservado)
-- ------------------------------------------------------------
drop policy if exists "tenant: full access to own extra workouts" on public.extra_workouts;
create policy "tenant: full access to own extra workouts" on public.extra_workouts for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and (student_id is null or public.can_view_student_by_id(student_id))
  )
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and (student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- extra_workout_items (sem student_id direto; via extra_workout_id)
-- ------------------------------------------------------------
drop policy if exists "tenant: full access to own extra items" on public.extra_workout_items;
create policy "tenant: full access to own extra items" on public.extra_workout_items for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from extra_workouts ew
      where ew.id = extra_workout_items.extra_workout_id
        and (ew.student_id is null or public.can_view_student_by_id(ew.student_id))
    )
  )
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from extra_workouts ew
      where ew.id = extra_workout_items.extra_workout_id
        and (ew.student_id is null or public.can_view_student_by_id(ew.student_id))
    )
  );

-- ------------------------------------------------------------
-- financial_plans (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "financial_plans: personal CRUD no próprio tenant" on public.financial_plans;
create policy "financial_plans: personal CRUD no próprio tenant" on public.financial_plans for all
  using (tenant_id = get_my_tenant_id() and public.can_view_student_by_id(student_id));

-- ------------------------------------------------------------
-- meal_plans (student_id nullable; write inclui global_admin)
-- ------------------------------------------------------------
drop policy if exists "meal_plans_tenant_select" on public.meal_plans;
create policy "meal_plans_tenant_select" on public.meal_plans for select
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and (student_id is null or public.can_view_student_by_id(student_id))
  );

drop policy if exists "meal_plans_tenant_write" on public.meal_plans;
create policy "meal_plans_tenant_write" on public.meal_plans for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = any (array['personal'::app_role, 'global_admin'::app_role]))
    and (get_my_role() = 'global_admin'::app_role or student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- physical_assessments (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "physical_assessments: personal CRUD no próprio tenant" on public.physical_assessments;
create policy "physical_assessments: personal CRUD no próprio tenant" on public.physical_assessments for all
  using (tenant_id = get_my_tenant_id() and public.can_view_student_by_id(student_id));

-- ------------------------------------------------------------
-- shared_files (student_id nullable)
-- ------------------------------------------------------------
drop policy if exists "personal_manage_shared_files" on public.shared_files;
create policy "personal_manage_shared_files" on public.shared_files for all
  using (
    tenant_id in (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.role = 'personal'::app_role)
    and (student_id is null or public.can_view_student_by_id(student_id))
  )
  with check (
    tenant_id in (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.role = 'personal'::app_role)
    and (student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- student_messages (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "personal_send_messages" on public.student_messages;
create policy "personal_send_messages" on public.student_messages for insert
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

drop policy if exists "personal_view_messages" on public.student_messages;
create policy "personal_view_messages" on public.student_messages for select
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid()))
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- student_plan_assignments (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "personal_manage_plan_assignments" on public.student_plan_assignments;
create policy "personal_manage_plan_assignments" on public.student_plan_assignments for all
  using (
    tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid() and p.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  )
  with check (
    tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid() and p.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- student_progress (student_id not null; policy só SELECT do personal)
-- ------------------------------------------------------------
drop policy if exists "student_progress: personal vê tenant" on public.student_progress;
create policy "student_progress: personal vê tenant" on public.student_progress for select
  using (tenant_id = get_my_tenant_id() and public.can_view_student_by_id(student_id));

-- ------------------------------------------------------------
-- student_meal_plan_assignments (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "tenant_members_manage_meal_assignments" on public.student_meal_plan_assignments;
create policy "tenant_members_manage_meal_assignments" on public.student_meal_plan_assignments for all
  using (
    tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.tenant_id is not null)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- workout_plans (student_id nullable — planos-template sem aluno)
-- ------------------------------------------------------------
drop policy if exists "workout_plans: personal CRUD no próprio tenant" on public.workout_plans;
create policy "workout_plans: personal CRUD no próprio tenant" on public.workout_plans for all
  using (
    tenant_id = get_my_tenant_id()
    and (student_id is null or public.can_view_student_by_id(student_id))
  );

-- ------------------------------------------------------------
-- workout_routines (sem student_id direto; via workout_plan_id)
-- ------------------------------------------------------------
drop policy if exists "tenant: full access to own routines" on public.workout_routines;
create policy "tenant: full access to own routines" on public.workout_routines for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from workout_plans wp
      where wp.id = workout_routines.workout_plan_id
        and (wp.student_id is null or public.can_view_student_by_id(wp.student_id))
    )
  )
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from workout_plans wp
      where wp.id = workout_routines.workout_plan_id
        and (wp.student_id is null or public.can_view_student_by_id(wp.student_id))
    )
  );

-- ------------------------------------------------------------
-- workout_items (sem student_id direto; via routine_id -> workout_plan_id)
-- ------------------------------------------------------------
drop policy if exists "tenant: full access to own items" on public.workout_items;
create policy "tenant: full access to own items" on public.workout_items for all
  using (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from workout_routines wr
      join workout_plans wp on wp.id = wr.workout_plan_id
      where wr.id = workout_items.routine_id
        and (wp.student_id is null or public.can_view_student_by_id(wp.student_id))
    )
  )
  with check (
    (tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid() limit 1))
    and exists (
      select 1 from workout_routines wr
      join workout_plans wp on wp.id = wr.workout_plan_id
      where wr.id = workout_items.routine_id
        and (wp.student_id is null or public.can_view_student_by_id(wp.student_id))
    )
  );

-- ------------------------------------------------------------
-- workout_exercises (sem student_id direto; via workout_plan_id)
-- ------------------------------------------------------------
drop policy if exists "workout_exercises: personal CRUD no próprio tenant" on public.workout_exercises;
create policy "workout_exercises: personal CRUD no próprio tenant" on public.workout_exercises for all
  using (
    tenant_id = get_my_tenant_id()
    and exists (
      select 1 from workout_plans wp
      where wp.id = workout_exercises.workout_plan_id
        and (wp.student_id is null or public.can_view_student_by_id(wp.student_id))
    )
  );

-- ------------------------------------------------------------
-- workout_feedbacks (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "personal_delete_feedbacks" on public.workout_feedbacks;
create policy "personal_delete_feedbacks" on public.workout_feedbacks for delete
  using (
    tenant_id in (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

drop policy if exists "personal_insert_feedbacks" on public.workout_feedbacks;
create policy "personal_insert_feedbacks" on public.workout_feedbacks for insert
  with check (
    tenant_id in (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

drop policy if exists "personal_read_feedbacks" on public.workout_feedbacks;
create policy "personal_read_feedbacks" on public.workout_feedbacks for select
  using (
    tenant_id in (select profiles.tenant_id from profiles where profiles.id = auth.uid() and profiles.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- workout_sessions (student_id not null)
-- ------------------------------------------------------------
drop policy if exists "personal_manage_sessions" on public.workout_sessions;
create policy "personal_manage_sessions" on public.workout_sessions for all
  using (
    tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid() and p.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  )
  with check (
    tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid() and p.role = 'personal'::app_role)
    and public.can_view_student_by_id(student_id)
  );

-- ------------------------------------------------------------
-- workout_session_exercises (sem student_id/tenant_id direto; via session_id)
-- ------------------------------------------------------------
drop policy if exists "personal_manage_session_exercises" on public.workout_session_exercises;
create policy "personal_manage_session_exercises" on public.workout_session_exercises for all
  using (
    exists (
      select 1 from workout_sessions ws
      join profiles p on p.tenant_id = ws.tenant_id
      where ws.id = workout_session_exercises.session_id
        and p.id = auth.uid() and p.role = 'personal'::app_role
        and public.can_view_student_by_id(ws.student_id)
    )
  )
  with check (
    exists (
      select 1 from workout_sessions ws
      join profiles p on p.tenant_id = ws.tenant_id
      where ws.id = workout_session_exercises.session_id
        and p.id = auth.uid() and p.role = 'personal'::app_role
        and public.can_view_student_by_id(ws.student_id)
    )
  );

-- ------------------------------------------------------------
-- ai_messages (sem tenant_id/student_id direto; via conversation_id)
-- ------------------------------------------------------------
drop policy if exists "messages_via_personal_conversation" on public.ai_messages;
create policy "messages_via_personal_conversation" on public.ai_messages for select
  using (
    conversation_id in (
      select ai_conversations.id from ai_conversations
      where ai_conversations.tenant_id = (select profiles.tenant_id from profiles where profiles.id = auth.uid())
        and public.can_view_student_by_id(ai_conversations.student_id)
    )
  );
